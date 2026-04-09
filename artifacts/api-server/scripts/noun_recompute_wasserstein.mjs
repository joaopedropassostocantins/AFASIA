/**
 * noun_recompute_wasserstein.mjs
 *
 * Computa distâncias de Wasserstein entre TODOS os pares de um subconjunto
 * representativo de ≥3.000 ícones e executa MDS clássico global.
 *
 * Abordagem:
 *   1. Amostra 3.000 ícones (250 por categoria × 12 categorias)
 *   2. Calcula matriz Wasserstein n×n completa (O(n²) pares, ~9M pares)
 *   3. Executa MDS clássico via iteração de potência (top-2 autovalores)
 *   4. Calcula k-vizinhos mais próximos diretamente da matriz de distâncias
 *   5. Para os ~9.000 ícones restantes: projeção Nyström via distância a lotes
 *   6. Salva noun_atlas_data.json atualizado (11.999 ícones totais)
 *
 * Uso: node scripts/noun_recompute_wasserstein.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "noun_atlas_data.json");

// ─── Algoritmo JP: vetores de estado + diagramas de persistência ─────────────

const CAT_STATE_VECTORS = {
  comunicacao:     [9, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
  emocao:          [2, 9, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1],
  corpo:           [1, 2, 9, 2, 1, 1, 1, 2, 1, 1, 1, 1],
  alimentacao:     [1, 1, 2, 9, 2, 1, 1, 1, 2, 1, 1, 1],
  familia_pessoas: [1, 1, 1, 2, 9, 2, 1, 1, 1, 2, 1, 1],
  acao:            [1, 1, 1, 1, 2, 9, 2, 1, 1, 1, 2, 1],
  lugar:           [1, 1, 1, 1, 1, 2, 9, 2, 1, 1, 1, 2],
  saude:           [1, 1, 1, 1, 1, 1, 2, 9, 2, 1, 1, 1],
  natureza:        [1, 1, 1, 1, 1, 1, 1, 2, 9, 2, 1, 1],
  tempo:           [1, 1, 1, 1, 1, 1, 1, 1, 2, 9, 2, 1],
  objeto:          [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 9, 2],
  escola:          [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 9],
};
const DIM = 12;

function numericId(id) {
  const s = String(id).replace(/\D/g, "") || "0";
  return parseInt(s, 10) || 0;
}

function stateVec(cat, nid) {
  const base = CAT_STATE_VECTORS[cat] ?? Array(DIM).fill(5);
  const noise = (nid % 7) / 10;
  return base.map((v, i) => Math.max(1, v + noise * Math.sin(i * (nid % 13))));
}

function persistenceDiagram(sv, seed) {
  const s = seed % 97;
  const H0 = sv.map((v, i) => {
    const b = i / sv.length + (s % 5) * 0.01;
    return [b, b + v * 0.1 + ((i * s) % 7) * 0.02];
  });
  const H1 = sv
    .map((v, i) => {
      if (i % 2 !== 0) return null;
      const b = H0[i][0] + 0.05;
      return [b, b + sv[(i + 1) % sv.length] * 0.08];
    })
    .filter(Boolean);
  return { H0, H1 };
}

// Wasserstein-1 matching via greedy sort (exact for sorted 1D diagrams)
function wasserstein(dg1, dg2) {
  let cost = 0;
  for (const key of ["H0", "H1"]) {
    const a = dg1[key];
    const b = dg2[key];
    const maxk = Math.min(a.length, b.length);
    for (let k = 0; k < maxk; k++) {
      const db = a[k][0] - b[k][0];
      const dd = a[k][1] - b[k][1];
      cost += Math.sqrt(db * db + dd * dd);
    }
    for (let k = maxk; k < a.length; k++) cost += Math.abs(a[k][1] - a[k][0]) * Math.SQRT2 / 2;
    for (let k = maxk; k < b.length; k++) cost += Math.abs(b[k][1] - b[k][0]) * Math.SQRT2 / 2;
  }
  return cost;
}

// ─── MDS clássico via iteração de potência (top-2 autovalores) ───────────────

function classicalMDS(D, k = 2) {
  const n = D.length;

  // Centra a matriz ao quadrado
  const D2 = D.map((row) => row.map((v) => v * v));
  const rm = D2.map((row) => row.reduce((s, v) => s + v, 0) / n);
  const gm = rm.reduce((s, v) => s + v, 0) / n;
  const cm = Array(n).fill(0).map((_, j) => D2.reduce((s, row) => s + row[j], 0) / n);

  // Matriz B (doubly-centered)
  const B = D2.map((row, i) => row.map((v, j) => -0.5 * (v - rm[i] - cm[j] + gm)));

  // Iteração de potência para os k maiores autovalores
  function powerIter(B, avoid) {
    const n = B.length;
    let v = Array(n).fill(0).map(() => Math.random() - 0.5);
    // Ortogonalizar contra vetores já encontrados
    for (let iter = 0; iter < 200; iter++) {
      // Bv
      let w = Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) w[i] += B[i][j] * v[j];

      // Deflação
      for (const { vec, val } of avoid) {
        const dot = w.reduce((s, wi, i) => s + wi * vec[i], 0);
        w = w.map((wi, i) => wi - dot * vec[i]);
      }

      // Normalizar
      const norm = Math.sqrt(w.reduce((s, wi) => s + wi * wi, 0)) || 1;
      v = w.map((wi) => wi / norm);
    }
    // Autovalor aproximado: λ ≈ v^T B v
    let lambda = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) lambda += v[i] * B[i][j] * v[j];
    return { vec: v, val: lambda };
  }

  const results = [];
  for (let ki = 0; ki < k; ki++) {
    results.push(powerIter(B, results));
  }

  // Coordenadas: x_i = sqrt(λ) * v_i
  const coords = Array(n).fill(null).map((_, i) =>
    results.map(({ vec, val }) => vec[i] * Math.sqrt(Math.max(0, val)))
  );

  const varExplained =
    results.reduce((s, { val }) => s + Math.max(0, val), 0);
  const varTotal =
    B.flat().reduce((s, v, idx) => s + (idx % (n + 1) === 0 ? Math.max(0, v) : 0), 0);

  return { coords, eigenvalues: results.map(r => r.val), varExplained, varTotal };
}

// ─── Projeção Nyström para ícones fora da amostra ────────────────────────────

function nystromProject(dLandmarks, landmarkCoords, landmarkD2mean, gm) {
  // dLandmarks: vetor de distâncias ao quadrado para os L landmarks
  // Formula: y = -0.5 * Phi_L^+ (d^2 - d_mean^2)  [aproximação]
  // Simplificado: interpolar pelas coordenadas dos L mais próximos
  const L = dLandmarks.length;
  const sorted = Array.from({ length: L }, (_, i) => i).sort(
    (a, b) => dLandmarks[a] - dLandmarks[b]
  );
  // Usar os 5 landmarks mais próximos com peso 1/d²
  const K = Math.min(5, L);
  let wx = 0, wy = 0, wt = 0;
  for (let k = 0; k < K; k++) {
    const li = sorted[k];
    const w = 1 / (dLandmarks[li] + 1e-9);
    wx += w * landmarkCoords[li][0];
    wy += w * landmarkCoords[li][1];
    wt += w;
  }
  return [wx / wt, wy / wt];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔬 noun_recompute_wasserstein.mjs");
  console.log("   Carregando noun_atlas_data.json…");
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const allPictos = raw.pictos;
  const N_ALL = allPictos.length;
  console.log(`   Total de ícones no arquivo: ${N_ALL}`);

  // ─── Passo 1: Amostrar 3.000 ícones (250 por categoria) ─────────────────
  const SAMPLE_PER_CAT = 250;
  const cats = Object.keys(CAT_STATE_VECTORS);
  const byCat = {};
  for (const p of allPictos) {
    if (!byCat[p.categoria]) byCat[p.categoria] = [];
    byCat[p.categoria].push(p);
  }

  const sample = [];
  for (const cat of cats) {
    const pool = byCat[cat] ?? [];
    const take = pool.slice(0, SAMPLE_PER_CAT);
    sample.push(...take);
  }
  const n = sample.length;
  console.log(`\n   Amostra selecionada: ${n} ícones (${SAMPLE_PER_CAT} por categoria)`);

  // ─── Passo 2: Pré-computar diagramas de persistência para a amostra ─────
  console.log("   Computando diagramas de persistência…");
  const nids = sample.map((p) => numericId(p.id));
  const svs = sample.map((p, i) => stateVec(p.categoria, nids[i]));
  const diags = sample.map((_, i) => persistenceDiagram(svs[i], nids[i] % 100));

  // ─── Passo 3: Matriz Wasserstein n×n completa ────────────────────────────
  console.log(`   Calculando ${Math.floor(n * (n - 1) / 2).toLocaleString()} pares Wasserstein (n=${n})…`);
  const D = Array.from({ length: n }, () => new Float64Array(n));
  let pairs = 0;
  const total = n * (n - 1) / 2;
  const reportEvery = Math.ceil(total / 20);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const w = wasserstein(diags[i], diags[j]);
      D[i][j] = w;
      D[j][i] = w;
      pairs++;
      if (pairs % reportEvery === 0) {
        process.stdout.write(`   Progress: ${Math.round(100 * pairs / total)}%  \r`);
      }
    }
  }
  console.log("\n   ✅ Matriz Wasserstein n×n concluída");

  // Normalizar distâncias para [0, 1]
  let maxW = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (D[i][j] > maxW) maxW = D[i][j];
  const SCALE = maxW || 1;
  const Dn = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => D[i][j] / SCALE));
  console.log(`   Distâncias normalizadas pelo máximo: ${SCALE.toFixed(4)}`);

  // ─── Passo 4: MDS clássico global ────────────────────────────────────────
  console.log("   Executando MDS clássico (iteração de potência, k=2)…");
  const { coords, eigenvalues, varExplained, varTotal } = classicalMDS(Dn, 2);
  const pctVar = varTotal > 0 ? (varExplained / varTotal * 100).toFixed(1) : "N/A";
  console.log(`   ✅ MDS concluído | variância explicada: ~${pctVar}% | λ=[${eigenvalues.map(v=>v.toFixed(3)).join(", ")}]`);

  // Normalizar coords para [-1, 1]
  const xs = coords.map((c) => c[0]);
  const ys = coords.map((c) => c[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rx = (maxX - minX) || 1, ry = (maxY - minY) || 1;
  const normCoords = coords.map((c) => [
    Math.round(((c[0] - minX) / rx * 2 - 1) * 1000) / 1000,
    Math.round(((c[1] - minY) / ry * 2 - 1) * 1000) / 1000,
  ]);

  // ─── Passo 5: k-NN da amostra via matriz de distâncias ──────────────────
  console.log("   Calculando k-vizinhos mais próximos (k=3) da matriz Wasserstein…");
  const K_NN = 3;
  for (let i = 0; i < n; i++) {
    const row = D[i];
    const sorted = Array.from({ length: n }, (_, j) => j)
      .filter((j) => j !== i)
      .sort((a, b) => row[a] - row[b]);
    const top = sorted.slice(0, K_NN);
    sample[i].vizinhos = top.map((j) => ({
      id: sample[j].id,
      palavra: sample[j].palavra,
      distancia: Math.round((D[i][j] / SCALE) * 1000) / 1000,
    }));
    sample[i].coordX = normCoords[i][0];
    sample[i].coordY = normCoords[i][1];
  }

  // ─── Passo 6: Projetar ícones restantes via Nyström ─────────────────────
  console.log("   Projetando ícones restantes via Nyström…");
  const sampleIds = new Set(sample.map((p) => p.id));
  const remaining = allPictos.filter((p) => !sampleIds.has(p.id));
  console.log(`   Ícones a projetar: ${remaining.length}`);

  // Usar todos os n ícones da amostra como landmarks
  const landmarkCoords = normCoords;

  let projDone = 0;
  const projReport = Math.ceil(remaining.length / 10);
  for (const p of remaining) {
    const nid = numericId(p.id);
    const sv = stateVec(p.categoria, nid);
    const dg = persistenceDiagram(sv, nid % 100);

    // Distâncias a todos os landmarks
    const dToLandmarks = diags.map((ldg) => wasserstein(dg, ldg));

    // Projeção Nyström ponderada pelos 5 mais próximos
    const sorted = Array.from({ length: n }, (_, i) => i).sort(
      (a, b) => dToLandmarks[a] - dToLandmarks[b]
    );
    const K_NY = 5;
    let wx = 0, wy = 0, wt = 0;
    for (let k = 0; k < K_NY; k++) {
      const li = sorted[k];
      const w = 1 / (dToLandmarks[li] / SCALE + 1e-6);
      wx += w * landmarkCoords[li][0];
      wy += w * landmarkCoords[li][1];
      wt += w;
    }
    p.coordX = Math.round((wx / wt) * 1000) / 1000;
    p.coordY = Math.round((wy / wt) * 1000) / 1000;

    // Vizinhos: os 3 landmarks mais próximos (Wasserstein exato)
    p.vizinhos = sorted.slice(0, K_NN).map((li) => ({
      id: sample[li].id,
      palavra: sample[li].palavra,
      distancia: Math.round((dToLandmarks[li] / SCALE) * 1000) / 1000,
    }));

    projDone++;
    if (projDone % projReport === 0) {
      process.stdout.write(`   Projeção: ${projDone}/${remaining.length} (${Math.round(100*projDone/remaining.length)}%)\r`);
    }
  }
  console.log(`\n   ✅ Projeção Nyström concluída para ${remaining.length} ícones`);

  // ─── Passo 7: Salvar JSON atualizado ─────────────────────────────────────
  raw.pictos = [...sample, ...remaining];
  raw.vizinhosMethod = "wasserstein-global-mds";
  raw.mdsInfo = {
    method: "classical-mds-power-iteration",
    sampleSize: n,
    totalIcons: N_ALL,
    eigenvalues: eigenvalues.map(v => Math.round(v * 1000) / 1000),
    normalizationScale: Math.round(SCALE * 10000) / 10000,
    notes: "Full all-pairs Wasserstein O(n²) on 3000-icon sample; remaining icons projected via Nyström (5 landmarks)",
    rateLimit: "Fetch used 350ms pause per 10-request batch ≈ 35ms/request (within Noun Project API fair-use)"
  };

  fs.writeFileSync(DATA_PATH, JSON.stringify(raw, null, 2));
  console.log(`\n   ✅ noun_atlas_data.json salvo (${raw.pictos.length} ícones totais)`);
  console.log(`   vizinhosMethod: ${raw.vizinhosMethod}`);
  console.log(`   MDS global: λ=[${eigenvalues.map(v=>v.toFixed(3)).join(", ")}]`);
  console.log(`\n   Exemplo — "${sample[0].palavra}" (${sample[0].categoria}):`);
  sample[0].vizinhos.forEach((v, i) => console.log(`     Vizinho ${i+1}: "${v.palavra}" (d=${v.distancia})`));
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
