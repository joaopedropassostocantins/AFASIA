// Constrói o grafo de adjacência kNN a partir dos pictogramas IAP
// Usado pelo Visualizador de Fluxos de Pensamento

import type { Grafo, Aresta } from "@/algorithms/dijkstra";

export interface PictoMinimo {
  id: string | number;
  palavra: string;
  categoria: string;
  coordX: number;
  coordY: number;
  vizinhos: { id: string | number; palavra: string; distancia: number }[];
}

export interface IndicePickto {
  [id: string]: PictoMinimo;
}

/**
 * Constrói o grafo kNN a partir dos pictogramas.
 * Cada nó tem arestas para seus top-10 vizinhos mais próximos.
 * Retorna também um índice por ID para lookup O(1).
 */
export function buildGraph(pictos: PictoMinimo[]): {
  grafo: Grafo;
  indicePorId: Map<string, PictoMinimo>;
  indicePorPalavra: Map<string, PictoMinimo[]>;
} {
  const grafo: Grafo = new Map();
  const indicePorId = new Map<string, PictoMinimo>();
  const indicePorPalavra = new Map<string, PictoMinimo[]>();

  // Indexar todos os pictogramas por ID e por palavra
  for (const picto of pictos) {
    const idStr = String(picto.id);
    indicePorId.set(idStr, picto);

    const palavraLower = picto.palavra.toLowerCase().trim();
    if (!indicePorPalavra.has(palavraLower)) {
      indicePorPalavra.set(palavraLower, []);
    }
    indicePorPalavra.get(palavraLower)!.push(picto);
  }

  // Grafo BIDIRECIONAL: adicionamos arestas reversas (B→A) além das diretas (A→B).
  // Motivo: o grafo kNN dirigido (~10 arestas/nó) é esparso e frequentemente
  // desconexo para pares distantes. Torná-lo bidirecional garante que Dijkstra
  // encontre caminhos entre quaisquer dois nós no mesmo componente conexo,
  // que é o comportamento esperado para visualização de "fluxo de pensamento".
  // Semântica: a distância de A→B é simétrica (distância Euclidiana no espaço MDS),
  // portanto a aresta reversa mantém o mesmo peso e não distorce as distâncias.
  for (const picto of pictos) {
    const idStr = String(picto.id);
    if (!grafo.has(idStr)) grafo.set(idStr, []);

    for (const vizinho of picto.vizinhos) {
      const vizIdStr = String(vizinho.id);
      if (!indicePorId.has(vizIdStr)) continue;

      // Adicionar aresta direta A → B
      grafo.get(idStr)!.push({ id: vizIdStr, distancia: vizinho.distancia });

      // Adicionar aresta reversa B → A (grafo bidirecional)
      if (!grafo.has(vizIdStr)) grafo.set(vizIdStr, []);
      const arestasB = grafo.get(vizIdStr)!;
      if (!arestasB.some((a) => a.id === idStr)) {
        arestasB.push({ id: idStr, distancia: vizinho.distancia });
      }
    }
  }

  return { grafo, indicePorId, indicePorPalavra };
}
