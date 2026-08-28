"""Fetch Meta Ads spend for a single date."""

from __future__ import annotations

import argparse
import os
from datetime import date
from pathlib import Path

import requests
from dotenv import load_dotenv


GRAPH_API_VERSION = "v23.0"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Meta Ads Insights API에서 지정한 날짜의 광고비를 조회합니다."
    )
    parser.add_argument("--date", default="2026-08-27", help="조회 날짜 (YYYY-MM-DD)")
    parser.add_argument("--env-file", type=Path, default=Path("env.txt"))
    return parser.parse_args()


def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"환경변수가 없습니다: {name}")
    return value


def main() -> int:
    args = parse_args()
    try:
        date.fromisoformat(args.date)
    except ValueError as error:
        raise RuntimeError("날짜는 YYYY-MM-DD 형식이어야 합니다.") from error

    load_dotenv(args.env_file, override=False)
    access_token = required_env("META_ACCESS_TOKEN")
    account_ids = [
        account.strip()
        for account in required_env("REPORT_AD_ACCOUNTS").split(",")
        if account.strip()
    ]
    params = {
        "access_token": access_token,
        "fields": "account_id,account_name,spend",
        "time_range": f'{{"since":"{args.date}","until":"{args.date}"}}',
        "level": "account",
        "limit": 100,
    }

    total_spend = 0.0
    for account_id in account_ids:
        response = requests.get(
            f"https://graph.facebook.com/{GRAPH_API_VERSION}/{account_id}/insights",
            params=params,
            timeout=30,
        )
        if not response.ok:
            detail = response.json().get("error", {}).get("message", response.text)
            raise RuntimeError(f"{account_id} 조회 실패: {detail}")

        rows = response.json().get("data", [])
        if not rows:
            print(f"{account_id}: 광고비 데이터 없음")
            continue

        for row in rows:
            spend = float(row.get("spend", 0))
            total_spend += spend
            print(
                f"{row.get('account_name', account_id)}: {spend:,.2f}"
            )

    print(f"전체 합계: {total_spend:,.2f}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        raise SystemExit(f"오류: {error}")