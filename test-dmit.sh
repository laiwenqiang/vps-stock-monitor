#!/bin/bash

# Dmit 库存检查快速测试脚本
# 用于在 wrangler dev --remote 运行时快速测试

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 默认配置
BASE_URL="http://127.0.0.1:8787"
DMIT_URL="https://www.dmit.io/cart.php?gid=1"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      DMIT_URL="$2"
      shift 2
      ;;
    --port)
      BASE_URL="http://127.0.0.1:$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Dmit 库存检查测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 测试配置:"
echo "  Worker URL: $BASE_URL"
echo "  Dmit URL:   $DMIT_URL"
echo ""

# 检查 Worker 是否运行
echo "🔍 检查 Worker 状态..."
if ! curl -s -f "$BASE_URL/" > /dev/null 2>&1; then
  echo -e "${RED}❌ Worker 未运行${NC}"
  echo ""
  echo "请先启动 Worker:"
  echo "  npm run dev:remote"
  echo ""
  exit 1
fi
echo -e "${GREEN}✅ Worker 正在运行${NC}"
echo ""

# 测试健康检查
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  健康检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$BASE_URL/" | jq .
echo ""

# 测试 Dmit 库存检查
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Dmit 库存检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# URL 编码
ENCODED_URL=$(printf %s "$DMIT_URL" | jq -sRr @uri)
TEST_URL="$BASE_URL/test-dmit?url=$ENCODED_URL"

echo "请求 URL: $TEST_URL"
echo ""

# 发起请求并保存响应
RESPONSE=$(curl -s "$TEST_URL")

# 解析响应
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 测试成功！${NC}"
  echo ""
  echo "📊 库存状态:"
  echo "$RESPONSE" | jq '.status'
  echo ""
  echo "⏱️  响应时间:"
  echo "$RESPONSE" | jq -r '.duration'
  echo ""

  IN_STOCK=$(echo "$RESPONSE" | jq -r '.status.inStock')
  if [ "$IN_STOCK" = "true" ]; then
    echo -e "${GREEN}🎉 有货！${NC}"
  else
    echo -e "${YELLOW}⚠️  缺货${NC}"
  fi
else
  echo -e "${RED}❌ 测试失败${NC}"
  echo ""
  echo "错误信息:"
  echo "$RESPONSE" | jq -r '.error'
  echo ""

  # 检查是否是 403 错误
  if echo "$RESPONSE" | grep -q "403"; then
    echo -e "${YELLOW}💡 提示:${NC}"
    echo "  - 仍然被 Cloudflare 拦截"
    echo "  - 可能需要使用 Browser Rendering 或代理服务"
    echo "  - 参考: DMIT_CLOUDFLARE_SOLUTION.md"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 显示完整响应
echo "完整响应 (JSON):"
echo "$RESPONSE" | jq .
