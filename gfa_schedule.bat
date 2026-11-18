@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem 자동 적재를 등록한다. 두 번 눌러 실행하면 된다.
rem   기본: 하루 세 번 (09:00 · 14:00 · 19:00) + 3분마다 시트의 '지금 적재 요청' 확인
rem   시각을 바꾸려면:  gfa_schedule.bat 08:30,13:00
rem
rem 예전에는 아무것도 안 주면 여기서 09:00 을 넣어 보내서, gfa_schedule.ps1 의 기본값(세 번)이
rem 묻히고 **하루 한 번만** 등록됐다. 시각을 준 때만 넘긴다.

if "%~1"=="" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0gfa_schedule.ps1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0gfa_schedule.ps1" -At "%~1"
)
if errorlevel 1 (
  echo.
  echo 등록하지 못했습니다. 이 창을 관리자 권한으로 다시 실행해 보세요.
  echo   (파일을 오른쪽 클릭 - 관리자 권한으로 실행)
)
pause
