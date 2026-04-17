#!/bin/bash
set -e
cd "$(dirname "$0")"

REPORTS_PY="python3"
DATA_PY="python3"

if [ -x ".venv/bin/python" ] && ./.venv/bin/python -c "import fitz" >/dev/null 2>&1; then
  REPORTS_PY="./.venv/bin/python"
fi
if [ -x ".venv/bin/python" ] && ./.venv/bin/python -c "import openpyxl" >/dev/null 2>&1; then
  DATA_PY="./.venv/bin/python"
fi

echo "[1/4] 构建外部研究报告缓存..."
"${REPORTS_PY}" scripts/build_external_reports_data.py

echo ""
echo "[2/4] 在线补齐公开网页可得指标..."
"${DATA_PY}" scripts/fetch_online_macro_overrides.py

echo ""
echo "[3/4] 校验外部宏观数据导入状态..."
"${DATA_PY}" scripts/check_macro_excel_exports.py

echo ""
echo "[4/4] 生成前端数据包..."
"${DATA_PY}" scripts/build_macro_terminal_bundle.py
echo ""
echo "已更新宏观配置终端数据。"
echo "如需查看，请双击：一键打开宏观配置终端.command"
read -n 1 -s -r -p "按任意键关闭..."
