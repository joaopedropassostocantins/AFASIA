import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "data", "noun_atlas_data.json");
const ICONS_DIR = join(__dirname, "..", "..", "..", "artifacts", "iap-app", "public", "icons", "noun");
const CONCURRENCY = 10;
const BATCH_DELAY_MS = 50;

mkdirSync(ICONS_DIR, { recursive: true });

const data = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
const pictos = data.pictos;

console.log(`Iniciando download de ${pictos.length} ícones para ${ICONS_DIR}`);

let downloaded = 0;
let skipped = 0;
let failed = 0;
const failedIds = new Set();

async function downloadIcon(picto) {
  const id = picto.id;
  const destPath = join(ICONS_DIR, `${id}.png`);

  if (existsSync(destPath)) {
    skipped++;
    return;
  }

  const url = `https://static.thenounproject.com/png/${id}-200.png`;

  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "AFASIA-IAP-Hackathon/1.0 (educational, non-commercial)" },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buf = await resp.arrayBuffer();
    writeFileSync(destPath, Buffer.from(buf));
    downloaded++;
  } catch (err) {
    failed++;
    failedIds.add(id);
    process.stderr.write(`\nFalha [${id}]: ${err.message}\n`);
  }
}

const batches = [];
for (let i = 0; i < pictos.length; i += CONCURRENCY) {
  batches.push(pictos.slice(i, i + CONCURRENCY));
}

for (let i = 0; i < batches.length; i++) {
  await Promise.all(batches[i].map(downloadIcon));
  const done = Math.min((i + 1) * CONCURRENCY, pictos.length);
  process.stdout.write(`\r[${done}/${pictos.length}] novos=${downloaded} ignorados=${skipped} falhas=${failed}   `);
  if (i < batches.length - 1) {
    await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
  }
}

console.log(`\n\nDownload concluído!`);
console.log(`  Novos:     ${downloaded}`);
console.log(`  Ignorados: ${skipped}`);
console.log(`  Falhas:    ${failed}`);

console.log(`\nAtualizando imagemUrl em noun_atlas_data.json...`);
let localCount = 0;
let cdnCount = 0;
for (const p of data.pictos) {
  if (!failedIds.has(p.id) && existsSync(join(ICONS_DIR, `${p.id}.png`))) {
    p.imagemUrl = `/icons/noun/${p.id}.png`;
    localCount++;
  } else {
    cdnCount++;
  }
}
data.geradoEm = new Date().toISOString();
data.imagensLocais = localCount > 0;
writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");

console.log(`noun_atlas_data.json atualizado:`);
console.log(`  Locais: ${localCount}   CDN fallback: ${cdnCount}`);
if (cdnCount > 0) {
  console.log(`  AVISO: ${cdnCount} ícones ainda usam CDN — rode novamente para tentar baixá-los.`);
}
