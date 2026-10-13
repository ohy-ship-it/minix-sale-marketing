@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem 카페24 애널리틱스 UTM 숫자(기여기간 30일)를 구글시트 '카페24UTM30일' 탭에 적재한다.
rem 작업 스케줄러가 하루 한 번 부르고, 사람이 손으로 눌러도 된다.
rem
rem 기간은 스크립트 기본값 — 어제까지 최근 31일. 30일 기여라 지난 날짜 숫자도 나중에 늘어서
rem 매번 다시 받아 그 날짜를 통째로 새로 쓴다 (여러 번 돌려도 겹치지 않는다).
rem 크롬은 gfa_login.bat 으로 띄워 둔 창에 붙는다. 카페24 관리자 로그인이 그 창에 살아 있어야 한다.

echo ────────────────────────────────────────── >> cafe24-utm-load-detail.log
echo [%date% %time%] 적재 시작 >> cafe24-utm-load-detail.log

py get_cafe24_utm.py --push --login-wait 90 --log cafe24-utm-load.log >> cafe24-utm-load-detail.log 2>&1

if errorlevel 1 (
  echo [%date% %time%] 실패 — cafe24-utm-load.log 를 보세요 >> cafe24-utm-load-detail.log
  echo.
  echo 적재하지 못했습니다. cafe24-utm-load.log 에 이유가 적혀 있습니다.
  if "%1"=="manual" pause
  exit /b 1
)

echo [%date% %time%] 완료 >> cafe24-utm-load-detail.log
echo.
echo 적재를 마쳤습니다. 워크스페이스 카페24 결과 화면 '애널리틱스 기준 · 기여기간 30일' 표에서 보입니다.
if "%1"=="manual" pause
exit /b 0
