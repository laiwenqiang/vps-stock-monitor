# VPS Stock Monitor API 文档

## 概述

VPS Stock Monitor 是一个运行在 Cloudflare Workers 上的 VPS 库存监控服务，支持自动检查库存变化并通过 Telegram 发送通知。

## 功能特性

- ✅ 多 Provider 支持（当前支持 Dmit）
- ✅ 自动定时检查（Cron）
- ✅ Telegram 通知
- ✅ RESTful API
- ✅ KV 存储
- ✅ 灵活的通知策略

## API 端点

### 认证

所有 `/api/*` 端点需要 API Key 认证：

```bash
curl -H "X-API-Key: your-api-key" https://your-worker.workers.dev/api/targets
```

### 监控目标管理

#### 获取所有监控目标

```http
GET /api/targets
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1234567890-abc123",
      "provider": "dmit",
      "url": "https://www.dmit.io/cart.php?gid=1",
      "region": "us-west",
      "plan": "premium",
      "enabled": true,
      "notifyOnRestock": true,
      "notifyOnOutOfStock": false,
      "notifyOnPriceChange": false,
      "minNotifyInterval": 60,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### 创建监控目标

```http
POST /api/targets
Content-Type: application/json

{
  "provider": "dmit",
  "url": "https://www.dmit.io/cart.php?gid=1",
  "region": "us-west",
  "plan": "premium",
  "enabled": true,
  "notifyOnRestock": true,
  "notifyOnOutOfStock": false,
  "notifyOnPriceChange": false,
  "minNotifyInterval": 60
}
```

**必填字段**:
- `provider`: Provider ID（如 "dmit"）
- `url`: 监控的 URL

**可选字段**:
- `region`: 地区标识
- `plan`: 套餐名称
- `sourceType`: 数据源类型（"auto" | "api" | "json" | "html"）
- `enabled`: 是否启用（默认 true）
- `notifyOnRestock`: 补货时通知（默认 true）
- `notifyOnOutOfStock`: 缺货时通知（默认 false）
- `notifyOnPriceChange`: 价格变化时通知（默认 false）
- `minNotifyInterval`: 最小通知间隔（分钟，默认 60）

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "1234567890-abc123",
    "provider": "dmit",
    "url": "https://www.dmit.io/cart.php?gid=1",
    ...
  }
}
```

#### 获取单个监控目标

```http
GET /api/targets/:id
```

#### 更新监控目标

```http
PATCH /api/targets/:id
Content-Type: application/json

{
  "enabled": false,
  "notifyOnRestock": true
}
```

#### 删除监控目标

```http
DELETE /api/targets/:id
```

### 状态查询

#### 获取所有监控状态

```http
GET /api/status
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "target": {
        "id": "1234567890-abc123",
        "provider": "dmit",
        ...
      },
      "state": {
        "targetId": "1234567890-abc123",
        "lastStatus": {
          "inStock": true,
          "price": 99.99,
          "timestamp": "2024-01-01T12:00:00.000Z"
        },
        "lastCheckedAt": "2024-01-01T12:00:00.000Z",
        "lastNotifiedAt": "2024-01-01T11:00:00.000Z",
        "errorCount": 0
      }
    }
  ],
  "count": 1
}
```

#### 获取单个目标状态

```http
GET /api/status/:id
```

### 手动检查

#### 检查所有目标

```http
POST /api/check
```

**响应**:
```json
{
  "success": true,
  "data": {
    "success": 5,
    "failed": 1,
    "results": [
      {
        "targetId": "1234567890-abc123",
        "success": true,
        "status": {
          "inStock": true,
          "price": 99.99,
          "timestamp": "2024-01-01T12:00:00.000Z"
        }
      }
    ]
  }
}
```

#### 检查单个目标

```http
POST /api/check/:id
```

**响应**:
```json
{
  "success": true,
  "data": {
    "status": {
      "inStock": true,
      "price": 99.99,
      "timestamp": "2024-01-01T12:00:00.000Z"
    },
    "duration": "2345ms",
    "notified": true,
    "notifyReason": "Restocked"
  }
}
```

### 测试端点（无需认证）

