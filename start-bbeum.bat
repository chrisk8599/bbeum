@echo off
echo Starting bbeum Backend and Frontend...

REM Start Backend in new window
start "bbeum Backend" cmd /k "cd backend && venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak

REM Start Frontend in new window
start "bbeum Frontend" cmd /k "cd web && npm run dev"

echo Both servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000