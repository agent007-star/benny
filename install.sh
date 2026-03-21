#!/bin/bash
# Benny CLI 快速安装脚本
# 使用方法: curl -sSL benny-co.github.io/install.sh | bash
# 或下载后本地运行: bash install.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Benny AI 代码助手 · 安装程序"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检测操作系统
OS="$(uname -s)"
case "$OS" in
  Linux*)     PLATFORM=linux;;
  Darwin*)    PLATFORM=macos;;
  MINGW*|CYGWIN*|MSYS*) PLATFORM=windows;;
  *)          echo "❌ 不支持的操作系统: $OS"; exit 1;;
esac

echo "✅ 检测平台: $PLATFORM"

# 检测 Node.js
if ! command -v node &> /dev/null; then
  echo "❌ 错误: 未检测到 Node.js"
  echo "请先安装 Node.js 18+: https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ 错误: Node.js 版本过低 (当前: $(node -v), 需要: 18+)"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# 检测 npm
if ! command -v npm &> /dev/null; then
  echo "❌ 错误: 未检测到 npm"
  exit 1
fi
echo "✅ npm $(npm -v)"

# 尝试下载 tarball
TARBALL_URL="${TARBALL_URL:-https://0x0.st/P9Ca.0.tgz}"

echo ""
echo "📦 正在下载 Benny CLI..."
TARBALL="/tmp/benny-cli-install.tgz"

# 尝试从 GitHub 下载，如果失败则尝试本地 tarball
if command -v curl &> /dev/null; then
  if curl -fL -o "$TARBALL" "$TARBALL_URL" 2>/dev/null; then
    echo "✅ 下载完成: $(ls -lh "$TARBALL" | awk '{print $5}')"
  elif [ -f "$(dirname "$0")/benny-co-cli-0.1.0.tgz" ]; then
    TARBALL="$(dirname "$0")/benny-co-cli-0.1.0.tgz"
    echo "✅ 使用本地 tarball: $TARBALL"
  else
    echo "⚠️  无法下载，使用本地查找..."
    if [ -f "$PWD/benny-co-cli-0.1.0.tgz" ]; then
      TARBALL="$PWD/benny-co-cli-0.1.0.tgz"
      echo "✅ 找到本地 tarball: $TARBALL"
    else
      echo "❌ 未找到本地 tarball"
      echo ""
      echo "请手动下载并安装:"
      echo "  1. 下载: https://github.com/benny-co/benny/releases"
      echo "  2. 运行: npm install ./benny-cli.tar.gz -g"
      exit 1
    fi
  fi
else
  echo "❌ 需要 curl 来下载"
  exit 1
fi

# 安装
echo ""
echo "🔧 正在安装..."
if npm install "$TARBALL" -g 2>&1; then
  echo "✅ 安装成功!"
else
  echo "❌ 安装失败，请检查权限 (可能需要 sudo)"
  echo "  尝试: sudo npm install \"$TARBALL\" -g"
  exit 1
fi

# 验证
echo ""
echo "🔍 验证安装..."
if command -v benny &> /dev/null; then
  VERSION=$(benny --version 2>/dev/null || echo "unknown")
  echo "✅ Benny v$VERSION 安装成功!"
else
  echo "⚠️  安装完成但 benny 命令不可用"
  echo "  尝试: hash -r && benny --version"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  下一步:"
echo "  1. benny init          # 配置 API 密钥"
echo "  2. benny chat          # 开始聊天"
echo "  3. benny --help        # 查看所有命令"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 教程: benny-co.github.io/tutorials"
echo "💬 问题: github.com/benny-co/benny/issues"
echo "💰 升级 Pro: bennyco@proton.me"
echo ""
