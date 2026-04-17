#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
构建“外部研究报告”结构化分析数据：

1. 扫描 `外部研究报告/*.pdf`
2. 抽取文本、元信息、关键页与知识映射
3. 输出 `data/external_reports.json`
4. 渲染关键图表页到 `research-task/generated/external-reports/charts/`

默认启用缓存，避免重复解析未变化的 PDF。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

try:
    import fitz
except ImportError as exc:  # pragma: no cover - 环境依赖提醒
    raise SystemExit(
        "缺少 PyMuPDF（fitz）。请优先使用项目内 `.venv/bin/python scripts/build_external_reports_data.py` 运行。"
    ) from exc

fitz.TOOLS.mupdf_display_errors(False)
fitz.TOOLS.mupdf_display_warnings(False)


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "外部研究报告"
OUTPUT_JSON = ROOT / "data" / "external_reports.json"
REVIEW_JSON = ROOT / "data" / "external_reports_review.json"
GENERATED_ROOT = ROOT / "research-task" / "generated" / "external-reports"
CACHE_DIR = GENERATED_ROOT / "cache"
CHART_DIR = GENERATED_ROOT / "charts"
SCRIPT_VERSION = "2026-04-16-v4"

NOISE_PATTERNS = [
    r"请务必阅读正文之后的免责条款部分.*",
    r"用户\d+于\d{4}-\d{2}-\d{2}日下载，仅供本人内部使用，不可传播与转载",
    r"未经许可，禁止转载",
    r"证券研究报告",
    r"宏观研究报告",
    r"策略研究报告",
    r"免责条款部分",
]

FRAMEWORK_RULES = [
    {"title": "美林投资时钟", "keywords": ["美林时钟", "投资时钟", "四象限", "增长上行", "通胀回落"]},
    {"title": "货币信用框架", "keywords": ["货币信用", "宽货币", "宽信用", "紧信用", "流动性", "社融", "信用周期"]},
    {"title": "库存周期", "keywords": ["库存周期", "补库存", "去库存", "主动补库", "被动去库"]},
    {"title": "朱格拉 / 康波周期", "keywords": ["朱格拉", "康波", "中周期", "长周期", "产能周期"]},
    {"title": "金融周期", "keywords": ["金融周期", "杠杆", "房地产价格", "债务压力", "金融条件"]},
    {"title": "领先指标与转折点识别", "keywords": ["领先指标", "CLI", "转折点", "经济周期指数", "马氏距离"]},
    {"title": "风险平价 / 全天候", "keywords": ["风险平价", "全天候", "all weather", "balanced beta", "风险预算"]},
    {"title": "Black-Litterman 与组合优化", "keywords": ["black-litterman", "组合优化", "CVaR", "均值方差", "风险配置"]},
]

SCENARIO_RULES = [
    {"title": "增长上行 / 通胀回落", "keywords": ["增长上行", "通胀回落", "复苏", "软着陆"]},
    {"title": "增长上行 / 通胀上行", "keywords": ["增长上行", "通胀上行", "过热", "再通胀"]},
    {"title": "增长下行 / 通胀上行", "keywords": ["增长下行", "通胀上行", "滞胀", "股债双杀"]},
    {"title": "增长下行 / 通胀下行", "keywords": ["增长下行", "通胀下行", "衰退", "低通胀"]},
    {"title": "宽货币 / 紧信用", "keywords": ["宽货币", "紧信用", "流动性宽松"]},
    {"title": "宽货币 / 宽信用", "keywords": ["宽货币", "宽信用", "信用扩张", "信用修复"]},
    {"title": "紧货币 / 宽信用", "keywords": ["紧货币", "宽信用"]},
    {"title": "紧货币 / 紧信用", "keywords": ["紧货币", "紧信用", "钱荒", "去杠杆"]},
]

ASSET_RULES = [
    {"title": "中国股票", "keywords": ["A股", "股票", "权益", "股市", "沪深300"]},
    {"title": "中国利率债", "keywords": ["利率债", "国债", "久期", "中债总全价"]},
    {"title": "中国信用债", "keywords": ["信用债", "信用利差", "产业债", "城投债"]},
    {"title": "中国商品/黄金", "keywords": ["商品", "大宗", "黄金", "油价", "铜"]},
    {"title": "中国货币/现金", "keywords": ["现金", "货币市场基金", "货基"]},
    {"title": "海外股票", "keywords": ["美股", "日股", "海外股票", "纳斯达克"]},
    {"title": "海外债券", "keywords": ["美债", "海外债券", "美国国债"]},
    {"title": "美元/外汇", "keywords": ["美元", "汇率", "人民币", "外汇"]},
    {"title": "REITs/另类", "keywords": ["REITs", "另类资产", "不动产信托"]},
]

