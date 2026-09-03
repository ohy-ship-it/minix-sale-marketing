"""GFA(네이버 성과형 디스플레이광고) 성과 가져오기.

GFA 에는 공개 API 가 없다. 대신 관리 화면(ads.naver.com)이 쓰는 내부 API 를 그대로 부른다.
주소는 gfa_probe.py 로 알아냈다.

    GET /apis/ad-account/v1.1/adAccounts/access          광고계정 목록 (GFA · SA 가 섞여 온다)
    GET /apis/report/gfa/v1/adAccounts/{no}/stats/reportPerformance
        startDate · endDate · reportAdUnit(CAMPAIGN|AD_SET|CREATIVE) · pageNumber · pageSize

인증은 브라우저 쿠키다. 쿠키를 빼내 requests 로 재현하면 만료·재로그인마다 깨지므로,
**로그인된 크롬 안에서 fetch() 로 부른다.** 헤더도 쿠키도 브라우저가 알아서 붙인다.

    py get_gfa_report.py                      오늘까지 7일, 캠페인 · 광고그룹
    py get_gfa_report.py --since 2026-08-01 --until 2026-08-31
    py get_gfa_report.py --level CAMPAIGN AD_SET CREATIVE

로그인이 풀렸으면 창이 로그인 화면에 멈춘다. 그때는 사람이 한 번 로그인하면
('로그인 상태 유지' 체크) 다음부터는 다시 안 묻는다. gfa_probe.py 와 같은 프로필을 쓴다.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(errors="replace", line_buffering=True)

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ORIGIN = "https://ads.naver.com"

# 적재할 곳. app.js 의 SHEET_ENDPOINT 와 같은 Apps Script 웹앱이다.
SHEET_ENDPOINT = ("https://script.google.com/macros/s/"
                  "AKfycbwWEYRTgiY7g5Hoz1U5Y9HGauaSjuZal5AQmO4vU8lN-SrU2xwc17wszUpPypHBixbV/exec")

# 한 번에 보낼 줄 수. Apps Script 는 큰 본문을 받다가 시간이 넘칠 수 있다.
PUSH_CHUNK = 400

# 화면이 부르는 그대로. 버전 번호까지 맞춰 둔다 (v1.1 · v1 이 섞여 있다)
ACCOUNTS_PATH = "/apis/ad-account/v1.1/adAccounts/access"
REPORT_PATH = "/apis/report/gfa/v1/adAccounts/{account}/stats/reportPerformance"

# 실제로 광고를 돌리는 계정. 다른 GFA 계정(미닉스 자사몰)은 광고비가 0인데
# 하루 · 단위마다 조회가 붙어 시간만 쓴다. 필요하면 --account all 로 전부 본다.
DEFAULT_ACCOUNT = "60641"

# 보고서에는 켜짐 · 꺼짐이 안 담겨 온다. 목록에서 따로 받아 온다.
# 화면(매체별 성과)은 지금 켜져 있는 캠페인만 표에 올리므로 이 값이 없으면 표가 빈다.
CAMPAIGN_LIST_PATH = "/apis/gfa/v1.1/adAccounts/{account}/campaigns"
ADSET_LIST_PATH = "/apis/gfa/v1.2/adAccounts/{account}/adSets"

# 소재 미리보기 이미지. 보고서에는 이미지가 없어서 소재 목록에서 따로 받는다.
# 광고그룹 단위로만 물어볼 수 있고, 검수상태를 안 넣으면 500 이 난다.
# 응답의 realCreativeNo 가 보고서의 소재 번호(creativeNo)와 같은 값이다. (no 는 초안 번호)
CREATIVE_LIST_PATH = "/apis/gfa/v1/adAccounts/{account}/creatives/draft/searchCreativesByAdSetNo"
CREATIVE_INSPECTION = ["PENDING", "REJECT", "ACCEPT",
                       "PENDING_IN_OPERATION", "REJECT_IN_OPERATION", "DELETED"]

# 이미지 주소는 응답 여러 곳에 흩어져 있다 (소재 유형마다 다르다). 네이버 이미지 서버 주소를 찾는다.
IMAGE_HOST = re.compile(r"https://[a-z0-9\-]*phinf[^\"\\ ]+")

# 이미지를 물어볼 광고그룹 수. 광고그룹마다 한 번씩 부르므로 끝을 둔다.
# 미리보기 · 문구를 물어볼 광고그룹 수. 광고그룹마다 한 번 부른다(0.3초쯤).
# 60 이었는데 한 달치를 받으면 광고그룹이 67개라 뒤 7개의 소재 25개가 비었다.
CREATIVE_IMAGE_GROUPS = 200

# 한 번에 받아 올 줄 수. 화면은 10 으로 부르지만 더 크게 줘도 받는다.
PAGE_SIZE = 100

# 너무 많은 쪽을 도는 것을 막는다 (한 쪽 100줄 × 50 = 5000줄)
MAX_PAGES = 50

LEVELS = ("CAMPAIGN", "AD_SET", "ASSET_GROUP", "CREATIVE")

# 화면(매체별 성과)이 쓰는 이름으로 옮긴다. 메타 · 구글 · 카카오와 같은 모양이어야
# app.js 가 같은 코드로 표를 그린다.
#   spend      광고비    ← sales      (GFA 의 spend 는 sales × 100,000 인 정수라 쓰지 않는다)
#   results    결과      ← convCount  (GFA 가 세어 준 전환 합. 우리 쪽에서 다시 더하지 않는다)
#   revenue    전환매출  ← convSales
LEVEL_KEYS = {
    "CAMPAIGN": ("campaignNo", "campaignName"),
    "AD_SET": ("adSetNo", "adSetName"),
    # 애드부스트(advoost) 캠페인은 광고그룹이 없고 애셋그룹을 쓴다. 이 단위를 빼면
    # 캠페인 광고비와 광고그룹 광고비 합이 어긋난다.
    "ASSET_GROUP": ("assetGroupNo", "assetGroupName"),
    "CREATIVE": ("creativeNo", "creativeName"),
}

FETCH_SCRIPT = """
const done = arguments[arguments.length - 1];
fetch(arguments[0], { credentials: 'include', headers: { accept: 'application/json' } })
  .then(function (response) {
    return response.text().then(function (text) {
      done({ status: response.status, body: text });
    });
  })
  .catch(function (error) { done({ status: 0, body: String(error) }); });
