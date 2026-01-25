import type { MonitorTarget, StockStatus } from "../models/types.js";
import type { Provider } from "./base.js";

/**
 * Dmit Provider
 * 用于获取 Dmit VPS 的库存状态
 *
 * TODO: 需要先调研 Dmit 网站确认库存获取方式
 * 调研步骤：
 * 1. 访问 Dmit 产品页面（如 https://www.dmit.io）
 * 2. 使用浏览器开发者工具抓包分析
 * 3. 确认库存信息的获取方式（API/JSON/HTML）
 * 4. 实现具体的解析逻辑
 */
export class DmitProvider implements Provider {
  id = "dmit";
  name = "Dmit";

  /**
   * 判断是否支持该监控目标
   * 通过 URL 的 hostname 是否为 dmit.io 或其子域名来判断
   */
  supports(target: MonitorTarget): boolean {
    try {
      const url = new URL(target.url);
      return url.hostname === "dmit.io" || url.hostname.endsWith(".dmit.io");
    } catch {
      // URL 解析失败，不支持
      return false;
    }
  }

  /**
   * 获取库存状态
   *
   * 实现策略：
   * 1. 使用浏览器 User-Agent 和标准 HTTP 头来绕过基础反爬虫
   * 2. 根据 sourceType 选择解析策略（auto/api/json/html）
   * 3. auto 模式下按优先级尝试：API → Embedded JSON → HTML
   *
   * @param target 监控目标
   * @returns 库存状态
   * @throws Error 当获取失败时抛出异常
   */
  async fetchStatus(target: MonitorTarget): Promise<StockStatus> {
    const sourceType = target.sourceType ?? "auto";

    // 发起 HTTP 请求
    const response = await this.fetchPage(target.url);

    // 根据 sourceType 选择解析策略
    if (sourceType !== "auto") {
      return this.parseByType(sourceType, response);
    }

    // auto 模式：按优先级尝试多种解析方式
    return this.parseWithFallback(response);
  }

  /**
   * 发起 HTTP 请求获取页面内容
   * 使用浏览器标准 HTTP 头来绕过基础反爬虫保护
   * 包含超时控制以防止请求挂起
   */
  private async fetchPage(url: string, timeoutMs = 10000): Promise<string> {
    const urlObj = new URL(url);
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8",
      Referer: urlObj.origin,
    };

