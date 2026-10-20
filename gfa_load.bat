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
rem 파이썬 출력을 UTF-8 로 — 안 그러면 gfa-load-detail.log 의 한글이 깨져 못 읽는다
set PYTHONIOENCODING=utf-8

echo ────────────────────────────────────────── >> gfa-load-detail.log
echo [%date% %time%] 적재 시작 >> gfa-load-detail.log

rem 진행 내용은 로그로만 가서, 이 줄이 없으면 창이 1분 가까이 빈 채로 있다
echo GFA 성과를 받아 시트에 적재하는 중입니다 (30초~1분)…

py get_gfa_report.py --push --level %LEVELS% --login-wait 90 --log gfa-load.log >> gfa-load-detail.log 2>&1

if errorlevel 1 (
  echo [%date% %time%] 실패 — gfa-load.log 를 보세요 >> gfa-load-detail.log
  echo.
  echo 적재하지 못했습니다. 이유:
  powershell -NoProfile -Command "Get-Content -Encoding UTF8 'gfa-load.log' -Tail 1"
  echo.
  echo 크롬이 닫혔거나 네이버 로그인이 풀렸으면 gfa_login.bat 으로 다시 로그인한 뒤 눌러 주세요.
  set CODE=1
  goto :hold
)

echo [%date% %time%] 완료 >> gfa-load-detail.log
set CODE=0
echo.
echo 적재를 마쳤습니다. 워크스페이스 매체별 성과 → 네이버 GFA 탭에서 보입니다.
powershell -NoProfile -Command "Get-Content -Encoding UTF8 'gfa-load.log' -Tail 1"

:hold
rem 예전에는 "manual" 을 붙여 실행할 때만 멈췄다 — 두 번 눌러 열면 끝나자마자 창이 닫혀
rem '적재를 마쳤습니다' 를 볼 수가 없었다. pause 는 스케줄러 실행을 영원히 붙잡으므로
rem 몇 초 보여 주고 닫는다 (스케줄러처럼 입력이 없는 곳에서는 timeout 이 바로 끝난다).
echo.
timeout /t 30
exit /b %CODE%
