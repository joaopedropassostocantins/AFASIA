/**
 * caa_download_icons.mjs — Baixa PNGs dos ícones CAA e atualiza caa_atlas_data.json
 *
 * Pipeline CAA (passo 4):
 *   4. node scripts/caa_download_icons.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "data", "caa_atlas_data.json");
const ICONS_DIR = join(__dirname, "..", "..", "..", "artifacts", "iap-app", "public", "icons", "caa");
const CONCURRENCY = 10;
const BATCH_DELAY_MS = 50;

mkdirSync(ICONS_DIR, { recursive: true });

const data = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
const pictos = data.pictos;
console.log(`Baixando ${pictos.length} ícones CAA para ${ICONS_DIR}`);

let downloaded = 0, skipped = 0, failed = 0;
const failedIds = new Set();

async function downloadIcon(p) {
  const id = p.id;
  const destPath = join(ICONS_DIR, `${id}.png`);
  if (existsSync(destPath)) { skipped++; return; }
  const url = `https://static.thenounproject.com/png/${id}-200.png`;
  try {
    const resp = await fetch(url, { headers: { "User-Agent": "AFASIA-IAP-Hackathon/1.0 (educational)" } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buf = await resp.arrayBuffer();
    writeFileSync(destPath, Buffer.from(buf));
    downloaded++;
  } catch (err) {
    failed++;
    failedIds.add(String(id));
  }
}

const batches = [];
for (let i = 0; i < pictos.length; i += CONCURRENCY) batches.push(pictos.slice(i, i + CONCURRENCY));

for (let i = 0; i < batches.length; i++) {
  await Promise.all(batches[i].map(downloadIcon));
  const done = Math.min((i + 1) * CONCURRENCY, pictos.length);
  process.stdout.write(`\r[${done}/${pictos.length}] novos=${downloaded} ignorados=${skipped} falhas=${failed}   `);
  if (i < batches.length - 1) await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
}

console.log(`\n\nDownload concluído: novos=${downloaded} ignorados=${skipped} falhas=${failed}`);

console.log("Atualizando imagemUrl para paths locais...");
let localCount = 0, cdnCount = 0;
for (const p of data.pictos) {
  if (!failedIds.has(String(p.id)) && existsSync(join(ICONS_DIR, `${p.id}.png`))) {
    p.imagemUrl = `/icons/caa/${p.id}.png`;
    localCount++;
  } else {
    cdnCount++;
  }
}
data.imagensLocais = localCount > 0;
data.geradoEm = new Date().toISOString();
writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
console.log(`caa_atlas_data.json atualizado: locais=${localCount} cdn=${cdnCount}`);
