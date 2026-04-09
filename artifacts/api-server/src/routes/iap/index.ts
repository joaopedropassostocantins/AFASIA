import { Router, type IRouter, type Response } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import {
  RunJpAlgorithmBody,
  PictorialChatBody,
  ComputeTopologyBody,
} from "@workspace/api-zod";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function resolveDataPath(filename: string): string {
  const candidates = [
    join(dirname(fileURLToPath(import.meta.url)), "..", "data", filename),
    join(process.cwd(), "artifacts", "api-server", "data", filename),
    join(process.cwd(), "data", filename),
  ];
  return candidates.find(existsSync) ?? candidates[0];
}

function isZodError(err: unknown): err is { issues: unknown[] } {
  return typeof err === "object" && err !== null && "issues" in err && Array.isArray((err as { issues: unknown }).issues);
}

function handleRouteError(err: unknown, res: Response, log: (msg: string) => void, context: string) {
  if (isZodError(err)) {
    res.status(400).json({ error: "Invalid request body", details: err.issues });
    return;
  }
  log(`Failed to ${context}: ${String(err)}`);
  res.status(500).json({ error: "Internal server error" });
}

const router: IRouter = Router();

interface JpEvent {
  id: string;
  label: string;
  description?: string;
}

interface JpEdge {
  from: string;
  to: string;
  label: string;
  cost: number;
}

interface JpPlanStep {
  stepNumber: number;
  fromEvent: string;
  toEvent: string;
  manu: string;
  cost: number;
  topologicalDistance: number;
}

function computeTopologicalDistance(
  currentId: string,
  goalId: string,
  events: JpEvent[]
): number {
  const currentIdx = events.findIndex((e) => e.id === currentId);
  const goalIdx = events.findIndex((e) => e.id === goalId);
  if (currentIdx === -1 || goalIdx === -1) return 1.0;
  const n = events.length;
  const normalizedCurrent = currentIdx / Math.max(1, n - 1);
  const normalizedGoal = goalIdx / Math.max(1, n - 1);
  return Math.abs(normalizedGoal - normalizedCurrent);
}

function runJpAlgorithmLogic(
  goal: string,
  startEvent: string,
  events: JpEvent[],
  edges: JpEdge[]
): { success: boolean; path: JpPlanStep[]; totalCost: number; iterations: number; message: string } {
  const adjacency = new Map<string, { to: string; label: string; cost: number }[]>();

  for (const event of events) {
    adjacency.set(event.id, []);
  }

  for (const edge of edges) {
    const current = adjacency.get(edge.from) ?? [];
    current.push({ to: edge.to, label: edge.label, cost: edge.cost });
    adjacency.set(edge.from, current);
  }

  const goalEvent = events.find((e) => e.id === goal || e.label === goal);
  const startEv = events.find((e) => e.id === startEvent || e.label === startEvent);

  if (!goalEvent || !startEv) {
    return {
      success: false,
      path: [],
      totalCost: 0,
      iterations: 0,
      message: `Evento objetivo "${goal}" ou evento inicial "${startEvent}" não encontrado na lista de eventos.`,
    };
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, { from: string; edge: { to: string; label: string; cost: number } } | null>();

  for (const event of events) {
    dist.set(event.id, Infinity);
  }
  dist.set(startEv.id, 0);

  const unvisited = new Set(events.map((e) => e.id));
  let iterations = 0;

  while (unvisited.size > 0) {
    iterations++;
    let minDist = Infinity;
    let current = "";

    for (const id of unvisited) {
      const d = dist.get(id) ?? Infinity;
      if (d < minDist) {
        minDist = d;
        current = id;
      }
    }

    if (!current || minDist === Infinity) break;
    if (current === goalEvent.id) break;

    unvisited.delete(current);

    const neighbors = adjacency.get(current) ?? [];
    for (const edge of neighbors) {
      const newDist = (dist.get(current) ?? Infinity) + edge.cost;
      if (newDist < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, newDist);
        prev.set(edge.to, { from: current, edge });
      }
    }
  }

  if (dist.get(goalEvent.id) === Infinity) {
    return {
      success: false,
      path: [],
      totalCost: 0,
      iterations,
      message: `Nenhum caminho encontrado de "${startEv.label}" até "${goalEvent.label}".`,
    };
  }

  const forwardPath: JpPlanStep[] = [];
  let node: string | undefined = goalEvent.id;
  let stepNum = 0;

  while (node && node !== startEv.id) {
    const prevNode = prev.get(node);
    if (!prevNode) break;
    stepNum++;
    const fromLabel = events.find((e) => e.id === prevNode.from)?.label ?? prevNode.from;
    const toLabel = events.find((e) => e.id === node)?.label ?? node;
    const topoDistance = computeTopologicalDistance(node, goalEvent.id, events);

    forwardPath.unshift({
      stepNumber: 0,
      fromEvent: fromLabel,
      toEvent: toLabel,
      manu: prevNode.edge.label,
      cost: prevNode.edge.cost,
      topologicalDistance: topoDistance,
    });
    node = prevNode.from;
  }

  forwardPath.forEach((step, idx) => {
    step.stepNumber = idx + 1;
  });

  return {
    success: true,
    path: forwardPath,
    totalCost: dist.get(goalEvent.id) ?? 0,
    iterations,
    message: `Plano encontrado: ${forwardPath.length} etapas de "${startEv.label}" até "${goalEvent.label}" com custo total ${dist.get(goalEvent.id)?.toFixed(1)}.`,
  };
}

