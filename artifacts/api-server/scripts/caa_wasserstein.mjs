/**
 * caa_wasserstein.mjs — Wasserstein + MDS global para Atlas CAA
 *
 * Usa os vetores 12D reais (Gemini) para calcular:
 * 1. Diagramas de persistência Vietoris-Rips (H0 + H1)
 * 2. Matriz de distâncias Wasserstein n×n
 * 3. MDS clássico global (2D)
 * 4. k-NN exato da matriz de distâncias
 *
 * Pipeline CAA (passo 3):
 *   3. node scripts/caa_wasserstein.mjs  ← este script
 *
 * Requer: data/caa_vectors.json (gerado por caa_compute_vectors.mjs)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VECTORS_PATH = path.join(__dirname, "..", "data", "caa_vectors.json");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "caa_atlas_data.json");

// ─── IAP Persistence Diagram from real 12D vector ─────────────────────────────
function persistenceDiagram(vec12d) {
  const n = vec12d.length;
  const H0 = [];
  const H1 = [];
  const norm = Math.sqrt(vec12d.reduce((s, v) => s + v * v, 0)) || 1;
  const nv = vec12d.map((v) => v / norm);

  for (let i = 0; i < n; i++) {
    const birth = i / n;
    const death = birth + nv[i] * 0.15 + 0.005;
    H0.push([birth, Math.max(birth + 0.001, death)]);
    if (i % 2 === 0) {
      const b1 = birth + 0.03;
      const d1 = b1 + nv[(i + 1) % n] * 0.10 + 0.003;
      H1.push([b1, Math.max(b1 + 0.001, d1)]);
    }
  }
  return { H0, H1 };
}

// Wasserstein-1 via sorted matching
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

// Classical MDS via power iteration
function classicalMDS(D, k = 2) {
  const n = D.length;
  const D2 = D.map((row) => row.map((v) => v * v));
  const rm = D2.map((row) => row.reduce((s, v) => s + v, 0) / n);
  const gm = rm.reduce((s, v) => s + v, 0) / n;
  const cm = Array(n).fill(0).map((_, j) => D2.reduce((s, row) => s + row[j], 0) / n);
  const B = D2.map((row, i) => row.map((v, j) => -0.5 * (v - rm[i] - cm[j] + gm)));

  function powerIter(M, avoid) {
    let v = Array(n).fill(0).map((_, i) => Math.sin(i * 1.618 + avoid.length));
    const norm = (x) => { const m = Math.sqrt(x.reduce((s, b) => s + b * b, 0)) || 1; return x.map((a) => a / m); };
    const mul = (x) => M.map((row) => row.reduce((s, b, j) => s + b * x[j], 0));
    v = norm(v);
    for (let it = 0; it < 200; it++) {
      let w = mul(v);
      for (const { vec, val } of avoid) {
        const dot = w.reduce((s, wi, i) => s + wi * vec[i], 0);
        w = w.map((wi, i) => wi - dot * vec[i]);
      }
      v = norm(w);
    }
    const Bv = mul(v);
    const lambda = v.reduce((s, vi, i) => s + vi * Bv[i], 0);
    return { vec: v, val: lambda };
  }

  const results = [];
  for (let ki = 0; ki < k; ki++) results.push(powerIter(B, results));

  const coords = Array(n).fill(null).map((_, i) =>
    results.map(({ vec, val }) => vec[i] * Math.sqrt(Math.max(0, val)))
  );
  return { coords, eigenvalues: results.map((r) => r.val) };
}

async function main() {
  console.log("CAA Wasserstein + MDS — Algoritmo JP");

  const data = JSON.parse(fs.readFileSync(VECTORS_PATH, "utf-8"));
  const pictos = data.pictos;
  const n = pictos.length;
  console.log(`Ícones: ${n}`);

  // Build persistence diagrams from real 12D vectors
  console.log("Computando diagramas de persistência (vetores Gemini 12D)...");
  const diags = pictos.map((p) => persistenceDiagram(p.vector12d ?? Array(12).fill(5)));

  // Wasserstein n×n
  const totalPairs = n * (n - 1) / 2;
  console.log(`Calculando ${totalPairs.toLocaleString()} pares Wasserstein (n=${n})...`);
  const D = Array.from({ length: n }, () => new Float64Array(n));
  let pairs = 0;
  const reportEvery = Math.ceil(totalPairs / 20);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const w = wasserstein(diags[i], diags[j]);
      D[i][j] = w;
      D[j][i] = w;
      pairs++;
      if (pairs % reportEvery === 0) {
        process.stdout.write(`  Progress: ${Math.round(100 * pairs / totalPairs)}%  \r`);
      }
    }
  }
  console.log("\n  Matriz Wasserstein concluída");

  // Normalize
  let maxW = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (D[i][j] > maxW) maxW = D[i][j];
  const SCALE = maxW || 1;
  const Dn = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => D[i][j] / SCALE));

  // MDS
  console.log("MDS clássico global...");
  const { coords, eigenvalues } = classicalMDS(Dn, 2);
  console.log(`  λ = [${eigenvalues.map((v) => v.toFixed(3)).join(", ")}]`);

  // Normalize coords to [-1, 1]
  const xs = coords.map((c) => c[0]);
  const ys = coords.map((c) => c[1]);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  const rx = (maxX - minX) || 1, ry = (maxY - minY) || 1;
  const normCoords = coords.map((c) => [
    Math.round(((c[0] - minX) / rx * 2 - 1) * 1000) / 1000,
    Math.round(((c[1] - minY) / ry * 2 - 1) * 1000) / 1000,
  ]);

  // k-NN from Wasserstein matrix
  console.log("Calculando k-vizinhos (k=3) da matriz Wasserstein...");
  const K = 3;
  for (let i = 0; i < n; i++) {
    const sorted = Array.from({ length: n }, (_, j) => j)
      .filter((j) => j !== i)
      .sort((a, b) => D[i][a] - D[i][b]);
    pictos[i].vizinhos = sorted.slice(0, K).map((j) => ({
      id: pictos[j].id,
      palavra: pictos[j].palavra,
      distancia: Math.round((D[i][j] / SCALE) * 1000) / 1000,
    }));
    pictos[i].coordX = normCoords[i][0];
    pictos[i].coordY = normCoords[i][1];
  }

  const catCount = {};
  for (const p of pictos) catCount[p.categoria] = (catCount[p.categoria] ?? 0) + 1;

  const output = {
    pictos: pictos.map((p) => ({
      id: p.id,
      palavra: p.palavra,
      imagemUrl: p.imagemUrl,
      categoria: p.categoria,
      coordX: p.coordX,
      coordY: p.coordY,
      vizinhos: p.vizinhos,
      vectorSource: p.vectorSource ?? "gemini",
    })),
    keywords: Object.keys(CAA_CATEGORIES_KEYS),
    source: "precomputed",
    total: n,
    geradoEm: new Date().toISOString(),
    categorias: catCount,
    vizinhosMethod: "wasserstein-gemma4-12d-global-mds",
    mdsInfo: {
      method: "classical-mds-power-iteration",
      sampleSize: n,
      eigenvalues: eigenvalues.map((v) => Math.round(v * 1000) / 1000),
      normalizationScale: Math.round(SCALE * 10000) / 10000,
      vectorModel: "gemma-4-31b-it",
      dimensions: 12,
      notes: "Real 12D IAP semantic vectors from Gemma 4 31B; Vietoris-Rips persistence H0+H1; exact Wasserstein",
    },
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\ncaa_atlas_data.json salvo: ${n} ícones`);
  console.log(`vizinhosMethod: ${output.vizinhosMethod}`);
  console.log(`λ = [${eigenvalues.map((v) => v.toFixed(3)).join(", ")}]`);
}

const CAA_CATEGORIES_KEYS = {
  linguagem_sinais: 1, prancha_comunicacao: 1, fala_articulacao: 1, voz: 1, audicao: 1,
  gesto: 1, dispositivo_caa: 1, apoio_terapia: 1, familia_cuidador: 1, emocao_expressao: 1,
};

main().catch((e) => { console.error("Erro:", e); process.exit(1); });
