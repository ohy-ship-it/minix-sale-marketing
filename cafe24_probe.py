"""카페24 애널리틱스 내부 API 정찰 — UTM 세부항목(기여기간 30일) 1단계.

카페24 API(/sales/orderdetails)는 같은 방문 안에서 산 주문만 광고에 붙인다.
애널리틱스 화면의 '기여기간 30일' 숫자는 API 로 안 나오므로, GFA 처럼
화면이 부르는 **내부 JSON 요청을 엿봐서** 주소와 파라미터를 알아낸다.

    py cafe24_probe.py

GFA 와 같은 크롬 프로필을 쓴다(로그인을 따로 남겨 둘 필요가 없게).
처음이면 카페24 관리자에 로그인 → 애널리틱스 UTM 세부항목 팝업이 열린다.
**기간이나 기여기간을 한 번 바꿔** 준 뒤 이 창에서 엔터.

잡은 내용은 cafe24-probe-<시각>.json 으로 남는다. 매출 숫자가 들어 있으니 공유하지 않는다.
"""

from __future__ import annotations

import sys
from datetime import date, timedelta

import gfa_probe

end = date.today() - timedelta(days=1)
start = end - timedelta(days=6)
START_URL = (
    "https://ca-web.cafe24data.com/inflow/popup/detail?device_type=total&period=7d"
    f"&start_date={start}&end_date={end}&conversion_timeframe=30d"
)

gfa_probe.START_URL = START_URL
gfa_probe.HOST_HINTS = ("cafe24data.com", "cafe24.com", "cafe24api.com")
gfa_probe.METRIC_HINTS = (
    "conversion", "timeframe", "order", "purchase", "visit", "inflow",
    "utm", "campaign", "content", "keyword", "medium", "amount", "sales",
)
gfa_probe.NOISE_HINTS = gfa_probe.NOISE_HINTS + ("google-analytics", "doubleclick", "/log", "beacon")

if __name__ == "__main__":
    if "--url" not in sys.argv:
        sys.argv += ["--url", START_URL]
    if "--out" not in sys.argv:
        sys.argv += ["--out", f"cafe24-probe-{date.today():%y%m%d}.json"]
    raise SystemExit(gfa_probe.main())
