# Análise de Padrões e Regras Universais do Motor Pictórico (Algoritmo JP)

A análise do documento fornecido revela que o "Motor Pictórico (Algoritmo JP)" processa tarefas do ARC-AGI reduzindo problemas complexos de raciocínio visual a interações físicas e geométricas elementares. O texto menciona explicitamente que a lógica foi reduzida a quatro pilares fundamentais: **Vetor, Gravidade, Simetria e Contenção**.

Com base nos exemplos fornecidos, é possível extrair um conjunto de regras simples e universais que permitem a um analista (ou sistema) responder à grande maioria dessas tarefas de forma sistemática.

## A Estrutura Fundamental de Resolução

Todas as tarefas analisadas seguem uma estrutura lógica tripartida idêntica. Para resolver qualquer problema, o analista deve identificar três elementos em sequência:

1. **A Invariante (O Cenário):** O que permanece estático na imagem? (Ex: um grid, uma linha de base, obstáculos, um caminho desenhado). A invariante define os limites físicos do problema.
2. **A Semente (O Ator):** Qual é o elemento ativo ou móvel? (Ex: um pixel isolado, um objeto flutuante, um símbolo).
3. **A Regra Geométrica (A Ação):** Qual força física ou transformação geométrica deve ser aplicada à semente em relação à invariante?

## As 4 Regras Simples Universais

Ao observar os padrões subjacentes, podemos categorizar as ações em quatro regras universais simples. Se o analista aplicar este "checklist" mental, conseguirá resolver a maioria dos casos:

### 1. Regra da Projeção Vetorial (Ligar os Pontos)
**Quando usar:** Quando houver pontos isolados (sementes) e alvos claros (obstáculos, trilhos ou outros pontos).
**Ação Simples:** "Trace uma linha reta do ponto A até encontrar o obstáculo B ou alinhar com a coordenada C."
**Exemplos no texto:**
*   **Tarefa WA30 (Sombra):** Traçar uma linha vertical da semente verde até bater no obstáculo azul.
*   **Tarefa VC33 (Trilho):** Deslocar o objeto amarelo horizontalmente até alinhar com a marca no trilho preto.
*   **Tarefa SU15 (Radar):** Estender uma linha da origem, passando pelo centro do alvo, até a borda.

### 2. Regra da Gravidade (Queda Livre)
**Quando usar:** Quando houver objetos "flutuando" acima de uma linha de base clara ou de outros objetos.
**Ação Simples:** "Deixe todos os objetos móveis caírem em linha reta para baixo até baterem no chão ou em outro objeto."
**Exemplos no texto:**
*   **Tarefa SP80 (Gravidade):** Mover as formas sólidas para a posição mais baixa possível (eixo -y) até colidirem com a linha verde (chão).

### 3. Regra do Mapeamento Isomórfico (Copiar e Colar com Lógica)
**Quando usar:** Quando houver um "dicionário" visual (uma área mostrando correspondências) ou um elemento controlador isolado.
**Ação Simples:** "Se a forma X está no fundo A, desenhe a forma Y correspondente no fundo B" ou "Se o controlador está na posição N, altere o alvo na posição N".
**Exemplos no texto:**
*   **Tarefa TR87 (Glifos):** Identificar símbolos no fundo azul e desenhar seus pares exatos no fundo rosa, consultando a tabela de equivalência.
*   **Tarefa TN36 (Máquina):** A posição do círculo azul na base dita exatamente qual coluna da matriz superior deve ser alterada.

### 4. Regra da Coesão Topológica (Preencher o Caminho)
**Quando usar:** Quando houver um caminho contínuo desenhado (como um labirinto ou zigue-zague) conectando dois pontos.
**Ação Simples:** "Pinte todo o caminho existente conectando a entrada à saída, sem pular nenhum espaço."
**Exemplos no texto:**
*   **Tarefa TU93 (Serpente):** Colorir o caminho cinza de forma contínua para unir a semente azul à semente verde.

## Resumo Prático para o Analista

Para responder rapidamente a qualquer nova matriz do lote, o analista deve fazer as seguintes perguntas em ordem:

1. **Existe um caminho desenhado entre dois pontos?** Se sim, aplique a **Regra 4** (Preencha o caminho).
2. **Existem objetos flutuando sobre um "chão"?** Se sim, aplique a **Regra 2** (Deixe cair).
3. **Existe uma tabela de tradução de símbolos ou um "controle remoto"?** Se sim, aplique a **Regra 3** (Traduza/Mapeie).
4. **Existem pontos isolados apontando para obstáculos ou alvos?** Se sim, aplique a **Regra 1** (Trace a linha/Alinhe).

Esta abordagem reduz a complexidade de interpretação abstrata (típica do ARC-AGI) para um conjunto de instruções mecânicas e visuais diretas, confirmando a eficácia do "Motor Pictórico" descrito no documento.
