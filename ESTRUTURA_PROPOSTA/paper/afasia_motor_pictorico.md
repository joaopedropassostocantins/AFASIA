# AFASIA: Motor Pictórico como Interface de Comunicação Aumentativa
## Usando Inteligência Topológica (G = I + F) e Gemma 4 para Reabilitação de Afasia

**Autores:** João Pedro Passos Tocantins  
**Competição:** Gemma 4 Good Hackathon — Kaggle 2026  
**Track:** Saúde

---

## Resumo (Abstract)

> TODO: escrever após demo funcional. ~150 palavras.
> Incluir: motivação clínica, método, resultados quantitativos, conclusão.

---

## 1. Motivação

A afasia é um distúrbio de linguagem adquirido, frequentemente causado por AVC, que afeta a capacidade de falar, escrever e compreender a linguagem verbal. No Brasil, estima-se que...

> TODO: inserir dados epidemiológicos brasileiros (DATASUS, Ministério da Saúde)

O paciente com afasia frequentemente preserva capacidades cognitivas não-linguísticas intactas — reconhece faces, navega em ambientes, usa ferramentas. O desafio é criar uma **ponte** entre essa cognição preservada e a comunicação externa.

---

## 2. Hipótese Teórica: G = I + F

A hipótese central deste trabalho é que a inteligência geral pode ser decomposta em:
- **I** (Incerteza tolerada): a capacidade de navegar em espaços não completamente mapeados
- **F** (Flexibilidade geométrica): a capacidade de deformar representações para acomodar novos padrões

O Motor Pictórico implementa F como transporte ótimo de Wasserstein entre distribuições visuais, computado via Sinkhorn-Knopp (Cuturi, 2013).

Para pacientes com afasia, a hipótese é que **F permanece intacto** (flexibilidade visuoespacial preservada), mas **I é comprometida** no domínio linguístico. A solução é redirecionar a comunicação pelo canal visuoespacial.

---

## 3. Arquitetura do Sistema

```
[Input: foto/gesto/pictograma]
        ↓
[Gemma 4 multimodal]
  - Descrição da imagem
  - Extração de intenção
  - Function calling → contexto clínico
        ↓
[Motor Pictórico]
  - Mapeamento pictograma → intenção
  - Ranking por relevância contextual
        ↓
[Output: frase + alternativas + confiança]
```

> TODO: diagrama visual (substituir ASCII por figura)

---

## 4. Dataset

> TODO: descrever dataset ARASAAC utilizado
> Número de pictogramas, categorias, idioma

---

## 5. Resultados

> TODO: após demo funcional, inserir:
> - Acurácia de interpretação (% de intenções corretamente identificadas)
> - Latência média (ms)
> - Comparação com baseline (busca por palavra-chave)

---

## 6. Conclusão

> TODO: escrever após resultados

---

## Referências

- Cuturi, M. (2013). Sinkhorn Distances: Lightspeed Computation of Optimal Transport. *NeurIPS*.
- Jordan, R., Kinderlehrer, D., Otto, F. (1998). The variational formulation of the Fokker-Planck equation. *SIAM Journal on Mathematical Analysis*, 29(1).
- LeCun, Y. (2022). A Path Towards Autonomous Machine Intelligence. *OpenReview*.
- Bronstein, M. et al. (2021). Geometric Deep Learning. *arXiv:2104.13478*.
- Schwartz, M. et al. (2011). Rehabilitation of aphasia. *Handbook of Clinical Neurology*.
- ARASAAC. (2026). Portal Aragonés de la Comunicación Aumentativa y Alternativa. https://arasaac.org/