METHOD_RULES = [
    {"title": "风险平价 / 全天候", "keywords": ["风险平价", "全天候", "all weather", "balanced beta"]},
    {"title": "宏观因子风险预算", "keywords": ["宏观因子", "风险预算", "因子配置", "股债配置", "风险配置"]},
    {"title": "Black-Litterman", "keywords": ["black-litterman", "主观观点", "隐含均衡收益"]},
    {"title": "情景映射 + 区间权重", "keywords": ["资产排序", "配置建议", "超配", "低配", "区间权重"]},
]

HISTORY_RULES = [
    {"title": "2008年全球金融危机后宽松初期", "keywords": ["2008", "金融危机", "危机后宽松"]},
    {"title": "2016年中国供给侧改革与再通胀交易", "keywords": ["2016", "供给侧", "再通胀"]},
    {"title": "2019年中国信用修复初期", "keywords": ["2019", "信用修复"]},
    {"title": "2014-2015年中国宽松交易：债券先行，总量后确认", "keywords": ["2014", "2015", "债券先行", "总量后确认"]},
    {"title": "2013年钱荒与流动性冲击", "keywords": ["2013", "钱荒"]},
    {"title": "2020年疫情冲击与全球再宽松", "keywords": ["疫情冲击", "全球再宽松", "2020"]},
    {"title": "2022年海外高通胀与加息周期", "keywords": ["2022", "高通胀", "加息周期"]},
    {"title": "2023-2024年海外软着陆交易：股票先行，硬数据后跟", "keywords": ["软着陆", "2023", "2024"]},
    {"title": "2024-2025年中国低通胀与弱修复环境", "keywords": ["2024", "2025", "低通胀", "弱修复"]},
]

CURRENT_VIEW_RULES = [
    {"title": "低通胀弱修复", "keywords": ["低通胀", "弱修复", "弱复苏"]},
    {"title": "货币已宽、信用待验", "keywords": ["宽货币", "信用修复", "实体待验", "信用待验"]},
    {"title": "债券底仓占优", "keywords": ["超配债券", "债券是最佳配置", "利率债", "债市"]},
    {"title": "权益从防守转向结构进攻", "keywords": ["结构性", "权益配置", "股票", "行业轮动"]},
    {"title": "海外放缓未衰退", "keywords": ["放缓未衰退", "美国经济", "软着陆", "海外"]},
]

NEW_KNOWLEDGE_RULES = [
    {
        "name": "三因子中国经济周期模型",
        "keywords": ["三因子经济周期模型", "增长数据", "流动性数据", "通胀数据"],
        "note": "把增长、流动性、通胀组合成中国本土六段周期划分，可直接补充现有周期识别层。",
    },
    {
        "name": "六段经济周期划分",
        "keywords": ["六阶段", "六段", "扩张前", "扩张后", "衰退前", "衰退后"],
        "note": "相较传统四阶段，更强调拐点前后资产切换的节奏差异。",
    },
    {
        "name": "普林格经济周期六段论",
        "keywords": ["普林格", "六段论"],
        "note": "把更细颗粒度的周期阶段直接映射到资产、行业和风格轮动。",
    },
    {
        "name": "ETF周期配置法",
        "keywords": ["ETF配置", "ETF", "周期划分下的ETF配置"],
        "note": "适合把宏观判断进一步落成可执行 ETF 清单，而不只停留在资产大类层。",
    },
    {
        "name": "油价与经济周期联动",
        "keywords": ["油价", "原油", "商品规律"],
        "note": "把商品价格与宏观周期连起来，可补强商品/黄金资产卡和历史复盘。",
    },
    {
        "name": "宏中观复合周期",
        "keywords": ["宏中观复合周期", "产业周期", "中观复合周期"],
        "note": "把宏观状态和产业/行业节奏叠加，有助于从大类资产延伸到行业轮动。",
    },
    {
        "name": "战后日本经济周期镜鉴",
        "keywords": ["日本经济周期", "战后日本"],
        "note": "为低增长、低通胀、资产负债表修复环境提供历史镜像样本。",
    },
]

