/**
 * caa_fetch.mjs — Coleta ícones CAA (Comunicação Aumentativa e Alternativa) do Noun Project
 *
 * Pipeline CAA (executar em ordem):
 *   1. node scripts/caa_fetch.mjs             ← coleta ícones CAA
 *   2. node scripts/caa_compute_vectors.mjs   ← vetores Gemini 12D
 *   3. node scripts/caa_wasserstein.mjs       ← Wasserstein + MDS
 *   4. node scripts/caa_download_icons.mjs    ← download PNGs locais
 *
 * Requer: NOUN_PROJECT_KEY, NOUN_PROJECT_SECRET
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "..", "data", "caa_raw_data.json");

const KEY = process.env.NOUN_PROJECT_KEY;
const SECRET = process.env.NOUN_PROJECT_SECRET;

if (!KEY || !SECRET) {
  console.error("Erro: NOUN_PROJECT_KEY e NOUN_PROJECT_SECRET são obrigatórios.");
  process.exit(1);
}

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
  const baseString = [method.toUpperCase(), encodeURIComponent(baseUrl), encodeURIComponent(paramString)].join("&");
  const sig = crypto.createHmac("sha1", `${encodeURIComponent(SECRET)}&`).update(baseString).digest("base64");
  const oauthKeys = [...Object.keys(allParams).filter((k) => k.startsWith("oauth_")), "oauth_signature"];
  return "OAuth " + oauthKeys.map((k) => `${k}="${encodeURIComponent(k === "oauth_signature" ? sig : allParams[k])}"`).join(", ");
}

async function fetchIcons(query, page = 1) {
  const BASE = "https://api.thenounproject.com/v2/icon";
  const params = { query, limit: "50", page: String(page), include_sensitive: "0" };
  const auth = buildOAuth("GET", BASE, params);
  const url = `${BASE}?query=${encodeURIComponent(query)}&limit=50&page=${page}&include_sensitive=0`;
  const resp = await fetch(url, { headers: { Authorization: auth }, signal: AbortSignal.timeout(15000) });
  if (!resp.ok) { console.warn(`  Noun API ${resp.status} for query="${query}" p${page}`); return []; }
  const data = await resp.json();
  return data.icons ?? [];
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// CAA-specific categories for Augmentative & Alternative Communication
const CAA_CATEGORIES = {
  linguagem_sinais: ["sign language", "hand sign", "deaf", "ASL", "gesture sign", "finger spelling"],
  prancha_comunicacao: ["communication board", "pictogram", "symbol card", "AAC", "picture card", "visual schedule"],
  fala_articulacao: ["speech", "articulation", "mouth speaking", "pronunciation", "speak", "talking"],
  voz: ["voice", "vocalize", "microphone speak", "audio", "sound wave", "vocal"],
  audicao: ["hearing", "ear", "deaf hearing", "hearing aid", "listen", "auditory"],
  gesto: ["gesture", "pointing", "hand wave", "nod", "thumbs up", "hand signal"],
  dispositivo_caa: ["tablet communication", "device button", "switch access", "eye gaze", "touch screen", "assistive tech"],
  apoio_terapia: ["speech therapy", "support help", "assist disability", "rehabilitation", "care support", "therapy"],
  familia_cuidador: ["caregiver", "family support", "therapist patient", "teacher student disability", "helper", "companion"],
  emocao_expressao: ["emotion face", "expression feeling", "happy sad face", "emotional", "feeling chart", "mood face"],
};

function inferCAACategory(term, tags) {
  const text = [term, ...(tags ?? [])].join(" ").toLowerCase();
  const rules = [
    { cat: "linguagem_sinais", words: ["sign", "deaf", "asl", "libras", "finger", "spell"] },
    { cat: "prancha_comunicacao", words: ["board", "pictogram", "symbol", "aac", "picture", "card", "visual", "schedule", "pecs"] },
    { cat: "fala_articulacao", words: ["speech", "articul", "pronunci", "speak", "talk", "word", "phoneme"] },
    { cat: "voz", words: ["voice", "vocal", "micro", "sound", "audio", "vocalize"] },
    { cat: "audicao", words: ["hear", "ear", "deaf", "listen", "audit", "cochle"] },
    { cat: "gesto", words: ["gesture", "point", "wave", "nod", "thumb", "signal"] },
    { cat: "dispositivo_caa", words: ["tablet", "device", "button", "switch", "gaze", "touch", "assistive", "tech", "screen"] },
    { cat: "apoio_terapia", words: ["therapy", "therapist", "rehab", "treat", "care", "assist", "support", "clinic"] },
    { cat: "familia_cuidador", words: ["caregiv", "family", "parent", "teacher", "helper", "companion", "partner"] },
    { cat: "emocao_expressao", words: ["emotion", "feel", "happy", "sad", "expression", "mood", "face", "smile", "cry"] },
  ];
  for (const rule of rules) {
    if (rule.words.some((w) => text.includes(w))) return rule.cat;
  }
  return "apoio_terapia";
}

async function main() {
  console.log("CAA Fetch — Comunicação Aumentativa e Alternativa");
  const allIcons = new Map();

  const allPairs = [];
  for (const [cat, queries] of Object.entries(CAA_CATEGORIES)) {
    for (const q of queries) {
      allPairs.push({ cat, q, page: 1 });
      allPairs.push({ cat, q, page: 2 });
    }
  }

  console.log(`Fetching ${allPairs.length} queries...`);
  let done = 0;
  for (const { cat, q, page } of allPairs) {
    done++;
    try {
      const icons = await fetchIcons(q, page);
      let added = 0;
      for (const ic of icons) {
        if (!allIcons.has(ic.id)) {
          allIcons.set(ic.id, {
            id: ic.id,
            palavra: (ic.term ?? q).slice(0, 60),
            imagemUrl: ic.thumbnail_url ?? `https://static.thenounproject.com/png/${ic.id}-200.png`,
            categoria: inferCAACategory(ic.term ?? q, ic.tags),
          });
          added++;
        }
      }
      console.log(`  [${done}/${allPairs.length}] "${q}" p${page} → ${icons.length} icons, ${added} new (total: ${allIcons.size})`);
    } catch (e) {
      console.log(`  [${done}/${allPairs.length}] "${q}" ERROR: ${e.message}`);
    }
    await sleep(300);
  }

  const pictos = [...allIcons.values()];
  const catCount = {};
  for (const p of pictos) catCount[p.categoria] = (catCount[p.categoria] ?? 0) + 1;

  console.log(`\nTotal: ${pictos.length} icons`);
  Object.entries(catCount).forEach(([c, n]) => console.log(`  ${c.padEnd(25)} ${n}`));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({ pictos, total: pictos.length, categorias: catCount, geradoEm: new Date().toISOString() }, null, 2));
  console.log(`\ncaa_raw_data.json salvo: ${pictos.length} icons`);
}

main().catch((e) => { console.error("Erro:", e); process.exit(1); });
