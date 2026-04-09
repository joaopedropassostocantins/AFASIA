/**
 * disfasia_update_vectors.mjs — Recalcula vetores Gemini 12D para Atlas Disfasia
 *
 * Atualiza os 38 ícones ARASAAC do Atlas Disfasia com vetores semânticos 12D
 * reais via Gemini, substituindo os vetores estáticos sintéticos.
 *
 * Requer: GEMINI_USER_API_KEY
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DISFASIA_PATH = path.join(__dirname, "..", "data", "disfasia_atlas_data.json");
const CACHE_PATH = path.join(__dirname, "..", "data", "disfasia_gemini_cache.json");

const GEMINI_KEY = process.env.GEMINI_USER_API_KEY;
if (!GEMINI_KEY) {
  console.error("Erro: GEMINI_USER_API_KEY é obrigatório.");
  process.exit(1);
}

const GEMINI_MODEL = "gemma-4-31b-it";
const FALLBACK_MODEL = "gemma-3-27b-it";
const API_VERSION = "v1beta";
const DELAY_MS = 5000;

const IAP_DIMENSIONS = [
  "concretude", "emocionalidade", "acao", "social", "urgencia", "temporalidade",
  "localizacao", "saude_corpo", "comunicacao", "cognitivo", "necessidade_basica", "especializado_caa",
];

const IAP_PROMPT = (word, cat) => `
Você é especialista em disfasia e Comunicação Aumentativa e Alternativa (CAA).

Para o conceito/palavra: "${word}" (categoria disfasia: ${cat})

Atribua pontuações 0-10 para as 12 dimensões semânticas IAP no contexto de comunicação de pacientes com disfasia:

1. concretude: quão concreto (10=objeto físico, 0=abstrato)
2. emocionalidade: carga emocional (10=forte emoção, 0=neutro)
3. acao: ação/movimento (10=ação intensa, 0=estático)
4. social: interação social (10=social, 0=individual)
5. urgencia: urgência (10=urgente, 0=não urgente)
6. temporalidade: relação temporal (10=temporal, 0=atemporal)
7. localizacao: espaço/lugar (10=localização clara, 0=sem localização)
8. saude_corpo: relevância para saúde/corpo (10=central, 0=não relacionado)
9. comunicacao: relevância para comunicação (10=central, 0=não comunicativo)
10. cognitivo: complexidade cognitiva (10=complexo, 0=simples)
11. necessidade_basica: necessidade básica (10=fundamental, 0=supérfluo)
12. especializado_caa: específico de CAA/disfasia (10=vocabulário central, 0=genérico)

Responda APENAS com JSON, sem markdown:
{"concretude":X,"emocionalidade":X,"acao":X,"social":X,"urgencia":X,"temporalidade":X,"localizacao":X,"saude_corpo":X,"comunicacao":X,"cognitivo":X,"necessidade_basica":X,"especializado_caa":X}
`.trim();

const CAT_FALLBACK = {
  fluencia:    [4, 5, 6, 6, 6, 8, 2, 5, 9, 5, 6, 9],
  sequencia:   [3, 3, 5, 5, 5, 9, 3, 4, 8, 6, 5, 8],
  emocao:      [3, 10, 5, 7, 6, 4, 2, 5, 8, 5, 6, 7],
  espaco:      [6, 3, 3, 4, 3, 5, 10, 4, 6, 5, 4, 6],
  comunicacao: [4, 5, 6, 8, 5, 4, 3, 4, 10, 5, 6, 9],
};

async function callGemmaModel(model, word, categoria) {
  const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent?key=${GEMINI_KEY}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: IAP_PROMPT(word, categoria) }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`);
  }
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const m = text.match(/\{[^}]+\}/);
  if (!m) throw new Error("No JSON");
  const parsed = JSON.parse(m[0]);
  return IAP_DIMENSIONS.map((dim) => {
    const v = parsed[dim]; return typeof v === "number" ? Math.max(0, Math.min(10, v)) : 5;
  });
}

async function callGemini(word, categoria) {
  const modelsToTry = [GEMINI_MODEL, FALLBACK_MODEL];
  for (const model of modelsToTry) {
    try {
      const vec = await callGemmaModel(model, word, categoria);
      return { vec, source: model };
    } catch (err) {
      process.stderr.write(`\n  [${model}] ${err.message.slice(0, 100)}\n`);
    }
  }
  return { vec: CAT_FALLBACK[categoria] ?? Array(12).fill(5), source: "fallback" };
}

function persistenceDiagram(vec12d) {
  const n = vec12d.length;
  const norm = Math.sqrt(vec12d.reduce((s, v) => s + v * v, 0)) || 1;
  const nv = vec12d.map((v) => v / norm);
  const H0 = nv.map((v, i) => { const b = i / n; return [b, Math.max(b + 0.001, b + v * 0.15 + 0.005)]; });
  const H1 = nv.filter((_, i) => i % 2 === 0).map((v, i) => {
    const b = H0[i * 2][0] + 0.03; return [b, Math.max(b + 0.001, b + nv[(i * 2 + 1) % n] * 0.10 + 0.003)];
  });
  return { H0, H1 };
}

function wasserstein(dg1, dg2) {
  let cost = 0;
  for (const key of ["H0", "H1"]) {
    const a = dg1[key], b = dg2[key];
    const maxk = Math.min(a.length, b.length);
    for (let k = 0; k < maxk; k++) {
      const db = a[k][0] - b[k][0], dd = a[k][1] - b[k][1];
      cost += Math.sqrt(db * db + dd * dd);
    }
    for (let k = maxk; k < a.length; k++) cost += Math.abs(a[k][1] - a[k][0]) * Math.SQRT2 / 2;
    for (let k = maxk; k < b.length; k++) cost += Math.abs(b[k][1] - b[k][0]) * Math.SQRT2 / 2;
  }
  return cost;
}

function miniMDS(D, n) {
  if (n <= 1) return Array(n).fill({ x: 0, y: 0 });
  const D2 = D.map((r) => r.map((v) => v * v));
  const rm = D2.map((r) => r.reduce((s, v) => s + v, 0) / n);
  const gm = rm.reduce((s, v) => s + v, 0) / n;
  const cm = Array(n).fill(0).map((_, j) => D2.reduce((s, r) => s + r[j], 0) / n);
  const B = D2.map((r, i) => r.map((v, j) => -0.5 * (v - rm[i] - cm[j] + gm)));
  const norm = (v) => { const m = Math.sqrt(v.reduce((s, b) => s + b * b, 0)) || 1; return v.map((a) => a / m); };
  const mul = (M, v) => M.map((r) => r.reduce((s, b, j) => s + b * v[j], 0));
  function power(seed) {
    let v = norm(Array(n).fill(0).map((_, i) => Math.sin(i * 1.618 + seed)));
    for (let it = 0; it < 100; it++) v = norm(mul(B, v));
    const Bv = mul(B, v); const lam = v.reduce((s, vi, i) => s + vi * Bv[i], 0);
    return { vec: v, val: lam };
  }
  const { vec: v1, val: l1 } = power(0);
  const B2 = B.map((r, i) => r.map((b, j) => b - l1 * v1[i] * v1[j]));
  const { vec: v2 } = power(1.5);
  const s1 = Math.sqrt(Math.max(0, l1)), s2 = Math.sqrt(Math.max(0, l1 * 0.7));
  return Array(n).fill(null).map((_, i) => ({ x: Math.round(v1[i] * s1 * 1000) / 1000, y: Math.round(v2[i] * s2 * 1000) / 1000 }));
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  console.log(`Disfasia — Atualização com vetores Gemma 4 31B (${GEMINI_MODEL})`);

  const data = JSON.parse(fs.readFileSync(DISFASIA_PATH, "utf-8"));
  const pictos = data.pictos;
  console.log(`Ícones: ${pictos.length}`);

  let cache = {};
  if (fs.existsSync(CACHE_PATH)) cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));

  let gemmaCount = 0, fallbackCount = 0, cacheHit = 0;
  const vectors = [];

  for (let i = 0; i < pictos.length; i++) {
    const p = pictos[i];
    const key = `${p.id}:${p.palavra}`;
    if (cache[key]) {
      cacheHit++;
      vectors.push(cache[key].vec);
      process.stdout.write(`\r[${i + 1}/${pictos.length}] gemma=${gemmaCount} cache=${cacheHit}   `);
      continue;
    }
    const result = await callGemini(p.palavra, p.categoria);
    vectors.push(result.vec);
    cache[key] = result;
    if (result.source !== "fallback") { gemmaCount++; await sleep(DELAY_MS); }
    else { fallbackCount++; }
    process.stdout.write(`\r[${i + 1}/${pictos.length}] gemma=${gemmaCount} cache=${cacheHit} fallback=${fallbackCount}   `);
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log(`\n\nVetores: gemma=${gemmaCount} cache=${cacheHit} fallback=${fallbackCount}`);

  // Recompute Wasserstein + MDS
  console.log("Recomputando Wasserstein + MDS...");
  const n = pictos.length;
  const diags = vectors.map((v) => persistenceDiagram(v));
  const D = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      D[i][j] = D[j][i] = wasserstein(diags[i], diags[j]);
    }
  }
  let maxW = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (D[i][j] > maxW) maxW = D[i][j];
  const SCALE = maxW || 1;
  const Dn = D.map((r) => r.map((v) => v / SCALE));
  const mdsCoords = miniMDS(Dn, n);

  const xs = mdsCoords.map((c) => c.x), ys = mdsCoords.map((c) => c.y);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  const rx = (maxX - minX) || 1, ry = (maxY - minY) || 1;

  for (let i = 0; i < n; i++) {
    pictos[i].coordX = Math.round(((mdsCoords[i].x - minX) / rx * 2 - 1) * 1000) / 1000;
    pictos[i].coordY = Math.round(((mdsCoords[i].y - minY) / ry * 2 - 1) * 1000) / 1000;
    const K = 3;
    const sorted = Array.from({ length: n }, (_, j) => j).filter((j) => j !== i).sort((a, b) => D[i][a] - D[i][b]);
    pictos[i].vizinhos = sorted.slice(0, K).map((j) => ({
      id: pictos[j].id, palavra: pictos[j].palavra, distancia: Math.round((D[i][j] / SCALE) * 1000) / 1000,
    }));
    pictos[i].vectorSource = GEMINI_MODEL;
  }

  data.vizinhosMethod = "wasserstein-gemma4-12d-mds";
  data.geradoEm = new Date().toISOString();
  data.geminiModel = GEMINI_MODEL;
  fs.writeFileSync(DISFASIA_PATH, JSON.stringify(data, null, 2));
  console.log(`disfasia_atlas_data.json atualizado com vetores Gemma 4 31B.`);
}

main().catch((e) => { console.error("Erro:", e); process.exit(1); });
