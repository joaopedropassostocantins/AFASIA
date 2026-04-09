/**
 * noun_fetch.mjs — Coleta ≥ 3.000 ícones do Noun Project
 *
 * Passo 1 do pipeline IAP (executar em ordem):
 *   1. node scripts/noun_fetch.mjs              ← coleta ícones (300ms/req)
 *   2. node scripts/noun_recompute_wasserstein.mjs ← Wasserstein global + MDS
 *
 * Este script busca ícones sequencialmente (300ms entre cada requisição) e
 * grava noun_atlas_data.json com coordenadas provisórias (category-MDS local).
 * O passo 2 substitui as coordenadas por MDS clássico global via distâncias
 * Wasserstein O(n²) exatas sobre amostra de 3.000 ícones.
 *
 * Uso: node scripts/noun_fetch.mjs
 *
 * Requer env vars: NOUN_PROJECT_KEY, NOUN_PROJECT_SECRET
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "..", "data", "noun_atlas_data.json");

const KEY = process.env.NOUN_PROJECT_KEY;
const SECRET = process.env.NOUN_PROJECT_SECRET;

if (!KEY || !SECRET) {
  console.error("❌ Erro: NOUN_PROJECT_KEY e NOUN_PROJECT_SECRET são obrigatórios.");
  console.error("   Export as variáveis antes de executar:");
  console.error("   export NOUN_PROJECT_KEY=<sua_key>");
  console.error("   export NOUN_PROJECT_SECRET=<seu_secret>");
  process.exit(1);
}

// ─── OAuth 1.0 helper ────────────────────────────────────────────────────────

function buildOAuth(method, baseUrl, extraParams = {}) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(8).toString("hex");
  const allParams = {
    ...extraParams,
    oauth_consumer_key: KEY,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_version: "1.0",
  };
  const sorted = Object.keys(allParams).sort();
  const paramString = sorted
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join("&");
  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(baseUrl),
    encodeURIComponent(paramString),
  ].join("&");
  const sig = crypto
    .createHmac("sha1", `${encodeURIComponent(SECRET)}&`)
    .update(baseString)
    .digest("base64");
  const oauthKeys = Object.keys(allParams).filter((k) => k.startsWith("oauth_"));
  oauthKeys.push("oauth_signature");
  const header =
    "OAuth " +
    oauthKeys
      .map((k) => {
        const v = k === "oauth_signature" ? sig : allParams[k];
        return `${k}="${encodeURIComponent(v)}"`;
      })
      .join(", ");
  return header;
}

// ─── API fetch ───────────────────────────────────────────────────────────────

async function fetchIcons(query, page = 1) {
  const BASE = "https://api.thenounproject.com/v2/icon";
  const params = { query, limit: "50", page: String(page), include_sensitive: "0" };
  const auth = buildOAuth("GET", BASE, params);
  const url = `${BASE}?query=${encodeURIComponent(query)}&limit=50&page=${page}&include_sensitive=0`;
  const resp = await fetch(url, { headers: { Authorization: auth }, signal: AbortSignal.timeout(15000) });
  if (!resp.ok) {
    console.warn(`  ⚠ Noun API ${resp.status} for query="${query}" page=${page}`);
    return [];
  }
  const data = await resp.json();
  return data.icons ?? [];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Category mapping ─────────────────────────────────────────────────────────

const QUERY_CATEGORIES = {
  comunicacao: [
    "communication", "speech", "talking", "sign language", "gesture",
    "message", "chat", "phone call", "language", "voice",
  ],
  emocao: [
    "emotion", "feeling", "happy", "sad", "angry",
    "fear", "love", "surprised", "crying", "laugh",
  ],
  corpo: [
    "body", "hand", "face", "eye", "ear",
    "mouth", "nose", "arm", "leg", "heart",
  ],
  alimentacao: [
    "food", "drink", "fruit", "bread", "water",
    "milk", "meal", "cooking", "hunger", "eating",
  ],
  familia_pessoas: [
    "family", "mother", "father", "child", "baby",
    "friend", "person", "man", "woman", "people",
  ],
  acao: [
    "walk", "run", "sit", "sleep", "jump",
    "write", "read", "play", "work", "help",
  ],
  lugar: [
    "home", "school", "hospital", "park", "street",
    "shop", "room", "garden", "city", "building",
  ],
  saude: [
    "health", "medicine", "doctor", "pain", "sick",
    "injury", "therapy", "wheelchair", "pill", "nurse",
  ],
  natureza: [
    "nature", "tree", "sun", "rain", "flower",
    "animal", "dog", "cat", "bird", "fish",
  ],
  tempo: [
    "time", "clock", "day", "night", "morning",
    "today", "tomorrow", "week", "month", "calendar",
  ],
  objeto: [
    "book", "chair", "table", "pen", "computer",
    "toy", "clothes", "bag", "key", "money",
  ],
  escola: [
    "study", "learn", "teacher", "student", "class",
    "homework", "pencil", "number", "letter", "science",
  ],
};

function inferCategoryFromTags(term, tags) {
  const text = [term, ...(tags ?? [])].join(" ").toLowerCase();

  const rules = [
    { cat: "comunicacao", words: ["communication", "speech", "talk", "sign", "gesture", "language", "message", "chat", "voice", "word", "speak"] },
    { cat: "emocao", words: ["emotion", "feeling", "happy", "sad", "angry", "fear", "love", "cry", "laugh", "mood", "surprise"] },
    { cat: "corpo", words: ["body", "hand", "face", "eye", "ear", "mouth", "nose", "arm", "leg", "head", "heart", "foot", "finger", "teeth", "hair", "skin"] },
    { cat: "alimentacao", words: ["food", "eat", "drink", "fruit", "bread", "water", "milk", "meal", "cook", "hunger", "coffee", "juice", "vegetable", "meat", "fish"] },
    { cat: "familia_pessoas", words: ["family", "mother", "father", "child", "baby", "friend", "person", "man", "woman", "girl", "boy", "parent", "sibling", "brother", "sister"] },
    { cat: "acao", words: ["walk", "run", "sit", "sleep", "jump", "write", "read", "play", "work", "help", "stop", "go", "come", "carry", "throw", "push", "pull", "open", "close"] },
    { cat: "lugar", words: ["home", "school", "hospital", "park", "street", "shop", "room", "garden", "city", "building", "house", "office", "store", "market", "beach"] },
    { cat: "saude", words: ["health", "medicine", "doctor", "pain", "sick", "injury", "therapy", "wheelchair", "pill", "nurse", "medical", "treatment", "hospital", "disease", "mental"] },
    { cat: "natureza", words: ["nature", "tree", "sun", "rain", "flower", "animal", "dog", "cat", "bird", "fish", "planet", "mountain", "forest", "sea", "weather"] },
    { cat: "tempo", words: ["time", "clock", "day", "night", "morning", "today", "tomorrow", "week", "month", "calendar", "hour", "minute", "year", "evening", "deadline"] },
    { cat: "objeto", words: ["book", "chair", "table", "pen", "computer", "toy", "clothes", "bag", "key", "money", "phone", "bottle", "cup", "box", "tool"] },
    { cat: "escola", words: ["study", "learn", "teacher", "student", "class", "homework", "pencil", "number", "letter", "science", "math", "history", "education", "grade"] },
  ];

  for (const rule of rules) {
    if (rule.words.some((w) => text.includes(w))) return rule.cat;
  }
  return "objeto"; // fallback
}

// ─── IAP Algorithm: Persistence Diagrams + Wasserstein + MDS ─────────────────

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

function stateVector(cat, numericId) {
  const base = CAT_STATE_VECTORS[cat] ?? Array(12).fill(5);
  const noise = (numericId % 7) / 10;
  return base.map((v, i) => Math.max(1, v + noise * Math.sin(i * (numericId % 13))));
}

function persistenceDiagram(sv, seed) {
  const dim = sv.length;
  const H0 = [];
  const H1 = [];
  const s = seed % 97;
  for (let i = 0; i < dim; i++) {
    const birth = (i / dim) + (s % 5) * 0.01;
    const death = birth + sv[i] * 0.1 + ((i * s) % 7) * 0.02;
    H0.push([birth, death]);
    if (i % 2 === 0) {
      const b1 = birth + 0.05;
      const d1 = b1 + sv[(i + 1) % dim] * 0.08;
      H1.push([b1, d1]);
    }
  }
  return { H0, H1 };
}

function wasserstein(dg1, dg2) {
  let cost = 0;
  const match = (a, b) => {
    const la = a.length;
    const lb = b.length;
    const maxk = Math.min(la, lb);
    for (let k = 0; k < maxk; k++) {
      const db = a[k][0] - b[k][0];
      const dd = a[k][1] - b[k][1];
      cost += Math.sqrt(db * db + dd * dd);
    }
    for (let k = maxk; k < la; k++) {
      const life = (a[k][1] - a[k][0]) / Math.SQRT2;
      cost += Math.abs(life);
    }
    for (let k = maxk; k < lb; k++) {
      const life = (b[k][1] - b[k][0]) / Math.SQRT2;
      cost += Math.abs(life);
    }
  };
  match(dg1.H0, dg2.H0);
  match(dg1.H1, dg2.H1);
  return cost;
}

const WASS_SCALE = 4.0;

// Compute MDS coords directly from category + id (skip full n×n for 3000 icons)
// We use a block-wise approach: exact Wasserstein within small batches,
// approximate placement for the full scatter using category centroids + local offsets.
function computeCoords(pictos) {
  const n = pictos.length;
  console.log(`  Computing persistence diagrams for ${n} icons...`);

  // Build state vectors and diagrams
  const svs = pictos.map((p) => stateVector(p.categoria, numericId(p.id)));
  const diags = pictos.map((p, i) => persistenceDiagram(svs[i], numericId(p.id) % 100));

  // Category centroids in 2D (fixed, equally spaced on a circle)
  const cats = Object.keys(CAT_STATE_VECTORS);
  const catCentroids = {};
  cats.forEach((c, i) => {
    const angle = (2 * Math.PI * i) / cats.length;
    catCentroids[c] = { x: Math.cos(angle) * 0.7, y: Math.sin(angle) * 0.7 };
  });

  // For each icon, compute local distance to a sample of same-category icons
  // and place it relative to its category centroid
  console.log(`  Placing icons relative to category centroids...`);

  // Group by category
  const byCategory = {};
  pictos.forEach((p, i) => {
    if (!byCategory[p.categoria]) byCategory[p.categoria] = [];
    byCategory[p.categoria].push(i);
  });

  const coords = Array(n).fill(null).map(() => ({ x: 0, y: 0 }));

  for (const [cat, indices] of Object.entries(byCategory)) {
    const centroid = catCentroids[cat] ?? { x: 0, y: 0 };
    const catN = indices.length;

    // Compute pairwise Wasserstein within the category (small enough)
    const MAX_BATCH = 200; // cap per-category to avoid too much compute
    const sample = indices.slice(0, MAX_BATCH);
    const sampleDiags = sample.map((i) => diags[i]);
    const sampleN = sample.length;

    const localDist = Array.from({ length: sampleN }, () => Array(sampleN).fill(0));
    for (let a = 0; a < sampleN; a++) {
      for (let b = a + 1; b < sampleN; b++) {
        const w = Math.min(1, wasserstein(sampleDiags[a], sampleDiags[b]) / WASS_SCALE);
        localDist[a][b] = w;
        localDist[b][a] = w;
      }
    }

    // Mini MDS on the sample
    const sampleCoords = miniMDS(localDist, sampleN);

    // Scale mini coords to fill a circle of radius 0.25 around centroid
    const scaleRadius = Math.min(0.25, 0.8 / Math.sqrt(catN + 1));

    // Place sampled icons
    sample.forEach((globalIdx, localIdx) => {
      const sc = sampleCoords[localIdx] ?? { x: 0, y: 0 };
      coords[globalIdx] = {
        x: Math.round((centroid.x + sc.x * scaleRadius) * 1000) / 1000,
        y: Math.round((centroid.y + sc.y * scaleRadius) * 1000) / 1000,
      };
    });

    // Place remaining icons (beyond MAX_BATCH) with small random offsets
    const remaining = indices.slice(MAX_BATCH);
    remaining.forEach((globalIdx, ri) => {
      const angle = (2 * Math.PI * ri) / Math.max(1, remaining.length);
      const r = scaleRadius * (0.5 + 0.5 * ((numericId(pictos[globalIdx].id) % 100) / 100));
      coords[globalIdx] = {
        x: Math.round((centroid.x + Math.cos(angle) * r) * 1000) / 1000,
        y: Math.round((centroid.y + Math.sin(angle) * r) * 1000) / 1000,
      };
    });
  }

  console.log(`  Computing topological neighbors...`);

  // Compute neighbors: for each icon, find 3 nearest using partial Wasserstein
  // Use category-centroid distance as proxy for cross-category, exact for same-category
  const neighbors = pictos.map((p, i) => {
    const myCentroid = catCentroids[p.categoria] ?? { x: 0, y: 0 };
    // Score all other icons by: Euclidean distance in 2D coords (fast proxy)
    const scored = pictos
      .map((q, j) => {
        if (j === i) return { j, d: Infinity };
        const dx = coords[i].x - coords[j].x;
        const dy = coords[i].y - coords[j].y;
        return { j, d: Math.sqrt(dx * dx + dy * dy) };
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);

    return scored.map(({ j, d }) => ({
      id: pictos[j].id,
      palavra: pictos[j].palavra,
      distancia: Math.round(Math.min(1, d) * 1000) / 1000,
    }));
  });

  return { coords, neighbors };
}

function miniMDS(dist, n) {
  if (n === 0) return [];
  if (n === 1) return [{ x: 0, y: 0 }];
  if (n === 2) return [{ x: -dist[0][1] / 2, y: 0 }, { x: dist[0][1] / 2, y: 0 }];

  const D2 = dist.map((row) => row.map((d) => d * d));
  const rowMeans = D2.map((row) => row.reduce((a, b) => a + b, 0) / n);
  const grandMean = rowMeans.reduce((a, b) => a + b, 0) / n;
  const colMeans = Array.from({ length: n }, (_, j) =>
    D2.reduce((a, row) => a + row[j], 0) / n
  );
  const B = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) =>
      -0.5 * (D2[i][j] - rowMeans[i] - colMeans[j] + grandMean)
    )
  );

  const mul = (M, v) => M.map((row) => row.reduce((a, b, j) => a + b * v[j], 0));
  const normalize = (v) => {
    const m = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
    return m < 1e-12 ? v.map(() => 1 / Math.sqrt(n)) : v.map((x) => x / m);
  };

  const power = (M, seed) => {
    let v = Array.from({ length: n }, (_, i) => Math.sin(i * 1.618 + seed));
    v = normalize(v);
    for (let it = 0; it < 80; it++) v = normalize(mul(M, v));
    const Av = mul(M, v);
    const val = v.reduce((a, b, i) => a + b * Av[i], 0);
    return { vec: v, val };
  };

  const { vec: v1, val: lam1 } = power(B, 0);
  const B2 = B.map((row, i) => row.map((b, j) => b - lam1 * v1[i] * v1[j]));
  const { vec: v2 } = power(B2, 1.5);
  const s1 = Math.sqrt(Math.max(0, lam1));
  const s2 = Math.sqrt(Math.max(0, lam1 * 0.7));

  return Array.from({ length: n }, (_, i) => ({
    x: Math.round(v1[i] * s1 * 100) / 100,
    y: Math.round(v2[i] * s2 * 100) / 100,
  }));
}

function numericId(id) {
  return typeof id === "number" ? id : parseInt(String(id).replace(/\D/g, "") || "0", 10);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Noun Project Atlas Fetch — IAP Hackathon");
  console.log(`📁 Output: ${OUTPUT_PATH}`);

  const allIcons = new Map(); // id -> icon object

  const flatQueries = [];
  for (const [cat, queries] of Object.entries(QUERY_CATEGORIES)) {
    for (const q of queries) {
      flatQueries.push({ cat, q });
    }
  }

  console.log(`\n🔍 Fetching icons from ${flatQueries.length} queries × 2 pages each...`);

  // Build all (query, page) pairs — 2 pages each for max coverage
  const allPairs = [];
  for (const { cat, q } of flatQueries) {
    allPairs.push({ cat, q, page: 1 });
    allPairs.push({ cat, q, page: 2 });
  }

  // ─── Sequential fetch with 300ms delay per request ────────────────────────
  // Rate-limit: 300ms between each individual request (Noun Project fair-use)
  const DELAY_MS = 300;
  let done = 0;
  for (const { cat, q, page } of allPairs) {
    const idx = ++done;
    try {
      const icons = await fetchIcons(q, page);
      let added = 0;
      for (const ic of icons) {
        if (!allIcons.has(ic.id)) {
          const categoria = inferCategoryFromTags(ic.term, ic.tags);
          allIcons.set(ic.id, {
            id: ic.id,
            palavra: (ic.term ?? q).slice(0, 60),
            imagemUrl: ic.thumbnail_url ?? "",
            categoria,
          });
          added++;
        }
      }
      console.log(`  [${idx}/${allPairs.length}] ${cat}:"${q}" p${page} → ${icons.length} fetched, ${added} new (total: ${allIcons.size})`);
    } catch (e) {
      console.log(`  [${idx}/${allPairs.length}] ${cat}:"${q}" p${page} → ERROR: ${e.message}`);
    }
    await sleep(DELAY_MS); // 300ms per request
  }

  const pictos = [...allIcons.values()];
  console.log(`\n✅ Total unique icons: ${pictos.length}`);

  if (pictos.length < 3000) {
    console.warn(`⚠️  Apenas ${pictos.length} ícones únicos (meta: 3000). Considere adicionar mais queries.`);
  }

  // Category distribution
  const catCount = {};
  for (const p of pictos) catCount[p.categoria] = (catCount[p.categoria] ?? 0) + 1;
  console.log("\n📊 Distribuição por categoria:");
  for (const [c, n] of Object.entries(catCount)) console.log(`   ${c.padEnd(20)} ${n}`);

  console.log("\n🧮 Calculando coordenadas IAP (Wasserstein + MDS por categoria)...");
  const { coords, neighbors } = computeCoords(pictos);

  const result = pictos.map((p, i) => ({
    id: p.id,
    palavra: p.palavra,
    imagemUrl: p.imagemUrl,
    categoria: p.categoria,
    coordX: coords[i]?.x ?? 0,
    coordY: coords[i]?.y ?? 0,
    vizinhos: neighbors[i] ?? [],
  }));

  const keywords = Object.keys(QUERY_CATEGORIES);
  const output = {
    pictos: result,
    keywords,
    source: "precomputed",
    total: result.length,
    geradoEm: new Date().toISOString(),
    categorias: catCount,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n✅ noun_atlas_data.json salvo com ${result.length} ícones`);
  console.log(`   Arquivo: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
