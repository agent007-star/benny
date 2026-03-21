#!/bin/bash
# Benny Demo Script - 展示 Benny AI代码助手核心功能
# 
# 前置条件:
#   npm install ./benny-co-cli-0.1.0.tgz -g
#   benny init  (配置API密钥)
#
# 运行方式: ./demo.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEMO_DIR="$(mktemp -d)"
cd "$DEMO_DIR"

echo "╔════════════════════════════════════════════╗"
echo "║   Benny AI代码助手 - 功能演示             ║"
echo "╚════════════════════════════════════════════╝"
echo ""

echo "🔧 [1/7] 创建示例项目..."
mkdir -p src/utils
cat > src/utils/math.ts << 'EOF'
// 基础求和函数
function sum(a: number, b: number): number {
  return a + b;
}

// 同步风格的处理函数
function processData(items: number[], callback: (result: number) => void) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i];
  }
  callback(total);
}

const nums = [1, 2, 3, 4, 5];
processData(nums, (result) => {
  console.log('Result: ' + result);
});
EOF
echo "  ✓ 创建 src/utils/math.ts"
echo ""

echo "🤖 [2/7] Benny 版本..."
benny --version 2>/dev/null && echo "" || echo "  ✓ Benny 已安装"
echo ""

echo "📋 [3/7] 列出支持的模型..."
benny models 2>/dev/null || echo "  (需要 API Key)"
echo ""

echo "🔍 [4/7] AI代码审查..."
echo "  输入代码:"
cat src/utils/math.ts | head -8
echo ""
echo "  → Benny 审查:"
benny review -f src/utils/math.ts 2>/dev/null || echo "  (需要配置 API Key: 运行 benny init)"
echo ""

echo "💬 [5/7] 对话助手示例..."
echo "  问: 如何实现防抖函数?"
echo ""
echo "  → Benny 回答:"
benny chat "用TypeScript实现一个防抖函数" 2>/dev/null | head -20 || echo "  (需要配置 API Key: 运行 benny init)"
echo ""

echo "🔄 [6/7] 模型对比..."
echo "  对比: 用JS实现数组去重"
echo ""
echo "  → 三模型回答对比:"
benny compare "用JavaScript实现数组去重" 2>/dev/null | head -30 || echo "  (需要配置 API Key: 运行 benny init)"
echo ""

echo "📊 [7/7] 用量追踪..."
benny stats 2>/dev/null || echo "  (暂无使用记录)"
echo ""

echo "╔════════════════════════════════════════════╗"
echo "║            快速开始指南                    ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "  1️⃣  安装: npm install ./benny-co-cli-0.1.0.tgz -g"
echo "  2️⃣  配置: benny init"
echo "  3️⃣  对话: benny chat"
echo "  4️⃣  审查: benny review -f <文件>"
echo "  5️⃣  对比: benny compare <问题>"
echo ""
echo "  📖 帮助: benny --help"
echo "  🌐 GitHub: github.com/benny-co/benny"
echo ""
echo "示例项目: $DEMO_DIR"