KEYWORD_POOL = [
    "经济周期",
    "资产配置",
    "流动性",
    "信用周期",
    "金融周期",
    "库存周期",
    "风险平价",
    "Black-Litterman",
    "宏观因子",
    "股票",
    "债券",
    "商品",
    "黄金",
    "美元",
    "ETF",
    "股债双杀",
    "软着陆",
    "低通胀",
    "弱修复",
    "信用修复",
]

CHART_LABEL_PATTERN = r"(图|表)\s*[0-9一二三四五六七八九十]+"
GENERIC_FRAGMENT_PATTERNS = [
    r"请务必.*阅读",
    r"免责",
    r"免责声明",
    r"资料来源",
    r"来源：",
    r"目录",
    r"contents",
    r"图表目录",
    r"正文目录",
    r"创造财富",
    r"china galaxy securities",
    r"评级标准",
    r"行业评级体系",
    r"证券研究报告",
    r"宏观专题研究",
    r"http://www\.",
    r"用户\d+",
    r"bs361ygven",
]

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="构建外部 PDF 研究报告分析数据。")
    parser.add_argument("--force", action="store_true", help="忽略缓存，强制重建。")
    parser.add_argument("--max-reports", type=int, default=0, help="仅处理前 N 份报告，0 表示全量。")
    parser.add_argument("--charts-per-report", type=int, default=1, help="每份报告渲染的关键图表页数量。")
    parser.add_argument("--render-scale", type=float, default=1.3, help="关键页渲染比例，默认 1.3。")
    return parser.parse_args()


def ensure_dirs() -> None:
    GENERATED_ROOT.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)


def read_system_corpus() -> str:
    parts: List[str] = []
    for name in [
        "data/frameworks.json",
        "data/macro_scenarios.json",
        "data/assets.json",
        "data/historical_cases.json",
        "data/current_view.json",
        "data/config.json",
    ]:
        path = ROOT / name
        if path.exists():
            parts.append(path.read_text(encoding="utf-8"))
    return "\n".join(parts)


def normalize_review_key(value: str) -> str:
    text = re.sub(r"\s+", "", str(value or "")).strip().lower()
    for token in ["：", ":", "-", "_", "/", "（", "）", "(", ")", "《", "》", "“", "”", "\"", "'", "，", ",", "."]:
        text = text.replace(token, "")
    return text


def load_review_entries() -> Dict[str, Dict[str, object]]:
    if not REVIEW_JSON.exists():
        return {}
    payload = json.loads(REVIEW_JSON.read_text(encoding="utf-8"))
    reports = payload.get("reports", []) if isinstance(payload, dict) else []
    entries: Dict[str, Dict[str, object]] = {}
    for item in reports:
        if not isinstance(item, dict):
            continue
        key = normalize_review_key(item.get("title", ""))
        if not key:
            continue
        entries[key] = dict(item)
    return entries


def clean_text(text: str) -> str:
    value = text.replace("\x00", " ")
    for pattern in NOISE_PATTERNS:
        value = re.sub(pattern, " ", value, flags=re.I)
    lines = []
    for raw in value.splitlines():
        line = re.sub(r"\s+", " ", raw).strip()
        if not line:
            continue
        if len(line) <= 2:
            continue
        lines.append(line)
    return "\n".join(lines)


def is_generic_fragment(text: str) -> bool:
    value = re.sub(r"\s+", " ", text or "").strip().lower()
    if not value:
        return True
    return any(re.search(pattern, value, flags=re.I) for pattern in GENERIC_FRAGMENT_PATTERNS)


def non_empty_lines(text: str) -> List[str]:
    return [line.strip() for line in text.splitlines() if line.strip()]


def compact_meaningful_text(text: str, max_len: int = 240) -> str:
    lines = []
    for raw in text.splitlines():
        line = re.sub(r"\s+", " ", raw).strip()
        if not line or is_generic_fragment(line):
            continue
        lines.append(line)
    value = " ".join(lines).strip()
    if len(value) > max_len:
        value = value[: max_len - 1].rstrip() + "…"
    return value


def split_sentences(text: str) -> List[str]:
    base = re.sub(r"\s+", " ", text)
    parts = re.split(r"(?<=[。！？；])\s+|(?<=\.)\s{2,}|\n+", base)
    results = []
    for part in parts:
        value = part.strip(" -•·\t")
        if 18 <= len(value) <= 180:
            results.append(value)
    return results