#### 测试 Dmit 库存检查

```http
GET /test-dmit?url=https://www.dmit.io/cart.php?gid=1
```

## 使用示例

### 1. 创建监控目标

```bash
curl -X POST https://your-worker.workers.dev/api/targets \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "dmit",
    "url": "https://www.dmit.io/cart.php?gid=1",
    "region": "us-west",
    "plan": "Premium",
    "enabled": true,
    "notifyOnRestock": true,
    "minNotifyInterval": 60
  }'
```

### 2. 查看所有监控目标

```bash
curl https://your-worker.workers.dev/api/targets \
  -H "X-API-Key: your-api-key"
```

### 3. 手动检查库存

```bash
curl -X POST https://your-worker.workers.dev/api/check/1234567890-abc123 \
  -H "X-API-Key: your-api-key"
```

### 4. 更新监控目标

```bash
curl -X PATCH https://your-worker.workers.dev/api/targets/1234567890-abc123 \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'
```

### 5. 删除监控目标

```bash
curl -X DELETE https://your-worker.workers.dev/api/targets/1234567890-abc123 \
  -H "X-API-Key: your-api-key"
```

## 通知配置

### Telegram 通知

在 `.dev.vars` 或 Cloudflare Workers 环境变量中配置：

```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### 通知触发条件

1. **补货通知** (`notifyOnRestock: true`)
   - 上次检查：缺货
   - 本次检查：有货
   - 触发：发送通知

2. **缺货通知** (`notifyOnOutOfStock: true`)
   - 上次检查：有货
   - 本次检查：缺货
   - 触发：发送通知

3. **价格变化通知** (`notifyOnPriceChange: true`)
   - 价格发生变化
   - 触发：发送通知

### 通知间隔

通过 `minNotifyInterval` 控制最小通知间隔（分钟），避免频繁通知。

## 定时任务

在 `wrangler.toml` 中配置 Cron 触发器：

```toml
[triggers]
crons = ["*/5 * * * *"]  # 每 5 分钟执行一次
```

定时任务会：
1. 检查所有启用的监控目标
2. 比较库存状态变化
3. 根据配置发送通知
4. 更新状态到 KV

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": "Error message"
}
```

### 常见错误

- `401 Unauthorized`: API Key 无效
- `404 Not Found`: 目标不存在
- `500 Internal Server Error`: 服务器错误

### 错误计数

系统会记录连续错误次数，超过阈值后可以自动禁用目标（待实现）。

## 开发

### 本地开发

```bash
# 启动开发服务器
npm run dev:remote

# 运行测试
npm test

# 类型检查
npm run lint
```

### 部署

```bash
npm run deploy
```

## 支持的 Provider

### Dmit

- **ID**: `dmit`
- **支持的 URL**: `https://www.dmit.io/*` 或 `https://*.dmit.io/*`
- **数据源**: API / Embedded JSON / HTML（自动检测）

## 限制

- KV 存储限制：免费计划 100,000 次读取/天
- Cron 触发器：最小间隔 1 分钟
- 请求超时：10 秒
- 建议检查间隔：5-10 分钟

## 最佳实践

1. **合理设置检查间隔**: 建议 5-10 分钟，避免过于频繁
2. **配置通知间隔**: 设置 `minNotifyInterval` 避免通知轰炸
3. **监控错误计数**: 定期检查 `errorCount`，及时处理失败的目标
4. **使用 sourceType**: 如果知道数据源类型，指定 `sourceType` 可以提高性能

## 故障排查

### 检查不到库存

1. 查看错误日志
2. 使用 `/test-dmit` 端点测试
3. 检查 URL 是否正确
4. 尝试不同的 `sourceType`

### 没有收到通知

1. 检查 Telegram 配置
2. 确认通知条件满足
3. 检查 `minNotifyInterval`
4. 查看 `lastNotifiedAt` 时间

### API 返回 503

检查环境变量配置，确保 `API_KEY` 已设置。

## 更多信息

- [快速开始](./QUICK_START.md)
- [本地测试指南](./LOCAL_TEST_SOLUTION.md)
- [测试报告](./TEST_REPORT.md)
