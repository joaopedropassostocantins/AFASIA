#!/usr/bin/env bash
set -euo pipefail

echo "============================================================"
echo "  AFASIA -- Motor Pictorico v7.x (ARC-AGI-3)"
echo "  Instalador Linux/Mac"
echo "============================================================"
echo ""

# Verificar Python 3.10+
if ! command -v python3 &>/dev/null; then
    echo "[ERRO] python3 nao encontrado. Instale Python 3.10+."
    exit 1
fi

PYVER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
PYVERMAJ=$(python3 -c "import sys; print(sys.version_info.major)")
PYVERMIN=$(python3 -c "import sys; print(sys.version_info.minor)")

if [ "$PYVERMAJ" -lt 3 ] || { [ "$PYVERMAJ" -eq 3 ] && [ "$PYVERMIN" -lt 10 ]; }; then
    echo "[ERRO] Python $PYVER detectado. Requer Python 3.10+."
    exit 1
fi
echo "[OK] Python $PYVER"

# Verificar pip
if ! python3 -m pip --version &>/dev/null; then
    echo "[ERRO] pip nao encontrado. Execute: python3 -m ensurepip"
    exit 1
fi

# Instalar dependencias
echo ""
echo "[INFO] Instalando arc-agi..."
python3 -m pip install arc-agi -q
echo "[OK] arc-agi instalado"

# Verificar API Key
echo ""
if [ -z "${ARC_API_KEY:-}" ]; then
    echo "[AVISO] ARC_API_KEY nao definida."
    echo "        Para definir nesta sessao:"
    echo "          export ARC_API_KEY='sua-chave-aqui'"
    echo "        Para persistir, adicione ao ~/.bashrc ou ~/.zshrc."
else
    echo "[OK] ARC_API_KEY detectada"
fi

echo ""
echo "============================================================"
echo "  Instalacao concluida!"
echo "  Execute: python3 main.py --game=ls20"
echo "============================================================"
