#!/bin/bash
# Benny Demo Script - 展示 Benny 主要功能
# 运行方式: ./demo.sh

set -e

DEMO_DIR="$(mktemp -d)"
cd "$DEMO_DIR"

echo "=============================================="
echo "  Benny AI代码助手 - 功能演示"
echo "=============================================="
echo ""

echo "[1/6] 创建示例项目..."
mkdir -p src
cat > src/app.ts << 'EOF'
function calculateSum(numbers) {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  return sum;
}

function calculateAverage(numbers) {
  const sum = calculateSum(numbers);
  return sum / numbers.length;
}

const data = [10, 20, 30, 40, 50];
console.log("Sum:", calculateSum(data));
console.log("Average:", calculateAverage(data));
EOF
echo "  ✓ 创建 src/app.ts"
echo ""

echo "[2/6] 检查 Benny 版本..."
benny --version || echo "  (version 命令待验证)"
echo ""

echo "[3/6] 列出可用模型..."
benny models
echo ""

echo "[4/6] 代码审查示例（本地文件）..."
echo "  输入代码:"
cat src/app.ts
echo ""
echo "  Benny 审查结果:"
benny review -f src/app.ts || echo "  (需要 API Key 配置)"
echo ""

echo "[5/6] 添加中文注释示例..."
echo "  Benny 注释结果:"
benny comment -f src/app.ts || echo "  (需要 API Key 配置)"
echo ""

echo "[6/6] 代码优化示例..."
echo "  Benny 优化结果:"
benny optimize -f src/app.ts || echo "  (需要 API Key 配置)"
echo ""

echo "=============================================="
echo "  演示完成！"
echo "=============================================="
echo ""
echo "下一步："
echo "  1. 配置 API Key: cp benny/.env.example benny/.env"
echo "  2. 进入 Benny 目录: cd benny"
echo "  3. 交互式对话: benny chat"
echo "  4. 查看帮助: benny --help"
echo ""

# 保留目录以便用户查看结果
echo "示例项目保存在: $DEMO_DIR"