def score_sentence(sentence: str, page_number: int) -> int:
    if is_generic_fragment(sentence):
        return -10
    score = 0
    scoring_terms = [
        "核心观点",
        "资产配置",
        "配置标的",
        "经济周期",
        "流动性",
        "信用",
        "股票",
        "债券",
        "商品",
        "黄金",
        "模型",
        "框架",
        "领先",
        "最佳",
        "最优",
        "轮动",
        "风险平价",
        "Black-Litterman",
        "ETF",
    ]
    penalty_terms = ["目录", "电话", "执业资格", "免责", "资料来源：Wind"]
    for term in scoring_terms:
        if term.lower() in sentence.lower():
            score += 2
    for term in penalty_terms:
        if term in sentence:
            score -= 4
    if sentence.startswith("核心观点"):
        score += 4
    return score


def classify_page_kind(text: str, page_number: int) -> str:
    header_lines = non_empty_lines(text)[:10]
    header = " ".join(header_lines)
    if re.search(r"(目录|contents|图表目录|正文目录)", header, flags=re.I):
        return "toc"
    chart_hits = len(re.findall(CHART_LABEL_PATTERN, text))
    if page_number <= 2 and chart_hits == 0 and is_generic_fragment(header):
        return "cover"
    if chart_hits >= 1 and "资料来源" in text:
        return "chart"
    if chart_hits >= 2:
        return "chart"
    return "text"


def score_page(text: str, page_number: int, page_kind: str) -> int:
    if page_kind == "toc":
        return -20
    if page_kind == "cover":
        return -12
    score = 0
    if page_kind == "chart":
        score += 8
    rules = [
        (CHART_LABEL_PATTERN, 8),
        (r"资料来源", 4),
        (r"资产配置", 4),
        (r"经济周期", 3),
        (r"轮动", 3),
        (r"风险平价|Black-Litterman|ETF", 3),
        (r"股票|债券|商品|黄金", 2),
    ]
    for pattern, weight in rules:
        if re.search(pattern, text, flags=re.I):
            score += weight
    if "目录" in text[:80]:
        score -= 6
    if len(text) < 120:
        score -= 3
    if is_generic_fragment(" ".join(non_empty_lines(text)[:6])):
        score -= 6
    return score


def normalize_title_from_filename(path: Path) -> Dict[str, str]:
    stem = path.stem
    patterns = [
        r"^(?P<date>\d{4}-\d{2}-\d{2})_(?P<institution>[^_]+)_(?P<title>.+)$",
        r"^(?P<date>\d{4}-\d{2})_(?P<institution>[^_]+)_(?P<title>.+)$",
        r"^(?P<date>\d{4})_(?P<institution>[^_]+)_(?P<title>.+)$",
    ]
    for pattern in patterns:
        match = re.match(pattern, stem)
        if match:
            return {
                "date": match.group("date"),
                "institution": match.group("institution"),
                "title": match.group("title"),
            }
    date_match = re.match(r"^(?P<date>\d{4}年[^_ ]*)", stem)
    if date_match:
        return {"date": date_match.group("date"), "institution": "", "title": stem}
    return {"date": "", "institution": "", "title": stem}


def make_report_id(path: Path) -> str:
    digest = hashlib.md5(path.name.encode("utf-8")).hexdigest()[:10]
    meta = normalize_title_from_filename(path)
    prefix = re.sub(r"[^0-9A-Za-z]+", "-", meta["date"] or "report").strip("-").lower()
    return f"{prefix}-{digest}"


def build_signature(
    path: Path,
    charts_per_report: int,
    render_scale: float,
    review_entry: Dict[str, object] | None,
) -> str:
    stat = path.stat()
    review_digest = json.dumps(review_entry or {}, ensure_ascii=False, sort_keys=True)
    payload = (
        f"{SCRIPT_VERSION}|{path.name}|{stat.st_size}|{stat.st_mtime_ns}|"
        f"{charts_per_report}|{render_scale:.2f}|{review_digest}"
    )
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()


def choose_top_pages(page_infos: List[Dict[str, object]], limit: int) -> List[Dict[str, object]]:
    if not page_infos:
        return []
    candidates = [item for item in page_infos if item.get("kind") not in {"cover", "toc"}]
    if not candidates:
        candidates = page_infos
    if not any(str(item.get("text") or "").strip() for item in candidates):
        return []
    ranked = sorted(
        candidates,
        key=lambda item: (
            -int(item["score"]),
            int(item["page_number"]),
        ),
    )
    selected: List[Dict[str, object]] = []
    used_pages = set()
    for item in ranked:
        page_number = int(item["page_number"])
        if page_number in used_pages:
            continue
        if int(item["score"]) <= 0 and selected:
            continue
        selected.append(item)
        used_pages.add(page_number)
        if len(selected) >= limit:
            break
    if not selected and ranked:
        if int(ranked[0]["score"]) <= 0 and not str(ranked[0].get("text") or "").strip():
            return []
        selected = [ranked[0]]
    return sorted(selected, key=lambda item: int(item["page_number"]))


