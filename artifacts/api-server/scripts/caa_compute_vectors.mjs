/**
 * caa_compute_vectors.mjs — Calcula vetores semânticos 12D IAP via Gemini
 *
 * Para cada ícone CAA, chama a API Gemini e extrai um vetor 12D representando
 * as 12 dimensões semânticas do Algoritmo JP (Pereira Passos, UFT, 2026).
 *
 * Pipeline CAA (passo 2):
 *   1. node scripts/caa_fetch.mjs             ← coleta ícones
 *   2. node scripts/caa_compute_vectors.mjs   ← este script
 *   3. node scripts/caa_wasserstein.mjs       ← Wasserstein + MDS
 *
 * Requer: GEMINI_USER_API_KEY (Google AI Studio free tier)
 * Free tier: 15 RPM gemini-2.0-flash → delay de 5s entre chamadas
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_PATH = path.join(__dirname, "..", "data", "caa_sample.json");
const CACHE_PATH = path.join(__dirname, "..", "data", "caa_gemini_cache.json");
const OUTPUT_PATH = path.join(__dirname, "..", "data", "caa_vectors.json");

const GEMINI_KEY = process.env.GEMINI_USER_API_KEY;
if (!GEMINI_KEY) {
  console.error("Erro: GEMINI_USER_API_KEY é obrigatório.");
  console.error("  export GEMINI_USER_API_KEY=sua_chave");
  process.exit(1);
}

const GEMINI_MODEL = "gemma-4-31b-it";
const FALLBACK_MODEL = "gemma-3-27b-it";
const API_VERSION = "v1beta"; // Gemma 4 requer v1beta
const DELAY_MS = 1000; // 1s — Gemma 4 31B reasoning já demora 15-20s por chamada, well under rate limit

// IAP 12 dimensões semânticas (Algoritmo JP)
const IAP_DIMENSIONS = [
  "concretude",       // 0: quão concreto/tangível (10=muito concreto, 0=abstrato)
  "emocionalidade",   // 1: carga emocional (10=muito emocional, 0=neutro)
  "acao",             // 2: ação/movimento (10=ação intensa, 0=estático)
  "social",           // 3: interação social (10=altamente social, 0=isolado)
  "urgencia",         // 4: urgência/prioridade (10=urgente, 0=rotineiro)
  "temporalidade",    // 5: relação com tempo (10=muito temporal, 0=atemporal)
  "localizacao",      // 6: espaço/lugar (10=espacial, 0=sem localização)
  "saude_corpo",      // 7: saúde/corpo (10=muito corporal, 0=abstrato)
  "comunicacao",      // 8: comunicação (10=central para comunicação, 0=não comunicativo)
  "cognitivo",        // 9: complexidade cognitiva (10=complexo, 0=simples)
  "necessidade_basica",// 10: necessidade básica (10=necessidade fundamental, 0=opcional)
  "especializado_caa",// 11: específico de CAA/AAC (10=muito específico de CAA, 0=genérico)
];

const IAP_PROMPT = (word) => `
Você é um especialista em Comunicação Aumentativa e Alternativa (CAA) e Inteligência Artificial Pictórica (IAP).

Para o conceito/palavra: "${word}"

Atribua uma pontuação de 0 a 10 para cada uma das 12 dimensões semânticas IAP abaixo.
Considere o contexto de uso em CAA para pessoas com afasia, disfasia ou deficiência na comunicação.

Dimensões IAP (escala 0-10):
1. concretude: quão concreto e tangível é o conceito (10=objeto físico, 0=conceito abstrato)
2. emocionalidade: carga emocional (10=forte emoção, 0=neutro emocional)
3. acao: ação/movimento envolvido (10=ação física intensa, 0=completamente estático)
4. social: nível de interação social (10=essencialmente social, 0=individual/isolado)
5. urgencia: urgência de comunicação (10=urgente como "dor" ou "socorro", 0=não urgente)
6. temporalidade: relação temporal (10=fortemente temporal como "agora"/"depois", 0=atemporal)
7. localizacao: espaço/lugar (10=localização física clara, 0=sem localização)
8. saude_corpo: relevância para saúde/corpo (10=central para saúde, 0=não relacionado)
9. comunicacao: relevância para comunicação (10=central para ato comunicativo, 0=não comunicativo)
10. cognitivo: complexidade cognitiva para compreensão (10=muito complexo, 0=intuitivo/simples)
11. necessidade_basica: importância como necessidade básica (10=necessidade fundamental, 0=supérfluo)
12. especializado_caa: específico do domínio CAA/AAC/afasia (10=vocabulário central de CAA, 0=genérico)

Responda APENAS com um objeto JSON válido, sem markdown, sem explicações:
{"concretude":X,"emocionalidade":X,"acao":X,"social":X,"urgencia":X,"temporalidade":X,"localizacao":X,"saude_corpo":X,"comunicacao":X,"cognitivo":X,"necessidade_basica":X,"especializado_caa":X}
`.trim();

// Fallback vector based on CAA category
const CAT_FALLBACK = {
  linguagem_sinais:    [7, 5, 7, 9, 3, 4, 3, 3, 10, 5, 4, 10],
  prancha_comunicacao: [9, 4, 2, 7, 4, 3, 3, 3, 10, 3, 5, 10],
  fala_articulacao:    [5, 4, 6, 8, 4, 3, 2, 7, 10, 5, 4, 9],
  voz:                 [3, 5, 5, 7, 3, 3, 2, 6, 10, 4, 4, 8],
  audicao:             [4, 4, 2, 5, 3, 3, 2, 7, 8, 4, 5, 8],
  gesto:               [6, 5, 8, 8, 3, 4, 3, 4, 9, 3, 3, 7],
  dispositivo_caa:     [9, 2, 2, 5, 3, 2, 2, 2, 8, 6, 4, 10],
  apoio_terapia:       [5, 6, 4, 8, 5, 3, 4, 7, 7, 5, 7, 8],
  familia_cuidador:    [6, 8, 4, 10, 4, 3, 3, 5, 7, 4, 8, 5],
  emocao_expressao:    [4, 10, 5, 6, 5, 4, 2, 5, 8, 5, 6, 6],
};

function parseGemmaResponse(text, dims) {
  // 1. Try JSON object first
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (dims.some((d) => d in parsed)) {
        return dims.map((dim) => {
          const v = parsed[dim];
          return typeof v === "number" ? Math.max(0, Math.min(10, v)) : 5;
        });
      }
    } catch (_) { /* fall through */ }
  }

  // 2. Gemma 4 reasoning mode: extract "dim: N" bullet patterns
  // Must capture full number (e.g. "10" not just "1")
  const result = {};
  for (const dim of dims) {
    const re = new RegExp(
      `${dim}[:\\s*]+(?:[^(\\n]*\\(\\s*)?(10|[0-9](?:\\.[0-9]+)?)(?:[\\s\\)\\n,]|$)`,
      "i"
    );
    const m = text.match(re);
    if (m) {
      result[dim] = Math.max(0, Math.min(10, Math.round(parseFloat(m[1]))));
    }
  }
  if (dims.filter((d) => d in result).length >= 10) {
    return dims.map((dim) => result[dim] ?? 5);
  }

  throw new Error(`Cannot parse response (text: ${text.slice(0, 80)})`);
}

