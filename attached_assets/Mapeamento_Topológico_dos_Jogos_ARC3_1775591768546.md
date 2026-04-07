# Mapeamento Topológico dos Jogos ARC3

Para cada jogo, definimos o espaço de estado $X$, a variedade $M$ e as propriedades de homologia persistente relevantes.

| Jogo | Espaço de Estado ($X$) | Variedade ($M$) | Homologia Persistente ($H_k$) |
| :--- | :--- | :--- | :--- |
| **n0r0** | Grid 2D Binário | Variedade Discreta (Grafo) | $H_0$ (Componentes Conectadas), $H_1$ (Ciclos/Buracos) |
| **ls20** | Espaço Métrico de Caminhos | Variedade com Borda (Obstáculos) | $H_0$ (Caminhos de Acesso), $H_1$ (Obstáculos intransponíveis) |
| **lp85** | Espaço de Configuração de Cores | Variedade Combinatória | Distância de Wasserstein entre configurações de cores |
| **lf52** | Nuvem de Pontos (Grid) | Complexo Simplicial | Filtragem por proximidade de pontos verdes |
| **ka59** | Espaço de Produto $X_1 \times X_2$ | Variedade Desconectada | Homologia de interseção entre áreas |
| **g50t** | Grafo de Fluxo | Variedade 1D imersa em 2D | Persistência de caminhos críticos |
| **ft09** | Grupo de Simetria (Permutações) | Variedade de Cayley | Invariantes sob transformações de clique |
| **dc22** | Espaço de Isometrias | Variedade de Formas | Matching de persistência entre peça e silhueta |

## Estratégia de Filtragem
Utilizaremos a **Filtragem de Subnível** baseada na intensidade de cor ou distância ao objetivo para construir o complexo de Vietoris-Rips. O GUDHI calculará os diagramas de persistência para identificar características "reais" (longa vida) versus ruído (curta vida).
