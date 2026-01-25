# VPS 库存监控服务 - 开发文档

## 项目概览

本项目用于监控 VPS 商家库存变化并通过通知渠道推送消息。当前阶段以 **Dmit** 商家为首个支持目标，后续可通过 Provider 模式扩展其他商家。

### 核心特性

- **定时监控**：使用 Cloudflare Cron Triggers 定期检查库存
- **智能通知**：仅在库存状态变化时推送通知，避免重复打扰
- **多数据源支持**：Provider 架构支持 API、JSON、HTML 等多种数据源
- **轻量部署**：基于 Cloudflare Workers，无需服务器维护

### 技术栈

- **运行时**：Cloudflare Workers
- **语言**：TypeScript
- **Web 框架**：Hono（轻量级，专为 Workers 优化）
- **存储**：Cloudflare KV（键值存储）
- **通知**：Telegram Bot API

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Workers                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │  Cron Job    │─────▶│  Monitor     │                     │
│  │  (定时触发)   │      │  Service     │                     │
│  └──────────────┘      └──────┬───────┘                     │
│                                │                              │
│  ┌──────────────┐             │        ┌──────────────┐     │
│  │  API Routes  │◀────────────┼───────▶│  KV Storage  │     │
│  │  (配置管理)   │             │        │  (状态存储)   │     │
│  └──────────────┘             │        └──────────────┘     │
│                                │                              │
│                         ┌──────▼───────┐                     │
│                         │  Providers   │                     │
│                         │  (数据获取)   │                     │
│                         └──────┬───────┘                     │
│                                │                              │
│                         ┌──────▼───────┐                     │
│                         │  Notifier    │                     │
│                         │  (消息推送)   │                     │
│                         └──────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                          Telegram Bot API
```

### 数据流程

1. **配置阶段**：通过 API 添加监控目标 → 存储到 KV
2. **监控阶段**：
   - Cron Trigger 定时触发
   - 从 KV 读取所有启用的监控目标
   - Provider 获取当前库存状态
   - 与 KV 中的上次状态比对
   - 检测到变化时触发通知
   - 更新 KV 中的最新状态

---

## 项目结构

```
vps-stock-monitor/
├── src/
│   ├── index.ts              # Hono 应用入口
│   ├── routes/
│   │   ├── api.ts            # API 路由（配置管理、手动触发）
│   │   └── ui.ts             # 可选：简单配置 UI
│   ├── jobs/
│   │   └── cron.ts           # Cron 任务入口
│   ├── providers/
│   │   ├── base.ts           # Provider 基类和接口
│   │   └── dmit.ts           # Dmit Provider（待实现）
│   ├── services/
│   │   ├── monitor.ts        # 监控服务核心逻辑
│   │   ├── notifier.ts       # 通知服务（Telegram）
│   │   └── storage.ts        # KV 存储封装
│   ├── models/
│   │   └── types.ts          # TypeScript 类型定义
│   └── utils/
│       ├── http.ts           # HTTP 请求封装
│       └── parser.ts         # 通用解析工具
├── wrangler.toml             # Cloudflare Workers 配置
├── package.json
├── tsconfig.json
├── DEV.md                    # 本文档
└── README.md
```

---

## 数据模型

### MonitorTarget（监控目标）

```typescript
type MonitorTarget = {
  id: string                    // 唯一标识符
  provider: string              // Provider ID（如 "dmit"）
  url: string                   // 监控的 URL
  region?: string               // 地区（如 "us-west"）
  plan?: string                 // 套餐名称（如 "premium"）
  sourceType?: "auto" | "api" | "json" | "html"  // 数据源类型
  enabled: boolean              // 是否启用

  // 通知策略（可选，未设置时使用全局配置）
  notifyOnRestock?: boolean     // 补货时通知
  notifyOnOutOfStock?: boolean  // 缺货时通知
  notifyOnPriceChange?: boolean // 价格变化时通知
  minNotifyInterval?: number    // 最小通知间隔（分钟）

  createdAt: string             // 创建时间
  updatedAt: string             // 更新时间
}
```

### StockStatus（库存状态）

```typescript
type StockStatus = {
  inStock: boolean              // 是否有库存
  qty?: number                  // 库存数量（如果可获取）
  price?: number                // 价格（如果可获取）
  region?: string               // 地区
  rawSource?: string            // 原始数据片段（截断至 500 字符，用于调试）
  timestamp: string             // 检查时间
}
```

**注意**：`rawSource` 应仅保存关键数据片段的截断版本（建议不超过 500 字符），避免 KV 存储膨胀和敏感信息泄露。

### MonitorState（监控状态）

```typescript
type MonitorState = {
  targetId: string              // 关联的监控目标 ID
  lastStatus?: StockStatus      // 上次检查的状态
  lastCheckedAt?: string        // 上次检查时间
  lastNotifiedAt?: string       // 上次通知时间
  errorCount: number            // 连续错误次数
  lastError?: string            // 最后一次错误信息
}
```

### GlobalConfig（全局配置）

```typescript
type GlobalConfig = {
  // 通知策略（目标级配置可覆盖）
  notifyOnRestock: boolean      // 默认：补货时通知
  notifyOnOutOfStock: boolean   // 默认：缺货时通知
  notifyOnPriceChange: boolean  // 默认：价格变化时通知
  minNotifyInterval: number     // 默认：最小通知间隔（分钟）

  // 监控配置
  maxErrorCount: number         // 连续错误次数阈值，超过后暂停目标
  requestTimeout: number        // 请求超时时间（秒）
}
```

**默认值建议**：
```typescript
const DEFAULT_CONFIG: GlobalConfig = {
  notifyOnRestock: true,
  notifyOnOutOfStock: false,
  notifyOnPriceChange: false,
  minNotifyInterval: 60,        // 1 小时
  maxErrorCount: 5,
  requestTimeout: 10,
}
```

**注意**：当 KV 中不存在全局配置时，应使用 `DEFAULT_CONFIG` 作为回退值。

---

## Provider 设计

### 接口定义

Provider 用于屏蔽不同数据源的获取方式，统一输出标准化的库存状态。

```typescript
interface Provider {
  /** Provider 唯一标识 */
  id: string

