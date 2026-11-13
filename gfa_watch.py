"""시트에서 누른 'GFA 지금 적재 요청' 을 집어다 적재한다.

GFA 는 공개 API 가 없어 **이 PC 의 크롬**이 관리 화면을 읽어야 한다. Apps Script 는
크롬을 띄울 수 없으니 시트가 직접 받아 올 수는 없다. 그래서 시트는 쪽지만 남기고,
이 스크립트가 몇 분마다 들여다보다가 쪽지가 있으면 평소 예약 작업과 **똑같은** 적재를 돌린다.

    py gfa_watch.py              쪽지가 있으면 적재하고, 없으면 아무 말 없이 끝난다
    py gfa_watch.py --loud       쪽지가 없을 때도 그렇다고 적는다 (손으로 확인할 때)

작업 스케줄러가 이걸 몇 분마다 부른다 (gfa_schedule.ps1 이 등록해 준다).
적재 자체는 gfa_load.bat 을 그대로 부른다 — 로그도 실패 처리도 한 곳에 모아 두려는 것이다.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(errors="replace", line_buffering=True)

# 적재 도구와 같은 웹앱 · 같은 열쇠를 쓴다. 한 군데서 가져다 쓴다 —
# 주소나 열쇠를 옮길 때 두 파일을 고치게 두면 반드시 한쪽을 빠뜨린다.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from get_gfa_report import SHEET_ENDPOINT, push_key          # noqa: E402

HERE = Path(__file__).resolve().parent
LOAD_BAT = HERE / "gfa_load.bat"
WATCH_LOG = HERE / "gfa-watch.log"


def ask(action: str, extra: dict | None = None) -> dict:
    body = {"action": action, "key": push_key()}
    if extra:
        body.update(extra)
    request = urllib.request.Request(
        SHEET_ENDPOINT,
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "text/plain;charset=utf-8"})
    with urllib.request.urlopen(request, timeout=60) as response:
        text = response.read().decode("utf-8", "replace")
    try:
        return json.loads(text or "{}")
    except ValueError:
        raise RuntimeError("구글이 JSON 이 아닌 답을 보냈습니다")


def note(line: str) -> None:
    from datetime import datetime
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(WATCH_LOG, "a", encoding="utf-8") as log:
        log.write(f"{stamp} · {line}\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="시트의 GFA 적재 요청을 집어다 돌린다")
    parser.add_argument("--loud", action="store_true",
                        help="쪽지가 없을 때도 그렇다고 적는다")
    args = parser.parse_args()

    if not push_key():
        print("적재 열쇠가 없습니다 — MINIX_PUSH_KEY 나 minix_push_key.txt 를 두세요")
        return 1

    try:
        job = ask("naverJobPeek")
    except Exception as error:
        # 인터넷이 잠깐 끊긴 것까지 로그로 쌓으면 읽을 수가 없다. 조용히 넘긴다.
        if args.loud:
            print(f"물어보지 못했습니다 — {type(error).__name__}: {error}")
        return 0

    # 시트 쪽이 옛 판이면 '모르는 요청입니다' 가 온다. 이걸 '쪽지 없음' 과 섞으면
    # 아무리 눌러도 조용히 아무 일도 안 일어난다 — 그 날을 또 겪지 않게 따로 말한다.
    if not job.get("ok"):
        why = job.get("error") or "까닭을 안 알려 줍니다"
        print(f"시트가 거절했습니다 — {why}")
        if "모르는 요청" in str(why):
            print("  Apps Script 가 옛 판입니다. Code.gs 를 붙여 넣고 새 버전으로 다시 배포해 주세요.")
        note(f"시트 거절 — {why}")
        return 1

    if not job.get("wanted"):
        if args.loud:
            print("요청해 둔 것이 없습니다.")
        return 0

    who = job.get("by") or "누군가"
    print(f"적재 요청을 집었습니다 ({who} · {job.get('askedAt', '')}). 지금 돌립니다…")
    note(f"요청 집음 — {who}")

    # 평소 예약 작업과 같은 길로 돌린다. gfa_load.bat 이 로그 · 실패 안내를 다 맡는다.
    done = subprocess.run(["cmd", "/c", str(LOAD_BAT)], cwd=str(HERE))
    good = done.returncode == 0

    # 한 줄 요약은 적재 도구가 남긴 로그의 마지막 줄을 그대로 쓴다 —
    # 사람이 시트에서 볼 글이라, 여기서 따로 지어내면 로그와 말이 달라진다.
    tail = ""
    spot = HERE / "gfa-load.log"
    if spot.exists():
        lines = [one.strip() for one in
                 spot.read_text(encoding="utf-8", errors="replace").splitlines() if one.strip()]
        if lines:
            tail = lines[-1][:400]

    try:
        ask("naverJobDone", {"good": good, "note": tail})
    except Exception as error:
        note(f"결과를 못 적었습니다 — {error}")
        print("적재는 했는데 시트에 결과를 못 적었습니다.")
        return 0 if good else 1

    note(("끝남 · " if good else "실패 · ") + tail)
    print("끝났습니다. 시트의 [적재 상태 보기] 에 결과가 적혔습니다.")
    return 0 if good else 1


if __name__ == "__main__":
    raise SystemExit(main())
