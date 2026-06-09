# Run face-service without needing Python on PATH
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$venvPython = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
  $systemPython = "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe"
  if (-not (Test-Path $systemPython)) {
    Write-Error "Python not found. Install Python 3.10+ or run: docker build -t elitebase-face-service ."
  }
  & $systemPython -m venv .venv
  & $venvPython -m pip install -r requirements.txt
}

& $venvPython -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