  /** Provider 名称 */
  name: string

  /** 判断是否支持该监控目标 */
  supports(target: MonitorTarget): boolean

  /** 获取库存状态 */
  fetchStatus(target: MonitorTarget): Promise<StockStatus>
}
```

### 实现策略

每个 Provider 内部可以根据实际情况选择最合适的数据获取方式：

1. **API 接口**（优先级最高）
   - 稳定性好，结构化数据
   - 示例：`https://api.example.com/stock?sku=xxx`

2. **页面内嵌 JSON**（优先级中等）
   - 从 HTML 中提取 `<script type="application/json">` 或 `window.__INITIAL_STATE__`
   - 比 HTML 解析更稳定

3. **HTML 解析**（优先级最低）
   - 最脆弱，页面改版即失效
   - 仅作为兜底方案

### 最佳实践

- 记录 `rawSource` 用于调试和问题排查
- 实现合理的超时和重试机制
- 处理网络错误和解析异常
- 添加日志记录关键步骤

---

## Dmit Provider（待确认）

### 当前状态

⚠️ **Dmit 的具体实现方式尚未确认，需要先进行以下调研：**

1. 访问 Dmit 官网，找到 VPS 产品页面
2. 使用浏览器开发者工具抓包，分析网络请求
3. 确认库存信息的获取方式：
   - 是否有专门的 API 接口？
   - 页面是否内嵌 JSON 数据？
   - 是否需要解析 HTML？
4. 确认库存判断逻辑：
   - 如何判断有/无库存？
   - 库存数量是否可获取？
   - 价格信息是否可获取？

### 实现计划

```typescript
// src/providers/dmit.ts

export class DmitProvider implements Provider {
  id = "dmit"
  name = "Dmit"

  supports(target: MonitorTarget): boolean {
    // 判断 URL 是否为 Dmit 域名
    return target.url.includes("dmit.io")
  }

  async fetchStatus(target: MonitorTarget): Promise<StockStatus> {
    // TODO: 根据调研结果实现
    // 1. 发起 HTTP 请求
    // 2. 解析响应数据
    // 3. 提取库存信息
    // 4. 返回标准化的 StockStatus
    throw new Error("Not implemented yet")
  }
}
```

