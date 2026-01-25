# VPS 库存监控服务

一个基于 Cloudflare Workers 的轻量级 VPS 库存监控服务，支持自动检测库存变化并通过 Telegram 推送通知。

**当前状态**：开发中（MVP 阶段）

## 特性（计划）

- 🔄 **自动监控**：使用 Cron Triggers 定期检查库存状态
- 📱 **即时通知**：库存变化时通过 Telegram Bot 推送消息
- 🎯 **智能过滤**：仅在状态变化时通知，避免重复打扰
- 🔌 **可扩展**：Provider 架构支持多个 VPS 商家
- ☁️ **无服务器**：部署在 Cloudflare Workers，无需维护服务器
- 🔒 **安全**：支持 API Key 和 Cloudflare Access 双重鉴权

## 当前支持

- 🔜 Dmit（开发中）
- 🔜 更多商家（Vultr、Hetzner、Linode 等）

## 快速开始

### 前置要求

- Node.js 18+
- Cloudflare 账号
- Telegram Bot Token

### 安装

```bash
# 克隆仓库
git clone <your-repo-url>
cd vps-stock-monitor

# 安装依赖
npm install

# 配置环境变量
# 创建 .dev.vars 文件并填入配置（见下方）
```

### 配置

创建 `.dev.vars` 文件：

```
API_KEY=your-secret-api-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

### 本地开发

```bash
npm run dev
```

### 部署

```bash
npm run deploy
```

## 自动测试与 CI/CD

### 本地测试

```bash
npm test
```

### GitHub Actions

仓库包含两个工作流：

- **CI**：所有分支/PR 运行 `npm run lint` 和 `npm test`
- **Deploy**：`main` 分支自动部署

在 GitHub 仓库 `Settings → Secrets and variables → Actions` 中添加：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 使用方法

### 添加监控目标

```bash
curl -X POST https://your-worker.workers.dev/api/targets \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{
    "provider": "dmit",
    "url": "https://www.dmit.io/cart.php?a=add&pid=123",
    "region": "us-west",
    "enabled": true
  }'
```

### 查看监控状态

```bash
curl -H "X-API-Key: your-secret-api-key" \
  https://your-worker.workers.dev/api/status
```

### 手动触发检查

```bash
curl -X POST -H "X-API-Key: your-secret-api-key" \
  https://your-worker.workers.dev/api/check
```

## 架构

```
Cloudflare Workers
├── Cron Trigger (定时监控)
├── API Routes (配置管理)
├── Providers (数据获取)
│   └── Dmit Provider
├── Monitor Service (监控逻辑)
├── Notifier (消息推送)
└── KV Storage (状态存储)
```

## 文档

- [开发文档](./DEV.md) - 详细的开发指南和 API 文档
- [项目说明](./CLAUDE.md) - 项目上下文和协作指南

## 配置选项

### 全局配置

- `notifyOnRestock`: 补货时通知（默认：true）
- `notifyOnOutOfStock`: 缺货时通知（默认：false）
- `notifyOnPriceChange`: 价格变化时通知（默认：false）
- `minNotifyInterval`: 最小通知间隔（默认：60 分钟）

### 目标级配置

每个监控目标可以覆盖全局配置，实现个性化通知策略。

## 技术栈

- **运行时**: Cloudflare Workers
- **语言**: TypeScript
- **框架**: Hono
- **存储**: Cloudflare KV
- **通知**: Telegram Bot API

## 限制

⚠️ **以下数值为参考，具体以 Cloudflare 官方文档为准**

- Cron 最小间隔：1 分钟
- CPU 时间：免费版约 10ms，付费版约 50ms
- KV 存储：最终一致性

详见 [开发文档 - Cloudflare Workers 限制](./DEV.md#cloudflare-workers-限制)

## 路线图

- [x] 基础架构设计
- [x] 开发文档编写
- [ ] Dmit Provider 实现
- [ ] Telegram 通知集成
- [ ] 配置 UI
- [ ] 更多 VPS 商家支持
- [ ] 历史数据记录

## 贡献

欢迎提交 Issue 和 Pull Request！

**注意**：项目当前处于 MVP 开发阶段，核心功能尚未完成。

## 许可证

MIT License

## 常见问题

### 如何获取 Telegram Bot Token？

1. 在 Telegram 中搜索 @BotFather
2. 发送 `/newbot` 创建新机器人
3. 按提示设置名称和用户名
4. 获取 Bot Token

### 如何获取 Telegram Chat ID？

1. 向你的机器人发送一条消息
2. 访问 `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. 在响应中找到 `chat.id`

### 为什么收不到通知？

1. 检查 Telegram Bot Token 和 Chat ID 是否正确
2. 确认监控目标已启用（`enabled: true`）
3. 检查 Cloudflare Dashboard 中的 Cron 执行日志
4. 查看是否触发了通知频率限制

## 联系方式

- 提交 Issue: GitHub Issues（待配置）

---

**注意**：本项目仅供学习和个人使用，请遵守目标网站的服务条款和爬虫政策。
