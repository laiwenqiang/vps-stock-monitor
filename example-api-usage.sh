#!/bin/bash

# VPS Stock Monitor API 使用示例
# 演示如何使用 API 管理监控目标

set -e

# 配置
BASE_URL="${BASE_URL:-http://localhost:8787}"
API_KEY="${API_KEY:-your-api-key}"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  VPS Stock Monitor API 使用示例"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 配置:"
echo "  Base URL: $BASE_URL"
echo "  API Key:  ${API_KEY:0:10}..."
echo ""

# 1. 创建监控目标
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1️⃣  创建监控目标${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TARGET_ID=$(curl -s -X POST "$BASE_URL/api/targets" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "dmit",
    "url": "https://www.dmit.io/cart.php?gid=1",
    "region": "us-west",
    "plan": "Premium",
    "enabled": true,
    "notifyOnRestock": true,
    "notifyOnOutOfStock": false,
    "notifyOnPriceChange": false,
    "minNotifyInterval": 60
  }' | jq -r '.data.id')

if [ -n "$TARGET_ID" ] && [ "$TARGET_ID" != "null" ]; then
  echo -e "${GREEN}✅ 创建成功${NC}"
  echo "Target ID: $TARGET_ID"
else
  echo -e "${YELLOW}⚠️  创建失败或目标已存在${NC}"
  # 获取第一个目标的 ID
  TARGET_ID=$(curl -s "$BASE_URL/api/targets" \
    -H "X-API-Key: $API_KEY" | jq -r '.data[0].id')
  echo "使用现有 Target ID: $TARGET_ID"
fi

echo ""

# 2. 获取所有监控目标
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2️⃣  获取所有监控目标${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

curl -s "$BASE_URL/api/targets" \
  -H "X-API-Key: $API_KEY" | jq '.data[] | {id, provider, url, enabled}'

echo ""

# 3. 手动检查库存
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3️⃣  手动检查库存${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$TARGET_ID" ] && [ "$TARGET_ID" != "null" ]; then
  RESULT=$(curl -s -X POST "$BASE_URL/api/check/$TARGET_ID" \
    -H "X-API-Key: $API_KEY")

  SUCCESS=$(echo "$RESULT" | jq -r '.success')

  if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ 检查成功${NC}"
    echo "$RESULT" | jq '.data'
  else
    echo -e "${YELLOW}⚠️  检查失败${NC}"
    echo "$RESULT" | jq '.error'
  fi
else
  echo -e "${YELLOW}⚠️  没有可用的目标${NC}"
fi

echo ""

# 4. 查看监控状态
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4️⃣  查看监控状态${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

curl -s "$BASE_URL/api/status" \
  -H "X-API-Key: $API_KEY" | jq '.data[] | {
    targetId: .target.id,
    url: .target.url,
    inStock: .state.lastStatus.inStock,
    lastChecked: .state.lastCheckedAt,
    errorCount: .state.errorCount
  }'

echo ""

# 5. 更新监控目标
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5️⃣  更新监控目标（禁用）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$TARGET_ID" ] && [ "$TARGET_ID" != "null" ]; then
  curl -s -X PATCH "$BASE_URL/api/targets/$TARGET_ID" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "enabled": false
    }' | jq '.data | {id, enabled}'

  echo -e "${GREEN}✅ 更新成功${NC}"
else
  echo -e "${YELLOW}⚠️  没有可用的目标${NC}"
fi

echo ""

# 6. 删除监控目标（可选）
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6️⃣  删除监控目标（跳过）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "如需删除，运行:"
echo "  curl -X DELETE $BASE_URL/api/targets/$TARGET_ID -H \"X-API-Key: $API_KEY\""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  示例完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 提示:"
echo "  - 设置环境变量: export BASE_URL=https://your-worker.workers.dev"
echo "  - 设置 API Key: export API_KEY=your-api-key"
echo "  - 查看 API 文档: doc/API.md"
