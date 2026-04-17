#!/bin/bash
set -e
cd "$(dirname "$0")"

BUNDLE_FILE="data/macro_allocation_bundle.js"

PORT=8765
URL="http://127.0.0.1:${PORT}/index.html?ts=$(date +%s)"

if [ ! -f "${BUNDLE_FILE}" ]; then
  echo "未找到 ${BUNDLE_FILE}，先执行一次数据更新..."
  bash "./一键更新宏观配置数据.command"
fi

OLD_PID=$(lsof -ti TCP:${PORT} -sTCP:LISTEN 2>/dev/null || true)
if [ -n "${OLD_PID}" ]; then
  kill "${OLD_PID}" 2>/dev/null || true
  sleep 1
fi

echo ""
echo "启动本地网页服务..."
nohup python3 -m http.server ${PORT} >/tmp/macro_allocation_terminal_http.log 2>&1 &
sleep 1

if open "${URL}"; then
  echo "已打开浏览器：${URL}"
else
  echo "浏览器未自动打开，请手动访问：${URL}"
fi

echo ""
echo "如需更新最新宏观数据，请先双击：一键更新宏观配置数据.command"
