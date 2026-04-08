# AFASIA IAP — Inteligência Artificial Pictórica
**Gemma 4 Good Hackathon 2025**  
Autor: João Pedro Pereira Passos (UFT - Universidade Federal do Tocantins)

## Hardware Utilizado
- CPU: 4 cores  
- RAM: 30 GB  
- GPU: 1× NVIDIA T4 (16 GB)  
- Plataforma: Kaggle Notebook (Linux)

## Como Executar
1. Adicione o dataset oficial **"gemma-4"** como Input no Kaggle.
2. Abra o notebook `afasia_iap_notebook.ipynb`.
3. Execute todas as células.

## Treinamento
Zero-shot (não foi feito nenhum treino). Apenas inferência no Gemma 4 26B A4B.

## Previsão
O notebook já calcula o caminho ótimo entre pictogramas usando embeddings do Gemma 4 + Análise Topológica (Wasserstein + Dijkstra).

Nenhum efeito colateral. Não modifica arquivos de entrada.
