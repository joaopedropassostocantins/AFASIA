# AFASIA — Motor Pictórico para ARC-AGI-3

Agente de resolução de puzzles ARC-AGI-3 baseado em **Transporte Ótimo (Sinkhorn-Knopp)** e **Geodésicas de Custo (BFS)**.

## Arquitetura

O agente trata cada puzzle como um problema de transporte de fluido:
- **Sinkhorn Solver:** Calcula o plano de transporte ótimo entre blobs de cores
- **BFS Geodésico:** Mede distâncias reais respeitando obstáculos do grid
- **Anti-Loop:** Detecta frames idênticos e força ações aleatórias
- **Prioridade:** WASD/Sinkhorn > Click exploratório > Random

## Uso Standalone (Kaggle)

```python
# No notebook Kaggle, cole o conteúdo de pictoric_agent.py e main.py
python main.py                      # todos os jogos
python main.py --game=ls20          # jogo específico
python main.py --game=ka59 --steps=100
```

## Integração com ARC-AGI-3-Agents (Framework Oficial)

1. Clone o framework:
```bash
git clone https://github.com/arcprize/ARC-AGI-3-Agents.git
cd ARC-AGI-3-Agents
```

2. Copie o agente:
```bash
cp pictoric_agent.py agents/pictoric_agent.py
```

3. Edite `agents/__init__.py`:
```python
from .pictoric_agent import PictoricAgent

__all__ = [
    # ... agentes existentes ...
    "PictoricAgent",
    "AVAILABLE_AGENTS",
]
```

4. Mude os imports dentro de `agents/pictoric_agent.py`:
```python
# Troque:
from agents.agent import Agent
# Por:
from .agent import Agent
```

5. Execute:
```bash
uv run main.py --agent=pictoricagent --game=ls20
```

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `pictoric_agent.py` | Classe `PictoricAgent(Agent)` — cérebro do agente |
| `main.py` | Runner standalone para Kaggle/local |
| `agente.py` | Documentação das regras do Motor Pictórico |