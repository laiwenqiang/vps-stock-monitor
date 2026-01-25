# 🚀 快速开始：本地测试 Dmit 库存检查

## 最简单的方法（推荐）

### 步骤 1: 启动 Remote Dev

在终端 1 中运行：

```bash
npm run dev:remote
```

等待看到：
```
⛅️ wrangler 3.x.x
🌍 Listening on http://127.0.0.1:8787
```

### 步骤 2: 测试

在终端 2 中运行：

```bash
# 方法 A: 使用测试脚本（推荐）
./test-dmit.sh

# 方法 B: 使用 curl
curl "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=1"

# 方法 C: 在浏览器中打开
open "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=1"
```

### 步骤 3: 查看结果

#### ✅ 成功（能绕过 Cloudflare）

```json
{
  "success": true,
  "status": {
    "inStock": true,
    "price": 99.99,
    "timestamp": "2024-01-25T12:00:00.000Z"
  }
}
```

**说明**: 🎉 可以直接使用！继续开发监控功能。

#### ❌ 失败（仍被拦截）

```json
{
  "success": false,
  "error": "Failed to fetch Dmit page: 403 Forbidden"
}
```

**说明**: 需要使用其他方案（Browser Rendering 或代理）。

## 所有可用命令

```bash
# 开发
npm run dev              # 本地开发（请求从本地 IP 发出）
npm run dev:remote       # 远程开发（请求从 Cloudflare 发出）⭐ 推荐

# 测试
npm test                 # 运行所有单元测试
npm run test:watch       # 监听模式
npm run test:dmit        # 只测试 Dmit Provider

# 部署
npm run deploy           # 正式部署到 Cloudflare

# 代码质量
npm run lint             # TypeScript 类型检查
npm run format           # 格式化代码
```

## 测试不同的 Dmit URL

```bash
# 测试不同的产品组
./test-dmit.sh --url "https://www.dmit.io/cart.php?gid=1"
./test-dmit.sh --url "https://www.dmit.io/cart.php?gid=2"
./test-dmit.sh --url "https://www.dmit.io/cart.php?gid=16"

# 测试特定产品
./test-dmit.sh --url "https://www.dmit.io/cart.php?a=add&pid=123"
```

## 开发工作流

```bash
# 1. 启动 remote dev（终端 1）
npm run dev:remote

# 2. 测试（终端 2）
./test-dmit.sh

# 3. 修改代码
# 编辑 src/providers/dmit.ts

# 4. 保存后自动重新部署，再次测试
./test-dmit.sh
```

## 常见问题

### Q: Remote dev 和本地 dev 有什么区别？

| 特性 | 本地 dev | Remote dev |
|------|----------|------------|
| 运行位置 | 本地机器 | Cloudflare 边缘 |
| 请求来源 | 本地 IP | Cloudflare IP |
| 能否绕过反爬虫 | ❌ 不能 | ✅ 可能 |
| 速度 | 快 | 较快 |
| 推荐用途 | 开发 API 逻辑 | 测试真实请求 |

### Q: 为什么推荐 remote dev？

因为：
1. **请求从 Cloudflare 发出**，可能绕过反爬虫
2. **无需正式部署**，节省时间
3. **实时同步代码**，修改后立即生效
4. **免费**，不消耗额外配额

### Q: 如何查看详细日志？

```bash
# 启动时添加 debug 日志
npm run dev:remote -- --log-level debug
```

### Q: 测试脚本需要什么依赖？

需要 `jq`（JSON 处理工具）：

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# 或者不使用测试脚本，直接用 curl
curl "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=1"
```

## 下一步

### 如果测试成功 ✅

1. 实现完整的监控逻辑
2. 添加 KV 存储支持
3. 实现通知功能（Telegram/Email）
4. 设置 Cron 定时任务
5. 正式部署：`npm run deploy`

### 如果测试失败 ❌

查看解决方案：
- `DMIT_CLOUDFLARE_SOLUTION.md` - Cloudflare 绕过方案
- `CLOUDFLARE_WORKERS_TEST.md` - 详细测试指南

## 相关文档

- `LOCAL_DEV_GUIDE.md` - 完整的本地开发指南
- `README_DMIT_STATUS.md` - Dmit Provider 状态总结
- `DMIT_PROVIDER_VERIFICATION.md` - 代码验证报告

## 快速参考

```bash
# 一键启动并测试
npm run dev:remote &
sleep 5
./test-dmit.sh
```

---

**现在就开始**: `npm run dev:remote` 🚀
