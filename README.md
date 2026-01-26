# VPS 库存监控服务

一个基于 Cloudflare Workers 的轻量级 VPS 库存监控服务，支持自动检测库存变化并通过 Telegram 推送通知。

**当前状态**：✅ **生产就绪** - 核心功能已完成并测试

## ✨ 特性

- 🔄 **自动监控**：使用 Cron Triggers 定期检查库存状态（每 5 分钟）
- 📱 **即时通知**：库存变化时通过 Telegram Bot 推送消息
- 🎯 **智能过滤**：仅在状态变化时通知，避免重复打扰
- 🔌 **可扩展**：Provider 架构支持多个 VPS 商家
- ☁️ **无服务器**：部署在 Cloudflare Workers，无需维护服务器
- 🔒 **安全**：API Key 认证保护
- 📊 **状态追踪**：KV 存储记录检查历史和错误
- 🚀 **高性能**：并发检查，响应快速

## 🎯 当前支持

- ✅ **Dmit** - 完整实现并测试
  - 多源解析（API/JSON/HTML）
  - 自动回退策略
  - 超时控制
  - 反爬虫处理
- 🔜 更多商家（Vultr、Hetzner、Linode 等）

## 📊 项目状态

- ✅ Dmit Provider 实现（29 个单元测试，100% 通过）
- ✅ RESTful API（完整的 CRUD 操作）
- ✅ KV 存储集成
- ✅ Telegram 通知
- ✅ 定时任务（Cron）
- ✅ 完整文档（10+ 文档文件）
- ✅ 测试工具和示例

## 🚀 快速开始

### 前置要求

- Node.js 20+
- Cloudflare 账号
- Telegram Bot Token（可选，用于通知）

### 安装

```bash
# 克隆仓库
git clone https://github.com/laiwenqiang/vps-stock-monitor.git
cd vps-stock-monitor

# 安装依赖
npm install

# 配置环境变量
# 创建 .dev.vars 文件并填入配置（见下方）
```

### 配置

创建 `.dev.vars` 文件：

```env
API_KEY=your-secret-api-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

### 本地开发

```bash
# 本地开发（推荐）
npm run dev:remote

# 或本地模式
npm run dev
```

### 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 只测试 Dmit
npm run test:dmit

# 类型检查
npm run lint
```

### 部署

```bash
# 1. 创建 KV Namespace
npx wrangler kv:namespace create KV
npx wrangler kv:namespace create KV --preview

# 2. 更新 wrangler.toml 中的 KV ID

# 3. 部署
npm run deploy
```

## 📖 使用方法

### 1. 创建监控目标

```bash
curl -X POST https://your-worker.workers.dev/api/targets \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
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
curl -H "X-API-Key: your-secret-api-key" \
  https://your-worker.workers.dev/api/targets
```

### 3. 查看监控状态

```bash
curl -H "X-API-Key: your-secret-api-key" \
  https://your-worker.workers.dev/api/status
```

### 4. 手动检查库存

```bash
curl -X POST -H "X-API-Key: your-secret-api-key" \
  https://your-worker.workers.dev/api/check/target-id
```

### 5. 测试 Dmit 库存（无需认证）

```bash
curl "https://your-worker.workers.dev/test-dmit?url=https://www.dmit.io/cart.php?gid=1"
```

## 📚 API 文档

完整的 API 文档请查看：[doc/API.md](./doc/API.md)

### 主要端点

#### 目标管理
- `GET /api/targets` - 获取所有监控目标
- `POST /api/targets` - 创建监控目标
- `GET /api/targets/:id` - 获取单个目标
- `PATCH /api/targets/:id` - 更新目标
- `DELETE /api/targets/:id` - 删除目标

#### 状态查询
- `GET /api/status` - 获取所有监控状态
- `GET /api/status/:id` - 获取单个状态

#### 手动检查
- `POST /api/check` - 检查所有目标
- `POST /api/check/:id` - 检查单个目标

#### 测试
- `GET /test-dmit?url=...` - 测试 Dmit 库存检查

## 🏗️ 架构

```
Cloudflare Workers
├── Cron Trigger (定时监控)
├── API Routes (配置管理)
│   ├── 目标管理 (CRUD)
│   ├── 状态查询
│   └── 手动检查
├── Services
│   ├── Monitor Service (监控逻辑)
│   ├── Storage Service (KV 存储)
│   └── Notification Service (通知)
├── Providers (数据获取)
│   └── Dmit Provider ✅
└── KV Storage (状态存储)
```

