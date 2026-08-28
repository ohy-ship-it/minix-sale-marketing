"""Fetch Google Ads spend for a single date."""

from __future__ import annotations

import argparse
import os
from datetime import date
from pathlib import Path

from dotenv import load_dotenv
from google.ads.googleads.client import GoogleAdsClient


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Google Ads API에서 지정한 날짜의 광고비를 조회합니다."
    )
    parser.add_argument(
        "--date",
        default="2026-08-27",
        help="조회 날짜 (YYYY-MM-DD, 기본값: 2026-08-27)",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=Path("env.txt"),
        help="Google Ads 환경변수 파일 (기본값: env.txt)",
    )
    return parser.parse_args()


def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"환경변수가 없습니다: {name}")
    return value


def main() -> int:
    args = parse_args()
    try:
        query_date = date.fromisoformat(args.date)
    except ValueError as error:
        raise RuntimeError("날짜는 YYYY-MM-DD 형식이어야 합니다.") from error

    load_dotenv(args.env_file, override=False)
    customer_id = required_env("GOOGLE_ADS_CUSTOMER_ID").replace("-", "")
    config = {
        "developer_token": required_env("GOOGLE_ADS_DEVELOPER_TOKEN"),
        "client_id": required_env("GOOGLE_ADS_CLIENT_ID"),
        "client_secret": required_env("GOOGLE_ADS_CLIENT_SECRET"),
        "refresh_token": required_env("GOOGLE_ADS_REFRESH_TOKEN"),
        "use_proto_plus": True,
    }
    login_customer_id = os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID")
    if login_customer_id:
        config["login_customer_id"] = login_customer_id.replace("-", "")

    client = GoogleAdsClient.load_from_dict(config)
    service = client.get_service("GoogleAdsService")
    query = f"""
        SELECT
          customer.id,
          customer.descriptive_name,
          metrics.cost_micros
        FROM customer
        WHERE segments.date = '{query_date.isoformat()}'
    """

    rows = service.search(customer_id=customer_id, query=query)
    total_cost_micros = 0
    account_name = ""
    for row in rows:
        account_name = row.customer.descriptive_name
        total_cost_micros += row.metrics.cost_micros

    print(f"조회일: {query_date.isoformat()}")
    print(f"광고계정: {account_name or '(이름 없음)'}")
    print(f"광고비: {total_cost_micros / 1_000_000:,.2f} (계정 통화 기준)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        raise SystemExit(f"오류: {error}")