"""카카오 비즈니스 토큰 발급 (한 번만 쓰는 스크립트).

카카오모먼트 API 는 일반 액세스 토큰이 아니라 '비즈니스 토큰' 으로 부른다.
비즈니스 토큰에는 리프레시 토큰이 없다. 한 번 받아 두고 계속 쓰는 값이라
Apps Script 스크립트 속성(KAKAO_BUSINESS_TOKEN)에 넣어 두면 된다.
여러 번 받으면 발급이 제한될 수 있으니 필요할 때만 실행한다.

    python get_kakao_business_token.py --redirect-uri http://localhost:8765/callback

--redirect-uri 는 카카오 디벨로퍼스 앱에 등록해 둔 값이어야 한다.
localhost 로 등록해 두었으면 브라우저가 알아서 돌아오고,
서비스 주소로 등록되어 있으면 돌아온 주소를 그대로 붙여넣으면 된다.
"""

from __future__ import annotations

import argparse
import http.server
import json
import secrets
import sys
import threading
import urllib.parse
import urllib.request
import webbrowser
from pathlib import Path

AUTHORIZE_URL = "https://kauth.kakao.com/oauth/business/authorize"
TOKEN_URL = "https://kauth.kakao.com/oauth/business/token"

# 카카오모먼트 조회에 필요한 동의항목. 만들기·지우기까지 하려면 moment_create·moment_delete 를 더한다.
DEFAULT_SCOPE = "moment_management"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="카카오 비즈니스 토큰을 발급합니다.")
    parser.add_argument("--client-id", help="카카오 앱의 REST API 키 (없으면 env.txt 의 KAKAO_REST_API_KEY)")
    parser.add_argument("--client-secret", help="카카오 앱의 Client Secret (사용 중일 때만)")
    parser.add_argument("--redirect-uri", required=True, help="카카오 앱에 등록해 둔 Redirect URI")
    parser.add_argument("--scope", default=DEFAULT_SCOPE, help=f"동의항목 (기본값: {DEFAULT_SCOPE})")
    parser.add_argument("--output", type=Path, default=Path("kakao_business_token.txt"),
                        help="토큰을 저장할 파일 (기본값: kakao_business_token.txt)")
    return parser.parse_args()


def read_env(name: str) -> str | None:
    """env.txt 에서 값을 읽는다. 없으면 None."""
    path = Path("env.txt")
    if not path.exists():
        return None
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        key, _, value = line.partition("=")
        if key.strip() == name:
            return value.strip() or None
    return None


def catch_code(redirect_uri: str, state: str) -> str:
    """등록한 Redirect URI 가 localhost 면 잠깐 서버를 띄워 인가 코드를 받는다."""
    parsed = urllib.parse.urlparse(redirect_uri)
    got: dict[str, str] = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            got.update({key: value[0] for key, value in query.items()})
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            done = "code" in got
            self.wfile.write(
                ("<h2>" + ("받았습니다. 창을 닫아도 됩니다." if done else "인가 코드를 받지 못했습니다.")
                 + "</h2>").encode("utf-8")
            )

        def log_message(self, *args: object) -> None:
            pass   # 요청 로그는 찍지 않는다

    server = http.server.HTTPServer((parsed.hostname or "localhost", parsed.port or 80), Handler)
    threading.Thread(target=server.handle_request, daemon=True).start()

    url = AUTHORIZE_URL + "?" + urllib.parse.urlencode({
        "client_id": CLIENT_ID, "response_type": "code",
        "redirect_uri": redirect_uri, "scope": SCOPE, "state": state,
    })
    print("브라우저에서 카카오 로그인 · 광고계정 인가를 마쳐 주세요.")
    print(url + "\n")
    webbrowser.open(url)

    server.serve_forever_timeout = None
    for _ in range(600):                    # 5분까지 기다린다
        if got:
            break
        threading.Event().wait(0.5)
    server.server_close()

    if got.get("state") and got["state"] != state:
        raise RuntimeError("state 값이 달라 요청을 버렸습니다. 다시 실행해 주세요.")
    if "code" not in got:
        raise RuntimeError(f"인가 코드를 받지 못했습니다: {got.get('error_description') or got.get('error') or '응답 없음'}")
    return got["code"]