    // 使用 AbortController 实现超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const cfRay = response.headers.get("cf-ray");
        const errorHint = cfRay ? ` (Cloudflare Ray ID: ${cfRay})` : "";
        throw new Error(
          `Failed to fetch Dmit page: ${response.status} ${response.statusText}${errorHint}. ` +
            `URL: ${url}`
        );
      }

      return await response.text();
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw new Error(`Request timeout after ${timeoutMs}ms. URL: ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 根据指定类型解析响应
   */
  private parseByType(
    type: "api" | "json" | "html",
    content: string
  ): StockStatus {
    switch (type) {
      case "api":
        return this.parseApiResponse(JSON.parse(content));
      case "json":
        return this.parseEmbeddedJson(content);
      case "html":
        return this.parseHtmlResponse(content);
    }
  }

  /**
   * auto 模式：按优先级尝试多种解析方式
   * 优先级：API → Embedded JSON → HTML
   */
  private parseWithFallback(content: string): StockStatus {
    const errors: string[] = [];

    // 尝试 1: 检查是否为 JSON API 响应
    try {
      const trimmed = content.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        return this.parseApiResponse(JSON.parse(content));
      }
    } catch (err) {
      errors.push(`API parse: ${(err as Error).message}`);
    }

    // 尝试 2: 查找页面内嵌 JSON
    try {
      return this.parseEmbeddedJson(content);
    } catch (err) {
      errors.push(`Embedded JSON parse: ${(err as Error).message}`);
    }

    // 尝试 3: HTML 文本解析
    try {
      return this.parseHtmlResponse(content);
    } catch (err) {
      errors.push(`HTML parse: ${(err as Error).message}`);
    }

    // 所有方式都失败
    throw new Error(
      `Failed to parse Dmit page with all methods. Errors: ${errors.join(" | ")}`
    );
  }

  /**
   * 从 API 响应中解析库存状态
   * 支持 WHMCS 标准 API 格式
   */
  private parseApiResponse(data: unknown): StockStatus {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid API response: not an object");
    }

    const obj = data as Record<string, unknown>;

    // 规范化布尔值字段（处理字符串 "true"/"false"）
    const normalizeBoolean = (value: unknown): boolean | undefined => {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        const lower = value.toLowerCase();
        if (lower === "true") return true;
        if (lower === "false") return false;
      }
      return undefined;
    };

    // 规范化数字字段（处理数字字符串）
    const normalizeNumber = (value: unknown): number | undefined => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const num = parseFloat(value);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    };

    // WHMCS 可能的字段名
    const available = normalizeBoolean(obj.available);
    const inStockField = normalizeBoolean(obj.inStock);
    const stockQty = normalizeNumber(obj.stock);

    const inStock =
      available ?? inStockField ?? (stockQty !== undefined && stockQty > 0);

    const qty = stockQty;
    const price = normalizeNumber(obj.price);

    return {
      inStock: Boolean(inStock),
      qty,
      price,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 从 HTML 中解析库存状态
   * 基于 WHMCS 常见的库存展示模式
   * 使用大小写不敏感的匹配以提高鲁棒性
   */
  private parseHtmlResponse(html: string): StockStatus {
    // 转换为小写以进行大小写不敏感的匹配
    const htmlLower = html.toLowerCase();

    // 缺货关键词（多语言支持）
    const outOfStockKeywords = [
      "out of stock",
      "sold out",
      "unavailable",
      "缺货",
      "库存不足",
      "已售罄",
    ];

    // 有货关键词
    const inStockKeywords = [
      "add to cart",
      "order now",
      "purchase",
      "立即购买",
      "购买",
      "加入购物车",
    ];

    const hasOutOfStockKeyword = outOfStockKeywords.some((keyword) =>
      htmlLower.includes(keyword)
    );
    const hasInStockKeyword = inStockKeywords.some((keyword) =>
      htmlLower.includes(keyword)
    );

    // 如果两个关键词都没有，无法判断库存状态
    if (!hasOutOfStockKeyword && !hasInStockKeyword) {
      throw new Error(
        "Unable to determine stock status: no stock-related keywords found in HTML"
      );
    }

    // 尝试提取价格（可选）
    const price = this.extractPrice(html);

    return {
      inStock: hasInStockKeyword && !hasOutOfStockKeyword,
      price,
      rawSource: html.substring(0, 500),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 从页面内嵌 JSON 中解析库存状态
   * 查找 <script type="application/json"> 或类似的内嵌数据
   */
  private parseEmbeddedJson(html: string): StockStatus {
    // 匹配 <script type="application/json"> 标签
    const jsonScriptMatch = html.match(
      /<script[^>]*type=["']application\/json["'][^>]*>(.*?)<\/script>/is
    );

    if (jsonScriptMatch) {
      try {
        const data = JSON.parse(jsonScriptMatch[1]);
        return this.parseApiResponse(data);
      } catch (error) {
        throw new Error(
          `Failed to parse JSON from <script> tag: ${(error as Error).message}`
        );
      }
    }

    // 匹配 window.__INITIAL_STATE__ 或类似的全局变量
    // 使用索引定位而非正则捕获，避免 }; 在字符串中导致的截断
    const stateMarker = "window.__INITIAL_STATE__";
    const stateIndex = html.indexOf(stateMarker);

    if (stateIndex !== -1) {
      // 找到赋值符号后的内容
      const afterMarker = html.substring(stateIndex + stateMarker.length);
      const assignIndex = afterMarker.indexOf("=");

      if (assignIndex !== -1) {
        const afterAssign = afterMarker.substring(assignIndex + 1).trim();
        // 从赋值符号后开始提取平衡的 JSON
        const jsonStr = this.extractBalancedJson(afterAssign);

        if (jsonStr) {
          try {
            const data = JSON.parse(jsonStr);
            return this.parseApiResponse(data);
          } catch (error) {
            throw new Error(
              `Failed to parse window.__INITIAL_STATE__: ${(error as Error).message}`
            );
          }
        }
      }
    }

    throw new Error("No embedded JSON found in HTML");
  }

  /**
   * 提取平衡的 JSON 对象
   * 处理嵌套的大括号和字符串字面量中的特殊字符
   */
  private extractBalancedJson(text: string): string | null {
    let depth = 0;
    let start = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // 处理转义字符
      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      // 处理字符串边界
      if (char === '"') {
        inString = !inString;
        continue;
      }

      // 只在非字符串内部处理大括号
      if (!inString) {
        if (char === "{") {
          if (depth === 0) start = i;
          depth++;
        } else if (char === "}") {
          depth--;
          if (depth === 0 && start !== -1) {
            return text.substring(start, i + 1);
          }
        }
      }
    }

    return null;
  }

  /**
   * 从 HTML 中提取价格
   * 支持多种货币符号和格式
   */
  private extractPrice(html: string): number | undefined {
    // 匹配常见的价格格式：$12.99, ¥99, €19.99, CNY 99
    const pricePatterns = [
      /\$\s*(\d+(?:\.\d{2})?)/,
      /¥\s*(\d+(?:\.\d{2})?)/,
      /€\s*(\d+(?:\.\d{2})?)/,
      /CNY\s*(\d+(?:\.\d{2})?)/i,
      /USD\s*(\d+(?:\.\d{2})?)/i,
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        const price = parseFloat(match[1]);
        if (!isNaN(price)) {
          return price;
        }
      }
    }

    return undefined;
  }
}
