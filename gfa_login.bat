@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem 적재용 크롬을 띄워 둔다. 한 번만 로그인하려면 이 창을 계속 열어 두어야 한다.
rem
rem 네이버 로그인 쿠키는 '로그인 상태 유지' 를 켜지 않으면 세션 쿠키다.
rem 세션 쿠키는 **브라우저가 닫히는 순간** 사라진다. 그래서 적재 스크립트가
rem 매번 크롬을 띄우고 닫으면 그때마다 로그인을 다시 해야 한다.
rem 이렇게 띄워 두면 적재 스크립트가 이 크롬에 '붙어서' 쓰고, 닫지 않는다.
rem
rem 열어 둔 채 최소화해 두면 된다. PC 를 껐다 켜면 다시 이걸 실행하면 된다.

set PORT=9222
set PROFILE=%LOCALAPPDATA%\gfa-chrome-profile
set CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe
if not exist "%CHROME%" set CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe
if not exist "%CHROME%" set CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe
if not exist "%CHROME%" (
  echo 크롬을 찾지 못했습니다. 크롬이 설치되어 있는지 확인해 주세요.
  pause
  exit /b 1
)

rem 이미 띄워 둔 것이 있으면 두 개가 되지 않게 알려만 준다
netstat -ano | findstr ":%PORT% " | findstr LISTENING >nul
if not errorlevel 1 (
  echo 이미 띄워 둔 크롬이 있습니다 ^(포트 %PORT%^). 그 창을 그대로 쓰세요.
  echo 로그인이 풀렸으면 그 창에서 ads.naver.com 에 다시 로그인하면 됩니다.
  pause
  exit /b 0
)

echo.
echo 적재용 크롬을 띄웁니다.
echo.
echo   1. 열린 창에서 네이버에 로그인하세요 ^(ads.naver.com^)
echo   2. 로그인한 뒤 **창을 닫지 마세요.** 최소화만 해 두세요
echo   3. 이제 gfa_load.bat 은 이 창에 붙어서 성과를 받아 갑니다 - 로그인을 다시 묻지 않습니다
echo.
echo   '로그인 상태 유지' 까지 체크해 두면 PC 를 껐다 켜도 로그인이 남습니다.
echo   체크하지 않았다면 PC 를 켤 때마다 이 파일을 한 번 실행해 로그인해 주세요.
echo.

start "" "%CHROME%" --remote-debugging-port=%PORT% --user-data-dir="%PROFILE%" ^
  --disable-blink-features=AutomationControlled "https://ads.naver.com/"

echo 띄웠습니다. 이 검은 창은 닫아도 됩니다 ^(크롬 창만 열어 두세요^).
timeout /t 8 >nul
exit /b 0
