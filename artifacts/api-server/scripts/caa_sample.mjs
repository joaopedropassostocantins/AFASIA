/**
 * caa_sample.mjs — Amostra 30 ícones por categoria da caa_raw_data.json
 *
 * De 5.124 ícones brutos, seleciona 30 por categoria (300 total)
 * para uso na computação de vetores Gemini e Wasserstein.
 * Prioriza diversidade de palavras (dedup por palavra).
 *
 * Pipeline CAA (passo 1.5):
 *   1. node scripts/caa_fetch.mjs      ← 5.124 ícones brutos
 *   1.5 node scripts/caa_sample.mjs   ← este script (300 por amostra)
 *   2. node scripts/caa_compute_vectors.mjs  ← vetores Gemini
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_PATH = path.join(__dirname, "..", "data", "caa_raw_data.json");
const SAMPLE_PATH = path.join(__dirname, "..", "data", "caa_sample.json");

const PER_CATEGORY = 30;

const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf-8"));
const pictos = raw.pictos;

// Group by category
const byCat = {};
for (const p of pictos) {
  if (!byCat[p.categoria]) byCat[p.categoria] = [];
  byCat[p.categoria].push(p);
}

const sample = [];
const catCount = {};

for (const [cat, icons] of Object.entries(byCat)) {
  // Deduplicate by palavra (keep first occurrence)
  const seenWords = new Set();
  const unique = icons.filter((p) => {
    const key = p.palavra.toLowerCase().slice(0, 30);
    if (seenWords.has(key)) return false;
    seenWords.add(key);
    return true;
  });

  // Take first PER_CATEGORY unique icons
  const taken = unique.slice(0, PER_CATEGORY);
  sample.push(...taken);
  catCount[cat] = taken.length;
  console.log(`  ${cat.padEnd(25)} ${taken.length} (of ${icons.length} raw, ${unique.length} unique)`);
}

const output = {
  pictos: sample,
  total: sample.length,
  categorias: catCount,
  samplePerCategory: PER_CATEGORY,
  geradoEm: new Date().toISOString(),
};

fs.writeFileSync(SAMPLE_PATH, JSON.stringify(output, null, 2));
console.log(`\ncaa_sample.json salvo: ${sample.length} ícones (${PER_CATEGORY} por categoria)`);
