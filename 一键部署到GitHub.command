#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

REMOTE_NAME="${REMOTE_NAME:-origin}"
BRANCH_NAME="${BRANCH_NAME:-main}"
SITE_URL="${SITE_URL:-https://fifamy.github.io/macro-allocation-terminal/}"
PYTHON_BIN="python3"
DRY_RUN="${DRY_RUN:-0}"
DEFAULT_GIT_USER_NAME="${DEFAULT_GIT_USER_NAME:-fifamy}"
DEFAULT_GIT_USER_EMAIL="${DEFAULT_GIT_USER_EMAIL:-51155618+fifamy@users.noreply.github.com}"

pause_and_exit() {
  local exit_code="$1"
  echo ""
  if [ "${exit_code}" -eq 0 ]; then
    echo "脚本结束。"
  else
    echo "部署失败，请先看上面的提示。"
  fi
  read -n 1 -s -r -p "按任意键关闭..."
  echo ""
}

trap 'pause_and_exit $?' EXIT

step() {
  local current="$1"
  local total="$2"
  local message="$3"
  echo ""
  echo "[${current}/${total}] ${message}"
}

run_cmd() {
  if [ "${DRY_RUN}" = "1" ]; then
    printf '+'
    for arg in "$@"; do
      printf ' %q' "${arg}"
    done
    printf '\n'
  else
    "$@"
  fi
}

ensure_expected_remote() {
  local remote_url="$1"
  case "${remote_url}" in
    https://github.com/fifamy/macro-allocation-terminal.git|\
    https://github.com/fifamy/macro-allocation-terminal|\
    git@github.com:fifamy/macro-allocation-terminal.git)
      ;;
    *)
      echo "当前 origin 不是目标仓库："
      echo "  ${remote_url}"
      echo "请先把 origin 改到 fifamy/macro-allocation-terminal，再重新部署。"
      exit 1
      ;;
  esac
}

if [ -x ".venv/bin/python" ]; then
  PYTHON_BIN="./.venv/bin/python"
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "当前目录不是 Git 仓库，无法部署。"
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [ "${CURRENT_BRANCH}" != "${BRANCH_NAME}" ]; then
  echo "当前分支是 ${CURRENT_BRANCH}，GitHub Pages 发布分支要求使用 ${BRANCH_NAME}。"
  echo "请先切回 ${BRANCH_NAME} 再部署。"
  exit 1
fi

REMOTE_URL="$(git remote get-url "${REMOTE_NAME}" 2>/dev/null || true)"
if [ -z "${REMOTE_URL}" ]; then
  echo "未找到 ${REMOTE_NAME} 远端，无法部署。"
  exit 1
fi
ensure_expected_remote "${REMOTE_URL}"

GIT_USER_NAME="$(git config user.name || git config --global user.name || true)"
GIT_USER_EMAIL="$(git config user.email || git config --global user.email || true)"
GIT_USER_NAME="${GIT_USER_NAME:-${DEFAULT_GIT_USER_NAME}}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-${DEFAULT_GIT_USER_EMAIL}}"

step 1 4 "重建前端 bundle"
run_cmd "${PYTHON_BIN}" scripts/build_macro_terminal_bundle.py

step 2 4 "同步检查 GitHub 远端状态"
run_cmd git fetch "${REMOTE_NAME}" "${BRANCH_NAME}"

AHEAD=0
BEHIND=0
if git show-ref --verify --quiet "refs/remotes/${REMOTE_NAME}/${BRANCH_NAME}"; then
  COUNTS="$(git rev-list --left-right --count HEAD...${REMOTE_NAME}/${BRANCH_NAME})"
  AHEAD="$(printf '%s' "${COUNTS}" | awk '{print $1}')"
  BEHIND="$(printf '%s' "${COUNTS}" | awk '{print $2}')"
fi

if [ "${BEHIND}" -gt 0 ]; then
  echo "GitHub 上已经有比本地更新的提交。"
  echo "请先执行 git pull --rebase origin ${BRANCH_NAME} 处理完，再重新双击部署。"
  exit 1
fi

WORKTREE_STATUS="$(git status --porcelain)"
if [ -z "${WORKTREE_STATUS}" ] && [ "${AHEAD}" -eq 0 ]; then
  echo "没有检测到需要部署的本地改动。"
  echo "公开地址：${SITE_URL}"
  exit 0
fi

if [ -n "${WORKTREE_STATUS}" ]; then
  step 3 4 "提交本地改动"
  run_cmd git add -A

  if ! git diff --cached --quiet; then
    COMMIT_MESSAGE="${1:-Deploy $(date '+%Y-%m-%d %H:%M:%S')}"
    run_cmd git -c user.name="${GIT_USER_NAME}" -c user.email="${GIT_USER_EMAIL}" commit -m "${COMMIT_MESSAGE}"
    AHEAD=$((AHEAD + 1))
  else
    echo "暂存后没有新的文件内容变化，跳过提交。"
  fi
else
  echo ""
  echo "工作区没有未提交改动，直接推送已有本地提交。"
fi

if [ "${AHEAD}" -eq 0 ]; then
  echo "本地没有可推送的新提交。"
  echo "公开地址：${SITE_URL}"
  exit 0
fi

step 4 4 "推送到 GitHub"
run_cmd git push "${REMOTE_NAME}" "${BRANCH_NAME}"

echo ""
echo "部署完成。"
echo "仓库地址：https://github.com/fifamy/macro-allocation-terminal"
echo "公开地址：${SITE_URL}"
