"""카페24 애널리틱스 UTM 숫자(기여기간 30일) 가져오기.

카페24 API(/sales/orderdetails)는 같은 방문 안에서 산 주문만 광고에 붙인다. 그래서 애널리틱스
화면에서 '기여기간 30일' 로 뽑은 구매건수와 안 맞는다. 30일 숫자는 공개 API 에 없으므로
GFA 처럼 **애널리틱스 화면이 부르는 내부 API 를 로그인된 크롬 안에서 그대로 부른다.**
주소는 cafe24_probe.py 와 화면을 뒤져 알아냈다.

    GET https://ca-internal.cafe24data.com/ca2/adsources/customdetails
        start_date · end_date · format_type=day · conversion_timeframe=30d · limit · offset …
        광고 유입 상세 분석 → 표시 기준 '일 단위'. 엑셀 다운로드와 같은 칸이 온다.

인증은 쿠키가 아니라 Bearer 토큰(caToken)이다. 카페24 관리자 → 애널리틱스 메뉴를 열면
화면 안의 ca-web 이 토큰을 받아 localStorage 에 둔다(2시간짜리). 그래서 매번 관리자 메뉴를
한 번 열어 새 토큰을 받는다. 관리자 로그인이 풀렸으면 창이 로그인 화면에 멈춘다 —
사람이 한 번 로그인하면 이어서 돈다.

    py get_cafe24_utm.py                 최근 30일 (30일 기여라 지난 날짜 숫자도 바뀐다)
    py get_cafe24_utm.py --push          + 시트 '카페24UTM30일' 탭에 적재 (그 날짜는 지우고 새로 쓴다)
    py get_cafe24_utm.py --since 2026-09-01 --until 2026-09-30 --push

크롬은 gfa_login.bat 으로 띄워 둔 것(포트 9222)에 붙는다. GFA 와 같은 프로필이다.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import urlencode

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(errors="replace", line_buffering=True)

from get_gfa_report import (SHEET_ENDPOINT, attach_driver, day_list, default_profile,
                            launch_driver, note, push_key)

MALL = "minixstore"
ADMIN_PAGE = f"https://{MALL}.cafe24.com/disp/admin/shop1/menu/cafe24analytics?type=channel-analysis-utm"
API = "https://ca-internal.cafe24data.com/ca2/adsources/customdetails"

# 한 번에 받아 올 줄 수. 화면은 20 으로 부르지만 1000 도 받는다. 하루치가 800줄쯤이다.
PAGE_SIZE = 1000
MAX_PAGES = 200

# 한 번에 시트로 보낼 줄 수. 날짜별로 끊어 보낸다(그 날짜를 지우고 새로 쓰므로).
PUSH_CHUNK = 1000
PUSH_TRIES = 3

FETCH_SCRIPT = """
const done = arguments[arguments.length - 1];
let token = '';
try { token = JSON.parse(localStorage.getItem('auth')).state.caToken || ''; } catch (e) {}
if (!token) { done({ status: -1, body: 'no token' }); return; }
fetch(arguments[0], { headers: { Authorization: 'Bearer ' + token, accept: 'application/json' } })
  .then(r => r.text().then(t => done({ status: r.status, body: t })))
  .catch(e => done({ status: 0, body: String(e) }));
