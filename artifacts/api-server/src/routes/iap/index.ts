import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import {
  RunJpAlgorithmBody,
  PictorialChatBody,
  ComputeTopologyBody,
} from "@workspace/api-zod";

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
    req.log.error({ err }, "Failed to run JP Algorithm");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pictoric-chat", async (req, res) => {
  try {
    const body = PictorialChatBody.parse(req.body);
    const lang = body.language ?? "pt";
    const symbolsText = body.symbols.join(", ");
    const contextText = body.context ? `\nContexto adicional: ${body.context}` : "";

    const systemPrompt = lang === "pt"
      ? `Você é um assistente especializado em Comunicação Aumentativa e Alternativa (CAA) para pessoas com afasia.
         Sua função é interpretar sequências de símbolos pictóricos e traduzi-las para linguagem natural clara e empática.
         A teoria IAP (Inteligência Artificial Pictórica) sugere que o pensamento ocorre em espaços topológicos antes da linguagem.
         Responda sempre de forma acolhedora e em português.`
      : `You are a specialized assistant in Augmentative and Alternative Communication (AAC) for people with aphasia.
         Your role is to interpret sequences of pictorial symbols and translate them into clear, empathetic natural language.
         PAI (Pictorial Artificial Intelligence) theory suggests thought occurs in topological spaces before language.
         Always respond in an empathetic and supportive way in English.`;

    const userPrompt = lang === "pt"
      ? `Símbolos pictóricos selecionados: ${symbolsText}${contextText}
         
         Por favor:
         1. Interprete o que o usuário quer comunicar
         2. Crie uma frase completa em linguagem natural
         3. Sugira 3 combinações de símbolos seguintes que fariam sentido
         
         Responda em formato JSON com os campos: interpretation, naturalLanguage, suggestions (array de 3 strings), confidence (0-1)`
      : `Pictorial symbols selected: ${symbolsText}${contextText}
         
         Please:
         1. Interpret what the user wants to communicate
         2. Create a complete natural language sentence
         3. Suggest 3 next symbol combinations that would make sense
         
         Respond in JSON format with fields: interpretation, naturalLanguage, suggestions (array of 3 strings), confidence (0-1)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] },
      ],
      config: {
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text ?? "{}";

    let parsed: {
      interpretation?: string;
      naturalLanguage?: string;
      suggestions?: string[];
      confidence?: number;
    } = {};

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        interpretation: rawText.slice(0, 200),
        naturalLanguage: rawText.slice(0, 200),
        suggestions: [],
        confidence: 0.5,
      };
    }

    res.json({
      interpretation: parsed.interpretation ?? "Could not interpret symbols",
      naturalLanguage: parsed.naturalLanguage ?? symbolsText,
      suggestions: parsed.suggestions ?? [],
      confidence: parsed.confidence ?? 0.8,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to process pictorial chat");
    res.status(500).json({ error: "Internal server error" });
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
    req.log.error({ err }, "Failed to compute topology");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
