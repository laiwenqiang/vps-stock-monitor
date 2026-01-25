# Dmit 库存检查解决方案

## 问题

Dmit 网站使用 Cloudflare 保护，简单的 HTTP 请求会被拦截（403 Forbidden）。

## 解决方案

### 方案 1: 使用 Puppeteer/Playwright（推荐）

在 Cloudflare Workers 环境中，可以使用 Browser Rendering API：

```typescript
// 需要在 wrangler.toml 中配置 browser binding
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();
    await page.goto('https://www.dmit.io/cart.php?gid=1');

    const html = await page.content();
    // 使用 DmitProvider 的 parseHtmlResponse 解析

    await browser.close();
  }
}
```

**优点**:
- 完全模拟真实浏览器
- 可以绕过大多数反爬虫保护
- 支持 JavaScript 渲染

**缺点**:
- 需要 Cloudflare Workers 付费计划
- 响应时间较长（2-5秒）
- 成本较高

### 方案 2: 使用代理服务

使用第三方代理服务（如 ScrapingBee、Bright Data）：

```typescript
const response = await fetch('https://api.scrapingbee.com/api/v1/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    api_key: 'YOUR_API_KEY',
    url: 'https://www.dmit.io/cart.php?gid=1',
    render_js: false,
  }),
});
```

**优点**:
- 简单易用
- 自动处理反爬虫
- 响应速度快

**缺点**:
- 需要付费
- 依赖第三方服务

### 方案 3: 手动配置（临时方案）

如果你有 Dmit 账号，可以：

1. 在浏览器中登录 Dmit
2. 复制 Cookie 和其他认证信息
3. 在代码中使用这些信息

```typescript
const response = await fetch(url, {
  headers: {
    'User-Agent': '...',
    'Cookie': 'your-session-cookie',
    'Authorization': '...',
  },
});
```

**优点**:
- 无需额外成本
- 可以立即使用

**缺点**:
- Cookie 会过期
- 需要定期更新
- 不适合自动化

### 方案 4: 使用 Dmit API（如果有）

联系 Dmit 客服，询问是否有官方 API：

**优点**:
- 最稳定可靠
- 官方支持
- 无反爬虫问题

**缺点**:
- 可能不存在
- 可能需要特殊权限

## 推荐方案

### 短期（测试阶段）
使用**方案 3**（手动配置）快速验证功能。

### 长期（生产环境）
使用**方案 1**（Browser Rendering）或**方案 2**（代理服务）。

## 当前代码的价值

虽然无法直接访问 Dmit，但当前实现仍然有价值：

1. **解析逻辑完整**: 一旦获取到 HTML，可以正确解析
2. **多种策略支持**: 适应不同的数据源格式
3. **测试充分**: 确保解析逻辑正确
4. **易于扩展**: 可以轻松集成浏览器自动化或代理

## 下一步

1. 选择合适的方案（推荐方案 1 或 2）
2. 配置相应的服务
3. 修改 `fetchPage` 方法以使用新的获取方式
4. 用真实数据验证解析逻辑

## 示例：集成 Browser Rendering

```typescript
// src/providers/dmit.ts

private async fetchPage(url: string, env?: Env): Promise<string> {
  // 如果有 browser binding，使用浏览器渲染
  if (env?.BROWSER) {
    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    const html = await page.content();
    await browser.close();
    return html;
  }

  // 否则使用普通 fetch（可能被拦截）
  const response = await fetch(url, {
    headers: this.getHeaders(url),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  return await response.text();
}
```