router.post("/plan", async (req, res) => {
  try {
    const body = RunJpAlgorithmBody.parse(req.body);
    const result = runJpAlgorithmLogic(
      body.goal,
      body.startEvent,
      body.events,
      body.edges
    );
    res.json(result);
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "run JP Algorithm");
  }
});

const KNOWN_SYMBOL_IDS = [
  "agua", "comida", "banheiro", "remedio", "ajuda", "dormir", "frio", "calor",
  "feliz", "triste", "com_dor", "cansado", "com_medo", "ansioso", "irritado", "confuso",
  "casa", "hospital", "escola", "trabalho", "parque", "quarto", "fora", "dentro",
  "eu", "familia", "medico", "enfermeiro", "amigo", "cuidador", "filhos", "mae",
  "quero", "nao_quero", "parar", "ir", "sim", "nao", "dar", "chamar",
];

router.post("/pictoric-chat", async (req, res) => {
  try {
    const body = PictorialChatBody.parse(req.body);
    const symbolsText = body.symbols.join(", ");
    const contextText = body.context ? `\nContexto adicional: ${body.context}` : "";
    const historicoText = body.historico && body.historico.length > 0
      ? `\nMensagens anteriores do usuário: ${body.historico.slice(-5).join(" | ")}`
      : "";

    const hora = new Date().getHours();
    let periodoDia = "manhã";
    if (hora >= 12 && hora < 18) periodoDia = "tarde";
    else if (hora >= 18 || hora < 6) periodoDia = "noite";

    const symbolsList = KNOWN_SYMBOL_IDS.join(", ");

    const systemPrompt = `Você é um sistema de CAA (Comunicação Aumentativa e Alternativa) para pessoas com afasia, baseado na teoria IAP — Inteligência Artificial Pictórica de João Pedro Pereira Passos (UFT).
Na teoria IAP, o pensamento humano ocorre em espaços topológicos pré-linguísticos antes de ser expresso em linguagem verbal.
Você interpreta sequências de símbolos pictóricos e produz comunicação clara, empática e exclusivamente em português do Brasil.
Período do dia atual: ${periodoDia}.
Símbolos válidos para sugestões: ${symbolsList}.`;

    const userPrompt = `Símbolos selecionados pelo usuário com afasia: ${symbolsText}${contextText}${historicoText}

Retorne APENAS um objeto JSON com os campos abaixo (sem markdown, sem texto extra):
- intencao: string (frase em português, máx. 80 caracteres)
- urgencia: integer de 0 a 10 (0=nenhuma, 5=moderada, 8=alta, 10=emergência)
- emocao: string (1-2 palavras em português)
- confianca: float de 0.0 a 1.0
- sugestoes: array com exatamente 3 IDs de símbolos válidos (da lista fornecida)
- nota_cuidador: string (instrução em português, máx. 60 caracteres)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
      ],
      config: {
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text ?? "{}";

    let parsed: {
      intencao?: string;
      urgencia?: number;
      emocao?: string;
      confianca?: number;
      sugestoes?: string[];
      nota_cuidador?: string;
    } = {};

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        intencao: symbolsText,
        urgencia: 2,
        emocao: "neutro",
        confianca: 0.5,
        sugestoes: [],
        nota_cuidador: "Confirme com o usuário se a interpretação está correta.",
      };
    }

    const rawUrgencia = parsed.urgencia;
    const urgenciaNum = typeof rawUrgencia === "number"
      ? Math.max(0, Math.min(10, Math.round(rawUrgencia)))
      : typeof rawUrgencia === "string"
        ? Math.max(0, Math.min(10, Math.round(parseFloat(rawUrgencia) || 2)))
        : 2;

    const FALLBACK_SUGGESTIONS = ["agua", "ajuda", "sim"];
    const validSugestoes = (parsed.sugestoes ?? [])
      .filter((s) => KNOWN_SYMBOL_IDS.includes(s))
      .slice(0, 3);
    while (validSugestoes.length < 3) {
      const fallback = FALLBACK_SUGGESTIONS[validSugestoes.length] ?? KNOWN_SYMBOL_IDS[validSugestoes.length];
      if (!validSugestoes.includes(fallback)) {
        validSugestoes.push(fallback);
      } else {
        const alt = KNOWN_SYMBOL_IDS.find((id) => !validSugestoes.includes(id));
        if (alt) validSugestoes.push(alt);
        else break;
      }
    }

    res.json({
      intencao: parsed.intencao ?? symbolsText,
      urgencia: urgenciaNum,
      emocao: parsed.emocao ?? "neutro",
      confianca: parsed.confianca ?? 0.7,
      sugestoes: validSugestoes,
      nota_cuidador: parsed.nota_cuidador ?? "Verifique o que o usuário precisa.",
    });
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "process pictorial chat");
  }
});

function generateSimulatedPersistenceDiagram(
  state: number[],
  seed: number
): { birth: number; death: number; dimension: number; lifetime: number }[] {
  const bars: { birth: number; death: number; dimension: number; lifetime: number }[] = [];
  const avg = state.reduce((a, b) => a + b, 0) / state.length;
  const variance = state.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / state.length;

  const numH0 = Math.max(2, Math.floor(avg / 3) + 1);
  for (let i = 0; i < numH0; i++) {
    const birth = (i * 0.8 + seed * 0.1) % 2;
    const death = birth + 0.3 + (state[i % state.length] ?? 5) * 0.15;
    bars.push({
      birth: Math.round(birth * 100) / 100,
      death: Math.round(death * 100) / 100,
      dimension: 0,
      lifetime: Math.round((death - birth) * 100) / 100,
    });
  }

  const numH1 = Math.max(1, Math.floor(variance / 5) + 1);
  for (let i = 0; i < numH1; i++) {
    const birth = 0.5 + (i * 0.7 + seed * 0.2) % 1.5;
    const death = birth + 0.2 + (state[(i + 1) % state.length] ?? 5) * 0.1;
    bars.push({
      birth: Math.round(birth * 100) / 100,
      death: Math.round(death * 100) / 100,
      dimension: 1,
      lifetime: Math.round((death - birth) * 100) / 100,
    });
  }

  return bars;
}

function computeWasserstein(
  diag1: { birth: number; death: number; dimension: number; lifetime: number }[],
  diag2: { birth: number; death: number; dimension: number; lifetime: number }[]
): number {
  const h0_1 = diag1.filter((b) => b.dimension === 0);
  const h0_2 = diag2.filter((b) => b.dimension === 0);

  let totalDist = 0;
  const n = Math.max(h0_1.length, h0_2.length);

  for (let i = 0; i < n; i++) {
    const b1 = h0_1[i];
    const b2 = h0_2[i];

    if (b1 && b2) {
      totalDist += Math.sqrt(
        Math.pow(b1.birth - b2.birth, 2) + Math.pow(b1.death - b2.death, 2)
      );
    } else if (b1) {
      totalDist += b1.lifetime / Math.SQRT2;
    } else if (b2) {
      totalDist += b2.lifetime / Math.SQRT2;
    }
  }

  return Math.round(totalDist * 10000) / 10000;
}

router.post("/topology", async (req, res) => {
  try {
    const body = ComputeTopologyBody.parse(req.body);
    const currentState = body.currentState;
    const goalState = body.goalState;

    const diagramCurrent = generateSimulatedPersistenceDiagram(currentState, 1);
    const diagramGoal = generateSimulatedPersistenceDiagram(goalState, 42);

    const wassersteinDistance = computeWasserstein(diagramCurrent, diagramGoal);

    const complexityCurrent = diagramCurrent.filter((b) => b.lifetime > 0.3).length;
    const complexityGoal = diagramGoal.filter((b) => b.lifetime > 0.3).length;

    let interpretation: string;
    if (wassersteinDistance < 0.5) {
      interpretation = "Estados topologicamente próximos. As estruturas de conhecimento são similares — o agente está perto do objetivo.";
    } else if (wassersteinDistance < 1.5) {
      interpretation = "Distância topológica moderada. A heurística do Algoritmo JP orienta a busca por estruturas de conhecimento intermediárias.";
    } else {
      interpretation = "Grande distância topológica. Diferenças estruturais significativas entre os estados. Múltiplas etapas de planejamento são necessárias para cobrir a lacuna de conhecimento.";
    }

    res.json({
      wassersteinDistance,
      persistenceDiagramCurrent: diagramCurrent,
      persistenceDiagramGoal: diagramGoal,
      topologicalComplexityCurrent: complexityCurrent,
      topologicalComplexityGoal: complexityGoal,
      interpretation,
    });
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "compute topology");
  }
});


// ─── Atlas Topológico da Afasia ───────────────────────────────────────────────

const ATLAS_CAT_KEYWORDS: Record<string, string[]> = {
  necessidades: ["água", "agua", "comida", "comer", "beber", "banheiro", "toalete", "remédio", "remedio", "medicina", "ajuda", "socorro", "dormir", "descanso", "frio", "calor", "fome", "sede", "higiene", "banho", "dente", "roupa", "sapato"],
  sentimentos: ["feliz", "alegre", "triste", "dor", "doer", "medo", "ansioso", "ansiedade", "cansado", "irritado", "confuso", "nervoso", "raiva", "amor", "gostar", "emoção", "choro", "chorar", "rir", "saudade", "angústia", "angustia", "stress", "depressão"],
  lugares: ["casa", "hospital", "escola", "trabalho", "parque", "quarto", "rua", "jardim", "cidade", "praia", "mercado", "supermercado", "farmácia", "farmacia", "clínica", "clinica", "banheiro"],
  pessoas: ["eu", "mãe", "mae", "pai", "família", "familia", "médico", "medico", "enfermeiro", "amigo", "cuidador", "filho", "irmão", "irmao", "avó", "avo", "avô", "pessoa", "homem", "mulher", "criança", "crianca"],
  acoes: ["quero", "não", "nao", "sim", "parar", "ir", "vir", "dar", "chamar", "ajudar", "fazer", "ver", "ouvir", "falar", "andar", "correr", "sentar", "levantar", "brincar", "trabalhar", "estudar", "dormir"],
};

interface AtlasPictogram {
  id: number;
  palavra: string;
  imagemUrl: string;
  categoria: string;
  coordX: number;
  coordY: number;
  vizinhos: { id: number; palavra: string; distancia: number }[];
}

function inferCategoria(palavra: string): string {
  const lower = palavra.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [cat, keywords] of Object.entries(ATLAS_CAT_KEYWORDS)) {
    const normalizedKeywords = keywords.map((k) =>
      k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );
    if (normalizedKeywords.some((k) => lower.includes(k) || k.includes(lower))) {
      return cat;
    }
  }
  return "outros";
}

const CAT_STATE_VECTORS: Record<string, number[]> = {
  necessidades: [9, 2, 1, 2, 1],
  sentimentos:  [2, 9, 2, 1, 2],
  lugares:      [1, 2, 9, 2, 1],
  pessoas:      [2, 1, 2, 9, 2],
  acoes:        [1, 2, 1, 2, 9],
  outros:       [5, 5, 5, 5, 5],
};

function pairwiseTopo(pictos: { id: number; categoria: string }[]): number[][] {
  const stateVectors = pictos.map((p) => {
    const base = CAT_STATE_VECTORS[p.categoria] ?? CAT_STATE_VECTORS.outros;
    const noise = (p.id % 7) / 10;
    return base.map((v, idx) => Math.max(1, v + noise * Math.sin(idx * (p.id % 13))));
  });

  const diagrams = stateVectors.map((sv, i) =>
    generateSimulatedPersistenceDiagram(sv, pictos[i].id % 100)
  );

  const n = pictos.length;
  const WASS_SCALE = 3.0;
  const dist: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const w = computeWasserstein(diagrams[i], diagrams[j]);
      const normalized = Math.min(1.0, w / WASS_SCALE);
      dist[i][j] = normalized;
      dist[j][i] = normalized;
    }
  }
  return dist;
}

function classicalMDS(dist: number[][], n: number): { x: number; y: number }[] {
  if (n === 0) return [];
  if (n === 1) return [{ x: 0, y: 0 }];
  if (n === 2) return [{ x: -dist[0][1] / 2, y: 0 }, { x: dist[0][1] / 2, y: 0 }];

  const D2 = dist.map((row) => row.map((d) => d * d));
  const rowMeans = D2.map((row) => row.reduce((a, b) => a + b, 0) / n);
  const grandMean = rowMeans.reduce((a, b) => a + b, 0) / n;
  const colMeans = Array.from({ length: n }, (_, j) =>
    D2.reduce((a, row) => a + row[j], 0) / n
  );

  const B: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (__, j) =>
      -0.5 * (D2[i][j] - rowMeans[i] - colMeans[j] + grandMean)
    )
  );

  const mulMV = (M: number[][], v: number[]) =>
    M.map((row) => row.reduce((a, b, j) => a + b * v[j], 0));
  const normV = (v: number[]) => Math.sqrt(v.reduce((a, b) => a + b * b, 0));
  const normalizeV = (v: number[]) => {
    const m = normV(v);
    return m < 1e-12 ? v.map(() => 1 / Math.sqrt(n)) : v.map((x) => x / m);
  };

  const powerIterate = (M: number[][], seed: number): { vec: number[]; val: number } => {
    let v = Array.from({ length: n }, (_, i) => Math.sin(i * 1.618 + seed));
    v = normalizeV(v);
    for (let iter = 0; iter < 150; iter++) {
      v = normalizeV(mulMV(M, v));
    }
    const Av = mulMV(M, v);
    const val = v.reduce((a, b, i) => a + b * Av[i], 0);
    return { vec: v, val };
  };

  const { vec: v1, val: lam1 } = powerIterate(B, 0.0);
  const B2 = B.map((row, i) => row.map((b, j) => b - lam1 * v1[i] * v1[j]));
  const { vec: v2, val: lam2 } = powerIterate(B2, 1.5);

  const s1 = Math.sqrt(Math.max(0, lam1));
  const s2 = Math.sqrt(Math.max(0, lam2));

  return Array.from({ length: n }, (_, i) => ({
    x: Math.round(v1[i] * s1 * 1000) / 1000,
    y: Math.round(v2[i] * s2 * 1000) / 1000,
  }));
}

async function fetchArasaacSearch(palavra: string): Promise<{ id: number; keyword: string }[]> {
  const url = `https://api.arasaac.org/api/pictograms/pt/search/${encodeURIComponent(palavra)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  const data = (await res.json()) as { _id: number; keywords?: { keyword: string }[] }[];
  return data.slice(0, 5).map((item) => ({
    id: item._id,
    keyword: item.keywords?.[0]?.keyword ?? palavra,
  }));
}

function buildAtlasResult(rawPictos: { id: number; palavra: string }[]): AtlasPictogram[] {
  const seen = new Set<number>();
  const unique = rawPictos.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const withCat = unique.map((p) => ({
    ...p,
    categoria: inferCategoria(p.palavra),
    imagemUrl: `https://static.arasaac.org/pictograms/${p.id}/${p.id}_500.png`,
  }));

  const n = withCat.length;
  if (n === 0) return [];

  const dist = pairwiseTopo(withCat);
  const coords = classicalMDS(dist, n);

  return withCat.map((p, i) => {
    const neighbors = dist[i]
      .map((d, j) => ({ j, d }))
      .filter(({ j }) => j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map(({ j, d }) => ({
        id: withCat[j].id,
        palavra: withCat[j].palavra,
        distancia: Math.round(d * 1000) / 1000,
      }));

    return {
      id: p.id,
      palavra: p.palavra,
      imagemUrl: p.imagemUrl,
      categoria: p.categoria,
      coordX: coords[i]?.x ?? 0,
      coordY: coords[i]?.y ?? 0,
      vizinhos: neighbors,
    };
  });
}

router.get("/atlas", async (req, res) => {
  try {
    const query = String(req.query.query ?? "").trim();
    const categoriaFilter = req.query.categoria ? String(req.query.categoria).trim() : null;

    if (!query) {
      res.status(400).json({ error: "Parâmetro 'query' obrigatório" });
      return;
    }

    const raw = await fetchArasaacSearch(query);
    let rawPictos = raw.map((r) => ({ id: r.id, palavra: r.keyword }));

    if (categoriaFilter) {
      rawPictos = rawPictos.filter((p) => inferCategoria(p.palavra) === categoriaFilter);
    }

    const pictos = buildAtlasResult(rawPictos);
    res.json({ pictos });
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "fetch atlas");
  }
});

const ATLAS_CATEGORIAS_KEYWORDS = [
  "agua", "comida", "dor", "medo", "casa", "medico", "familia",
  "ajuda", "sim", "nao", "sair", "feliz", "triste", "remedio", "banheiro",
];

const ATLAS_DATA_PATH = resolveDataPath("atlas_data.json");

router.get("/atlas/categorias", async (req, res) => {
  try {
    if (existsSync(ATLAS_DATA_PATH)) {
      try {
        const raw = readFileSync(ATLAS_DATA_PATH, "utf-8");
        const data = JSON.parse(raw) as { pictos: AtlasPictogram[]; keywords?: string[] };
        if (Array.isArray(data?.pictos) && data.pictos.length > 0) {
          res.json({
            pictos: data.pictos,
            keywords: data.keywords ?? ATLAS_CATEGORIAS_KEYWORDS,
            source: "precomputed",
          });
          return;
        }
        req.log.warn("atlas_data.json existe mas está vazio ou malformado — usando modo live");
      } catch (parseErr) {
        req.log.warn(`Falha ao ler atlas_data.json (${String(parseErr)}) — usando modo live`);
      }
    }

    const results = await Promise.allSettled(
      ATLAS_CATEGORIAS_KEYWORDS.map((kw) => fetchArasaacSearch(kw))
    );

    const rawPictos: { id: number; palavra: string }[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        r.value.forEach((item) => {
          rawPictos.push({ id: item.id, palavra: item.keyword || ATLAS_CATEGORIAS_KEYWORDS[i] });
        });
      }
    });

    const pictos = buildAtlasResult(rawPictos);
    res.json({ pictos, keywords: ATLAS_CATEGORIAS_KEYWORDS, source: "live" });
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "fetch atlas categorias");
  }
});