---

## API 设计

### 鉴权

**推荐方案**：Cloudflare Access + API Key 双重保护

1. **Cloudflare Access**（外层保护）
   - 在 Cloudflare Dashboard 中为 Worker 配置 Access 策略
   - 仅允许特定邮箱或 IP 访问
   - 零代码改动，安全边界清晰

2. **API Key**（应用层兜底）
   - 在请求头中添加 `X-API-Key`
   - 与环境变量 `API_KEY` 比对
   - 便于脚本和本地调用

**请求示例**：
```bash
curl -H "X-API-Key: your-secret-key" \
  https://your-worker.workers.dev/api/targets
```

**错误响应**：
```json
{
  "success": false,
  "error": "Unauthorized",
  "code": 401
}
```

### 统一响应格式

**成功响应**：
```json
{
  "success": true,
  "data": { /* 响应数据 */ }
}
```

**错误响应**：
```json
{
  "success": false,
  "error": "错误信息",
  "code": 400  // HTTP 状态码
}
```

### 监控目标管理

#### 获取所有监控目标

```
GET /api/targets
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "id": "target-1",
      "provider": "dmit",
      "url": "https://www.dmit.io/cart.php?a=add&pid=123",
      "region": "us-west",
      "enabled": true,
      "createdAt": "2026-01-25T10:00:00Z"
    }
  ]
}
```

#### 添加监控目标

```
POST /api/targets
Content-Type: application/json

{
  "provider": "dmit",
  "url": "https://www.dmit.io/cart.php?a=add&pid=123",
  "region": "us-west",
  "enabled": true
}
```

#### 删除监控目标

```
DELETE /api/targets/:id
```

### 手动触发检查

#### 检查所有目标

```
POST /api/check
```

#### 检查单个目标

```
POST /api/check/:id
```

### 状态查询

#### 获取所有状态

```
GET /api/status
```

响应示例：
```json
{
  "success": true,
  "data": [
    {
      "targetId": "target-1",
      "lastStatus": {
        "inStock": true,
        "timestamp": "2026-01-25T10:30:00Z"
      },
      "lastCheckedAt": "2026-01-25T10:30:00Z"
    }
  ]
}
```

#### 获取单个状态

```
GET /api/status/:id
```

---

## 监控逻辑

### 核心流程

```typescript
async function checkAllTargets() {
  // 1. 从 KV 读取所有启用的监控目标
  const targets = await storage.getEnabledTargets()
  const config = await storage.getGlobalConfig()

  for (const target of targets) {
    try {
      // 2. 获取当前库存状态
      const provider = getProvider(target.provider)
      const currentStatus = await provider.fetchStatus(target)

      // 3. 读取上次状态（如果不存在则初始化）
      let state = await storage.getState(target.id)
      if (!state) {
        state = {
          targetId: target.id,
          errorCount: 0,
        }
      }

      // 4. 判断是否需要通知
      const shouldSendNotification = shouldNotify(
        target,
        state.lastStatus,
        currentStatus,
        config
      ) && canNotify(target, state, config)

      if (shouldSendNotification) {
        // 5. 发送通知
        await notifier.notify(target, currentStatus)

        // 6. 更新通知时间
        state.lastNotifiedAt = new Date().toISOString()
      }

      // 7. 更新状态
      state.lastStatus = currentStatus
      state.lastCheckedAt = new Date().toISOString()
      state.errorCount = 0
      state.lastError = undefined
      await storage.saveState(target.id, state)

    } catch (error) {
      // 8. 错误处理
      await handleError(target.id, error)
    }
  }
}
```

### 通知策略

通知策略由全局配置和目标级配置共同决定（目标级配置优先）。

#### 通知触发条件

