# AFASIA — Motor Pictórico

[![Gemma 4 Good Hackathon](https://img.shields.io/badge/Gemma_4_Good-Hackathon_2026-blue)](https://gemma4good.devpost.com/)
[![ARC Prize 2026](https://img.shields.io/badge/ARC_Prize-2026-orange)](https://arcprize.org/)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-green.svg)](https://www.python.org/)
[![GUDHI 3.12](https://img.shields.io/badge/GUDHI-3.12.0-purple)](https://gudhi.inria.fr/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Inteligência Artificial Pictórica para comunicação alternativa de pacientes
> com afasia — baseada na hipótese G = I + F (Dinâmica Topológica do Conhecimento).

## O Problema

43 milhões de brasileiros vivem com sequelas de AVC. A afasia — perda
ou comprometimento da capacidade comunicativa — afeta diretamente a qualidade
de vida e a autonomia desses pacientes. As soluções atuais dependem de
comunicação linguística como substrato — exatamente o recurso comprometido.

## A Solução: Motor Pictórico

O **AFASIA** opera diretamente no espaço geométrico do conhecimento, sem
mediação linguística obrigatória. A hipótese central:

```
G = I + F
```

Onde:
- **G** = Dinâmica do Conhecimento (espaço topológico pictórico)
- **I** = Incerteza (espaço topológico vazio — lacunas semânticas)
- **F** = Flexibilidade (distância de Wasserstein entre estados cognitivos)

## Arquitetura

| Componente | Tecnologia | Papel |
|---|---|---|
| Motor Pictórico | Alpha Complex (GUDHI 3.12) | Raciocínio geométrico puro |
| Interpretador | Gemma 4 (31B) | Ponte visual → linguagem |
| Demo Clínica | Gradio 4.x | Interface para profissionais |
| Agente ARC-AGI | Sinkhorn-Knopp + BFS | Validação competitiva |

## Instalação

```bash
git clone https://github.com/joaopedropassostocantins/AFASIA
cd AFASIA
pip install -r requirements.txt
export GOOGLE_API_KEY="sua_chave_aqui"
```

## Uso

### Demo Clínica (Gemma 4 + Gradio)

```bash
python app/demo.py
# Acesse: http://localhost:7860
```

### Análise TDA (Motor Pictórico Puro)

```bash
python tda_pictoric_analysis.py
# Gera visualizações em tda_results/
```

### ARC-AGI-3 (Agente Competitivo)

```bash
python main.py --game=ls20
```

## Estrutura

```
AFASIA/
├── pictoric_agent.py        # Agente ARC-AGI-3 (Sinkhorn + BFS)
├── submission.py            # Submissão offline Kaggle
├── tda_pictoric_analysis.py # TDA via GUDHI (Alpha Complex + Wasserstein)
├── app/
│   └── demo.py              # Interface Gradio
├── model/
│   └── gemma4_integration.py # API Gemma 4
├── data/
│   └── arasaac/             # Pictogramas ARASAAC
├── paper/                   # Artigo técnico
├── notebooks/               # Jupyter notebooks
└── tda_results/             # Visualizações geradas
```

## Referências

- Jordan, R.; Kinderlehrer, D.; Otto, F. (1998). The variational formulation of the Fokker-Planck equation.
- Peyre, G.; Cuturi, M. (2019). Computational Optimal Transport.
- Bronstein, M. et al. (2021). Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges.
- LeCun, Y. (2022). A Path Towards Autonomous Machine Intelligence (JEPA).
- GUDHI Project (2026). GUDHI Library v3.12.0. INRIA.

---

*Desenvolvido por João Pedro Passos — Palmas, TO, 2026.*