"""


def default_profile() -> str:
    base = os.environ.get("LOCALAPPDATA") or str(Path.home())
    return str(Path(base) / "gfa-chrome-profile")


def parse_args() -> argparse.Namespace:
    # 오늘까지 담는다. 당일 값은 아직 움직이지만, 다른 매체는 화면에서 오늘이 바로 보이므로
    # 네이버만 빈칸이면 '광고를 안 돌렸나' 로 헷갈린다. 최근 7일을 매번 다시 받아 덮으므로
    # 어제 값은 다음 실행에서 확정값으로 바뀐다.
    today = date.today()
    parser = argparse.ArgumentParser(description="GFA 성과를 내부 API 로 가져옵니다.")
    parser.add_argument("--since", default=str(today - timedelta(days=6)), help="시작일 (YYYY-MM-DD)")
    parser.add_argument("--until", default=str(today), help="종료일 (YYYY-MM-DD)")
    parser.add_argument("--level", nargs="+", default=["CAMPAIGN", "AD_SET"], choices=LEVELS,
                        help="가져올 단위 (기본값: CAMPAIGN AD_SET)")
    parser.add_argument("--account", default=DEFAULT_ACCOUNT,
                        help=f"광고계정 번호 (기본값: 미닉스 {DEFAULT_ACCOUNT}). all 이면 볼 수 있는 GFA 계정 전부")
    parser.add_argument("--profile", default=default_profile(), help="로그인이 남아 있는 크롬 프로필")
    parser.add_argument("--out", default="gfa-report.json", help="결과 JSON 파일")
    parser.add_argument("--login-wait", type=int, default=180,
                        help="로그인이 풀렸을 때 사람이 로그인할 때까지 기다리는 시간(초)")
    parser.add_argument("--push", action="store_true",
                        help="구글시트(네이버성과 탭)에 적재한다. 화면이 읽는 곳이다.")
    parser.add_argument("--endpoint", default=SHEET_ENDPOINT, help="Apps Script 웹앱 주소")
    parser.add_argument("--log", default="", help="한 줄 결과를 덧붙일 파일 (자동 실행에서 성공·실패를 남긴다)")
    parser.add_argument("--attach", type=int, default=9222,
                        help="띄워 둔 크롬(gfa_login.bat)에 붙을 포트. 0 이면 붙지 않고 새로 띄운다")
    return parser.parse_args()


def note(path: str, text: str) -> None:
    """자동 실행은 아무도 안 보고 있다. 성공이든 실패든 한 줄로 남긴다."""
    if not path:
        return
    stamp = time.strftime("%Y-%m-%d %H:%M:%S")
    try:
        with open(path, "a", encoding="utf-8") as file:
            file.write(f"{stamp} · {text}\n")
    except OSError:
        pass


def day_list(since: str, until: str) -> list:
    """기간을 하루씩 벌린다. 하루 단위로 쌓아야 화면이 아무 기간이나 골라도 답할 수 있다."""
    start = date.fromisoformat(since)
    end = date.fromisoformat(until)
    if end < start:
        raise ValueError("종료일이 시작일보다 앞섭니다.")
    out = []
    while start <= end:
        out.append(str(start))
        start += timedelta(days=1)
    return out


# Apps Script 의 /exec 는 이따금 요청을 흘린다 — 40초쯤 끌다가 JSON 대신 구글의
# 404 안내 페이지를 준다 (다섯 번에 한 번쯤). 한 묶음이 그렇게 되면 적재가 통째로 날아간다.
# **다시 보내도 안전하다.** naverAppend 는 날짜|계정|단위|ID 로 덮어쓰기라 두 번 들어가도
# 줄이 겹치지 않는다. (파일명 · T&D 적재는 덧붙이기라 이렇게 하면 안 된다)
PUSH_TRIES = 3


def push_once(endpoint: str, chunk: list) -> dict:
    import urllib.request

    body = json.dumps({"action": "naverAppend", "rows": chunk}, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(endpoint, data=body,
                                     headers={"Content-Type": "text/plain;charset=utf-8"})
    with urllib.request.urlopen(request, timeout=180) as response:
        text = response.read().decode("utf-8", "replace")
    try:
        answer = json.loads(text or "{}")
    except ValueError:
        raise RuntimeError("구글이 응답을 흘렸습니다 (JSON 이 아닌 답)")
    # POST 가 GET 으로 바뀌어 doGet 의 인사말이 오는 경우도 흘린 것으로 본다
    if answer.get("message") == "minix filename endpoint":
        raise RuntimeError("구글이 응답을 흘렸습니다 (doGet 이 답했습니다)")
    return answer


def push_rows(endpoint: str, rows: list) -> None:
    """시트에 적재한다. 같은 날짜 · 같은 줄이 다시 가면 Apps Script 가 덮어쓴다."""
    for at in range(0, len(rows), PUSH_CHUNK):
        chunk = rows[at:at + PUSH_CHUNK]
        answer = None
        trouble = None
        for turn in range(PUSH_TRIES):
            try:
                answer = push_once(endpoint, chunk)
                if answer.get("ok"):
                    break
                # 서버가 제대로 답한 오류(적재할 줄이 없다 등)는 다시 보내도 같다
                raise RuntimeError(f"적재 실패: {answer}")
            except RuntimeError as error:
                if "적재 실패" in str(error):
                    raise
                trouble = error
                answer = None
            except Exception as error:            # 404 · 시간 초과 · 끊김
                trouble = error
                answer = None
            if turn + 1 < PUSH_TRIES:
                print(f"    다시 보냅니다 ({turn + 2}/{PUSH_TRIES}) · {trouble}")
                time.sleep(3 * (turn + 1))
        if not answer or not answer.get("ok"):
            raise RuntimeError(f"적재 실패: {trouble}")
        print(f"  적재 {at + len(chunk):5}/{len(rows)} · 새 줄 {answer.get('added')} · 고친 줄 {answer.get('updated')}")


def attach_driver(port: int):
    """이미 띄워 둔 크롬에 붙는다. 못 붙으면 None.

    이게 있어야 로그인을 한 번만 한다. 네이버 로그인 쿠키는 '로그인 상태 유지' 를
    켜지 않으면 세션 쿠키라, **브라우저를 닫는 순간** 사라진다. 스크립트가 매번
    크롬을 띄우고 닫으면 그때마다 로그인을 다시 해야 한다.
    그래서 gfa_login.bat 으로 띄워 둔 크롬에 붙고, 끝나도 닫지 않는다.
    """
    options = Options()
    options.debugger_address = f"127.0.0.1:{port}"
    try:
        driver = webdriver.Chrome(options=options)
        driver.set_script_timeout(90)
        return driver
    except Exception:
        return None


def launch_driver(profile: Path) -> webdriver.Chrome:
    options = Options()
    options.add_argument(f"--user-data-dir={profile}")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    driver = webdriver.Chrome(options=options)
    driver.set_script_timeout(90)
    return driver


def build_driver(profile: Path, port: int):
    """(드라이버, 붙었는가) 를 돌려준다. 붙은 크롬은 끝나도 닫지 않는다."""
    if port:
        driver = attach_driver(port)
        if driver:
            print(f"띄워 둔 크롬에 붙었습니다 (포트 {port}). 로그인은 그 창에 남아 있습니다.")
            return driver, True
        print(f"포트 {port} 에 띄워 둔 크롬이 없습니다. 새로 띄웁니다.")
        print("  (gfa_login.bat 으로 한 번 띄워 두면 로그인을 다시 하지 않아도 됩니다)")
    return launch_driver(profile), False


def api(driver: webdriver.Chrome, path: str, params: dict | None = None):
    """로그인된 페이지 안에서 fetch 로 부른다. 같은 출처라 쿠키가 그대로 실린다.

    반드시 ads.naver.com 위에서 불러야 한다. 로그인 화면(nid.naver.com)에 머무는 동안
    상대 주소로 부르면 그 쪽 서버에 묻게 되어 404 HTML 이 돌아온다.
    """
    if not driver.current_url.startswith(ORIGIN):
        driver.get(ORIGIN + "/")
    url = ORIGIN + path
    if params:
        pairs = []
        for key, value in params.items():
            # 같은 이름을 여러 번 보내는 파라미터(campaignNoList 같은 것)도 받는다
            for one in (value if isinstance(value, (list, tuple)) else [value]):
                pairs.append(f"{key}={one}")
        url += "?" + "&".join(pairs)
    result = driver.execute_async_script(FETCH_SCRIPT, url)
    status = result.get("status")
    body = result.get("body") or ""
    if status != 200:
        raise RuntimeError(f"{path} → HTTP {status} {body[:300]}")
    try:
        return json.loads(body)
    except ValueError:
        raise RuntimeError(f"{path} → JSON 이 아닙니다: {body[:200]}")


def logged_in_cookie(driver: webdriver.Chrome) -> bool:
    """네이버 로그인 쿠키가 있는가. 로그인 화면에 있어도 .naver.com 쿠키는 보인다."""
    try:
        names = {cookie.get("name") for cookie in driver.get_cookies()}
    except Exception:
        return False
    return "NID_AUT" in names and "NID_SES" in names


def wait_for_login(driver: webdriver.Chrome, seconds: int) -> None:
    """로그인됐는지 확인하고, 안 됐으면 사람이 로그인할 때까지 기다린다.

    사람이 로그인하는 동안 창은 nid.naver.com 에 있다. 그동안은 API 를 부르지 않고
    로그인 쿠키가 생기는지만 본다. 생기면 ads.naver.com 으로 돌아가 확인한다.
    """
    deadline = time.time() + seconds
    told = False
    while True:
        if logged_in_cookie(driver):
            try:
                api(driver, "/apis/user/v1/users/me")
                return
            except RuntimeError as error:
                if told and time.time() > deadline:
                    raise
                print(f"  (아직입니다: {str(error)[:120]})")
        if not told:
            told = True
            print("로그인이 풀렸습니다. 열린 창에서 네이버에 로그인해 주세요.")
            print("  ★ '로그인 상태 유지' 를 체크하세요. 안 하면 창을 닫을 때 지워져 다음 실행에서 또 묻습니다.")
        if time.time() > deadline:
            raise RuntimeError("로그인을 기다렸지만 되지 않았습니다.")
        time.sleep(3)


def gfa_accounts(driver: webdriver.Chrome, only: str) -> list:
    """볼 수 있는 광고계정 중 GFA 것만 고른다. (검색광고 SA 계정이 섞여 온다)"""
    out = []
    page = 0
    while page < 20:
        body = api(driver, ACCOUNTS_PATH, {"page": page, "size": 100})
        for row in body.get("content") or []:
            account = row.get("adAccount") or {}
            if account.get("adPlatformType") != "GFA":
                continue
            if account.get("deleted"):
                continue
            number = str(account.get("no"))
            wanted = str(only or "").strip()
            if wanted and wanted != "all" and number != wanted:
                continue
            out.append({
                "id": number,
                "accountId": number,
                "name": account.get("name") or number,
                "currency": account.get("currency") or "KRW",
                "timezone": account.get("timezoneId") or "Asia/Seoul",
                "disabled": bool(account.get("disabled")),
            })
        if body.get("last", True):
            break
        page += 1
    return out


def report_rows(driver: webdriver.Chrome, account: str, level: str, since: str, until: str) -> list:
    """한 단위(캠페인 · 광고그룹 · 소재)의 성과를 쪽마다 이어 받는다."""
    path = REPORT_PATH.format(account=account)
    rows = []
    page = 1
    while page <= MAX_PAGES:
        body = api(driver, path, {
            "startDate": since,
            "endDate": until,
            "reportAdUnit": level,
            "reportFilterListString": "[]",
            "pageNumber": page,
            "pageSize": PAGE_SIZE,
        })
        found = body.get("reportPerformanceDetailResponseList") or []
        rows.extend(found)
        total = int(body.get("totalPage") or 1)
        if page >= total or not found:
            break
        page += 1
    return rows


def rows_of(body) -> list:
    """목록 응답은 content 로 감싸 오기도 하고 그냥 배열로 오기도 한다."""
    if isinstance(body, list):
        return body
    if isinstance(body, dict):
        for key in ("content", "data", "list"):
            if isinstance(body.get(key), list):
                return body[key]
    return []


def list_all(driver: webdriver.Chrome, path: str, params: dict | None = None) -> list:
    """쪽을 넘기며 목록을 다 받는다.

    unpaged=true 는 쓰지 않는다 — 이 API 는 그 값을 무시하고 기본 한 쪽(10건)만 준다.
    294건 중 10건만 와서 상태가 통째로 비는 일이 있었다.
    """
    out = []
    for page in range(MAX_PAGES):
        body = api(driver, path, dict(params or {}, page=page, size=200))
        rows = rows_of(body)
        out += rows
        if not rows or not isinstance(body, dict) or body.get("last", True):
            break
    return out


KST = timezone(timedelta(hours=9))


def kst_day(text) -> str:
    """GFA 는 시각을 UTC 로 준다. 한국 날짜(YYYY-MM-DD)로 바꾼다.

    광고그룹의 집행 기간이 '2026-08-31T15:00:00+00:00 ~ 2026-09-04T14:59:00+00:00' 으로 오는데,
    그대로 자르면 8/31 ~ 9/4 가 아니라 하루씩 밀린다. 한국 시각으로 옮긴 뒤 날짜만 남긴다.
    """
    raw = str(text or "").strip()
    if not raw:
        return ""
    try:
        when = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return raw[:10]
    if when.tzinfo is None:
        return raw[:10]
    return when.astimezone(KST).strftime("%Y-%m-%d")


def live_status(driver: webdriver.Chrome, account: str) -> dict:
    """캠페인 · 광고그룹의 지금 상태와 예산을 받아 온다.

    'ON' 은 켜져 있고(activated) 지워지지 않은 것만이다. 화면은 이 값으로 게재 표를 채운다.
    광고그룹도 계정 단위로 받는다 (campaignNo 없이 부르면 다 온다).
    """
    out = {}
    for level, path in (("CAMPAIGN", CAMPAIGN_LIST_PATH), ("AD_SET", ADSET_LIST_PATH)):
        for row in list_all(driver, path.format(account=account)):
            number = row.get("no")
            if number is None:
                continue
            on = bool(row.get("activated")) and not row.get("deleted")
            out[level + "|" + str(number)] = {
                "status": "ON" if on else "OFF",
                "budget": float(row.get("budgetAmount") or 0),
                "detail": row.get("status") or "",
                # 광고그룹에 설정해 둔 집행 기간. 캠페인 목록에는 없는 칸이라 비어 온다.
                "begin": kst_day(row.get("startTime")),
                "end": kst_day(row.get("endTime")),
            }
    return out


def creative_images(driver: webdriver.Chrome, account: str, adsets: list) -> dict:
    """소재 번호 → 미리보기 이미지 주소.

    이미지 주소는 로그인 없이 열리는 네이버 이미지 서버 주소라, 화면에서 그대로 <img> 로 쓴다.
    """
    out = {}
    for adset in adsets[:CREATIVE_IMAGE_GROUPS]:
        try:
            body = api(driver, CREATIVE_LIST_PATH.format(account=account), {
                "adSetNo": adset, "page": 0, "size": 100,
                "inspectionStatus": CREATIVE_INSPECTION,
            })
        except RuntimeError:
            continue          # 지워졌거나 볼 수 없는 광고그룹
        for row in rows_of(body):
            number = row.get("realCreativeNo") or row.get("no")
            if not number:
                continue
            found = creative_image(row)
            copy, alt = creative_copy(row)
            if found or copy or alt:
                out[str(number)] = {"thumbnail": found, "copy": copy, "altCopy": alt}
    return out


def creative_copy(row: dict) -> tuple:
    """소재의 광고 문구. (긴 문구, 짧은 문구)

    message 가 쇼핑소식 · 피드에 나가는 긴 문구고,
    medias[].content.altMessage 는 스마트채널처럼 짧게 들어가는 문구다.
    (T&D 시트가 '피드65 · 쇼핑57' 로 길이를 나눠 관리하는 그 두 가지다)
    """
    copy = str(row.get("message") or "").strip()
    alt = ""
    for media in row.get("medias") or []:
        content = media.get("content") or {}
        alt = str(content.get("altMessage") or "").strip()
        if alt:
            break
    return copy, alt


def creative_image(row: dict) -> str:
    """소재 한 줄에서 미리보기 이미지 주소를 고른다.

    소재 이미지는 medias[].image.imageUrl 에 있다.
    응답에는 **브랜드 프로필(로고) 이미지**도 함께 오는데(profile.image),
    아무 이미지나 먼저 집으면 소재가 아니라 로고가 뜬다.
    실제로 소재 24개 중 8개가 같은 로고 주소로 채워졌다.
    """
    for media in row.get("medias") or []:
        url = ((media.get("image") or {}).get("imageUrl")) or ""
        if url:
            return url

    # 위 구조가 아닌 소재 유형도 있다. 마지막 수단으로 훑되 로고는 빼고 본다.
    rest = {}
    for key, value in row.items():
        if key != "profile":
            rest[key] = value
    found = IMAGE_HOST.findall(json.dumps(rest, ensure_ascii=False))
    return found[0] if found else ""


def normalize(row: dict, level: str) -> dict:
    """매체별 성과 화면이 쓰는 모양으로 옮긴다 (메타 · 구글 · 카카오와 같은 칸)."""
    id_field, name_field = LEVEL_KEYS[level]
    number = row.get(id_field)
    return {
        "id": str(number) if number is not None else "",
        "name": row.get(name_field) or (str(number) if number is not None else ""),
        "campaignId": str(row.get("campaignNo") or ""),
        "campaignName": row.get("campaignName") or "",
        "adsetId": str(row.get("adSetNo") or ""),
        "adsetName": row.get("adSetName") or "",
        "objective": row.get("campaignObjective") or "",
        "spend": float(row.get("sales") or 0),          # GFA 의 sales 가 광고비다
        "impressions": int(row.get("impCount") or 0),
        "clicks": int(row.get("clickCount") or 0),
        "linkClicks": int(row.get("clickCount") or 0),  # GFA 는 클릭이 한 가지다
        "purchase": int(row.get("purchaseConvCount") or 0),
        "addToCart": int(row.get("cartConvCount") or 0),
        "lead": int(row.get("subscribeConvCount") or 0),
        "results": int(row.get("convCount") or 0),      # GFA 가 센 전환 합
        # 구매 매출만 쓴다. convSales 는 장바구니 · 위시리스트까지 합친 값이라
        # 메타 · 구글 · 카카오(구매만 센다)와 나란히 두면 ROAS 가 몇 배로 부푼다.
        # GFA 가 주는 purchaseRoas 도 이 값으로 센다 (purchaseConvSales ÷ 광고비).
        "revenue": float(row.get("purchaseConvSales") or 0),
        "roas": float(row.get("roas") or 0),
        "status": "",           # 목록에서 받은 켜짐 · 꺼짐을 나중에 채운다
        "thumbnail": "",        # 소재 목록에서 받은 미리보기 이미지 (소재 단위에만 있다)
        "copy": "",             # 광고 문구 (긴 것 · 쇼핑소식 · 피드)
        "altCopy": "",          # 짧은 문구 (스마트채널 등)
        "budget": float(row.get("campaignBudgetAmount") or 0),
        "budgetKind": "daily" if row.get("campaignBudgetAmount") else "",
        # 집행 기간은 보고서에 없다. 광고그룹 목록에서 받아 아래 적재 고리에서 채운다.
        "begin": "",
        "end": "",
        # 상세 보기용 칸. 구분을 걸지 않으면 전부 비어 온다.
        "gender": row.get("gender") or "",
        "ageGroup": row.get("ageGroup") or "",
        "placement": row.get("placementGroupCode") or "",
        "device": row.get("deviceType") or "",
    }


def main() -> int:
    args = parse_args()
    for value in (args.since, args.until):
        if len(value) != 10 or value[4] != "-" or value[7] != "-":
            print(f"날짜가 올바르지 않습니다: {value} (YYYY-MM-DD)")
            return 1
    try:
        return fetch(args)
    except Exception as error:
        # 자동 실행이면 아무도 화면을 안 본다. 무엇이 잘못됐는지 한 줄로 남긴다.
        reason = str(error) or type(error).__name__
        if "로그인" in reason:
            reason = "로그인이 만료됐습니다 — 그 PC 에서 한 번 로그인해 주세요 ('로그인 상태 유지' 체크)"
        note(args.log, f"실패 · {args.since}~{args.until} · {reason[:300]}")
        print(f"\n실패: {reason}")
        return 1


def fetch(args) -> int:
    driver, attached = build_driver(Path(args.profile).expanduser(), args.attach)
    try:
        driver.get(ORIGIN + "/")
        wait_for_login(driver, args.login_wait)

        accounts = gfa_accounts(driver, args.account)
        if not accounts:
            print("GFA 광고계정을 찾지 못했습니다. (검색광고 계정만 있는 아이디일 수 있습니다)")
            return 1
        print(f"GFA 광고계정 {len(accounts)}개: "
              + " · ".join(f"{one['name']}({one['id']})" for one in accounts))

        days = day_list(args.since, args.until)
        print(f"{args.since} ~ {args.until} · {len(days)}일 · 단위 {' '.join(args.level)}")

        rows = []
        for account in accounts:
            # 지금 켜져 있는지를 먼저 받아 둔다 (하루치마다 다시 묻지 않게 계정마다 한 번)
            try:
                status = live_status(driver, account["id"])
                print(f"  {account['name']} · 상태 {len(status)}건 "
                      + f"(켜짐 {sum(1 for v in status.values() if v['status'] == 'ON')}건)")
            except RuntimeError as error:
                status = {}
                print(f"  {account['name']} · 상태를 받지 못했습니다 ({str(error)[:80]})")

            # 키가 어긋나면 상태가 통째로 비어 들어간다. 그때 이유를 바로 알 수 있게 견본을 찍는다.
            if status:
                sample = [key for key in status if key.startswith("CAMPAIGN|")][:3]
                print(f"    상태 키 견본: {sample}")

            for day in days:
                counted = 0
                for level in args.level:
                    for raw in report_rows(driver, account["id"], level, day, day):
                        row = normalize(raw, level)
                        if not row["id"]:
                            continue
                        row["date"] = day
                        row["accountId"] = account["id"]
                        row["accountName"] = account["name"]
                        row["level"] = level
                        found = status.get(level + "|" + row["id"])
                        if found:
                            row["status"] = found["status"]
                            # 목록에 예산이 없는 캠페인도 있다 (애드부스트는 budgetAmount 가 null).
                            # 그때는 보고서에서 온 값을 그대로 둔다 — 0 으로 덮지 않는다.
                            if found["budget"]:
                                row["budget"] = found["budget"]
                            row["begin"] = found["begin"]
                            row["end"] = found["end"]
                        elif row["campaignId"]:
                            # 애셋그룹(애드부스트) · 소재는 상태 목록이 따로 없다.
                            # 캠페인이 켜져 있으면 그 아래도 켜진 것으로 본다. 예산은 물려받지 않는다.
                            parent = status.get("CAMPAIGN|" + row["campaignId"])
                            if parent:
                                row["status"] = parent["status"]
                        rows.append(row)
                        counted += 1
                spend = sum(one["spend"] for one in rows if one["date"] == day
                            and one["accountId"] == account["id"] and one["level"] == "CAMPAIGN")
                print(f"  {account['name']} · {day} · {counted:4}줄 · 광고비 {spend:,.0f}원")

            # 소재 미리보기 이미지 — 보고서에 없어서 소재 목록에서 따로 받는다.
            # 광고그룹 단위로만 물어볼 수 있으니, 이번에 받은 소재의 광고그룹만 훑는다.
            if "CREATIVE" in args.level:
                mine = [one for one in rows
                        if one["accountId"] == account["id"] and one["level"] == "CREATIVE"]
                # 광고비가 큰 광고그룹부터 물어본다. 위 한도에 걸려 잘리더라도
                # 사람이 실제로 보는 위쪽 소재는 미리보기가 남는다.
                weight = {}
                for one in mine:
                    if one["adsetId"]:
                        weight[one["adsetId"]] = weight.get(one["adsetId"], 0) + one["spend"]
                groups = sorted(weight, key=lambda gid: -weight[gid])
                extra = creative_images(driver, account["id"], groups)
                for one in mine:
                    found = extra.get(one["id"])
                    # 못 받은 소재는 빈 값으로 두고 보내지 않는다.
                    # 시트에 이미 채워 둔 미리보기를 빈 값으로 덮으면 안 된다 (Code.gs 가 지켜 준다).
                    if not found:
                        continue
                    one["thumbnail"] = found.get("thumbnail", "")
                    one["copy"] = found.get("copy", "")
                    one["altCopy"] = found.get("altCopy", "")
                withCopy = sum(1 for v in extra.values() if v.get("copy"))
                print(f"  {account['name']} · 소재 {len(extra)}건 "
                      + f"(이미지 {sum(1 for v in extra.values() if v.get('thumbnail'))} · 문구 {withCopy}) "
                      + f"· 광고그룹 {min(len(groups), CREATIVE_IMAGE_GROUPS)}개 조회")

        out = Path(args.out)
        out.write_text(json.dumps({
            "ok": True,
            "source": "naver",
            "range": {"since": args.since, "until": args.until},
            "fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "rows": rows,
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n{len(rows)}줄 · 저장: {out}")

        if args.push:
            print("시트에 적재합니다…")
            push_rows(args.endpoint, rows)
            print("적재 끝. 화면의 네이버 탭에서 보입니다.")
            spend = sum(one["spend"] for one in rows if one["level"] == "CAMPAIGN")
            note(args.log, f"성공 · {args.since}~{args.until} · {len(rows)}줄 · 광고비 {spend:,.0f}원")
        else:
            print("(시트에 올리려면 --push 를 붙이세요)")
            note(args.log, f"조회만 · {args.since}~{args.until} · {len(rows)}줄 (적재 안 함)")
        return 0
    finally:
        # 붙어서 쓴 크롬은 닫지 않는다. 닫으면 로그인(세션 쿠키)이 사라져
        # 다음 실행에서 사람이 또 로그인해야 한다.
        if not attached:
            try:
                driver.quit()
            except Exception:
                pass


if __name__ == "__main__":
    raise SystemExit(main())
