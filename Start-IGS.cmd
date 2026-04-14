@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Move to repo root (folder of this script)
pushd %~dp0

echo Starting Internal Governance System (backend + frontend)...

REM Open two consoles so you can see both outputs
start "IGS Backend" cmd /k "npm run dev -w apps/backend"
start "IGS Frontend" cmd /k "npm run dev -w apps/frontend"

popd
endlocal

