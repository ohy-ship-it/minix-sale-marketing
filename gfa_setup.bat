@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem 적재를 맡을 PC 에서 한 번만 실행한다.
rem   1) 파이썬이 있는지 본다  2) 셀레니움을 깐다  3) 네이버에 한 번 로그인한다
rem 이 PC 에서 로그인한 쿠키는 이 PC 에서만 쓸 수 있다.
rem 윈도우 사용자 계정에 묶인 키로 암호화되어, 프로필 폴더를 복사해 가도 풀리지 않는다.

echo.
echo == 1. 파이썬 확인 ==
py -V
if errorlevel 1 (
  echo.
  echo 파이썬이 없습니다. python.org 에서 3.10 이상을 설치하고 다시 실행해 주세요.
  echo   설치할 때 'Add python.exe to PATH' 를 켜 주세요.
  echo   (PATH 의 python.exe 가 마이크로소프트 스토어 껍데기면 실행이 안 됩니다. py 를 씁니다)
  pause
  exit /b 1
)

echo.
echo == 2. 셀레니움 설치 ==
py -m pip install --quiet --upgrade selenium
if errorlevel 1 (
  echo 셀레니움을 설치하지 못했습니다. 사내망 프록시나 권한 문제일 수 있습니다.
  pause
  exit /b 1
)
py -c "import selenium; print('selenium', selenium.__version__)"

echo.
echo == 3. 네이버 로그인 ==
echo 크롬이 열립니다. GFA 광고계정 권한이 있는 아이디로 로그인해 주세요.
echo.
echo   ★ '로그인 상태 유지' 를 꼭 체크하세요.
echo     체크하지 않으면 창을 닫을 때 로그인 쿠키가 지워져 자동 실행이 매번 실패합니다.
echo.
pause

rem 로그인만 시키고 실제 적재는 하지 않는다 (--push 없음). 어제 하루만 짧게 확인한다.
py get_gfa_report.py --login-wait 600 --level CAMPAIGN --out gfa-setup-check.json
if errorlevel 1 (
  echo.
  echo 로그인 확인에 실패했습니다. 위 메시지를 확인해 주세요.
  pause
  exit /b 1
)

echo.
echo 준비를 마쳤습니다.
echo   · 손으로 적재할 때:  gfa_load.bat 을 두 번 누르세요
echo   · 하루 한 번 자동으로 돌리려면 gfa_schedule.bat 을 실행하세요
pause
exit /b 0