```typescript
function shouldNotify(
  target: MonitorTarget,
  lastStatus: StockStatus | undefined,
  currentStatus: StockStatus,
  config: GlobalConfig
): boolean {
  // 获取有效配置（目标级覆盖全局）
  const notifyOnRestock = target.notifyOnRestock ?? config.notifyOnRestock
  const notifyOnOutOfStock = target.notifyOnOutOfStock ?? config.notifyOnOutOfStock
  const notifyOnPriceChange = target.notifyOnPriceChange ?? config.notifyOnPriceChange

  // 首次检查且有库存
  if (!lastStatus && currentStatus.inStock && notifyOnRestock) {
    return true
  }

  if (lastStatus) {
    // 从无库存到有库存
    if (!lastStatus.inStock && currentStatus.inStock && notifyOnRestock) {
      return true
    }

    // 从有库存到无库存
    if (lastStatus.inStock && !currentStatus.inStock && notifyOnOutOfStock) {
      return true
    }

    // 价格变化
    if (
      notifyOnPriceChange &&
      lastStatus.price != null &&
      currentStatus.price != null &&
      lastStatus.price !== currentStatus.price
    ) {
      return true
    }
  }

  return false
}
```

#### 通知频率限制

```typescript
function canNotify(
  target: MonitorTarget,
  state: MonitorState,
  config: GlobalConfig
): boolean {
  if (!state.lastNotifiedAt) return true

  const minInterval = target.minNotifyInterval ?? config.minNotifyInterval
  const lastNotified = new Date(state.lastNotifiedAt)
  const now = new Date()
  const minutesSinceLastNotify = (now.getTime() - lastNotified.getTime()) / 60000

  return minutesSinceLastNotify >= minInterval
}
```

**策略说明**：
- **从无库存到有库存**：默认通知（最常见需求）
- **从有库存到无库存**：默认不通知（避免噪音）
- **价格变化**：默认不通知（可按需启用）
- **频率限制**：默认 1 小时内同一目标最多通知 1 次

### 错误处理

- **网络错误**：记录错误次数，超过阈值后暂停该目标
- **解析错误**：记录 `rawSource`，便于调试
- **超时**：设置合理的超时时间（如 10 秒）

---

## 配置与部署

### 环境变量

在 `wrangler.toml` 或 `.dev.vars` 中配置：

```toml
[vars]
API_KEY = "your-secret-api-key"
TELEGRAM_BOT_TOKEN = "your-bot-token"
TELEGRAM_CHAT_ID = "your-chat-id"
```

**安全建议**：
- `API_KEY` 应使用强随机字符串（建议 32 字符以上）
- 生产环境建议使用 Cloudflare Secrets 存储敏感信息
- 配合 Cloudflare Access 使用，提供双重保护

### KV 命名空间

```toml
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### Cron Triggers

```toml
[triggers]
crons = ["*/5 * * * *"]  # 每 5 分钟执行一次
```

### 本地开发

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   创建 `.dev.vars` 文件：
   ```
   API_KEY=your-secret-api-key
   TELEGRAM_BOT_TOKEN=your-bot-token
   TELEGRAM_CHAT_ID=your-chat-id
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **测试 API**
   ```bash
   # 添加监控目标
   curl -X POST http://localhost:8787/api/targets \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-secret-api-key" \
     -d '{"provider":"dmit","url":"https://example.com","enabled":true}'

   # 手动触发检查
   curl -X POST http://localhost:8787/api/check \
     -H "X-API-Key: your-secret-api-key"
   ```

### 部署到生产环境

1. **配置 wrangler.toml**
   ```toml
   name = "vps-stock-monitor"
   main = "src/index.ts"
   compatibility_date = "2024-01-01"

   [vars]
   API_KEY = "your-secret-api-key"
   TELEGRAM_BOT_TOKEN = "your-bot-token"
   TELEGRAM_CHAT_ID = "your-chat-id"

   [[kv_namespaces]]
   binding = "KV"
   id = "your-kv-namespace-id"

   [triggers]
   crons = ["*/5 * * * *"]
   ```

2. **部署**
   ```bash
   npm run deploy
   ```

3. **验证**
   - 访问 Worker URL 确认服务正常
   - 检查 Cloudflare Dashboard 中的 Cron Triggers 是否生效
   - 添加测试目标并观察通知

---

## Cloudflare Workers 限制

