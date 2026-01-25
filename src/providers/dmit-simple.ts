/**
 * 简化版 Dmit Provider
 * 参考 bwh-stock-monitor 项目的简单方法
 *
 * 关键改进：
 * 1. 简化 HTTP 头（只保留必要的）
 * 2. 使用精确的 HTML 元素匹配
 * 3. 在 Cloudflare Workers 环境中运行（而不是本地）
 */

import type { MonitorTarget, StockStatus } from "../models/types.js";
import type { Provider } from "./base.js";

export class DmitProviderSimple implements Provider {
  id = "dmit-simple";
  name = "Dmit (Simple)";

  supports(target: MonitorTarget): boolean {
    try {
      const url = new URL(target.url);
      return url.hostname === "dmit.io" || url.hostname.endsWith(".dmit.io");
    } catch {
      return false;
    }
  }

  async fetchStatus(target: MonitorTarget): Promise<StockStatus> {
    // 简单的 fetch，参考 bwh-stock-monitor
    const response = await fetch(target.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Dmit page: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();

    // 参考搬瓦工的方法：查找特定的缺货元素
    // 需要根据实际 Dmit 页面结构调整
    const outOfStockPatterns = [
      'class="errorbox"',
      "Out of Stock",
      "Sold Out",
      "缺货",
      "库存不足",
    ];

    const inStockPatterns = [
      'class="btn-success"', // 通常购买按钮有这个类
      "Add to Cart",
      "Order Now",
      "立即购买",
    ];

    const hasOutOfStock = outOfStockPatterns.some((pattern) =>
      html.toLowerCase().includes(pattern.toLowerCase())
    );

    const hasInStock = inStockPatterns.some((pattern) =>
      html.toLowerCase().includes(pattern.toLowerCase())
    );

    // 如果找不到任何标识，抛出错误
    if (!hasOutOfStock && !hasInStock) {
      throw new Error(
        "Unable to determine stock status: no recognizable patterns found"
      );
    }

    return {
      inStock: hasInStock && !hasOutOfStock,
      rawSource: html.substring(0, 500),
      timestamp: new Date().toISOString(),
    };
  }
}
