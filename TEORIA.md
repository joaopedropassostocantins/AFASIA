# Teoria da Inteligência Topológica
## Hipótese-Mãe: G = I + F

**Autor:** João Pedro Passos Tocantins  
**Versão:** 1.0 — Abril 2026

---

## 1. A Hipótese Central

```
G = I + F
```

| Símbolo | Significado | Definição operacional |
|---------|-------------|----------------------|
| **G** | Inteligência (General Intelligence) | Capacidade de resolver problemas novos sem instrução explícita |
| **I** | Incerteza (Uncertainty) | Espaço vazio no mapa pictórico — regiões não mapeadas do problema |
| **F** | Flexibilidade (Flexibility) | Capacidade de deformar estrutura geométrica sem perder identidade topológica |

**Enunciado:** A inteligência geral é proporcional à soma da incerteza que o sistema consegue tolerar e da flexibilidade com que deforma seu espaço interno de representação para acomodar novos padrões.

### Interpretação geométrica

No espaço de Wasserstein W₂(ℝⁿ), um agente inteligente é aquele que:
1. Mantém uma distribuição de probabilidade sobre estados possíveis (**I** — tolera incerteza)
2. Transporta essa distribuição de forma ótima ao encontrar novas evidências (**F** — deforma com custo mínimo)

O fluxo ótimo entre distribuições (geodésica no espaço de Wasserstein) é precisamente o que o Motor Pictórico computa via Sinkhorn-Knopp.

---

## 2. O Motor Pictórico

O Motor Pictórico é a implementação computacional de G = I + F. Ele trata raciocínio como **transporte de massa geométrico**:

```
Problema visual → Blobs de cor (distribuições)
                → BFS Geodésico (custo de transporte respeita obstáculos)
                → Sinkhorn-Knopp (plano ótimo de transporte)
                → Vetor de fluxo → Ação
```

### As 4 Regras Universais do Motor Pictórico

| Regra | Nome | Princípio físico | Operação matemática |
|-------|------|-----------------|---------------------|
| 1 | **Vetor (Projeção)** | Força direcional | Trajetória geodésica entre pontos |
| 2 | **Gravidade** | Campo potencial | Minimização de energia potencial |
| 3 | **Simetria (Isomorfismo)** | Invariância por transformação | Mapeamento bijetivo entre estruturas |
| 4 | **Contenção (Coesão Topológica)** | Conectividade | Preenchimento de componentes conexas |

---

## 3. Validação Empírica: ARC-AGI-3

### Por que ARC-AGI valida G = I + F

O benchmark ARC-AGI-3 foi projetado para ser irresolúvel por memorização — cada puzzle requer raciocínio genuinamente novo. Isso o torna o teste ideal para G:

- **I (Incerteza):** O agente nunca viu o puzzle antes. Deve tolerar ambiguidade na leitura inicial do grid e navegar sem mapa completo.
- **F (Flexibilidade):** O agente deve deformar sua representação geométrica do grid (via transporte ótimo Sinkhorn) até encontrar o mapeamento correto.

### Restrição crítica (validação pura)
> ARC-AGI-3 proíbe o uso de LLMs para resolver as tarefas.

Isso significa que qualquer score positivo é evidência de G = I + F puro — sem atalhos de linguagem ou recuperação de padrões de texto.

### Estado atual
- Solver: BFS Geodésico + Sinkhorn-Knopp (Wasserstein W₂)
- Acurácia de referência: ~90% nas tarefas testadas localmente
- Competição: ARC Prize 2026 — Milestone 1: 30/06/2026

---

## 4. Validação Empírica: AFASIA (Gemma 4 Good Hackathon)

### Conexão entre afasia e G = I + F

A afasia/disfasia é uma condição onde G permanece intacto mas o canal linguístico está danificado. O paciente:
- **Mantém F (Flexibilidade cognitiva):** Raciocina, reconhece faces, navega no espaço
- **Perde acesso a I (Incerteza linguística):** Não consegue mapear intenção → palavra

