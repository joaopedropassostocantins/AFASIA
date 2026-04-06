# /data — Datasets e Exemplos

## Conteúdo esperado

```
/data
├── arasaac/          # Pictogramas ARASAAC (https://arasaac.org/) — licença CC
├── examples/         # Casos de uso reais (imagens de pacientes simulados)
├── test_cases.json   # Casos de teste estruturados
└── vocab.json        # Vocabulário pictórico → intenção comunicativa
```

## Como popular

### ARASAAC (gratuito)
```bash
# API pública — não requer cadastro
curl "https://api.arasaac.org/v1/pictograms/all/pt" -o arasaac/catalog.json
```

### test_cases.json — formato esperado
```json
[
  {
    "id": "tc001",
    "input_image": "examples/agua.jpg",
    "patient_intent": "Quero água",
    "context": "Adulto pós-AVC, afasia de Broca",
    "expected_output": ["Quero água", "Tenho sede", "Pode me dar água?"]
  }
]
```

## Fontes de dados públicas para afasia
- ARASAAC: https://arasaac.org/
- Boardmaker Symbols (versão demo): https://www.boardmakeronline.com/
- PECS (Picture Exchange Communication System)
- OpenDyslexic icons