⚠️ **重要提示**：以下数值为参考，具体限制以 [Cloudflare 官方文档](https://developers.cloudflare.com/workers/platform/limits/) 和当前套餐为准。

### 运行时限制

- **CPU 时间**：免费版约 10ms，付费版约 50ms（具体以套餐为准）
- **内存**：128MB
- **请求大小**：最大 100MB
- **响应大小**：无硬性限制，但受 CPU 时间影响

### KV 限制

- **读取延迟**：通常 < 100ms（边缘节点缓存）
- **写入一致性**：最终一致性，不保证立即全球同步
- **键大小**：最大 512 字节
- **值大小**：最大 25MB
- **操作配额**：免费版有每日读写次数限制

**注意**：KV 写入后立即读取可能读不到最新数据。对于需要强一致性的场景，考虑使用 Durable Objects。

### Cron Triggers 限制

- **最小间隔**：1 分钟
- **执行超时**：与普通请求相同的 CPU 时间限制
- **并发**：可能出现重叠触发，必要时使用 KV 或 Durable Objects 实现去重锁

### 应对策略

- **轻量解析**：避免复杂的 DOM 解析，优先使用 JSON
- **并发控制**：限制同时检查的目标数量
- **超时设置**：为每个请求设置合理的超时时间
- **缓存策略**：对不变的数据进行缓存
- **分批处理**：如果目标过多，考虑分批检查

---

## 风险与挑战

### 技术风险

1. **JavaScript 渲染**
   - Workers 无法执行 JavaScript
   - 必须通过 API/JSON/HTML 获取数据
   - 解决方案：优先寻找 API 接口

2. **反爬机制**
   - 可能被商家识别为爬虫
   - IP 可能被封禁
   - 解决方案：降低检查频率，添加合理的 User-Agent

3. **页面结构变化**
   - HTML 解析容易失效
   - 解决方案：优先使用 API，添加监控告警

### 业务风险

1. **通知延迟**
   - KV 最终一致性可能导致延迟
   - Cron 最小间隔 1 分钟
   - 解决方案：设置合理的预期

2. **误报/漏报**
   - 网络波动可能导致误判
   - 解决方案：添加重试机制，记录历史状态

---

## 未来计划

### 短期（MVP 后）

- [ ] 完善 Dmit Provider 实现
- [ ] 添加更多通知渠道（邮件、Discord）
- [ ] 实现简单的配置 UI
- [ ] 添加监控日志和统计

### 中期

- [ ] 支持更多 VPS 商家（Vultr、Hetzner、Linode）
- [ ] 实现智能通知策略（时间窗口、频率限制）
- [ ] 添加历史数据记录（使用 D1）
- [ ] 支持自定义通知模板

### 长期

- [ ] 多用户支持
- [ ] Webhook 集成
- [ ] 价格趋势分析
- [ ] 移动端 App

---

## 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用有意义的变量和函数名
- 添加必要的注释和文档

### 提交规范

- 使用语义化的提交信息
- 格式：`<type>: <description>`
- 类型：feat, fix, docs, style, refactor, test, chore

### 测试

- 为核心逻辑编写单元测试
- 为 API 编写集成测试
- 在部署前进行手动测试

---

## 常见问题

### Q: 如何获取 Telegram Bot Token？

A:
1. 在 Telegram 中搜索 @BotFather
2. 发送 `/newbot` 创建新机器人
3. 按提示设置名称和用户名
4. 获取 Bot Token

### Q: 如何获取 Telegram Chat ID？

A:
1. 向你的机器人发送一条消息
2. 访问 `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. 在响应中找到 `chat.id`

### Q: 如何调试 Cron Triggers？

A:
- 本地开发时 Cron 不会自动触发
- 使用手动触发 API 进行测试
- 部署后在 Cloudflare Dashboard 查看 Cron 执行日志

### Q: KV 写入后立即读取不到数据？

A:
- KV 是最终一致性存储，不保证立即全球同步
- 写入后在同一边缘节点通常能立即读取，但跨地区可能有延迟
- 对于需要强一致性的场景，考虑使用 Durable Objects

---

## 参考资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Hono 框架文档](https://hono.dev/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)

---

**文档版本**：v1.0
**最后更新**：2026-01-25
**维护者**：开发团队