O Motor Pictórico propõe usar representações pictóricas (imagens, gestos, ícones) como **canal alternativo** — contornando o dano linguístico e acessando diretamente F.

### Implementação com Gemma 4
```
Input: Imagem/foto/gesto do paciente
     → Gemma 4 (multimodal) → Interpretação pictórica
     → Motor Pictórico → Mapeamento para intenção comunicativa
     → Output: Palavra/frase/resposta contextualizada
```

### Por que Gemma 4 especificamente
- Capacidade multimodal nativa (texto + imagem)
- Roda em dispositivos edge (baixa largura de banda — crítico para clínicas)
- Open source (auditável para uso médico)
- Function calling nativo (integração com sistemas de saúde)

### Estado atual
- Competição: Gemma 4 Good Hackathon — Prazo: 18/05/2026
- Domínio: Saúde — afasia/disfasia em adultos e crianças
- **Status: Em desenvolvimento — falta demo funcional e dataset**

---

## 5. Referências Cruzadas

### Fundamentos Matemáticos

| Referência | Relevância para G = I + F |
|-----------|--------------------------|
| **Villani, C. (2003).** *Topics in Optimal Transportation.* AMS. | Fundamento do transporte ótimo W₂ — a geometria de F |
| **Jordan, R., Kinderlehrer, D., Otto, F. (1998).** "The variational formulation of the Fokker-Planck equation." *SIAM Journal on Mathematical Analysis*, 29(1). | Geodésicas no espaço de Wasserstein como fluxo de gradiente — base do Motor Pictórico |
| **Cuturi, M. (2013).** "Sinkhorn Distances: Lightspeed Computation of Optimal Transport." *NeurIPS.* | Sinkhorn-Knopp: implementação eficiente do plano ótimo de transporte |

### Fundamentos de IA

| Referência | Relevância |
|-----------|-----------|
| **LeCun, Y. (2022).** "A Path Towards Autonomous Machine Intelligence." *OpenReview.* | JEPA (Joint Embedding Predictive Architecture): I como espaço latente de predição — F como energia de deformação |
| **Bronstein, M. et al. (2021).** "Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges." *arXiv:2104.13478.* | F como invariância sob transformações de grupo — unificação de arquiteturas por simetria geométrica |
| **Chollet, F. (2019).** "On the Measure of Intelligence." *arXiv:1911.01547.* | Definição de ARC-AGI: inteligência = generalização fora da distribuição de treino. Alinhado com G = I + F |

### Neurociência e Afasia

| Referência | Relevância |
|-----------|-----------|
| **Damasio, A. (1989).** "Time-locked multiregional retroactivation." *Cognition*, 33(1-2). | Memória pictórica como representação distribuída — suporte neural para F |
| **Schwartz, M. et al. (2011).** "Rehabilitation of aphasia." *Handbook of Clinical Neurology.* | Estado da arte em reabilitação: abordagens pictóricas têm evidência empírica |

---

## 6. Diagrama Unificado

```
                        G = I + F
                       /         \
          INCERTEZA (I)           FLEXIBILIDADE (F)
          Espaço não mapeado      Deformação geométrica ótima
                |                          |
    ┌───────────┴────────────┐  ┌──────────┴──────────────┐
    │    ARC-AGI-3           │  │    AFASIA / Gemma 4      │
    │  Grid desconhecido     │  │  Paciente sem linguagem   │
    │  → BFS tolera          │  │  → Gemma 4 interpreta    │
    │    obstáculos          │  │    imagem/gesto           │
    │  → Sinkhorn deforma    │  │  → Motor Pictórico       │
    │    distribuição        │  │    mapeia intenção        │
    │  → WASD / Click        │  │  → Resposta contextual   │
    └───────────────────────┘  └──────────────────────────┘
              │                              │
    Score: levels_completed         Métrica: taxa de
    no ARC Prize 2026               comunicação bem-sucedida
```

---

*Este documento é o núcleo teórico unificado do projeto. Qualquer modificação no código deve ser justificável por G = I + F.*