async function callGemmaModel(model, word) {
  const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{ parts: [{ text: IAP_PROMPT(word) }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return parseGemmaResponse(text, IAP_DIMENSIONS);
}

async function callGemini(word, categoria) {
  const modelsToTry = [GEMINI_MODEL, FALLBACK_MODEL];
  for (const model of modelsToTry) {
    try {
      const vec = await callGemmaModel(model, word);
      return { vec, source: model };
    } catch (err) {
      process.stderr.write(`\n  [${model}] ${err.message.slice(0, 100)}\n`);
    }
  }
  return { vec: CAT_FALLBACK[categoria] ?? Array(12).fill(5), source: "fallback" };
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  console.log(`CAA Vectors — Gemma 4 31B IAP 12D (modelo: ${GEMINI_MODEL})`);

  const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf-8"));
  const pictos = raw.pictos;
  console.log(`Carregados: ${pictos.length} ícones`);

  // Load cache
  let cache = {};
  if (fs.existsSync(CACHE_PATH)) {
    cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    console.log(`Cache: ${Object.keys(cache).length} vetores em disco`);
  }

  let gemmaCount = 0;
  let fallbackCount = 0;
  let cacheHit = 0;

  for (let i = 0; i < pictos.length; i++) {
    const p = pictos[i];
    const cacheKey = `${p.id}:${p.palavra}`;

    if (cache[cacheKey]) {
      cacheHit++;
      p.vector12d = cache[cacheKey].vec;
      p.vectorSource = cache[cacheKey].source;
      process.stdout.write(`\r[${i + 1}/${pictos.length}] gemma=${gemmaCount} cache=${cacheHit} fallback=${fallbackCount}   `);
      continue;
    }

    const result = await callGemini(p.palavra, p.categoria);
    p.vector12d = result.vec;
    p.vectorSource = result.source;
    if (result.source !== "fallback") {
      gemmaCount++;
      cache[cacheKey] = result;
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
      await sleep(DELAY_MS);
    } else {
      fallbackCount++;
    }

    process.stdout.write(`\r[${i + 1}/${pictos.length}] gemma=${gemmaCount} cache=${cacheHit} fallback=${fallbackCount}   `);
  }

  // Final cache save
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

  console.log(`\n\nVetores calculados:`);
  console.log(`  Gemma 4: ${gemmaCount}`);
  console.log(`  Cache:   ${cacheHit}`);
  console.log(`  Fallback: ${fallbackCount}`);

  const output = {
    pictos,
    dimensions: IAP_DIMENSIONS,
    total: pictos.length,
    geradoEm: new Date().toISOString(),
    geminiModel: GEMINI_MODEL,
    categorias: raw.categorias,
    stats: { gemma: gemmaCount, cache: cacheHit, fallback: fallbackCount },
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`caa_vectors.json salvo: ${pictos.length} ícones`);
}

main().catch((e) => { console.error("Erro:", e); process.exit(1); });
