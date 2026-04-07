import { Router, type IRouter, type Response } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import {
  RunJpAlgorithmBody,
  PictorialChatBody,
  ComputeTopologyBody,
} from "@workspace/api-zod";

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
      message: `Goal event "${goal}" or start event "${startEvent}" not found in events list.`,
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
      message: `No path found from "${startEv.label}" to "${goalEvent.label}".`,
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
    message: `Plan found: ${forwardPath.length} steps from "${startEv.label}" to "${goalEvent.label}" with total cost ${dist.get(goalEvent.id)?.toFixed(1)}.`,
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
      interpretation = "States are topologically close. The knowledge structures are similar — the agent is near the goal.";
    } else if (wassersteinDistance < 1.5) {
      interpretation = "Moderate topological distance. The JP Algorithm heuristic guides search through intermediate knowledge structures.";
    } else {
      interpretation = "Large topological distance. Significant structural differences between states. Multiple planning steps required to bridge the knowledge gap.";
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

export default router;