def extract_label(text: str, page_number: int) -> str:
    for line in text.splitlines():
        candidate = line.strip()
        if not candidate:
            continue
        if re.search(CHART_LABEL_PATTERN, candidate) and not is_generic_fragment(candidate):
            return candidate[:80]
    for line in text.splitlines():
        candidate = line.strip()
        if len(candidate) >= 8 and not is_generic_fragment(candidate):
            return candidate[:80]
    return f"关键图表页 P{page_number}"


def rank_matches(title: str, text: str, rules: Iterable[Dict[str, object]], limit: int = 5) -> List[str]:
    title_lower = title.lower()
    text_lower = text.lower()
    ranked: List[Tuple[int, str]] = []
    for rule in rules:
        score = 0
        for keyword in rule["keywords"]:
            keyword_lower = str(keyword).lower()
            if keyword_lower in title_lower:
                score += 5
            elif keyword_lower in text_lower:
                score += 2
        if score > 0:
            ranked.append((score, str(rule["title"])))
    ranked.sort(key=lambda item: (-item[0], item[1]))
    return [title for _, title in ranked[:limit]]


def build_highlights(page_infos: List[Dict[str, object]], top_pages: List[Dict[str, object]]) -> List[str]:
    page_lookup = {int(item["page_number"]): item for item in page_infos}
    ordered_page_numbers = []
    for item in top_pages:
        page_number = int(item["page_number"])
        for candidate in [page_number, page_number - 1, page_number + 1]:
            if candidate > 0 and candidate not in ordered_page_numbers:
                ordered_page_numbers.append(candidate)
    candidates = []
    seen = set()
    for page_number in ordered_page_numbers:
        page_info = page_lookup.get(page_number)
        if not page_info or page_info.get("kind") in {"cover", "toc"}:
            continue
        for sentence in split_sentences(str(page_info.get("text") or "")):
            compact = sentence.replace(" ", "")
            if compact in seen:
                continue
            seen.add(compact)
            if is_generic_fragment(sentence):
                continue
            score = score_sentence(sentence, page_number)
            if page_info.get("kind") == "chart":
                score += 1
            if score <= 0:
                continue
            candidates.append((score, page_number, sentence))
    candidates.sort(key=lambda item: (-item[0], item[1], len(item[2])))
    return [sentence for _, _, sentence in candidates[:5]]


def derive_category(title: str, framework_matches: List[str], method_matches: List[str], asset_matches: List[str]) -> str:
    title_lower = title.lower()
    if "etf" in title_lower:
        return "ETF与执行层配置"
    if method_matches:
        return "配置方法与组合构建"
    if asset_matches and not framework_matches:
        return "资产与市场专题"
    if "油价" in title or "商品" in title:
        return "商品与价格周期专题"
    if framework_matches:
        return "宏观周期与框架研究"
    return "综合研究报告"


def derive_new_knowledge(text: str, system_corpus: str) -> List[Dict[str, str]]:
    results = []
    for rule in NEW_KNOWLEDGE_RULES:
        if rule["name"] in system_corpus:
            continue
        if any(keyword.lower() in text.lower() for keyword in rule["keywords"]):
            results.append({"name": rule["name"], "note": rule["note"]})
    return results


def derive_keywords(text: str, title: str, matches: List[str]) -> List[str]:
    selected = list(matches)
    title_text = f"{title}\n{text[:16000]}"
    for keyword in KEYWORD_POOL:
        if keyword.lower() in title_text.lower() and keyword not in selected:
            selected.append(keyword)
    return selected[:10]


def render_page_image(
    doc: fitz.Document,
    page_number: int,
    report_id: str,
    render_scale: float,
) -> str:
    target_dir = CHART_DIR / report_id
    target_dir.mkdir(parents=True, exist_ok=True)
    image_path = target_dir / f"page-{page_number:03d}.png"
    page = doc.load_page(page_number - 1)
    pix = page.get_pixmap(matrix=fitz.Matrix(render_scale, render_scale), alpha=False)
    pix.save(image_path)
    return str(image_path.relative_to(ROOT))


