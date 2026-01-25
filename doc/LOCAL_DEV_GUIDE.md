# Cloudflare Workers 本地开发和测试指南

## 方案对比

| 方案 | 运行位置 | 能否绕过 Cloudflare | 速度 | 推荐度 |
|------|----------|---------------------|------|--------|
| `wrangler dev` (本地) | 本地机器 | ❌ 不能 | 快 | ⭐⭐ |
| `wrangler dev --remote` | Cloudflare 边缘 | ✅ 可能 | 较快 | ⭐⭐⭐⭐⭐ |
| `wrangler deploy` | Cloudflare 边缘 | ✅ 可能 | 慢 | ⭐⭐⭐ |

## 推荐方案：Remote Dev（最佳）

### 什么是 Remote Dev？

`wrangler dev --remote` 会：
- 代码在 **Cloudflare 边缘网络**上运行
- 请求从 **Cloudflare IP** 发出（不是你的本地 IP）
- 实时同步代码更改
- 无需正式部署

### 使用步骤

#### 1. 启动 Remote Dev 服务器

```bash
npm run dev -- --remote
```

或者直接：

```bash
npx wrangler dev --remote
```

你会看到类似输出：

```
⛅️ wrangler 3.x.x
-------------------
⎔ Starting local server...
⎔ Uploading worker bundle...
✨ Worker deployed to Cloudflare edge
🌍 Listening on http://127.0.0.1:8787
```

#### 2. 测试 Dmit 库存检查

在另一个终端窗口：

```bash
# 测试健康检查
curl http://127.0.0.1:8787/

# 测试 Dmit 库存（关键测试）
curl "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=1"
```

或者在浏览器中打开：
```
http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=1
```

#### 3. 实时修改代码

修改 `src/providers/dmit.ts` 后：
- 保存文件
- Wrangler 自动重新上传
- 刷新浏览器或重新发送请求

**无需重启服务器！**

## 方案 2：本地 Dev（仅用于开发）

如果只是测试代码逻辑（不测试反爬虫）：

```bash
npm run dev
```

这会在本地运行，但请求仍然从你的本地 IP 发出，**会被 Cloudflare 拦截**。

适用场景：
- 测试 API 路由逻辑
- 测试数据解析
- 快速迭代开发

## 方案 3：使用 Vitest 的 Workers 环境

项目已经配置了 Vitest + Cloudflare Workers 环境：

```bash
# 运行测试
npm test

# 监听模式（自动重新运行）
npm test -- --watch

# 测试特定文件
npm test -- dmit.test.ts
```

这会在模拟的 Workers 环境中运行测试，但**不会发起真实的网络请求**。

## 完整工作流程

### 开发流程

```bash
# 1. 启动 remote dev（在终端 1）
npm run dev -- --remote

# 2. 在另一个终端测试（终端 2）
curl "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=1"

# 3. 修改代码
# 编辑 src/providers/dmit.ts

# 4. 保存后自动重新部署，再次测试
curl "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=1"
```

### 测试不同的 URL

```bash
# 测试不同的产品组
curl "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=1"
curl "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=2"
curl "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=16"

# 测试特定产品
curl "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?a=add&pid=123"
```

## 调试技巧

### 1. 查看详细日志

```bash
# 启动时添加 --log-level debug
npm run dev -- --remote --log-level debug
```

### 2. 使用 console.log

在代码中添加：

```typescript
console.log('Fetching URL:', url);
console.log('Response status:', response.status);
console.log('HTML length:', html.length);
```

日志会显示在 wrangler dev 的终端中。

### 3. 使用 curl 查看详细信息

```bash
# 查看完整响应
curl -v "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=1"

# 格式化 JSON 输出
curl "http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=1" | jq .
```

## 常见问题

### Q: Remote dev 和正式部署有什么区别？

**Remote dev**:
- 临时部署到 Cloudflare 边缘
- 只有你能访问（通过本地端口）
- 代码更改自动同步
- 适合开发和测试

**正式部署**:
- 永久部署到 Cloudflare 边缘
- 公开访问（通过 workers.dev 域名）
- 需要手动部署更新
- 适合生产环境

### Q: Remote dev 会消耗配额吗？

会，但非常少。Cloudflare Workers 免费计划包括：
- 每天 100,000 次请求
- 开发测试通常远低于此限制

### Q: 如何停止 remote dev？

在终端按 `Ctrl+C`。

### Q: 如何切换回本地 dev？

```bash
# 本地模式（默认）
npm run dev

# 远程模式
npm run dev -- --remote
```

## 推荐的开发设置

### 终端布局

```
┌─────────────────────────────────┬─────────────────────────────────┐
│ 终端 1: Wrangler Dev            │ 终端 2: 测试命令                │
│                                 │                                 │
│ $ npm run dev -- --remote       │ $ curl http://127.0.0.1:8787/   │
│                                 │                                 │
│ ⛅️ wrangler 3.x.x               │ $ curl "http://127.0.0.1:8787/  │
│ 🌍 Listening on                 │   test-dmit?url=..."            │
│    http://127.0.0.1:8787        │                                 │
│                                 │                                 │
│ [日志输出...]                   │ [测试结果...]                   │
└─────────────────────────────────┴─────────────────────────────────┘
```

### VS Code 配置

创建 `.vscode/tasks.json`：

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Wrangler Dev (Remote)",
      "type": "shell",
      "command": "npm run dev -- --remote",
      "problemMatcher": [],
      "isBackground": true
    }
  ]
}
```

然后在 VS Code 中：
1. 按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows)
2. 输入 "Tasks: Run Task"
3. 选择 "Wrangler Dev (Remote)"

## 快速开始

```bash
# 1. 启动 remote dev
npm run dev -- --remote

# 2. 在浏览器中打开
open http://127.0.0.1:8787/test-dmit?url=https://www.dmit.io/cart.php?gid=1

# 3. 查看结果并根据需要修改代码
```

## 下一步

如果 remote dev 测试成功：
1. ✅ 说明在 Cloudflare 网络中可以绕过反爬虫
2. 继续开发完整的监控功能
3. 最后正式部署：`npm run deploy`

如果 remote dev 仍然失败：
1. 尝试调整 HTTP 头
2. 考虑使用 Browser Rendering
3. 或使用代理服务
