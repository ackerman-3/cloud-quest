@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo  [처음 한 번만] GitHub에 cloud-quest 올리기
echo ============================================
echo.
echo 먼저 GitHub 웹에서 "cloud-quest" 이름의 빈 Public 저장소를 만들어 두세요.
echo (README, .gitignore 추가 체크는 모두 끄기)
echo.
set /p GHUSER=GitHub 아이디를 입력하고 Enter: 
if "%GHUSER%"=="" (
  echo 아이디가 비어 있어 종료합니다.
  pause
  exit /b 1
)
if not exist ".git" git init
git checkout -B main
git add -A
git commit -m "첫 업로드: 클라우드 아키텍트 퀘스트"
git remote remove origin >nul 2>&1
git remote add origin https://github.com/%GHUSER%/cloud-quest.git
git push -u origin main
echo.
echo 완료되면 GitHub 저장소 Settings - Pages - Source 를 "GitHub Actions"로 바꿔 주세요.
echo 주소: https://%GHUSER%.github.io/cloud-quest/
pause
