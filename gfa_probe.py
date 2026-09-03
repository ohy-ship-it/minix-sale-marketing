"""GFA(네이버 성과형 디스플레이광고) 내부 API 정찰 — 성과 조회 1단계.

GFA 에는 공개 API 가 없다. 그래서 관리 화면을 크롬으로 열고,
화면이 표를 그릴 때 부르는 **내부 JSON 요청을 그대로 엿본다.**
여기서 주소와 파라미터를 알아내면, 다음 단계부터는 로그인 세션만으로 그 주소를
직접 부를 수 있다. 표 DOM 을 긁는 방식은 네이버가 화면을 고칠 때마다 깨진다.

    py gfa_probe.py

처음 실행하면 빈 크롬이 열린다. 네이버에 로그인하고 GFA 성과·보고서 화면까지 들어간 뒤
**기간을 한 번 바꿔** 준다. 그때 오가는 요청이 잡힌다. 다 됐으면 이 창에서 엔터.
로그인은 전용 프로필에 남으므로 다음 실행부터는 로그인 화면이 뜨지 않는다.
(쓰던 크롬과 다른 프로필이라, 크롬을 켜 둔 채로 실행해도 된다)

잡은 내용은 gfa-probe-<시각>.json 으로 남는다. 광고 계정 숫자가 들어 있으니 공유하지 않는다.
세션 쿠키는 파일에 쓰지 않는다. 다음 단계도 이 프로필을 그대로 다시 열어 쓴다.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# 윈도우 콘솔에 못 찍는 글자가 하나 섞였다고 실행이 멈추면 안 된다.
# line_buffering: 백그라운드로 띄웠을 때도 진행 상황이 바로 보이게.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(errors="replace", line_buffering=True)

try:
    import msvcrt   # 윈도우: 엔터를 기다려 멈추지 않고 '눌렸는지'만 본다
except ImportError:
    msvcrt = None

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

START_URL = "https://ads.naver.com/"

# 네이버 안쪽 요청만 본다.
HOST_HINTS = ("naver.com", "navercorp.com")

# 성과가 실린 응답을 골라내는 낱말. 많이 들어 있을수록 위로 올린다.
METRIC_HINTS = (
    "impCnt", "impCount", "impression", "clkCnt", "clickCnt", "click",
    "cost", "salesAmt", "convCnt", "conversion", "ctr", "cpc", "cpm", "roas",
)

# 한 응답에서 파일에 남길 글자 수. 보고서 응답은 아주 길다.
BODY_LIMIT = 40000

# 성능 로그에서 걸러 낼 정적 파일
STATIC_TAILS = (".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
                ".woff", ".woff2", ".ico")

# 성과와 상관없는 요청. 오류 수집(sentry) · 접속 통계 같은 것들이 목록을 덮는다.
NOISE_HINTS = ("sentry", "/envelope/", "nelo", "wcslog", "lcs.naver.com",
               "siape.veta.naver.com", "/notices/")


def default_profile() -> str:
    base = os.environ.get("LOCALAPPDATA") or str(Path.home())
    return str(Path(base) / "gfa-chrome-profile")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="GFA 관리 화면이 부르는 내부 API 를 잡아냅니다.")
    parser.add_argument("--url", default=START_URL, help=f"열어 둘 첫 주소 (기본값: {START_URL})")
    parser.add_argument("--seconds", type=int, default=600,
                        help="엿볼 시간(초). 엔터를 누르면 그전에 끝냅니다.")
    parser.add_argument("--profile", default=default_profile(),
                        help="로그인을 남겨 둘 크롬 프로필 폴더 (쓰던 크롬과 별개)")
    parser.add_argument("--out", default="", help="결과 파일 이름 (기본값: gfa-probe-<시각>.json)")
    parser.add_argument("--stop-file", default="",
                        help="이 파일이 생기면 그만둔다 (콘솔에서 엔터를 누를 수 없을 때 쓰는 스위치)")
    return parser.parse_args()


def build_driver(profile: Path) -> webdriver.Chrome:
    options = Options()
    options.add_argument(f"--user-data-dir={profile}")
    options.add_argument("--start-maximized")
    # 네이버 로그인은 자동화 브라우저를 걸러낸다. 표시를 지워 두면 사람이 로그인하기 편하다.
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    # 오가는 요청을 성능 로그로 받는다. 이게 이 스크립트의 핵심이다.
    options.set_capability("goog:loggingPrefs", {"performance": "ALL", "browser": "ALL"})
    return webdriver.Chrome(options=options)


def wanted(url: str) -> bool:
    if not url.startswith("http"):
        return False
    if not any(hint in url for hint in HOST_HINTS):
        return False
    if any(hint in url for hint in NOISE_HINTS):
        return False
    return not url.split("?")[0].lower().endswith(STATIC_TAILS)


def cdp(driver: webdriver.Chrome, command: str, params: dict) -> dict:
    try:
        return driver.execute_cdp_cmd(command, params) or {}
    except Exception:
        return {}


def drain(driver: webdriver.Chrome, seen: dict, records: list) -> None:
    """성능 로그를 비우며 XHR/fetch 요청과 그 응답 본문을 모은다.

    본문은 응답이 끝난 뒤(loadingFinished)에야 받을 수 있다. 너무 늦게 물으면
    크롬이 버퍼에서 지워 버리므로, 끝나는 즉시 받아 둔다.
    """
    for entry in driver.get_log("performance"):
        try:
            message = json.loads(entry["message"])["message"]
        except (KeyError, ValueError):
            continue
        method = message.get("method", "")
        params = message.get("params", {})
        request_id = params.get("requestId", "")
        if not request_id:
            continue

        if method == "Network.requestWillBeSent":
            request = params.get("request", {})
            url = request.get("url", "")
            if not wanted(url):
                continue
            seen[request_id] = {
                "url": url,
                "method": request.get("method", ""),
                "type": params.get("type", ""),
                "postData": request.get("postData", "") or "",
                "hasPostData": bool(request.get("hasPostData")),
                "status": None,
                "mimeType": "",
                "body": "",
            }

        elif method == "Network.responseReceived":
            found = seen.get(request_id)
            if not found:
                continue
            response = params.get("response", {})
            found["status"] = response.get("status")
            found["mimeType"] = response.get("mimeType", "") or ""
            found["type"] = params.get("type") or found["type"]

        elif method == "Network.loadingFinished":
            found = seen.pop(request_id, None)
            if not found:
                continue
            if found["type"] not in ("XHR", "Fetch"):
                continue
            if "json" not in found["mimeType"].lower():
                continue
            body = cdp(driver, "Network.getResponseBody", {"requestId": request_id})
            if body.get("base64Encoded"):
                continue                            # 이진 응답은 볼 것이 없다
            found["body"] = (body.get("body") or "")[:BODY_LIMIT]
            if found["hasPostData"] and not found["postData"]:
                post = cdp(driver, "Network.getRequestPostData", {"requestId": request_id})
                found["postData"] = (post.get("postData") or "")[:BODY_LIMIT]
            records.append(found)


def save(out: Path, records: list) -> None:
    """잡은 것을 그때그때 파일에 쌓는다.

    끝에 한 번만 쓰면, 브라우저가 먼저 죽어 드라이버 연결이 끊길 때 통째로 날아간다.
    (셀레니움이 urllib3 예외를 그대로 올려 보내는 경우가 있어 except 로도 못 막는다)
    """
    try:
        out.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    except OSError as error:
        print(f"  (파일을 쓰지 못했습니다: {error})")


def score(record: dict) -> int:
    body = (record.get("body") or "").lower()
    return sum(1 for hint in METRIC_HINTS if hint.lower() in body)


def enter_pressed() -> bool:
    """엔터가 눌렸는지만 본다. 콘솔 없이 띄운 경우(백그라운드 실행)에는 시간으로만 끝낸다."""
    if not msvcrt:
        return False
    try:
        hit = False
        while msvcrt.kbhit():
            if msvcrt.getwch() in ("\r", "\n"):
                hit = True
        return hit
    except OSError:
        return False


def report(records: list) -> None:
    ranked = sorted(records, key=score, reverse=True)
    print(f"\n잡은 JSON 요청 {len(records)}개. 성과가 실렸을 것 같은 순서로 봅니다.\n")
    for record in ranked[:15]:
        print(f"  [{score(record):2}점] {record['method']:4} {record['status']} {record['url'][:150]}")
        if record["postData"]:
            print(f"         보낸 값: {record['postData'][:200]}")
        preview = " ".join((record["body"] or "").split())[:220]
        print(f"         받은 값: {preview}\n")
    if not records:
        print("  (하나도 못 잡았습니다. 로그인만 하고 성과 화면까지 못 들어갔을 수 있습니다)")


def main() -> int:
    args = parse_args()
    profile = Path(args.profile).expanduser()
    profile.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now().strftime("%y%m%d-%H%M")
    out = Path(args.out or f"gfa-probe-{stamp}.json")
    stop_file = Path(args.stop_file) if args.stop_file else None
    if stop_file and stop_file.exists():
        stop_file.unlink()

    driver = build_driver(profile)
    driver.get(args.url)

    print("\n크롬이 열렸습니다.")
    print("  1. 네이버에 로그인하세요 — '로그인 상태 유지' 를 꼭 체크하세요")
    print("     (체크하지 않으면 창을 닫을 때 쿠키가 지워져 다음 실행에서 또 로그인해야 합니다)")
    print("  2. GFA 성과 · 보고서 화면까지 들어가세요")
    print("  3. 기간을 한 번 바꿔 주세요 — 그때 오가는 요청이 잡힙니다")
    print(f"\n다 됐으면 이 창에 엔터. 아무것도 안 하면 {args.seconds}초 뒤 알아서 끝납니다.")
    print(f"잡는 즉시 {out} 에 쌓으므로, 중간에 끊겨도 그때까지 잡은 것은 남습니다.\n")

    seen: dict = {}
    records: list = []
    deadline = time.time() + args.seconds
    told = 0.0

    while time.time() < deadline:
        before = len(records)
        try:
            drain(driver, seen, records)
        except Exception as error:
            # 브라우저를 닫으면 드라이버 연결이 끊긴다. 셀레니움 예외가 아닐 때도 있어 전부 받는다.
            if len(records) > before:
                save(out, records)
            print(f"브라우저 연결이 끊겼습니다 ({type(error).__name__}). 잡은 것까지 정리합니다.")
            break
        if len(records) > before:
            save(out, records)
        if enter_pressed():
            break
        if stop_file and stop_file.exists():
            print("그만두라는 신호를 받았습니다.")
            break
        if time.time() - told > 20:
            told = time.time()
            print(f"  … 잡은 JSON {len(records)}개 · 남은 시간 {int(deadline - time.time())}초")
        time.sleep(1.0)

    try:
        drain(driver, seen, records)
    except Exception:
        pass

    save(out, records)
    report(records)
    print(f"자세한 내용: {out}  (광고 계정 숫자가 들어 있으니 공유하지 마세요)")

    try:
        driver.quit()
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
