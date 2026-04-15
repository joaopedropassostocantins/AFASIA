/**
 * dedupe_noun_atlas.mjs
 * Gera noun_atlas_deduped.json com 149 conceitos únicos a partir dos 3.443 ícones.
 * Para cada grupo, seleciona o ícone cujas coordenadas MDS são mais próximas do centróide
 * do grupo, registra varianteCount (total de designers), palavraPt (tradução pt-BR),
 * e reconstrói os vizinhos referenciando apenas os outros 148 conceitos únicos.
 * URLs de imagem via CDN do Noun Project.
 *
 * Uso: node artifacts/api-server/scripts/dedupe_noun_atlas.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../data");
const INPUT = resolve(DATA_DIR, "noun_atlas_data.json");
const OUTPUT = resolve(DATA_DIR, "noun_atlas_deduped.json");

// ── Dicionário inglês → português (todos os 149 conceitos) ─────────────────────
const TRANSLATIONS = {
  "angry":             "Raiva",
  "baby":              "Bebê",
  "bag":               "Bolsa",
  "bluebell":          "Sino",
  "body":              "Corpo",
  "book":              "Livro",
  "bread":             "Pão",
  "calendar tomorrow": "Calendário Amanhã",
  "calendar week":     "Semana no Calendário",
  "calendar weeks":    "Semanas no Calendário",
  "call phone":        "Telefonar",
  "campaign week":     "Semana de Campanha",
  "cat":               "Gato",
  "child":             "Criança",
  "class":             "Aula",
  "classes":           "Aulas",
  "clock":             "Relógio",
  "clothes":           "Roupas",
  "computer":          "Computador",
  "day":               "Dia",
  "doctor":            "Médico",
  "doctors":           "Médicos",
  "dog":               "Cachorro",
  "drink":             "Beber",
  "drinking":          "Bebendo",
  "drinks":            "Bebidas",
  "ear":               "Ouvido",
  "earing":            "Brinco",
  "earings":           "Brincos",
  "ears":              "Ouvidos",
  "emotion":           "Emoção",
  "emotions":          "Emoções",
  "eye":               "Olho",
  "face":              "Rosto",
  "faces":             "Rostos",
  "family":            "Família",
  "fashion week":      "Semana de Moda",
  "father":            "Pai",
  "feeling":           "Sentimento",
  "flower":            "Flor",
  "flowers":           "Flores",
  "food":              "Comida",
  "fruit":             "Fruta",
  "future":            "Futuro",
  "gate number":       "Número de Portão",
  "gesture":           "Gesto",
  "gestures":          "Gestos",
  "gesturing":         "Gesticulando",
  "hand":              "Mão",
  "hands":             "Mãos",
  "happy":             "Feliz",
  "health":            "Saúde",
  "holy week":         "Semana Santa",
  "home":              "Casa",
  "hospital":          "Hospital",
  "injury":            "Lesão",
  "jump":              "Pular",
  "jumping":           "Pulando",
  "key":               "Chave",
  "keys":              "Chaves",
  "last week":         "Semana Passada",
  "letter":            "Carta",
  "medicine":          "Remédio",
  "medicines":         "Remédios",
  "money":             "Dinheiro",
  "morning":           "Manhã",
  "mother":            "Mãe",
  "mother's":          "Da Mãe",
  "nature":            "Natureza",
  "next":              "Próximo",
  "next week":         "Próxima Semana",
  "night":             "Noite",
  "no angry":          "Sem Raiva",
  "no drink":          "Sem Bebida",
  "no drinking":       "Não Beber",
  "no drinks":         "Sem Bebidas",
  "no flower":         "Sem Flor",
  "no food":           "Sem Comida",
  "no foods":          "Sem Alimentos",
  "no run":            "Não Correr",
  "no sleep":          "Sem Sono",
  "no talk":           "Sem Fala",
  "no talking":        "Não Falar",
  "no water":          "Sem Água",
  "not the day":       "Não é o Dia",
  "number":            "Número",
  "number field":      "Campo Numérico",
  "number one":        "Número Um",
  "number padlock":    "Cadeado Numérico",
  "numbered":          "Numerado",
  "numbered list":     "Lista Numerada",
  "numbering":         "Numeração",
  "nurse":             "Enfermeiro",
  "nurses":            "Enfermeiros",
  "on time":           "Pontual",
  "pain":              "Dor",
  "park":              "Parque",
  "pen":               "Caneta",
  "people":            "Pessoas",
  "phone":             "Telefone",
  "phone call":        "Ligação",
  "pill":              "Comprimido",
  "pills":             "Comprimidos",
  "rain":              "Chuva",
  "raining":           "Chovendo",
  "right":             "Certo",
  "run":               "Correr",
  "sad":               "Triste",
  "sadness":           "Tristeza",
  "school":            "Escola",
  "science":           "Ciência",
  "serial number":     "Número de Série",
  "sick":              "Doente",
  "sign language":     "Linguagem de Sinais",
  "sit":               "Sentar",
  "sit-in":            "Sentado",
  "sleep":             "Dormir",
  "sleeping":          "Dormindo",
  "speech":            "Fala",
  "street":            "Rua",
  "streets":           "Ruas",
  "student":           "Estudante",
  "students":          "Estudantes",
  "study":             "Estudar",
  "sun":               "Sol",
  "table":             "Mesa",
  "talk":              "Conversa",
  "talking":           "Conversando",
  "teacher":           "Professor",
  "therapy":           "Terapia",
  "time":              "Tempo",
  "time and time":     "Mais Tempo",
  "tomorrow":          "Amanhã",
  "tomorrow calendar": "Amanhã no Calendário",
  "tomorrow list":     "Lista de Amanhã",
  "toy":               "Brinquedo",
  "toys":              "Brinquedos",
  "tracking number":   "Número de Rastreio",
  "tree":              "Árvore",
  "trees":             "Árvores",
  "view week":         "Ver Semana",
  "walk":              "Caminhar",
  "water":             "Água",
  "water water":       "Muita Água",
  "watering":          "Regando",
  "week calendar":     "Calendário Semanal",
  "week view":         "Vista Semanal",
  "weeker clock":      "Relógio Semanal",
  "weekly":            "Semanal",
};

function cdnUrl(id) {
  return `https://static.thenounproject.com/png/${id}-200.png`;
}

function normKey(palavra) {
  return palavra.toLowerCase().trim();
}

function euclidean(a, b) {
  const dx = a.coordX - b.coordX;
  const dy = a.coordY - b.coordY;
  return Math.sqrt(dx * dx + dy * dy);
}

console.log("Lendo", INPUT);
const raw = readFileSync(INPUT, "utf-8");
const data = JSON.parse(raw);
const pictos = data.pictos;
console.log(`Total de entradas: ${pictos.length}`);

// ── 1. Agrupar por palavra normalizada ─────────────────────────────────────────
const grupos = new Map(); // normKey → picto[]
for (const p of pictos) {
  const key = normKey(p.palavra);
  if (!grupos.has(key)) grupos.set(key, []);
  grupos.get(key).push(p);
}
console.log(`Conceitos únicos: ${grupos.size}`);

// ── 2. Selecionar representante (centróide) de cada grupo ─────────────────────
const representantes = new Map(); // normKey → picto representante
for (const [key, grupo] of grupos) {
  const centX = grupo.reduce((s, p) => s + p.coordX, 0) / grupo.length;
  const centY = grupo.reduce((s, p) => s + p.coordY, 0) / grupo.length;
  const centroide = { coordX: centX, coordY: centY };

  let melhor = grupo[0];
  let menorDist = Infinity;
  for (const p of grupo) {
    const d = euclidean(p, centroide);
    if (d < menorDist) { menorDist = d; melhor = p; }
  }
  representantes.set(key, { ...melhor, varianteCount: grupo.length });
}

// ── 3. Calcular vizinhos entre os 149 representantes (kNN euclideano k=20) ────
const reps = [...representantes.values()];

// Para cada representante, calcular distâncias para todos os outros
function computeVizinhos(rep, todos, k = 30) {
  const dists = [];
  for (const outro of todos) {
    const otroKey = normKey(outro.palavra);
    const repKey = normKey(rep.palavra);
    if (otroKey === repKey) continue;
    const d = euclidean(rep, outro);
    dists.push({ id: String(outro.id), palavra: outro.palavra, distancia: parseFloat(d.toFixed(4)) });
  }
  dists.sort((a, b) => a.distancia - b.distancia);
  return dists.slice(0, k);
}

// ── 4. Montar os 149 pictos finais ────────────────────────────────────────────
const pictosFinal = reps.map((rep) => {
  const key = normKey(rep.palavra);
  return {
    id: String(rep.id),
    palavra: rep.palavra,
    palavraPt: TRANSLATIONS[key] ?? rep.palavra,
    imagemUrl: cdnUrl(rep.id),
    categoria: rep.categoria,
    coordX: parseFloat(rep.coordX.toFixed(4)),
    coordY: parseFloat(rep.coordY.toFixed(4)),
    varianteCount: rep.varianteCount,
    vizinhos: computeVizinhos(rep, reps),
  };
});

// Verificar traduções faltantes
const semTraducao = pictosFinal.filter(p => p.palavraPt === p.palavra);
if (semTraducao.length > 0) {
  console.warn("ATENÇÃO — sem tradução para:", semTraducao.map(p => p.palavra));
}

// ── 5. Calcular categorias e estatísticas ──────────────────────────────────────
const categorias = {};
for (const p of pictosFinal) {
  categorias[p.categoria] = (categorias[p.categoria] ?? 0) + 1;
}

const output = {
  pictos: pictosFinal,
  keywords: pictosFinal.map(p => p.palavraPt),
  total: pictosFinal.length,
  totalConceitos: pictosFinal.length,
  totalVariantes: pictos.length,
  categorias,
  vizinhosMethod: "euclidean-knn-k30-deduped",
  mdsInfo: {
    algorithm: "AlgoritmoJP — Wasserstein + MDS Clássico (projeção euclidiana)",
    note: "Coordenadas MDS derivadas de distâncias de Wasserstein calculadas pelo AlgoritmoJP (IAP/UFT, Passos 2024). Vizinhos recalculados sobre os 149 representantes únicos.",
  },
  geradoEm: new Date().toISOString(),
};

writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf-8");
console.log(`\nSalvo em ${OUTPUT}`);
console.log(`Conceitos: ${output.totalConceitos} | Variantes originais: ${output.totalVariantes}`);
console.log("Categorias:", categorias);
