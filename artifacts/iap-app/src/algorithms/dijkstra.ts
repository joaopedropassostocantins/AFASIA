// Algoritmo de Dijkstra sobre o grafo kNN (AlgoritmoJP)
// Encontra o caminho de menor custo entre dois nós no espaço semântico IAP

export interface Aresta {
  id: string;
  distancia: number;
}

export type Grafo = Map<string, Aresta[]>;

export interface ResultadoDijkstra {
  caminho: string[];
  distanciaTotal: number;
}

// Nó na fila de prioridade simplificada
interface NoDaFila {
  id: string;
  dist: number;
}

/**
 * Executa o Algoritmo de Dijkstra no grafo kNN semântico.
 * Retorna o caminho mais curto entre origemId e destinoId,
 * ou null se os nós não estiverem conectados no grafo kNN.
 */
export function dijkstra(
  grafo: Grafo,
  origemId: string,
  destinoId: string
): ResultadoDijkstra | null {
  if (origemId === destinoId) {
    return { caminho: [origemId], distanciaTotal: 0 };
  }

  // Inicializar distâncias com Infinito
  const distancias = new Map<string, number>();
  const anterior = new Map<string, string>();
  const visitados = new Set<string>();

  // Fila de prioridade simplificada (array ordenado por distância)
  const fila: NoDaFila[] = [{ id: origemId, dist: 0 }];
  distancias.set(origemId, 0);

  while (fila.length > 0) {
    // Extrair nó com menor distância (min-heap simplificado)
    fila.sort((a, b) => a.dist - b.dist);
    const atual = fila.shift()!;

    // Chegamos ao destino
    if (atual.id === destinoId) break;

    // Ignorar se já visitado com distância menor
    if (visitados.has(atual.id)) continue;
    visitados.add(atual.id);

    const distAtual = distancias.get(atual.id) ?? Infinity;

    // Relaxar arestas dos vizinhos
    const vizinhos = grafo.get(atual.id) ?? [];
    for (const vizinho of vizinhos) {
      if (visitados.has(vizinho.id)) continue;

      const novaDist = distAtual + vizinho.distancia;
      const distAntiga = distancias.get(vizinho.id) ?? Infinity;

      if (novaDist < distAntiga) {
        distancias.set(vizinho.id, novaDist);
        anterior.set(vizinho.id, atual.id);
        fila.push({ id: vizinho.id, dist: novaDist });
      }
    }
  }

  // Verificar se o destino foi alcançado
  if (!distancias.has(destinoId) || (distancias.get(destinoId) ?? Infinity) === Infinity) {
    return null;
  }

  // Reconstruir o caminho de trás para frente
  const caminho: string[] = [];
  let no: string | undefined = destinoId;
  while (no !== undefined) {
    caminho.unshift(no);
    no = anterior.get(no);
  }

  // Validar que o caminho começa na origem
  if (caminho[0] !== origemId) return null;

  return {
    caminho,
    distanciaTotal: distancias.get(destinoId) ?? 0,
  };
}
