@echo off
chcp 65001 >nul
cd /d "%~dp0"
title GFA 지금 적재

rem 적재가 막혔을 때 **이것 하나만** 두 번 누르면 된다.
rem
rem gfa_load.bat 도 손으로 누를 수 있지만, 막히는 까닭은 열에 아홉 '크롬이 닫혔다 ·
rem 로그인이 풀렸다' 다. 그때 gfa_load.bat 만 누르면 또 실패하고, 사람은 gfa_login.bat 을
rem 따로 알아서 눌러야 했다. 두 파일 중 어느 것부터인지 아는 사람만 고칠 수 있었다.
rem
rem 그래서 여기서 **차례를 대신 밟는다** — 크롬부터 보고, 없으면 띄워 로그인을 기다린 뒤 적재한다.

set PORT=9222

echo.
echo  ── GFA 지금 적재 ──────────────────────────────
echo.
echo  크롬이 떠 있는지 봅니다…

netstat -ano | findstr ":%PORT% " | findstr LISTENING >nul
if not errorlevel 1 goto :load

echo.
echo  적재용 크롬이 닫혀 있습니다. 지금 띄웁니다.
echo.
call "%~dp0gfa_login.bat"

echo.
echo  ───────────────────────────────────────────────
echo   열린 크롬 창에서 네이버에 로그인해 주세요 (ads.naver.com).
echo   이미 로그인돼 있으면 그냥 넘어가면 됩니다.
echo.
echo   '로그인 상태 유지' 를 켜 두면 PC 를 껐다 켜도 로그인이 남습니다.
echo  ───────────────────────────────────────────────
echo.
echo  로그인을 마쳤으면 아무 키나 누르세요. 그때 적재를 시작합니다.
pause >nul

rem 크롬이 뜨고 디버깅 포트를 열기까지 몇 초 걸린다. 바로 붙으면 헛걸음이다.
netstat -ano | findstr ":%PORT% " | findstr LISTENING >nul
if errorlevel 1 (
  echo.
  echo  아직 크롬이 포트 %PORT% 를 열지 않았습니다. 5초 기다립니다…
  timeout /t 5 >nul
)

:load
echo.
echo  적재를 시작합니다.
echo.
call "%~dp0gfa_load.bat"
exit /b %errorlevel%
