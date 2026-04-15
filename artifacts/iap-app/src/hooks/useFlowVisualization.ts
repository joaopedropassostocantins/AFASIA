// Hook para o Visualizador de Fluxos de Pensamento (AlgoritmoJP)
// Encapsula estado, construção do grafo, execução do Dijkstra e geração de frases com IA

import { useState, useRef, useCallback } from "react";
import { dijkstra, type ResultadoDijkstra, type Grafo } from "@/algorithms/dijkstra";
import { buildGraph, type PictoMinimo, type IndicePickto } from "@/utils/buildGraph";

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

function getApiUrl(path: string) {
  return `${BASE_URL}${path}`;
}

export interface NoPensamento {
  id: string;
  palavra: string;
  palavraPt?: string;
  categoria: string;
  distanciaAteProximo: number | null; // null para o último nó
}

export interface ResultadoFluxo {
  nos: NoPensamento[];
  distanciaTotal: number;
  categorias: string[]; // categorias únicas percorridas
}

export interface EstadoFluxo {
  origem: PictoMinimo | null;
  destino: PictoMinimo | null;
  resultado: ResultadoFluxo | null;
  calculando: boolean;
  erro: string | null;
  naoEncontrado: boolean;
  frases: string[] | null;
  modeloFrases: string | null;
  gerandoFrases: boolean;
  erroFrases: string | null;
}

export interface AcoesFluxo {
  setOrigem: (picto: PictoMinimo | null) => void;
  setDestino: (picto: PictoMinimo | null) => void;
  calcularCaminho: () => void;
  limpar: () => void;
  gerarFrases: () => void;
  regerarFrases: () => void;
}

/**
 * Hook principal do Visualizador de Fluxos de Pensamento.
 * Recebe a lista de pictogramas e gerencia todo o estado do algoritmo JP
 * incluindo geração de frases lógicas com IA e cache por caminho.
 */
