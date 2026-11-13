@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem 시트에서 누른 'GFA 지금 적재 요청' 이 있는지 묻고, 있으면 적재한다.
rem 작업 스케줄러가 몇 분마다 부른다 (gfa_schedule.ps1 이 등록한다).
rem 쪽지가 없으면 아무 말 없이 바로 끝난다 — 로그를 쓸데없이 불리지 않으려는 것이다.

set PYTHONIOENCODING=utf-8
py gfa_watch.py >> gfa-watch-detail.log 2>&1
exit /b %errorlevel%