def paste_code(redirect_uri: str, state: str) -> str:
    """localhost 가 아니면 돌아온 주소를 사람이 붙여넣는다."""
    url = AUTHORIZE_URL + "?" + urllib.parse.urlencode({
        "client_id": CLIENT_ID, "response_type": "code",
        "redirect_uri": redirect_uri, "scope": SCOPE, "state": state,
    })
    print("아래 주소를 브라우저에서 열고 인가를 마친 뒤,")
    print("주소창에 남은 전체 주소(code=... 가 붙은 것)를 그대로 붙여넣어 주세요.\n")
    print(url + "\n")
    webbrowser.open(url)
    back = input("돌아온 주소: ").strip()
    query = urllib.parse.parse_qs(urllib.parse.urlparse(back).query)
    if "code" not in query:
        raise RuntimeError("붙여넣은 주소에 code 가 없습니다.")
    return query["code"][0]


def fetch_token(code: str, redirect_uri: str, client_secret: str | None) -> dict[str, object]:
    form = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "redirect_uri": redirect_uri,
        "code": code,
    }
    if client_secret:
        form["client_secret"] = client_secret

    request = urllib.request.Request(
        TOKEN_URL,
        data=urllib.parse.urlencode(form).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(request) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"토큰 발급 실패 (HTTP {error.code}): {body}") from error


def main() -> int:
    args = parse_args()

    global CLIENT_ID, SCOPE
    CLIENT_ID = args.client_id or read_env("KAKAO_REST_API_KEY")
    SCOPE = args.scope
    if not CLIENT_ID:
        raise RuntimeError("REST API 키가 없습니다. --client-id 로 넣거나 env.txt 에 KAKAO_REST_API_KEY 를 적어 주세요.")
    # 비즈니스 인증은 카카오 로그인과 달리 클라이언트 시크릿이 켜져 있어야 한다.
    secret = args.client_secret or read_env("KAKAO_CLIENT_SECRET")
    if not secret:
        print("경고: 클라이언트 시크릿이 없습니다. 비즈니스 인증은 시크릿이 필요합니다.")
        print("     앱 설정 → 플랫폼 키 → REST API 키 → 클라이언트 시크릿을 켜고,")
        print("     env.txt 에 KAKAO_CLIENT_SECRET 으로 넣어 주세요.\n")

    state = secrets.token_urlsafe(16)
    host = urllib.parse.urlparse(args.redirect_uri).hostname or ""
    code = catch_code(args.redirect_uri, state) if host in ("localhost", "127.0.0.1") \
        else paste_code(args.redirect_uri, state)

    body = fetch_token(code, args.redirect_uri, secret)
    token = str(body.get("access_token") or "")
    if not token:
        raise RuntimeError(f"응답에 access_token 이 없습니다: {body}")

    args.output.write_text(token + "\n", encoding="utf-8")
    print("\n비즈니스 토큰 발급 완료")
    print(f"파일에 저장했습니다: {args.output.resolve()}")
    print(f"확인용 마스킹 값: {token[:6]}…{token[-4:]} ({len(token)}자)")
    print(f"받은 동의항목: {body.get('scope')}")
    print("\n다음: Apps Script 편집기 → 프로젝트 설정 → 스크립트 속성에")
    print("     KAKAO_BUSINESS_TOKEN 이름으로 이 값을 넣어 주세요.")
    print("이 파일은 비밀정보입니다. 공유하거나 커밋하지 마세요.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f"오류: {error}", file=sys.stderr)
        raise SystemExit(1)
