@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem 하루 한 번 자동 적재를 등록한다. 두 번 눌러 실행하면 된다.
rem 시각을 바꾸려면:  gfa_schedule.bat 08:30

set AT=%1
if "%AT%"=="" set AT=09:00

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0gfa_schedule.ps1" -At %AT%
if errorlevel 1 (
  echo.
  echo 등록하지 못했습니다. 이 창을 관리자 권한으로 다시 실행해 보세요.
  echo   (파일을 오른쪽 클릭 - 관리자 권한으로 실행)
)
pause