const NOUN_ATLAS_PATH = resolveDataPath("noun_atlas_data.json");

router.get("/noun-atlas", (req, res) => {
  try {
    if (existsSync(NOUN_ATLAS_PATH)) {
      const raw = readFileSync(NOUN_ATLAS_PATH, "utf-8");
      const data = JSON.parse(raw) as { pictos: AtlasPictogram[]; keywords?: string[]; total?: number; categorias?: Record<string, number>; vizinhosMethod?: string; mdsInfo?: unknown; geradoEm?: string };
      if (Array.isArray(data?.pictos) && data.pictos.length > 0) {
        res.json({
          pictos: data.pictos,
          keywords: data.keywords ?? [],
          source: "precomputed",
          total: data.total ?? data.pictos.length,
          categorias: data.categorias ?? {},
          geradoEm: data.geradoEm ?? null,
          vizinhosMethod: data.vizinhosMethod ?? "precomputed",
          mdsInfo: data.mdsInfo ?? null,
        });
        return;
      }
    }
    res.status(503).json({ error: "Atlas Noun Project não disponível. Pipeline: 1) node scripts/noun_fetch.mjs  2) node scripts/noun_recompute_wasserstein.mjs", pictos: [] });
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "fetch noun atlas");
  }
});

const DISFASIA_ATLAS_PATH = resolveDataPath("disfasia_atlas_data.json");

