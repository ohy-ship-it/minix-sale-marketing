"""Issue a Google Ads OAuth refresh token through browser authentication."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from google.ads.googleads.client import GoogleAdsClient
from google_auth_oauthlib.flow import InstalledAppFlow


GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords"
GOOGLE_AUTH_URI = "https://accounts.google.com/o/oauth2/auth"
GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="브라우저 인증으로 Google Ads Refresh Token을 발급합니다."
    )
    parser.add_argument(
        "--client-secrets",
        type=Path,
        required=True,
        help="Google Cloud에서 내려받은 OAuth 클라이언트 JSON 파일 경로",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("google_ads_refresh_token.txt"),
        help="Refresh Token을 저장할 로컬 파일 경로 (기본값: google_ads_refresh_token.txt)",
    )
    return parser.parse_args()


def load_client_config(path: Path) -> dict[str, dict[str, str]]:
    try:
        config = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise RuntimeError(f"OAuth 클라이언트 파일을 찾을 수 없습니다: {path}") from error
    except json.JSONDecodeError as error:
        raise RuntimeError(f"OAuth 클라이언트 JSON이 올바르지 않습니다: {path}") from error

    client = config.get("installed") or config.get("web")
    if not isinstance(client, dict) or not client.get("client_id") or not client.get(
        "client_secret"
    ):
        raise RuntimeError(
            "JSON에 installed 또는 web 형식의 client_id/client_secret이 필요합니다."
        )

    return {
        "installed": {
            "client_id": client["client_id"],
            "client_secret": client["client_secret"],
            "auth_uri": client.get("auth_uri", GOOGLE_AUTH_URI),
            "token_uri": client.get("token_uri", GOOGLE_TOKEN_URI),
        }
    }


def main() -> int:
    args = parse_args()
    client_config = load_client_config(args.client_secrets)

    flow = InstalledAppFlow.from_client_config(
        client_config,
        scopes=[GOOGLE_ADS_SCOPE],
    )
    credentials = flow.run_local_server(
        host="localhost",
        port=0,
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
    )

    if not credentials.refresh_token:
        raise RuntimeError(
            "Refresh Token이 반환되지 않았습니다. Google 계정 권한 화면에서 동의를 완료했는지 확인하세요."
        )

    args.output.write_text(credentials.refresh_token + "\n", encoding="utf-8")

    GoogleAdsClient.load_from_dict(
        {
            "developer_token": "placeholder",
            "client_id": client_config["installed"]["client_id"],
            "client_secret": client_config["installed"]["client_secret"],
            "refresh_token": credentials.refresh_token,
            "use_proto_plus": True,
        },
        version="v20",
    )

    masked_token = f"{credentials.refresh_token[:6]}...{credentials.refresh_token[-4:]}"
    print("\nGoogle Ads Refresh Token 발급 완료")
    print(f"토큰은 화면에 출력하지 않고 로컬 파일에 저장했습니다: {args.output.resolve()}")
    print(f"확인용 마스킹 값: {masked_token}")
    print("이 파일은 비밀정보이므로 외부 공유나 Git 커밋을 하지 마세요.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f"오류: {error}", file=sys.stderr)
        raise SystemExit(1)