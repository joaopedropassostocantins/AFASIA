# DIAGNÓSTICO — Estado Atual dos Projetos
**Data:** 06/04/2026  
**Autor:** Análise automatizada via Claude Code

---

## PRAZOS CRÍTICOS

| Competição | Prazo | Dias restantes | Status |
|-----------|-------|---------------|--------|
| **Gemma 4 Good Hackathon** | 18/05/2026 | **42 dias** | URGENTE |
| **ARC Prize 2026 — Milestone 1** | 30/06/2026 | **85 dias** | Em andamento |
| **ARC Prize 2026 — Milestone 2** | 30/09/2026 | 177 dias | Futuro |

---

## REPOSITÓRIO 1 — AFASIA (Gemma 4 Good Hackathon)

**URL:** https://github.com/joaopedropassostocantins/AFASIA  
**Branch ativo:** `claude/add-install-script-RhKcZ`  
**Competição:** Gemma 4 Good Hackathon — Saúde (afasia/disfasia)

### Arquivos existentes

| Arquivo | Tipo | Estado | Observação |
|---------|------|--------|-----------|
| `pictoric_agent.py` | Código | Funcional | Agente ARC-AGI — **fora do escopo Gemma 4** |
| `main.py` | Código | Funcional | Runner ARC-AGI standalone |
| `submission.py` | Código | Funcional | Kaggle offline (ARC-AGI) |
| `agente.py` | Doc | OK | Regras do Motor Pictórico |
| `README.md` | Doc | Incompleto | Focado em ARC-AGI, sem menção à afasia |
| `install.cmd` | Script | OK | Windows |
| `install.sh` | Script | OK | Linux/Mac |
| `TEORIA.md` | Doc | Novo | Hipótese G = I + F |

### Avaliação: Gemma 4 Hackathon

```
PROBLEMA CRÍTICO: O repositório contém código de ARC-AGI,
mas a competição alvo é Gemma 4 Good Hackathon (saúde/afasia).
Praticamente tudo está para ser construído.
```

#### O que FALTA para submeter no Gemma 4 Hackathon

| Item | Prioridade | Esforço estimado | Status |
|------|-----------|-----------------|--------|
| Integração Gemma 4 (API/HuggingFace) | CRÍTICO | 2-3 dias | FALTANDO |
| Dataset de afasia (imagens/ícones) | CRÍTICO | 1-2 dias | FALTANDO |
| Demo funcional (Gradio/Streamlit) | CRÍTICO | 2-3 dias | FALTANDO |
| Notebook Kaggle executável | CRÍTICO | 1 dia | FALTANDO |
| Script do vídeo de apresentação | ALTO | 1 dia | FALTANDO |
| Paper/descrição técnica (2 páginas) | ALTO | 1-2 dias | FALTANDO |
| README com badges de competição | MÉDIO | 2h | FALTANDO |
| `/data` com exemplos de entrada | MÉDIO | 1 dia | FALTANDO |

**Score atual para Gemma 4 Hackathon: 0/8 requisitos atendidos**

---

## REPOSITÓRIO 2 — ARC-AGI (ARC Prize 2026)

**Competição:** ARC Prize 2026 — ARC-AGI-3 + ARC-AGI-2  
**Scorecard público:** https://three.arcprize.org/scorecards/58e5457c-0b19-4e4f-909b-83af90ce0907

### Ambiente Kaggle

O diretório `/kaggle/working/ARC-AGI-3-Agents/` **não existe** no ambiente local
(este é um ambiente de desenvolvimento, não um notebook Kaggle ativo).

### Estado do agente (baseado no código analisado)

#### Bugs identificados no `pictoric_agent.py`

| Bug | Severidade | Localização | Descrição |
|-----|-----------|------------|-----------|
| Loop WASD | ALTO | linha 254 | `_stale_threshold=3` pode ser insuficiente — agente trava em corredores |
| Geodésica assimétrica | MÉDIO | linha 67 | BFS ignora `src_set` nos nós de origem — pode subestimar distâncias |
| `action_map` por valor int | MÉDIO | linha 245 | Mapeia `a.value` para ação — frágil se enum mudar |
| Grid vazio → random | BAIXO | linha 221 | Se `extract_grid_from_frame` falha, vai direto para random |
| `FrameData(levels_completed=0)` inicial | BAIXO | linha 95 (main.py) | Frame inicial sintético pode confundir o agente |

#### O que funciona bem
- Anti-loop com `_stale_count` (detecta 3 frames idênticos)
- Fallback em 3 níveis: Sinkhorn → Click → Random
- Import do framework tolerante a falhas (`try/except`)
- `submission.py` preparado para Kaggle offline (instalação local de wheels)
- `MAX_ACTIONS = 200` (headroom suficiente)

#### Score atual no scorecard público
- Score reportado: **0** (conforme informado — bug de pathfinding não corrigido)
- Causa provável: agente não consegue progredir no ambiente `ls20` (Sokoban 64x64, 9 cores)

### Requisitos técnicos ARC-AGI-3

| Requisito | Status |
|-----------|--------|
| `OperationMode.OFFLINE` em `submission.py` | OK |
| Sem LLMs na lógica de decisão | OK |
| Wheels instalados de `/kaggle/input/` | OK |
| `--` em flags CLI (não `—`) | OK |
| DEVICE=cpu (sem GPU) | OK — não usa torch/cuda |
| `python submission.py` funcional | OK (estruturalmente) |

---

## RESUMO EXECUTIVO

```
┌─────────────────────────────────────────────────────────┐
│  GEMMA 4 HACKATHON: 42 DIAS — ESTADO: CRÍTICO           │
│  Repositório tem código ARC-AGI, não código de saúde.   │
│  Precisa construir tudo do zero para este hackathon.    │
├─────────────────────────────────────────────────────────┤
│  ARC-AGI-3: 85 DIAS — ESTADO: FUNCIONAL MAS SCORE=0    │
│  submission.py criado, lógica implementada.             │
│  Bug de loop em corredores precisa de fix urgente.      │
│  Falta testar contra API real e validar score > 0.      │
└─────────────────────────────────────────────────────────┘
```

---

*Próximo passo recomendado: ver ROADMAP.md*
