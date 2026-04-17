#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
通过公开网页补齐当前 Excel 导出中缺失的少量序列。

当前覆盖：
1. CX_PMI_MFG: InsiderStreet 的 Caixin PMI 历史发布表
2. LME_COPPER: FRED 的全球铜价月度序列（公开替代）
3. CSI300_DIVYIELD: 理杏仁公开页中的沪深300股息率表
"""

from __future__ import annotations

import calendar
import csv
import html
import io
import json
import re
from datetime import datetime, timedelta
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
MANUAL_OVERRIDE_FILE = ROOT / "外部宏观数据" / "manual_macro_series_overrides.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36"
    )
}

CX_PMI_URL = "https://www.moneycontrol.com/economic-calendar/chn-caixin-manufacturing-pmi/1864844"
FRED_COPPER_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=PCOPPUSDM"
CSI300_DIVYIELD_URL = "https://www.legulegu.com/stockdata/index-basic-composition?indexCode=000300.SH"

MONTH_MAP = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}

MONTHLY_INDICATORS = {"CX_PMI_MFG", "LME_COPPER"}
DAILY_INDICATORS = {"CSI300_DIVYIELD"}


def month_end(year: int, month: int) -> str:
    return f"{year:04d}-{month:02d}-{calendar.monthrange(year, month)[1]:02d}"


def build_jina_mirror_url(url: str) -> str:
    normalized = url.removeprefix("https://").removeprefix("http://")
    return f"https://r.jina.ai/http://{normalized}"


def request_text(url: str, timeout: int = 60, allow_mirror: bool = True) -> str:
    req = Request(
        url,
        headers={
            **HEADERS,
            "Accept": "text/html,application/xhtml+xml,application/xml,text/csv;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8",
            "Connection": "close",
            "Referer": "https://www.google.com/",
        },
    )
    try:
        with urlopen(req, timeout=timeout) as resp:
            content_type = resp.headers.get_content_charset() or "utf-8"
            return resp.read().decode(content_type, errors="ignore")
    except (HTTPError, URLError, TimeoutError) as exc:
        if not allow_mirror:
            raise
        mirror_req = Request(build_jina_mirror_url(url), headers=HEADERS)
        with urlopen(mirror_req, timeout=timeout) as resp:
            content_type = resp.headers.get_content_charset() or "utf-8"
            return resp.read().decode(content_type, errors="ignore")


def strip_html_tags(text: str) -> str:
    text = re.sub(r"<script.*?>.*?</script>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<style.*?>.*?</style>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    text = text.replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()


def merge_series(existing: list[dict], fresh: list[dict]) -> list[dict]:
    merged = {}
    for item in existing + fresh:
        date = str(item.get("date", "")).strip()
        value = item.get("value")
        if not date or value is None:
            continue
        merged[date] = value
    return [{"date": date, "value": merged[date]} for date in sorted(merged)]


def describe_series(records: list[dict]) -> str:
    if not records:
        return "0 条记录"
    latest = records[-1].get("date", "未知日期")
    return f"{len(records)} 条记录，最新 {latest}"


def parse_date_safe(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        return None


def expected_latest_date(indicator_id: str, now: datetime) -> datetime | None:
    if indicator_id in MONTHLY_INDICATORS:
        first_day_of_month = now.replace(day=1)
        previous_month_end = first_day_of_month - timedelta(days=1)
        return previous_month_end
    if indicator_id in DAILY_INDICATORS:
        return now
    return None


def should_skip_fetch(indicator_id: str, payload: dict, existing: list[dict], now: datetime) -> tuple[bool, str]:
    status_map = payload.get("meta", {}).get("online_fetch_status", {})
    status = status_map.get(indicator_id, {})
    last_fetch = parse_date_safe((payload.get("meta", {}).get("last_online_fetch_at") or "")[:10])
    latest_local = parse_date_safe(existing[-1]["date"]) if existing else None
    expected_latest = expected_latest_date(indicator_id, now)

    if existing and last_fetch and last_fetch.date() == now.date():
        return True, f"今天已抓取过，沿用本地缓存 {describe_series(existing)}"
    if existing and latest_local and expected_latest and latest_local.date() >= expected_latest.date():
        return True, f"本地缓存已覆盖当前发布窗口，沿用本地缓存 {describe_series(existing)}"
    if existing and status.get("status") == "degraded" and last_fetch and (now - last_fetch).days < 3:
        return True, f"最近已尝试抓取失败，先沿用本地缓存 {describe_series(existing)}"
    if not existing and status.get("status") == "failed" and last_fetch and last_fetch.date() == now.date():
        return True, "今天已尝试抓取但源不可用，跳过重复请求"
    return False, ""


def format_fetch_error(exc: Exception) -> str:
    if isinstance(exc, HTTPError):
        return f"HTTP {exc.code}"
    if isinstance(exc, URLError):
        return f"网络错误: {exc.reason}"
    return str(exc)


def load_existing_payload() -> dict:
    if MANUAL_OVERRIDE_FILE.exists():
        return json.loads(MANUAL_OVERRIDE_FILE.read_text(encoding="utf-8"))
    return {
        "meta": {
            "description": "用于补充当前 Excel 导出中不存在的宏观时间序列。保留空数组表示暂未补数。",
            "supported_fields": ["date", "value"],
            "date_format": "YYYY-MM-DD",
        },
        "series": {
            "CX_PMI_MFG": [],
            "LME_COPPER": [],
            "CSI300_DIVYIELD": [],
        },
    }


def parse_caixin_release_table(text: str) -> list[dict]:
    cleaned = strip_html_tags(text)
    pattern = re.compile(
        r"([A-Z][a-z]{2}\s+\d{2},\s+\d{4})\s+\d{2}:\d{2}\s+Caixin Manufacturing PMI\s+([A-Za-z]{3})\s+([0-9.]+)",
        flags=re.I,
    )
    records = {}
    for release_date_text, period_month_text, actual_text in pattern.findall(cleaned):
        release_date = datetime.strptime(release_date_text, "%b %d, %Y")
        period_month = MONTH_MAP[period_month_text.lower()]
        period_year = release_date.year - 1 if period_month > release_date.month else release_date.year
        records[month_end(period_year, period_month)] = float(actual_text)
    return [{"date": date, "value": records[date]} for date in sorted(records)]


def fetch_caixin_pmi_series() -> tuple[list[dict], str]:
    records = parse_caixin_release_table(request_text(CX_PMI_URL))
    return records, f"抓取到 {len(records)} 条月度记录。"


def fetch_fred_copper_series() -> tuple[list[dict], str]:
    text = request_text(FRED_COPPER_CSV, timeout=90, allow_mirror=False)
    reader = csv.DictReader(io.StringIO(text))
    records = []
    for row in reader:
        date_text = row.get("DATE")
        value = row.get("PCOPPUSDM")
        if not date_text or not value or value == ".":
            continue
        parsed = datetime.strptime(date_text, "%Y-%m-%d")
        records.append({"date": month_end(parsed.year, parsed.month), "value": round(float(value), 6)})
    return records, f"抓取到 {len(records)} 条月度记录。"


def fetch_csi300_dividend_yield_series() -> tuple[list[dict], str]:
    cleaned = strip_html_tags(request_text(CSI300_DIVYIELD_URL))
    date_match = re.search(r"成分股时间[:：]\s*(\d{4}-\d{2}-\d{2})", cleaned)
    row_pattern = re.compile(
        r"\d+\s+\d{6}\.(?:SH|SZ)\s+\S+\s+\S+\s+[-0-9.]+\s+[-0-9.]+\s+[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)%\s+([0-9.]+)"
    )
    weights = []
    for dividend_yield_text, market_cap_text in row_pattern.findall(cleaned):
        dividend_yield = float(dividend_yield_text)
        market_cap = float(market_cap_text)
        if market_cap <= 0:
            continue
        weights.append((dividend_yield, market_cap))
    if not date_match or not weights:
        raise ValueError("未能从乐咕乐股页面解析出沪深300成分股股息率与市值。")
    weighted_value = sum(dividend * market_cap for dividend, market_cap in weights) / sum(
        market_cap for _, market_cap in weights
    )
    return [{"date": date_match.group(1), "value": round(weighted_value, 6)}], "抓取到 1 条最新记录。"


def write_payload(payload: dict) -> None:
    MANUAL_OVERRIDE_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    now = datetime.now()
    payload = load_existing_payload()
    payload.setdefault("meta", {})
    payload.setdefault("series", {})
    payload["meta"].setdefault("online_fetch_status", {})

    payload["meta"]["online_sources"] = {
        "CX_PMI_MFG": {"label": "InsiderStreet Caixin PMI", "url": CX_PMI_URL},
        "LME_COPPER": {
            "label": "FRED PCOPPUSDM",
            "url": "https://fred.stlouisfed.org/series/PCOPPUSDM",
            "note": "使用公开可得的全球铜价月度序列作为 LME 铜价替代。",
        },
        "CSI300_DIVYIELD": {"label": "乐咕乐股沪深300成分股", "url": CSI300_DIVYIELD_URL},
    }

    tasks = [
        ("CX_PMI_MFG", fetch_caixin_pmi_series),
        ("LME_COPPER", fetch_fred_copper_series),
        ("CSI300_DIVYIELD", fetch_csi300_dividend_yield_series),
    ]

    print("在线补齐宏观缺口指标")
    print("")
    for indicator_id, fetcher in tasks:
        existing = payload["series"].get(indicator_id, [])
        skip, reason = should_skip_fetch(indicator_id, payload, existing, now)
        if skip:
            payload["meta"]["online_fetch_status"][indicator_id] = {
                "status": "cached",
                "note": reason,
                "record_count": len(existing),
                "latest_date": existing[-1]["date"] if existing else "",
            }
            print(f"{indicator_id}: cached, {reason}")
            continue
        try:
            fresh, note = fetcher()
            merged = merge_series(existing, fresh)
            payload["series"][indicator_id] = merged
            payload["meta"]["online_fetch_status"][indicator_id] = {
                "status": "ok",
                "note": note,
                "record_count": len(merged),
                "latest_date": merged[-1]["date"] if merged else "",
            }
            print(f"{indicator_id}: ok, {note} 当前共 {describe_series(merged)}")
        except Exception as exc:
            payload["series"].setdefault(indicator_id, existing)
            payload["meta"]["online_fetch_status"][indicator_id] = {
                "status": "degraded" if existing else "failed",
                "note": format_fetch_error(exc),
                "record_count": len(existing),
                "latest_date": existing[-1]["date"] if existing else "",
            }
            if existing:
                print(
                    f"{indicator_id}: skipped, {format_fetch_error(exc)}，"
                    f"沿用本地缓存 {describe_series(existing)}"
                )
            else:
                print(f"{indicator_id}: failed, {format_fetch_error(exc)}，且本地无缓存可用")

    payload["meta"]["last_online_fetch_at"] = now.strftime("%Y-%m-%d %H:%M:%S")
    write_payload(payload)
    print("")
    print("已写入:")
    print(MANUAL_OVERRIDE_FILE)


if __name__ == "__main__":
    main()
