import type { Env } from "../index.js";
import type { MonitorTarget, StockStatus } from "../models/types.js";

/**
 * 通知服务接口
 */
export interface NotificationService {
  /**
   * 发送通知
   */
  send(target: MonitorTarget, status: StockStatus, reason: string): Promise<void>;
}

/**
 * Telegram 通知服务
 */
export class TelegramNotifier implements NotificationService {
  constructor(
    private botToken: string,
    private chatId: string
  ) {}

  async send(
    target: MonitorTarget,
    status: StockStatus,
    reason: string
  ): Promise<void> {
    const message = this.formatMessage(target, status, reason);
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: this.chatId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram notification failed: ${error}`);
    }
  }

  private formatMessage(
    target: MonitorTarget,
    status: StockStatus,
    reason: string
  ): string {
    const emoji = status.inStock ? "✅" : "❌";
    const stockStatus = status.inStock ? "有货" : "缺货";

    let message = `${emoji} *VPS 库存变化*\n\n`;
    message += `*原因*: ${reason}\n`;
    message += `*状态*: ${stockStatus}\n`;
    message += `*Provider*: ${target.provider}\n`;

    if (target.region) {
      message += `*地区*: ${target.region}\n`;
    }

    if (target.plan) {
      message += `*套餐*: ${target.plan}\n`;
    }

    if (status.price !== undefined) {
      message += `*价格*: $${status.price}\n`;
    }

    if (status.qty !== undefined) {
      message += `*数量*: ${status.qty}\n`;
    }

    message += `\n*链接*: ${target.url}\n`;
    message += `*时间*: ${new Date(status.timestamp).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`;

    return message;
  }
}

/**
 * 控制台通知服务（用于测试）
 */
export class ConsoleNotifier implements NotificationService {
  async send(
    target: MonitorTarget,
    status: StockStatus,
    reason: string
  ): Promise<void> {
    console.log("=".repeat(60));
    console.log("📢 通知");
    console.log("=".repeat(60));
    console.log(`原因: ${reason}`);
    console.log(`状态: ${status.inStock ? "✅ 有货" : "❌ 缺货"}`);
    console.log(`Provider: ${target.provider}`);
    console.log(`URL: ${target.url}`);
    if (status.price) console.log(`价格: $${status.price}`);
    if (status.qty) console.log(`数量: ${status.qty}`);
    console.log(`时间: ${status.timestamp}`);
    console.log("=".repeat(60));
  }
}

/**
 * 通知管理器
 */
export class NotificationManager {
  private notifiers: NotificationService[] = [];

  constructor(env: Env) {
    // 配置 Telegram 通知
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      this.notifiers.push(
        new TelegramNotifier(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID)
      );
    }

    // 开发环境添加控制台通知
    if (!env.TELEGRAM_BOT_TOKEN) {
      this.notifiers.push(new ConsoleNotifier());
    }
  }

  /**
   * 发送通知到所有配置的服务
   */
  async notify(
    target: MonitorTarget,
    status: StockStatus,
    reason: string
  ): Promise<void> {
    const promises = this.notifiers.map((notifier) =>
      notifier.send(target, status, reason).catch((error) => {
        console.error("Notification failed:", error);
        // 不抛出错误，避免影响其他通知
      })
    );

    await Promise.all(promises);
  }

  /**
   * 检查是否有可用的通知服务
   */
  hasNotifiers(): boolean {
    return this.notifiers.length > 0;
  }
}
