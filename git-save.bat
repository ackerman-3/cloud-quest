@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 바뀐 내용을 GitHub에 올립니다. 올리면 1~2분 뒤 자동으로 배포됩니다.
git add -A
git commit -m "업데이트 %date% %time%"
git push
echo.
echo 진행 상황: GitHub 저장소의 Actions 탭에서 초록 체크가 뜨면 배포 완료입니다.
pause
