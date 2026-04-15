// Hook para o Visualizador de Fluxos de Pensamento (AlgoritmoJP)
// Encapsula estado, construção do grafo e execução do Dijkstra

import { useState, useRef, useCallback } from "react";
import { dijkstra, type ResultadoDijkstra, type Grafo } from "@/algorithms/dijkstra";
import { buildGraph, type PictoMinimo, type IndicePickto } from "@/utils/buildGraph";

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
}

export interface AcoesFluxo {
  setOrigem: (picto: PictoMinimo | null) => void;
  setDestino: (picto: PictoMinimo | null) => void;
  calcularCaminho: () => void;
  limpar: () => void;
}

/**
 * Hook principal do Visualizador de Fluxos de Pensamento.
 * Recebe a lista de pictogramas e gerencia todo o estado do algoritmo JP.
 */
export function useFlowVisualization(pictos: PictoMinimo[]): EstadoFluxo & AcoesFluxo {
  const [origem, setOrigemState] = useState<PictoMinimo | null>(null);
  const [destino, setDestinoState] = useState<PictoMinimo | null>(null);
  const [resultado, setResultado] = useState<ResultadoFluxo | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

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
  }, []);

  const setDestino = useCallback((picto: PictoMinimo | null) => {
    setDestinoState(picto);
    setResultado(null);
    setErro(null);
    setNaoEncontrado(false);
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
  }, []);

  return {
    origem,
    destino,
    resultado,
    calculando,
    erro,
    naoEncontrado,
    setOrigem,
    setDestino,
    calcularCaminho,
    limpar,
  };
}
