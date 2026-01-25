# 在 Cloudflare Workers 中测试 Dmit 库存检查

## 背景

参考 [bwh-stock-monitor](https://github.com/ppvia/bwh-stock-monitor) 项目，我们发现：
- 在**本地**测试时，Dmit 返回 403 Forbidden（Cloudflare 拦截）
- 但在 **Cloudflare Workers** 环境中，可能不会被拦截

原因：
1. Cloudflare Workers 的请求来自 Cloudflare 网络内部
2. 有更高的 IP 信誉度
3. 不会被识别为普通的爬虫

## 测试步骤

### 1. 部署到 Cloudflare Workers

```bash
# 确保已登录 Cloudflare
npx wrangler login

# 部署到 Workers
npm run deploy
```

### 2. 测试 Dmit 库存检查

部署成功后，你会得到一个 Worker URL，例如：
```
https://vps-stock-monitor.your-subdomain.workers.dev
```

使用测试端点：

```bash
# 方法 1: 使用 curl
curl "https://vps-stock-monitor.your-subdomain.workers.dev/test-dmit?url=https://www.dmit.io/cart.php?gid=1"

# 方法 2: 直接在浏览器中访问
# https://vps-stock-monitor.your-subdomain.workers.dev/test-dmit?url=https://www.dmit.io/cart.php?gid=1
```

### 3. 预期结果

#### 成功的响应（如果能绕过 Cloudflare）

```json
{
  "success": true,
  "duration": "1234ms",
  "url": "https://www.dmit.io/cart.php?gid=1",
  "provider": "Dmit",
  "status": {
    "inStock": true,
    "price": 99.99,
    "rawSource": "...",
    "timestamp": "2024-01-25T12:00:00.000Z"
  }
}
```

#### 失败的响应（如果仍被拦截）

```json
{
  "success": false,
  "error": "Failed to fetch Dmit page: 403 Forbidden (Cloudflare Ray ID: xxx)",
  "url": "https://www.dmit.io/cart.php?gid=1"
}
```

## 测试不同的 Dmit URL

```bash
# 测试不同的产品组
curl "https://your-worker.workers.dev/test-dmit?url=https://www.dmit.io/cart.php?gid=1"
curl "https://your-worker.workers.dev/test-dmit?url=https://www.dmit.io/cart.php?gid=2"
curl "https://your-worker.workers.dev/test-dmit?url=https://www.dmit.io/cart.php?gid=16"

# 测试特定产品
curl "https://your-worker.workers.dev/test-dmit?url=https://www.dmit.io/cart.php?a=add&pid=123"
```

## 如果仍然被拦截

如果在 Workers 环境中仍然返回 403，可以尝试：

### 方案 1: 添加更多 HTTP 头

修改 `src/providers/dmit.ts` 的 `fetchPage` 方法：

```typescript
const headers: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Cache-Control": "max-age=0",
};
```

### 方案 2: 使用 Cloudflare Browser Rendering

如果简单的 fetch 不行，可以使用浏览器渲染：

```bash
# 在 wrangler.toml 中添加
[browser]
binding = "BROWSER"
```

```typescript
// 在代码中使用
const browser = await puppeteer.launch(env.BROWSER);
const page = await browser.newPage();
await page.goto(url);
const html = await page.content();
await browser.close();
```

### 方案 3: 联系 Dmit

如果以上方法都不行，可以：
1. 联系 Dmit 客服，说明你的用途
2. 询问是否有官方 API
3. 请求将你的 Worker IP 加入白名单

## 对比：搬瓦工 vs Dmit

| 项目 | 搬瓦工 (BWH) | Dmit |
|------|-------------|------|
| 反爬虫保护 | 较弱 | 较强（Cloudflare） |
| 简单 fetch | ✅ 可行 | ❓ 待验证 |
| 需要浏览器渲染 | ❌ 不需要 | ❓ 可能需要 |

## 下一步

1. **立即测试**: 部署到 Workers 并测试
2. **收集数据**: 记录成功/失败的情况
3. **优化策略**: 根据测试结果调整实现

## 快速部署命令

```bash
# 1. 部署
npm run deploy

# 2. 获取 Worker URL
npx wrangler deployments list

# 3. 测试
curl "https://your-worker.workers.dev/test-dmit?url=https://www.dmit.io/cart.php?gid=1"
```

## 监控建议

如果测试成功，建议：
1. 设置 10 分钟的检查间隔（参考搬瓦工项目）
2. 添加错误日志和监控
3. 实现缓存机制，避免频繁请求
4. 添加重试逻辑（带指数退避）

## 参考资料

- [bwh-stock-monitor](https://github.com/ppvia/bwh-stock-monitor) - 搬瓦工库存监控项目
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Browser Rendering](https://developers.cloudflare.com/browser-rendering/)