"""


def parse_args() -> argparse.Namespace:
    today = date.today()
    parser = argparse.ArgumentParser(description="카페24 애널리틱스 UTM(30일 기여) 숫자를 가져옵니다.")
    parser.add_argument("--since", default=str(today - timedelta(days=30)), help="시작일 (YYYY-MM-DD)")
    parser.add_argument("--until", default=str(today - timedelta(days=1)), help="종료일 (YYYY-MM-DD, 기본 어제)")
    parser.add_argument("--timeframe", default="30d", choices=("30d", "2h"), help="기여기간 (기본 30d)")
    parser.add_argument("--profile", default=default_profile(), help="로그인이 남아 있는 크롬 프로필")
    parser.add_argument("--out", default="cafe24-utm.json", help="결과 JSON 파일")
    parser.add_argument("--login-wait", type=int, default=180,
                        help="관리자 로그인이 풀렸을 때 사람이 로그인할 때까지 기다리는 시간(초)")
    parser.add_argument("--push", action="store_true", help="구글시트(카페24UTM30일 탭)에 적재한다")
    parser.add_argument("--endpoint", default=SHEET_ENDPOINT, help="Apps Script 웹앱 주소")
    parser.add_argument("--log", default="", help="한 줄 결과를 덧붙일 파일")
    parser.add_argument("--attach", type=int, default=9222,
                        help="띄워 둔 크롬(gfa_login.bat)에 붙을 포트. 0 이면 새로 띄운다")
    return parser.parse_args()


def open_token(driver, login_wait: int):
    """관리자 애널리틱스 메뉴를 새 탭에 열고, 그 안의 ca-web 화면으로 들어가 토큰을 받는다."""
    from selenium.webdriver.common.by import By

    driver.switch_to.new_window("tab")
    driver.get(ADMIN_PAGE)
    deadline = time.time() + login_wait
    told = False
    while time.time() < deadline:
        time.sleep(2)
        if "cafe24analytics" not in driver.current_url:
            if not told:
                print("카페24 관리자 로그인이 필요합니다 — 열린 크롬 창에서 로그인해 주세요.")
                told = True
            if "/disp/admin" in driver.current_url:      # 로그인 끝나고 대시보드로 갔으면 다시 메뉴로
                driver.get(ADMIN_PAGE)
            continue
        frames = [f for f in driver.find_elements(By.TAG_NAME, "iframe")
                  if "cafe24data" in (f.get_attribute("src") or "")]
        if not frames:
            continue
        driver.switch_to.frame(frames[0])
        for _ in range(15):
            ok = driver.execute_script(
                "try { return !!JSON.parse(localStorage.getItem('auth')).state.caToken } catch (e) { return false }")
            if ok:
                return
            time.sleep(1)
        driver.switch_to.default_content()
    raise RuntimeError("애널리틱스 토큰을 받지 못했습니다 (로그인 · 메뉴 화면을 확인해 주세요)")


def api(driver, params: dict) -> dict:
    url = API + "?" + urlencode(params)
    for turn in range(3):
        got = driver.execute_async_script(FETCH_SCRIPT, url)
        status = got.get("status")
        if status == 200:
            return json.loads(got.get("body") or "{}")
        if status in (401, -1):
            raise RuntimeError(f"인증 실패 ({status}) — 토큰이 만료됐을 수 있습니다")
        time.sleep(2 * (turn + 1))
    raise RuntimeError(f"애널리틱스 응답 오류 {status}: {str(got.get('body'))[:200]}")


def fetch_rows(driver, since: str, until: str, timeframe: str) -> list:
    rows = []
    total = None
    for page in range(MAX_PAGES):
        body = api(driver, {
            "start_date": since, "end_date": until, "limit": PAGE_SIZE, "offset": page * PAGE_SIZE,
            "device_type": "total", "sort": "order_amount", "order": "desc",
            "conversion_timeframe": timeframe, "format_type": "day", "include_referer": "F",
            "tier": "premium", "is_internal": "true",
        })
        chunk = body.get("customdetails") or []
        total = body.get("total", total)
        for one in chunk:
            rows.append({
                "date": str(one.get("date") or "")[:10],
                "channel": one.get("channel") or "",
                "channelName": one.get("channel_name") or "",
                "medium": one.get("medium") or "",
                "campaign": one.get("campaign") or "",
                "content": one.get("content") or "",
                "term": one.get("term") or "",
                "amount": float(one.get("order_amount") or 0),
                "deliveryFee": float(one.get("order_delivery_fee") or 0),
                "orders": int(one.get("order_count") or 0),
                "inflow": int(one.get("inflow_count") or 0),
                "purchaseRate": float(one.get("purchase_rate") or 0),
            })
        print(f"  {since} ~ {until} · {len(rows)}/{total} 줄")
        if len(chunk) < PAGE_SIZE or (total is not None and len(rows) >= total):
            break
    return rows


def push_once(endpoint: str, chunk: list, clear: list) -> dict:
    import urllib.request

    body = json.dumps({"action": "cafe24CaAppend", "rows": chunk, "clear": clear, "key": push_key()},
                      ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(endpoint, data=body,
                                     headers={"Content-Type": "text/plain;charset=utf-8"})
    with urllib.request.urlopen(request, timeout=300) as response:
        text = response.read().decode("utf-8", "replace")
    try:
        answer = json.loads(text or "{}")
    except ValueError:
        raise RuntimeError("구글이 응답을 흘렸습니다 (JSON 이 아닌 답)")
    if answer.get("message") == "minix filename endpoint":
        raise RuntimeError("구글이 응답을 흘렸습니다 (doGet 이 답했습니다)")
    return answer


def push_rows(endpoint: str, rows: list, days: list) -> None:
    """날짜마다 첫 조각에 clear 를 실어 그 날짜의 옛 줄을 지우고 새로 쓴다.
    중간에 끊겨도 다시 돌리면 같은 날짜를 또 지우고 쓰므로 겹치지 않는다."""
    if not push_key():
        print("  적재 열쇠가 없습니다 — 환경변수 MINIX_PUSH_KEY 나 minix_push_key.txt 를 두세요")
    by_day: dict = {day: [] for day in days}
    for row in rows:
        by_day.setdefault(row["date"], []).append(row)
    sent = 0
    for day in sorted(by_day):
        lines = by_day[day]
        pieces = [lines[at:at + PUSH_CHUNK] for at in range(0, len(lines), PUSH_CHUNK)] or [[]]
        for index, chunk in enumerate(pieces):
            clear = [day] if index == 0 else []
            trouble = None
            answer = None
            for turn in range(PUSH_TRIES):
                try:
                    answer = push_once(endpoint, chunk, clear)
                    if answer.get("ok"):
                        break
                    raise RuntimeError(f"적재 실패: {answer}")
                except RuntimeError as error:
                    if "적재 실패" in str(error):
                        raise
                    trouble = error
                except Exception as error:
                    trouble = error
                answer = None
                if turn + 1 < PUSH_TRIES:
                    print(f"    다시 보냅니다 ({turn + 2}/{PUSH_TRIES}) · {trouble}")
                    time.sleep(3 * (turn + 1))
            if not answer or not answer.get("ok"):
                raise RuntimeError(f"적재 실패: {trouble}")
            sent += len(chunk)
        print(f"  적재 {day} · {len(lines)}줄 (누적 {sent}/{len(rows)})")


def main() -> int:
    args = parse_args()
    days = day_list(args.since, args.until)

    driver = attach_driver(args.attach) if args.attach else None
    attached = driver is not None
    if not driver:
        print("띄워 둔 크롬이 없어 새로 띄웁니다 (로그인이 필요할 수 있습니다).")
        driver = launch_driver(Path(args.profile))

    tab = None
    try:
        open_token(driver, args.login_wait)
        tab = driver.current_window_handle
        print(f"애널리틱스 토큰 받음 · {args.since} ~ {args.until} · 기여기간 {args.timeframe}")

        # 7일씩 끊어 받는다 (한 번에 30일을 물으면 응답이 느리다)
        rows: list = []
        for at in range(0, len(days), 7):
            part = days[at:at + 7]
            rows.extend(fetch_rows(driver, part[0], part[-1], args.timeframe))

        Path(args.out).write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
        orders = sum(row["orders"] for row in rows)
        print(f"받음 {len(rows)}줄 · 구매건수 합 {orders} → {args.out}")

        if args.push:
            push_rows(args.endpoint, rows, days)
            print("시트 적재 끝")
        note(args.log, f"카페24 UTM 30일 {args.since}~{args.until} · {len(rows)}줄 · 구매 {orders}"
                       + (" · 적재" if args.push else ""))
        return 0
    except Exception as error:
        print(f"실패: {error}")
        note(args.log, f"카페24 UTM 30일 실패 · {error}")
        return 1
    finally:
        try:
            if tab:
                driver.switch_to.default_content()
                driver.close()                     # 연 탭만 닫는다. 크롬은 그대로 둔다
                if driver.window_handles:
                    driver.switch_to.window(driver.window_handles[0])
            if not attached:
                driver.quit()
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
