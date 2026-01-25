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
   * TODO: 实现具体的库存获取逻辑
   * 可能的实现方式：
   * 1. API 接口：如果 Dmit 提供了库存查询 API
   * 2. 页面内嵌 JSON：从 HTML 中提取 <script type="application/json"> 或 window.__INITIAL_STATE__
   * 3. HTML 解析：解析页面中的库存信息（最不稳定）
   *
   * @param target 监控目标
   * @returns 库存状态
   * @throws Error 当获取失败时抛出异常
   */
  async fetchStatus(target: MonitorTarget): Promise<StockStatus> {
    // TODO: 根据调研结果实现
    // 示例实现流程：
    // 1. 发起 HTTP 请求获取页面或 API 数据
    // 2. 解析响应数据
    // 3. 提取库存信息（inStock, qty, price 等）
    // 4. 返回标准化的 StockStatus

    throw new Error(
      `DmitProvider.fetchStatus not implemented yet. ` +
        `Please investigate Dmit website to determine the stock data source. ` +
        `Target URL: ${target.url}`
    );
  }

  /**
   * 从 API 响应中解析库存状态
   * TODO: 根据实际 API 响应格式实现
   */
  private parseApiResponse(data: unknown): StockStatus {
    // 示例实现（需要根据实际 API 调整）
    // const response = data as { stock: number; price: number; available: boolean };
    // return {
    //   inStock: response.available && response.stock > 0,
    //   qty: response.stock,
    //   price: response.price,
    //   timestamp: new Date().toISOString(),
    // };

    throw new Error("parseApiResponse not implemented");
  }

  /**
   * 从 HTML 中解析库存状态
   * TODO: 根据实际 HTML 结构实现
   */
  private parseHtmlResponse(html: string): StockStatus {
    // 示例实现（需要根据实际 HTML 调整）
    // const outOfStock = html.includes("Out of Stock") || html.includes("缺货");
    // return {
    //   inStock: !outOfStock,
    //   rawSource: html.substring(0, 500), // 截断至 500 字符
    //   timestamp: new Date().toISOString(),
    // };

    throw new Error("parseHtmlResponse not implemented");
  }

  /**
   * 从页面内嵌 JSON 中解析库存状态
   * TODO: 根据实际页面结构实现
   */
  private parseEmbeddedJson(html: string): StockStatus {
    // 示例实现（需要根据实际页面调整）
    // const match = html.match(/<script type="application\/json"[^>]*>(.*?)<\/script>/s);
    // if (match) {
    //   const data = JSON.parse(match[1]);
    //   return this.parseApiResponse(data);
    // }

    throw new Error("parseEmbeddedJson not implemented");
  }
}