export function useFlowVisualization(pictos: PictoMinimo[]): EstadoFluxo & AcoesFluxo {
  const [origem, setOrigemState] = useState<PictoMinimo | null>(null);
  const [destino, setDestinoState] = useState<PictoMinimo | null>(null);
  const [resultado, setResultado] = useState<ResultadoFluxo | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  // Estados de frases com IA
  const [frases, setFrases] = useState<string[] | null>(null);
  const [modeloFrases, setModeloFrases] = useState<string | null>(null);
  const [gerandoFrases, setGerandoFrases] = useState(false);
  const [erroFrases, setErroFrases] = useState<string | null>(null);

  // Cache de frases por caminho (chave = palavraPt/palavra dos nós unidas por "→")
  const cacheRef = useRef<Map<string, { frases: string[]; modelo: string }>>(new Map());

  // Grafo e índice construídos de forma lazy e memoizados
  const grafoRef = useRef<Grafo | null>(null);
  const indicePorIdRef = useRef<Map<string, PictoMinimo> | null>(null);

  // Garante que o grafo só é construído uma vez (149 conceitos únicos)
  const garantirGrafo = useCallback(() => {
    if (!grafoRef.current || !indicePorIdRef.current) {
      const { grafo, indicePorId } = buildGraph(pictos);
      grafoRef.current = grafo;
      indicePorIdRef.current = indicePorId;
    }
    return { grafo: grafoRef.current!, indicePorId: indicePorIdRef.current! };
  }, [pictos]);

  const setOrigem = useCallback((picto: PictoMinimo | null) => {
    setOrigemState(picto);
    setResultado(null);
    setErro(null);
    setNaoEncontrado(false);
    setFrases(null);
    setModeloFrases(null);
    setErroFrases(null);
  }, []);

  const setDestino = useCallback((picto: PictoMinimo | null) => {
    setDestinoState(picto);
    setResultado(null);
    setErro(null);
    setNaoEncontrado(false);
    setFrases(null);
    setModeloFrases(null);
    setErroFrases(null);
  }, []);

  const calcularCaminho = useCallback(() => {
    if (!origem || !destino) {
      setErro("Selecione o pensamento de origem e o de destino.");
      return;
    }
    if (String(origem.id) === String(destino.id)) {
      setErro("Origem e destino são o mesmo pictograma.");
      return;
    }

    setCalculando(true);
    setErro(null);
    setResultado(null);
    setNaoEncontrado(false);
    setFrases(null);
    setModeloFrases(null);
    setErroFrases(null);

    // Executa de forma assíncrona para não travar a UI
    setTimeout(() => {
      try {
        const { grafo, indicePorId } = garantirGrafo();
        const origemId = String(origem.id);
        const destinoId = String(destino.id);

        const resultado: ResultadoDijkstra | null = dijkstra(grafo, origemId, destinoId);

        if (!resultado) {
          setNaoEncontrado(true);
          setCalculando(false);
          return;
        }

        // Montar os nós com distâncias parciais
        const nos: NoPensamento[] = resultado.caminho.map((id, idx) => {
          const picto = indicePorId.get(id);
          const proximoId = resultado.caminho[idx + 1];
          let distanciaAteProximo: number | null = null;

          if (proximoId) {
            const vizinhos = grafo.get(id) ?? [];
            const aresta = vizinhos.find((v) => v.id === proximoId);
            distanciaAteProximo = aresta?.distancia ?? null;
          }

          return {
            id,
            palavra: picto?.palavra ?? id,
            palavraPt: picto?.palavraPt,
            categoria: picto?.categoria ?? "outros",
            distanciaAteProximo,
          };
        });

        // Categorias únicas no caminho (preservando ordem de aparição)
        const categorias = [...new Set(nos.map((n) => n.categoria))];

        setResultado({
          nos,
          distanciaTotal: resultado.distanciaTotal,
          categorias,
        });
      } catch (e) {
        setErro("Erro ao calcular o caminho. Tente novamente.");
        console.error("[FluxoPensamento] Erro no Dijkstra:", e);
      } finally {
        setCalculando(false);
      }
    }, 50);
  }, [origem, destino, garantirGrafo]);

  const limpar = useCallback(() => {
    setOrigemState(null);
    setDestinoState(null);
    setResultado(null);
    setErro(null);
    setNaoEncontrado(false);
    setCalculando(false);
    setFrases(null);
    setModeloFrases(null);
    setGerandoFrases(false);
    setErroFrases(null);
  }, []);

  // Função interna para chamar o endpoint de frases
  const chamarEndpointFrases = useCallback(async (nos: NoPensamento[], forceRefresh = false) => {
    const caminhoLabels = nos.map((n) => n.palavraPt ?? n.palavra);
    const cacheKey = caminhoLabels.join("→");

    // Verificar cache
    if (!forceRefresh && cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      setFrases(cached.frases);
      setModeloFrases(cached.modelo);
      return;
    }

    setGerandoFrases(true);
    setErroFrases(null);
    setFrases(null);
    setModeloFrases(null);

    try {
      const resp = await fetch(getApiUrl("/api/iap/flow-phrases"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caminho: caminhoLabels }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${resp.status}`);
      }

      const data = await resp.json() as { frases: string[]; modelo: string };

      if (!Array.isArray(data.frases) || data.frases.length < 3) {
        throw new Error("O modelo retornou menos de 3 frases. Clique em 'Regerar' para tentar novamente.");
      }

      // Salvar no cache
      cacheRef.current.set(cacheKey, { frases: data.frases, modelo: data.modelo });

      setFrases(data.frases);
      setModeloFrases(data.modelo);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar frases. Tente novamente.";
      setErroFrases(msg);
      console.error("[FluxoPensamento] Erro ao gerar frases:", e);
    } finally {
      setGerandoFrases(false);
    }
  }, []);

  const gerarFrases = useCallback(() => {
    if (!resultado) return;
    chamarEndpointFrases(resultado.nos, false);
  }, [resultado, chamarEndpointFrases]);

  const regerarFrases = useCallback(() => {
    if (!resultado) return;
    chamarEndpointFrases(resultado.nos, true);
  }, [resultado, chamarEndpointFrases]);

  return {
    origem,
    destino,
    resultado,
    calculando,
    erro,
    naoEncontrado,
    frases,
    modeloFrases,
    gerandoFrases,
    erroFrases,
    setOrigem,
    setDestino,
    calcularCaminho,
    limpar,
    gerarFrases,
    regerarFrases,
  };
}