router.get("/disfasia-atlas", (req, res) => {
  try {
    if (existsSync(DISFASIA_ATLAS_PATH)) {
      const raw = readFileSync(DISFASIA_ATLAS_PATH, "utf-8");
      const data = JSON.parse(raw) as { pictos: AtlasPictogram[]; keywords?: string[] };
      if (Array.isArray(data?.pictos) && data.pictos.length > 0) {
        res.json({ pictos: data.pictos, keywords: data.keywords ?? [], source: "precomputed" });
        return;
      }
    }
    res.status(503).json({ error: "Dados do Atlas Disfasia não disponíveis.", pictos: [] });
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "fetch disfasia atlas");
  }
});

const DISFASIA_KNOWN_SYMBOL_IDS = [
  "parar", "continuar", "devagar", "rapido", "esperar", "repetir", "vez",
  "primeiro", "depois", "agora", "antes", "amanha", "ontem", "logo", "inicio", "fim",
  "frustrado", "tranquilo", "ansioso", "feliz", "triste", "nervoso", "calmo",
  "aqui", "ali", "longe", "perto", "dentro", "fora", "cima", "baixo",
  "falar", "ouvir", "entender", "explicar", "perguntar", "responder", "ajuda", "nao_entendi",
];

router.post("/disfasia-chat", async (req, res) => {
  try {
    const body = PictorialChatBody.parse(req.body);
    const symbolsText = body.symbols.join(", ");
    const contextText = body.context ? `\nContexto adicional: ${body.context}` : "";
    const historicoText = body.historico && body.historico.length > 0
      ? `\nMensagens anteriores: ${body.historico.slice(-5).join(" | ")}`
      : "";

    const hora = new Date().getHours();
    let periodoDia = "manhã";
    if (hora >= 12 && hora < 18) periodoDia = "tarde";
    else if (hora >= 18 || hora < 6) periodoDia = "noite";

    const symbolsList = DISFASIA_KNOWN_SYMBOL_IDS.join(", ");

    const systemPrompt = `Você é um sistema de CAA (Comunicação Aumentativa e Alternativa) especializado em disfasia, baseado na teoria IAP — Inteligência Artificial Pictórica de João Pedro Pereira Passos (UFT).

A disfasia é um distúrbio que afeta a fluência e a organização da fala, NÃO a compreensão. A pessoa com disfasia COMPREENDE tudo, mas tem dificuldade em organizar, sequenciar e articular as palavras espontaneamente. Por isso, ela usa símbolos pictóricos para montar intenções comunicativas.

Ao interpretar os símbolos, construa frases curtas, bem estruturadas e sequenciais em português do Brasil. Dê preferência a frases com ordem clara: Sujeito + Verbo + Complemento. Evite subordinadas complexas. Seja empático e natural.
Período do dia: ${periodoDia}.
Símbolos válidos para sugestões: ${symbolsList}.`;

    const userPrompt = `Símbolos selecionados pelo utilizador com disfasia: ${symbolsText}${contextText}${historicoText}

Retorne APENAS um objeto JSON com os campos abaixo (sem markdown, sem texto extra):
- intencao: string (frase estruturada em português, máx. 80 caracteres)
- urgencia: integer de 0 a 10 (0=nenhuma, 5=moderada, 8=alta, 10=emergência)
- emocao: string (1-2 palavras em português)
- confianca: float de 0.0 a 1.0
- sugestoes: array com exatamente 3 IDs de símbolos válidos (da lista fornecida)
- nota_cuidador: string (instrução em português, máx. 60 caracteres)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
      config: { maxOutputTokens: 1024, responseMimeType: "application/json" },
    });

    const rawText = response.text ?? "{}";
    let parsed: {
      intencao?: string; urgencia?: number; emocao?: string;
      confianca?: number; sugestoes?: string[]; nota_cuidador?: string;
    } = {};
    try { parsed = JSON.parse(rawText); } catch {
      parsed = { intencao: symbolsText, urgencia: 2, emocao: "neutro", confianca: 0.5, sugestoes: [], nota_cuidador: "Confirme com o utilizador." };
    }

    const rawUrgencia = parsed.urgencia;
    const urgenciaNum = typeof rawUrgencia === "number"
      ? Math.max(0, Math.min(10, Math.round(rawUrgencia)))
      : typeof rawUrgencia === "string"
        ? Math.max(0, Math.min(10, Math.round(parseFloat(rawUrgencia) || 2)))
        : 2;

    const FALLBACK_SUGGESTIONS = ["ajuda", "falar", "esperar"];
    const validSugestoes = (parsed.sugestoes ?? [])
      .filter((s) => DISFASIA_KNOWN_SYMBOL_IDS.includes(s))
      .slice(0, 3);
    while (validSugestoes.length < 3) {
      const fallback = FALLBACK_SUGGESTIONS[validSugestoes.length] ?? DISFASIA_KNOWN_SYMBOL_IDS[validSugestoes.length];
      if (!validSugestoes.includes(fallback)) validSugestoes.push(fallback);
      else { const alt = DISFASIA_KNOWN_SYMBOL_IDS.find((id) => !validSugestoes.includes(id)); if (alt) validSugestoes.push(alt); else break; }
    }

    res.json({
      intencao: parsed.intencao ?? symbolsText,
      urgencia: urgenciaNum,
      emocao: parsed.emocao ?? "neutro",
      confianca: parsed.confianca ?? 0.7,
      sugestoes: validSugestoes,
      nota_cuidador: parsed.nota_cuidador ?? "Verifique o que o utilizador quer comunicar.",
    });
  } catch (err) {
    handleRouteError(err, res, (msg) => req.log.error(msg), "process disfasia chat");
  }
});

export default router;