def preferred_image_path(report_id: str, page_number: int) -> str:
    return str(
        Path("research-task")
        / "generated"
        / "external-reports"
        / "charts"
        / report_id
        / f"page-{page_number:03d}.png"
    )


def load_cache(cache_path: Path, signature: str) -> Dict[str, object] | None:
    if not cache_path.exists():
        return None
    try:
        cached = json.loads(cache_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    if cached.get("signature") != signature:
        return None
    payload = cached.get("payload")
    if not isinstance(payload, dict):
        return None
    return payload


def save_cache(cache_path: Path, signature: str, payload: Dict[str, object]) -> None:
    cache_path.write_text(
        json.dumps({"signature": signature, "payload": payload}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def analyze_pdf(
    path: Path,
    system_corpus: str,
    charts_per_report: int,
    render_scale: float,
    force: bool,
    review_entry: Dict[str, object] | None,
) -> Dict[str, object]:
    report_id = make_report_id(path)
    signature = build_signature(path, charts_per_report, render_scale, review_entry)
    cache_path = CACHE_DIR / f"{report_id}.json"
    cached_payload = None if force else load_cache(cache_path, signature)
    if cached_payload is not None:
        timing = dict(cached_payload.get("timing", {}))
        timing["benchmark_text_seconds"] = timing.get("benchmark_text_seconds", timing.get("text_seconds", 0))
        timing["benchmark_analysis_seconds"] = timing.get("benchmark_analysis_seconds", timing.get("analysis_seconds", 0))
        timing["benchmark_render_seconds"] = timing.get("benchmark_render_seconds", timing.get("render_seconds", 0))
        timing["benchmark_total_seconds"] = timing.get("benchmark_total_seconds", timing.get("total_seconds", 0))
        timing["text_seconds"] = 0.0
        timing["analysis_seconds"] = 0.0
        timing["render_seconds"] = 0.0
        timing["cached"] = True
        timing["total_seconds"] = 0.0
        cached_payload["timing"] = timing
        return cached_payload

    meta = normalize_title_from_filename(path)
    started = time.perf_counter()
    text_started = time.perf_counter()
    doc = fitz.open(path)
    page_texts: List[str] = []
    page_infos: List[Dict[str, object]] = []
    for page_number in range(1, doc.page_count + 1):
        raw_text = doc.load_page(page_number - 1).get_text("text")
        cleaned = clean_text(raw_text)
        page_kind = classify_page_kind(cleaned, page_number)
        page_texts.append(cleaned)
        page_infos.append(
            {
                "page_number": page_number,
                "kind": page_kind,
                "score": score_page(cleaned, page_number, page_kind),
                "text": cleaned,
            }
        )
    text_seconds = time.perf_counter() - text_started

    analysis_started = time.perf_counter()
    full_text = "\n".join(page_texts)
    top_pages = choose_top_pages(page_infos, charts_per_report)
    if review_entry and review_entry.get("suppress_preview"):
        top_pages = []
    override = review_entry if review_entry and review_entry.get("preferred_page_number") else None
    if override:
        matched = next(
            (item for item in page_infos if int(item["page_number"]) == int(override["preferred_page_number"])),
            None,
        )
        if matched:
            top_pages = [matched]
    highlights = build_highlights(page_infos, top_pages)
    framework_matches = rank_matches(meta["title"], full_text, FRAMEWORK_RULES)
    scenario_matches = rank_matches(meta["title"], full_text, SCENARIO_RULES)
    asset_matches = rank_matches(meta["title"], full_text, ASSET_RULES)
    method_matches = rank_matches(meta["title"], full_text, METHOD_RULES)
    history_matches = rank_matches(meta["title"], full_text, HISTORY_RULES, limit=4)
    current_view_matches = rank_matches(meta["title"], full_text, CURRENT_VIEW_RULES, limit=4)
    new_knowledge = derive_new_knowledge(full_text, system_corpus)
    match_terms = framework_matches + scenario_matches + asset_matches + method_matches
    keywords = derive_keywords(full_text, meta["title"], match_terms)
    if highlights:
        summary = " ".join(highlights[:2])
    else:
        focus_text = compact_meaningful_text(
            "\n".join(str(item.get("text") or "") for item in top_pages if str(item.get("text") or "").strip())
        , 180)
        summary = focus_text or compact_meaningful_text("\n".join(page_texts[:2]), 180)
    category = derive_category(meta["title"], framework_matches, method_matches, asset_matches)
    analysis_seconds = time.perf_counter() - analysis_started

    render_started = time.perf_counter()
    rendered_pages = []
    for item in top_pages:
        page_number = int(item["page_number"])
        page_text = str(item["text"])
        if override and int(override["preferred_page_number"]) == page_number:
            image_path = str(override.get("preferred_image_path") or preferred_image_path(report_id, page_number))
            target = ROOT / image_path
            if not target.exists():
                image_path = render_page_image(doc, page_number, report_id, render_scale)
        else:
            image_path = render_page_image(doc, page_number, report_id, render_scale)
        rendered_pages.append(
            {
                "page_number": page_number,
                "label": (
                    override.get("preferred_label")
                    if override
                    and int(override["preferred_page_number"]) == page_number
                    and override.get("preferred_label")
                    else extract_label(page_text, page_number)
                ),
                "excerpt": compact_meaningful_text(page_text, 240),
                "image_path": image_path,
            }
        )
    render_seconds = time.perf_counter() - render_started
    doc.close()

    total_seconds = time.perf_counter() - started
    payload = {
        "id": report_id,
        "title": meta["title"],
        "date": meta["date"],
        "institution": meta["institution"],
        "category": category,
        "page_count": len(page_texts),
        "source_pdf_path": str(path.relative_to(ROOT)),
        "summary": summary,
        "highlights": highlights,
        "framework_matches": framework_matches,
        "scenario_matches": scenario_matches,
        "asset_matches": asset_matches,
        "method_matches": method_matches,
        "history_matches": history_matches,
        "current_view_matches": current_view_matches,
        "new_knowledge_points": new_knowledge,
        "keywords": keywords,
        "top_pages": rendered_pages,
        "review_status": (review_entry or {}).get("review_status", "unreviewed"),
        "review_notes": (review_entry or {}).get("review_notes", ""),
        "preferred_page_number": (review_entry or {}).get("preferred_page_number"),
        "timing": {
            "cached": False,
            "text_seconds": round(text_seconds, 4),
            "analysis_seconds": round(analysis_seconds, 4),
            "render_seconds": round(render_seconds, 4),
            "total_seconds": round(total_seconds, 4),
            "benchmark_text_seconds": round(text_seconds, 4),
            "benchmark_analysis_seconds": round(analysis_seconds, 4),
            "benchmark_render_seconds": round(render_seconds, 4),
            "benchmark_total_seconds": round(total_seconds, 4),
        },
    }
    save_cache(cache_path, signature, payload)
    return payload


def sort_reports(reports: List[Dict[str, object]]) -> List[Dict[str, object]]:
    def sort_key(item: Dict[str, object]) -> Tuple[int, str, str]:
        date_text = str(item.get("date") or "")
        if re.match(r"^\d{4}-\d{2}-\d{2}$", date_text):
            numeric = int(date_text.replace("-", ""))
        elif re.match(r"^\d{4}-\d{2}$", date_text):
            numeric = int(date_text.replace("-", "") + "00")
        elif re.match(r"^\d{4}$", date_text):
            numeric = int(date_text + "0000")
        else:
            numeric = 0
        return (-numeric, str(item.get("institution") or ""), str(item.get("title") or ""))

    return sorted(reports, key=sort_key)


def build_indexes(reports: List[Dict[str, object]]) -> Dict[str, Dict[str, List[str]]]:
    indexes = {
        "by_framework": defaultdict(list),
        "by_scenario": defaultdict(list),
        "by_asset": defaultdict(list),
        "by_method": defaultdict(list),
        "by_history": defaultdict(list),
    }
    for report in reports:
        report_id = str(report["id"])
        for key, field in [
            ("by_framework", "framework_matches"),
            ("by_scenario", "scenario_matches"),
            ("by_asset", "asset_matches"),
            ("by_method", "method_matches"),
            ("by_history", "history_matches"),
        ]:
            for title in report.get(field, []):
                indexes[key][title].append(report_id)
    return {key: dict(value) for key, value in indexes.items()}


def summarize(reports: List[Dict[str, object]], elapsed_seconds: float) -> Dict[str, object]:
    total_pages = sum(int(item["page_count"]) for item in reports)
    cache_hits = sum(1 for item in reports if item["timing"]["cached"])
    stage_totals = {
        "text_seconds": round(sum(float(item["timing"]["text_seconds"]) for item in reports), 4),
        "analysis_seconds": round(sum(float(item["timing"]["analysis_seconds"]) for item in reports), 4),
        "render_seconds": round(sum(float(item["timing"]["render_seconds"]) for item in reports), 4),
        "total_seconds": round(elapsed_seconds, 4),
    }
    benchmark_totals = {
        "text_seconds": round(sum(float(item["timing"].get("benchmark_text_seconds", item["timing"]["text_seconds"])) for item in reports), 4),
        "analysis_seconds": round(sum(float(item["timing"].get("benchmark_analysis_seconds", item["timing"]["analysis_seconds"])) for item in reports), 4),
        "render_seconds": round(sum(float(item["timing"].get("benchmark_render_seconds", item["timing"]["render_seconds"])) for item in reports), 4),
        "total_seconds": round(sum(float(item["timing"].get("benchmark_total_seconds", item["timing"]["total_seconds"])) for item in reports), 4),
    }
    slowest_reports = sorted(
        [
            {
                "id": item["id"],
                "title": item["title"],
                "seconds": item["timing"].get("benchmark_total_seconds", item["timing"]["total_seconds"]),
            }
            for item in reports
        ],
        key=lambda item: (-float(item["seconds"]), item["title"]),
    )[:5]

    category_counter = Counter(str(item.get("category") or "综合研究报告") for item in reports)
    framework_counter = Counter()
    new_knowledge_counter = Counter()
    review_status_counter = Counter()
    for item in reports:
        framework_counter.update(item.get("framework_matches", []))
        new_knowledge_counter.update(point["name"] for point in item.get("new_knowledge_points", []))
        review_status_counter.update([str(item.get("review_status") or "unreviewed")])

    return {
        "report_count": len(reports),
        "page_count": total_pages,
        "chart_image_count": sum(len(item.get("top_pages", [])) for item in reports),
        "cache_hits": cache_hits,
        "cache_misses": len(reports) - cache_hits,
        "avg_seconds_per_report": round(elapsed_seconds / len(reports), 4) if reports else 0.0,
        "timing": stage_totals,
        "benchmark_timing": benchmark_totals,
        "slowest_reports": slowest_reports,
        "category_counts": dict(category_counter.most_common()),
        "framework_counts": dict(framework_counter.most_common()),
        "new_knowledge_counts": dict(new_knowledge_counter.most_common()),
        "review_status_counts": dict(review_status_counter.most_common()),
    }


def main() -> None:
    args = parse_args()
    ensure_dirs()
    system_corpus = read_system_corpus()
    review_entries = load_review_entries()
    pdf_files = sorted(SOURCE_DIR.glob("*.pdf"))
    if args.max_reports:
        pdf_files = pdf_files[: args.max_reports]
    started = time.perf_counter()
    reports = [
        analyze_pdf(
            path=path,
            system_corpus=system_corpus,
            charts_per_report=max(1, args.charts_per_report),
            render_scale=max(0.8, args.render_scale),
            force=args.force,
            review_entry=review_entries.get(normalize_review_key(normalize_title_from_filename(path)["title"])),
        )
        for path in pdf_files
    ]
    reports = sort_reports(reports)
    elapsed_seconds = time.perf_counter() - started
    payload = {
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "source_dir": str(SOURCE_DIR.relative_to(ROOT)),
        "generator": {
            "script": str(Path("scripts") / "build_external_reports_data.py"),
            "version": SCRIPT_VERSION,
        },
        "summary": summarize(reports, elapsed_seconds),
        "indexes": build_indexes(reports),
        "reports": reports,
    }
    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    summary = payload["summary"]
    print("已生成外部研究报告分析数据:")
    print(OUTPUT_JSON)
    print(f"报告数: {summary['report_count']} | 总页数: {summary['page_count']} | 图表页: {summary['chart_image_count']}")
    print(
        "耗时: "
        f"总计 {summary['timing']['total_seconds']:.2f}s | "
        f"文本 {summary['timing']['text_seconds']:.2f}s | "
        f"分析 {summary['timing']['analysis_seconds']:.2f}s | "
        f"渲染 {summary['timing']['render_seconds']:.2f}s"
    )
    print(f"缓存命中: {summary['cache_hits']} | 未命中: {summary['cache_misses']}")
    if summary["slowest_reports"]:
        print("最慢报告:")
        for item in summary["slowest_reports"]:
            print(f"- {item['title']} ({item['seconds']:.2f}s)")


if __name__ == "__main__":
    main()