## 📁 项目结构

```
vps-stock-monitor/
├── src/
│   ├── index.ts                 # 主入口，路由定义
│   ├── models/
│   │   └── types.ts            # 类型定义
│   ├── providers/
│   │   ├── base.ts             # Provider 接口
│   │   ├── dmit.ts             # Dmit Provider
│   │   └── dmit.test.ts        # 测试（29 个）
│   └── services/
│       ├── storage.ts          # KV 存储服务
│       ├── monitor.ts          # 监控服务
│       └── notification.ts     # 通知服务
├── doc/                         # 文档目录
│   ├── API.md                  # API 文档
│   ├── QUICK_START.md          # 快速开始
│   ├── IMPLEMENTATION_SUMMARY.md # 实现总结
│   └── ...                     # 更多文档
├── test-*.ts                    # 测试脚本
├── example-api-usage.sh         # API 使用示例
└── package.json
```

## 📖 文档

### 用户文档
- [快速开始指南](./doc/QUICK_START.md) ⭐
- [API 文档](./doc/API.md) ⭐
- [本地测试方案](./doc/LOCAL_TEST_SOLUTION.md)

### 开发文档
- [实现总结](./doc/IMPLEMENTATION_SUMMARY.md) ⭐
- [本地开发指南](./doc/LOCAL_DEV_GUIDE.md)
- [Workers 测试指南](./doc/CLOUDFLARE_WORKERS_TEST.md)

### 测试报告
- [测试报告](./doc/TEST_REPORT.md)
- [验证报告](./doc/DMIT_PROVIDER_VERIFICATION.md)
- [状态总结](./doc/README_DMIT_STATUS.md)

## 🔧 配置选项

### 全局配置

- `notifyOnRestock`: 补货时通知（默认：true）
- `notifyOnOutOfStock`: 缺货时通知（默认：false）
- `notifyOnPriceChange`: 价格变化时通知（默认：false）
- `minNotifyInterval`: 最小通知间隔（默认：60 分钟）

### 目标级配置

每个监控目标可以覆盖全局配置，实现个性化通知策略。

## 🛠️ 技术栈

- **运行时**: Cloudflare Workers
- **语言**: TypeScript
- **框架**: Hono (轻量级 Web 框架)
- **存储**: Cloudflare KV
- **通知**: Telegram Bot API
- **测试**: Vitest

## ⚠️ 限制

- **KV 存储**: 免费计划 100,000 次读取/天
- **Cron 触发器**: 最小间隔 1 分钟
- **请求超时**: 10 秒
- **CPU 时间**: 免费版约 10ms，付费版约 50ms

详见 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)

## 🗺️ 路线图

- [x] 基础架构设计
- [x] 开发文档编写
- [x] Dmit Provider 实现
- [x] Telegram 通知集成
- [x] RESTful API
- [x] KV 存储
- [x] 定时任务
- [x] 完整测试
- [ ] Web 管理界面
- [ ] 更多 VPS 商家支持
- [ ] 邮件通知
- [ ] 统计分析

## 🧪 测试

### 单元测试

```bash
npm test
```

**结果**: 29/29 测试通过 ✅

### 真实测试

```bash
# 启动开发服务器
npm run dev:remote

# 测试 Dmit 库存
./test-dmit.sh
```

**结果**: 成功获取页面，无 403 拦截 ✅

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## ❓ 常见问题

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
3. 检查通知条件是否满足
4. 查看 `minNotifyInterval` 设置
5. 使用 `wrangler tail` 查看日志

### 如何添加新的 Provider？

查看 [实现总结](./doc/IMPLEMENTATION_SUMMARY.md#扩展性) 了解如何添加新的 Provider。

## 📞 联系方式

- GitHub Issues: https://github.com/laiwenqiang/vps-stock-monitor/issues

## 🙏 致谢

- [bwh-stock-monitor](https://github.com/ppvia/bwh-stock-monitor) - 灵感来源
- Cloudflare Workers - 优秀的 Serverless 平台
- Hono - 轻量级 Web 框架

---

**注意**：本项目仅供学习和个人使用，请遵守目标网站的服务条款和爬虫政策。

**开发者**: laiwenqiang
**协作者**: Claude Sonnet 4.5
**最后更新**: 2026-01-26
