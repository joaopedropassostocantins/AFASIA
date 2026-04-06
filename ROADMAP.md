# ROADMAP — Plano de Ação Priorizado
**Atualizado:** 06/04/2026  
**Horizonte:** 18/05/2026 (Gemma 4) → 30/06/2026 (ARC-AGI-3 Milestone 1)

---

## Critério de Priorização

```
Urgência × Impacto × Esforço⁻¹
```

Tarefas com prazo mais curto E maior impacto no score ficam no topo.

---

## FASE 1 — SEMANA 1-2 (06/04 → 20/04) — Base

### [P0] Fix crítico ARC-AGI: bug de loop em corredores
- **O que fazer:** Aumentar `_stale_threshold` de 3 para 5, adicionar memória de direções recentes
- **Arquivo:** `pictoric_agent.py` linha 173
- **Impacto:** Desbloqueia score > 0 no scorecard público
- **Esforço:** 2h

### [P0] Testar submission.py contra API ARC-AGI offline
- **O que fazer:** Rodar `python submission.py` em ambiente Kaggle com wheels reais
- **Impacto:** Valida que toda a cadeia funciona antes do Milestone 1
- **Esforço:** 1h

### [P0] Criar estrutura de diretórios Gemma 4
- **O que fazer:** Criar `/data`, `/model`, `/app`, `/paper`, `/notebooks`
- **Impacto:** Permite trabalhar em paralelo nos componentes
- **Esforço:** 30min

### [P1] Coletar dataset de afasia
- **O que fazer:** Baixar AAC (Augmentative and Alternative Communication) symbol sets públicos
  - ARASAAC (https://arasaac.org/) — pictogramas livres para afasia
  - PCS (Picture Communication Symbols) — versão demo
- **Impacto:** Sem dados, não há demo
- **Esforço:** 1 dia

### [P1] Protótipo Gemma 4 — integração básica
- **O que fazer:** Notebook Kaggle com chamada simples à API Gemma 4 (26B ou 31B)
  - Input: imagem de pictograma
  - Output: texto interpretado
- **Impacto:** Prova de conceito para o hackathon
- **Esforço:** 1-2 dias

---

## FASE 2 — SEMANA 3-4 (20/04 → 04/05) — Demo

### [P0] Demo funcional Gradio (Gemma 4 + Motor Pictórico)
- **O que fazer:** App em `/app/demo.py` com:
  - Upload de imagem/foto do paciente apontando para objeto
  - Gemma 4 interpreta a imagem (function calling)
  - Motor Pictórico mapeia para intenção comunicativa
  - Output: frase sugerida + alternativas
- **Impacto:** REQUISITO OBRIGATÓRIO do hackathon
- **Esforço:** 3-4 dias

### [P1] Notebook Kaggle executável end-to-end
- **O que fazer:** Notebook em `/notebooks/afasia_gemma4_demo.ipynb`
  - Célula 0: install Gemma 4 via Kaggle Models
  - Célula 1: carrega dataset de pictogramas
  - Célula 2: pipeline completo
  - Célula 3: avaliação quantitativa
- **Esforço:** 2 dias

### [P1] Fix geodésica BFS — simetria source/target
- **O que fazer:** Corrigir `calc_geodesic_matrix` para incluir `src_set` nos nós livres
- **Arquivo:** `pictoric_agent.py` linha 67
- **Impacto:** Melhora qualidade das geodésicas (menos paths sub-ótimos)
- **Esforço:** 1h

### [P2] Melhorar anti-loop com A* fallback
- **O que fazer:** Quando Sinkhorn falhar por N steps, ativar A* simples como fallback
- **Impacto:** Reduz casos de timeout no ARC-AGI
- **Esforço:** 4h

---

## FASE 3 — SEMANA 5-6 (04/05 → 18/05) — Submissão Gemma 4

### [P0] Paper técnico (2 páginas)
- **O que fazer:** Arquivo `/paper/afasia_motor_pictorico.md` com:
  - Motivação clínica (dados de prevalência de afasia)
  - Arquitetura técnica (G = I + F + Gemma 4)
  - Resultados da demo
  - Referências (Jordan-Kinderlehrer-Otto, Bronstein, LeCun JEPA)
- **Esforço:** 2 dias

### [P0] Script do vídeo de apresentação (3 min)
- **O que fazer:** Arquivo `/paper/video_script.md`
  - 0:00-0:30 — Problema: 43 milhões de brasileiros afetados por AVC/afasia
  - 0:30-1:30 — Solução: demo ao vivo
  - 1:30-2:30 — Teoria: G = I + F
  - 2:30-3:00 — Call to action
- **Esforço:** 4h

### [P0] README com badges de competição
- **O que fazer:** Atualizar `README.md` com:
  - Badge Gemma 4 Hackathon
  - Badge ARC Prize 2026
  - Seção de saúde (afasia) em destaque
  - GIF da demo
- **Esforço:** 2h

### [P1] Testes de usuário (2-3 pacientes simulados)
- **O que fazer:** Criar `/data/test_cases.json` com casos de uso reais
- **Esforço:** 1 dia

---

## FASE 4 — DEPOIS DE 18/05 — ARC-AGI Milestone 1

### [P0] Push para Kaggle e validar score > 0
- **Esforço:** 1 dia

### [P1] Otimizar Sinkhorn (reg adaptativo)
- **O que fazer:** `reg` dinâmico baseado na densidade do grid
- **Impacto:** Melhora qualidade do plano de transporte em grids densos
- **Esforço:** 2h

### [P2] Implementar Regra 2 (Gravidade) explicitamente
- **O que fazer:** Detectar objetos flutuantes e forçar movimento DOWN
- **Impacto:** Resolve tasks de gravidade sem depender do Sinkhorn
- **Esforço:** 3h

### [P2] Implementar Regra 4 (Contenção) — flood fill
- **O que fazer:** Detectar caminho desenhado e fazer flood fill
- **Impacto:** Resolve tasks de labirinto diretamente
- **Esforço:** 4h

---

## Calendário Visual

```
ABR 2026
Sem 1  (06-13): [P0] Fix loop ARC-AGI | [P0] Estrutura Gemma 4 | Dataset afasia
Sem 2  (13-20): [P1] Protótipo Gemma 4 API | [P1] Fix BFS geodésica
Sem 3  (20-27): [P0] Demo Gradio v1 | [P1] Notebook Kaggle
Sem 4  (27-04): [P0] Demo Gradio final | [P2] A* fallback

MAI 2026
Sem 5  (04-11): [P0] Paper técnico | [P0] Script vídeo
Sem 6  (11-18): [P0] README badges | Testes | SUBMISSÃO GEMMA 4 ← 18/05

JUN 2026
Sem 7-9        : Otimizações ARC-AGI | Validação score
Sem 10 (29-30) : SUBMISSÃO ARC-AGI MILESTONE 1 ← 30/06
```

---

## Métricas de Sucesso

| Projeto | Métrica | Meta mínima | Meta ideal |
|---------|---------|------------|-----------|
| Gemma 4 Hackathon | Submissão aceita | Demo funcional | Top 20% |
| ARC-AGI-3 Milestone 1 | `levels_completed` | > 0 | Top 50 scorecard |
| ARC-AGI-3 Milestone 2 | `levels_completed` | > milestone 1 | Top 20 scorecard |

---

*Ver DIAGNOSTICO.md para contexto completo do estado atual.*
