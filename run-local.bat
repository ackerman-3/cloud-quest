@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo PC에서 미리 실행합니다. 처음에는 설치에 1~2분 걸립니다.
if not exist "node_modules" call npm install
echo 브라우저에서 http://localhost:5173 을 여세요. 끝내려면 이 창에서 Ctrl+C.
call npm run dev
pause
