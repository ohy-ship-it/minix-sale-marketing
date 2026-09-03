@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem GFA(네이버 성과형 디스플레이광고) 성과를 구글시트에 적재한다.
rem 작업 스케줄러가 하루 한 번 이걸 부르고, 사람이 손으로 눌러도 된다.
rem
rem 기간은 스크립트 기본값 — 어제까지 최근 7일. 7일을 매번 다시 받는 이유가 둘 있다.
rem   · PC 가 꺼져 있어 건너뛴 날이 다음 실행에서 저절로 메워진다
rem   · 전환은 클릭 뒤 며칠까지 붙는다. 다시 받아 최신 값으로 덮어쓴다
rem 같은 날짜 같은 줄은 덮어쓰기라 여러 번 돌려도 이중 집계되지 않는다.

set LEVELS=CAMPAIGN AD_SET ASSET_GROUP CREATIVE

echo ────────────────────────────────────────── >> gfa-load-detail.log
echo [%date% %time%] 적재 시작 >> gfa-load-detail.log

py get_gfa_report.py --push --level %LEVELS% --login-wait 90 --log gfa-load.log >> gfa-load-detail.log 2>&1

if errorlevel 1 (
  echo [%date% %time%] 실패 — gfa-load.log 를 보세요 >> gfa-load-detail.log
  echo.
  echo 적재하지 못했습니다. gfa-load.log 에 이유가 적혀 있습니다.
  rem 사람이 눌러 실행한 경우에만 창을 잡아 둔다 (스케줄러 실행은 그냥 끝난다)
  if "%1"=="manual" pause
  exit /b 1
)

echo [%date% %time%] 완료 >> gfa-load-detail.log
echo.
echo 적재를 마쳤습니다. 워크스페이스 매체별 성과 → 네이버 GFA 탭에서 보입니다.
if "%1"=="manual" pause
exit /b 0
