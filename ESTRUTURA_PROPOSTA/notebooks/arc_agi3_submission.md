# Notebook ARC-AGI-3 — Guia de Submissão Kaggle

## Arquivo a submeter
`submission.py` (raiz do repositório) — já funcional.

## Estrutura do notebook Kaggle (quando criar)

```
Célula 0: Instala wheels de /kaggle/input/
Célula 1: Importa submission.py ou inline do código
Célula 2: Carrega ARC_API_KEY via Kaggle Secrets
Célula 3: arc_agi.Arcade(operation_mode=OperationMode.OFFLINE)
Célula 4: Loop principal — play_game() para cada ambiente
Célula 5: Print score final
```

## Checklist antes de submeter

- [ ] Wheels `arcengine` e `arc_agi` adicionados como dataset em /kaggle/input/
- [ ] `ARC_API_KEY` configurada em Add-ons > Secrets
- [ ] `OperationMode.OFFLINE` (não COMPETITION, não EVALUATION)
- [ ] `submission.py` como script principal (não notebook)
- [ ] Testado localmente com `python submission.py`
- [ ] Score > 0 no scorecard público antes de submeter

## Bugs a corrigir antes do Milestone 1 (30/06/2026)

1. `_stale_threshold=3` → aumentar para 5
2. BFS geodésico: incluir `src_set` nos nós livres
3. Validar `action_map.get()` com fallback explícito
