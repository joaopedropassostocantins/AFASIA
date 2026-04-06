@echo off
setlocal EnableDelayedExpansion

echo ============================================================
echo   AFASIA -- Motor Pictorico v7.x (ARC-AGI-3)
echo   Instalador Windows
echo ============================================================
echo.

:: Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado. Instale Python 3.10+ em https://python.org
    exit /b 1
)

for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo [OK] Python %PYVER% encontrado

:: Verificar pip
python -m pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] pip nao encontrado. Execute: python -m ensurepip
    exit /b 1
)

:: Instalar dependencias
echo.
echo [INFO] Instalando arc-agi...
python -m pip install arc-agi -q
if errorlevel 1 (
    echo [ERRO] Falha ao instalar arc-agi
    exit /b 1
)
echo [OK] arc-agi instalado

:: Verificar API Key
echo.
if "%ARC_API_KEY%"=="" (
    echo [AVISO] ARC_API_KEY nao definida.
    echo         Para definir permanentemente:
    echo           setx ARC_API_KEY "sua-chave-aqui"
    echo         Para esta sessao apenas:
    echo           set ARC_API_KEY=sua-chave-aqui
) else (
    echo [OK] ARC_API_KEY detectada
)

echo.
echo ============================================================
echo   Instalacao concluida!
echo   Execute: python main.py --game=ls20
echo ============================================================
endlocal
