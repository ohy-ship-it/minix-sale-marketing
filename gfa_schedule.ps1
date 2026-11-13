# GFA 성과 적재를 하루 한 번 자동으로 돌리게 등록한다.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File gfa_schedule.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File gfa_schedule.ps1 -At 08:30
#   powershell -NoProfile -ExecutionPolicy Bypass -File gfa_schedule.ps1 -Remove
#
# 'StartWhenAvailable' 을 켜 두므로 그 시각에 PC 가 꺼져 있어도 괜찮다.
# 다음에 켤 때 알아서 따라 돌고, 스크립트가 최근 7일을 다시 받으므로 건너뛴 날이 메워진다.
#
# 크롬 창이 떠야 하므로 '로그온한 동안에만' 돌게 한다. 로그아웃 상태에서는 돌지 않는다.

param(
    # 하루 여러 번 돌린다. 오늘 값은 GFA 도 집계 중이라, 아침에 한 번만 받으면
    # 그 시점에 멈춘 값이 하루 종일 보인다. 최근 7일을 매번 덮으므로 여러 번 돌려도 안전하다.
    [string[]]$At = @("09:00", "14:00", "19:00"),
    [string]$TaskName = "GFA 네이버 성과 적재",
    # 시트에서 '지금 적재 요청' 을 누른 것을 집으러 몇 분마다 들여다볼지.
    # 사람이 누르고 기다리는 시간이라 짧게 둔다 — 하는 일은 웹앱에 한 번 묻는 것뿐이다.
    [int]$WatchEvery = 3,
    [string]$WatchTaskName = "GFA 적재 요청 지켜보기",
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

# $PSScriptRoot 를 쓴다. $MyInvocation 은 부르는 방식에 따라 비어 있을 수 있고,
# 그러면 작업의 '시작 위치' 가 빈 값이 되어 등록이 0x8007007B(잘못된 이름) 로 막힌다.
$folder = $PSScriptRoot
if (-not $folder) { $folder = (Get-Location).Path }
$batch = Join-Path $folder "gfa_load.bat"

if ($Remove) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    "지웠습니다: $TaskName"
    # 지켜보기는 나중에 생긴 것이라 없을 수도 있다. 없다고 멈추지 않는다.
    try {
        Unregister-ScheduledTask -TaskName $WatchTaskName -Confirm:$false -ErrorAction Stop
        "지웠습니다: $WatchTaskName"
    } catch { "지켜보기 작업은 없었습니다: $WatchTaskName" }
    exit 0
}

if (-not (Test-Path $batch)) {
    "gfa_load.bat 을 찾을 수 없습니다: $batch"
    exit 1
}

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batch`"" -WorkingDirectory $folder
# 시각마다 트리거를 하나씩 만든다 (한 작업에 여러 트리거를 달 수 있다)
$trigger = @($At | ForEach-Object { New-ScheduledTaskTrigger -Daily -At $_ })
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -AllowStartIfOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive -RunLevel Limited

# 이미 있으면 덮어쓴다 (-Force). 시각만 바꿔 다시 실행해도 된다.
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
    -Settings $settings -Principal $principal -Force | Out-Null

$task = Get-ScheduledTask -TaskName $TaskName
$info = Get-ScheduledTaskInfo -TaskName $TaskName
""
"등록했습니다: $TaskName"
"  매일 $($At -join ' · ') · 놓치면 다음 부팅 때 따라 실행"
"  실행: cmd /c $batch"
"  다음 실행 예정: $($info.NextRunTime)"
"  상태: $($task.State)"
""
"지금 한 번 돌려 보려면:  Start-ScheduledTask -TaskName '$TaskName'"
"등록을 지우려면:         이 스크립트를 -Remove 로 실행"

# ── 시트에서 누른 '지금 적재 요청' 집으러 가기 ──────────────────────────
# 하루 세 번만 돌면, 적재가 멈춘 걸 알아채도 다음 차례까지 몇 시간을 기다려야 한다.
# 그래서 몇 분마다 웹앱에 한 번 묻는 작업을 따로 둔다. 쪽지가 없으면 바로 끝나므로 가볍다.
# 쪽지가 있을 때만 위의 gfa_load.bat 을 부른다 — 적재하는 길은 하나로 둔다.
$watchBat = Join-Path $folder "gfa_watch.bat"
if (Test-Path $watchBat) {
    $watchAction = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$watchBat`"" -WorkingDirectory $folder
    # 하루 종일 되풀이한다. 오늘 시작해 두면 다음 날도 이어진다.
    $watchTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddMinutes(1) `
        -RepetitionInterval (New-TimeSpan -Minutes $WatchEvery)
    # 적재가 도는 중에 또 부르면 크롬을 두 곳에서 쥐어 둘 다 깨진다. IgnoreNew 로 막는다.
    $watchSettings = New-ScheduledTaskSettingsSet `
        -StartWhenAvailable -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries `
        -ExecutionTimeLimit (New-TimeSpan -Hours 1) -MultipleInstances IgnoreNew
    Register-ScheduledTask -TaskName $WatchTaskName -Action $watchAction -Trigger $watchTrigger `
        -Settings $watchSettings -Principal $principal -Force | Out-Null
    ""
    "등록했습니다: $WatchTaskName"
    "  $WatchEvery 분마다 · 시트에서 [지금 적재 요청] 을 누른 것만 집어 돌립니다"
} else {
    ""
    "gfa_watch.bat 이 없어 '지켜보기' 는 등록하지 않았습니다."
}
