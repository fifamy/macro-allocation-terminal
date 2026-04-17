#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
校验“外部宏观数据”目录下的 Excel 导出状态。

用于在更新 bundle 前快速判断：
1. 是否找到了最新的日频 / 月季频工作簿
2. 工作簿是否只有 iFinD 公式而没有缓存值
3. 系统实际解析了多少条时间序列
"""

from __future__ import annotations

from build_macro_dashboard_data import (
    DAILY_GLOB,
    LME_COPPER_GLOB,
    MANUAL_OVERRIDE_FILE,
    MONTHLY_GLOB,
    build_catalog_alias_map,
    build_derived_series,
    read_manual_override_series,
    inspect_source_workbook,
    read_catalog,
    read_workbook_series,
    resolve_latest_workbook,
    SERIES_NAME_MAP,
    SUPPORT_SERIES,
)


def main() -> None:
    catalog = read_catalog()
    alias_map = build_catalog_alias_map(catalog)
    daily_file = resolve_latest_workbook(DAILY_GLOB)
    monthly_file = resolve_latest_workbook(MONTHLY_GLOB)
    lme_copper_file = resolve_latest_workbook(LME_COPPER_GLOB)
    print("外部宏观数据校验")
    print("")

    daily_status = inspect_source_workbook(daily_file)
    monthly_status = inspect_source_workbook(monthly_file)
    lme_copper_status = inspect_source_workbook(lme_copper_file)
    daily_series, _ = read_workbook_series(
        daily_file,
        daily_status,
        alias_map=alias_map,
        explicit_name_map={**SERIES_NAME_MAP, **SUPPORT_SERIES},
    )
    monthly_series, _ = read_workbook_series(
        monthly_file,
        monthly_status,
        alias_map=alias_map,
    )
    lme_copper_series, _ = read_workbook_series(
        lme_copper_file,
        lme_copper_status,
        alias_map=alias_map,
    )
    manual_series, manual_status = read_manual_override_series(MANUAL_OVERRIDE_FILE, catalog)
    all_series = {**manual_series, **daily_series, **monthly_series, **lme_copper_series}
    all_series.update(build_derived_series(all_series))
    available = {indicator_id for indicator_id in all_series if indicator_id in catalog}
    remaining = [indicator_id for indicator_id in catalog if indicator_id not in available]
    print(f"日频文件: {daily_file.name if daily_file else '未找到'}")
    print(f"状态: {daily_status['status']} / {daily_status['summary']}")
    if daily_status.get("details"):
        for item in daily_status["details"]:
            print(f"- {item}")
    print(f"已解析序列: {len(daily_series)}")
    print("")
    print(f"月季频文件: {monthly_file.name if monthly_file else '未找到'}")
    print(f"状态: {monthly_status['status']} / {monthly_status['summary']}")
    if monthly_status.get("details"):
        for item in monthly_status["details"]:
            print(f"- {item}")
    print(f"已解析序列: {len(monthly_series)}")
    print("")
    print(f"LME铜文件: {lme_copper_file.name if lme_copper_file else '未找到'}")
    print(f"状态: {lme_copper_status['status']} / {lme_copper_status['summary']}")
    if lme_copper_status.get("details"):
        for item in lme_copper_status["details"]:
            print(f"- {item}")
    print(f"已解析序列: {len(lme_copper_series)}")
    print("")
    print(f"手工覆盖文件: {MANUAL_OVERRIDE_FILE.name}")
    print(f"状态: {manual_status['status']} / {manual_status['summary']}")
    if manual_status.get("details"):
        for item in manual_status["details"]:
            print(f"- {item}")
    print(f"已解析序列: {len(manual_series)}")
    print("")
    print(f"剩余未接入指标: {len(remaining)}")
    if remaining:
        print(", ".join(remaining))


if __name__ == "__main__":
    main()
