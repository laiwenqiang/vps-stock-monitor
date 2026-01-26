import type { Env } from "../index.js";
import type { MonitorTarget, StockStatus } from "../models/types.js";
import { DmitProvider } from "../providers/dmit.js";
import type { Provider } from "../providers/base.js";
import { TargetStore, StateStore } from "./storage.js";

/**
 * Provider 注册表
 */
const PROVIDERS: Provider[] = [new DmitProvider()];

/**
 * 监控服务
 */
export class MonitorService {
  private targetStore: TargetStore;
  private stateStore: StateStore;

  constructor(private env: Env) {
    this.targetStore = new TargetStore(env.KV);
    this.stateStore = new StateStore(env.KV);
  }

  /**
   * 根据 provider ID 获取 Provider 实例
   */
  private getProvider(providerId: string): Provider | null {
    return PROVIDERS.find((p) => p.id === providerId) || null;
  }

  /**
   * 检查单个目标的库存状态
   */
  async checkTarget(target: MonitorTarget): Promise<StockStatus> {
    const provider = this.getProvider(target.provider);
    if (!provider) {
      throw new Error(`Unknown provider: ${target.provider}`);
    }

    if (!provider.supports(target)) {
      throw new Error(
        `Provider ${provider.name} does not support URL: ${target.url}`
      );
    }

    return await provider.fetchStatus(target);
  }

  /**
   * 检查所有启用的目标
   */
  async checkAllTargets(): Promise<{
    success: number;
    failed: number;
    results: Array<{
      targetId: string;
      success: boolean;
      status?: StockStatus;
      error?: string;
    }>;
  }> {
    const targets = await this.targetStore.listEnabled();
    const results: Array<{
      targetId: string;
      success: boolean;
      status?: StockStatus;
      error?: string;
    }> = [];

    let successCount = 0;
    let failedCount = 0;

    for (const target of targets) {
      try {
        const status = await this.checkTarget(target);
        await this.stateStore.recordSuccess(target.id, status);

        results.push({
          targetId: target.id,
          success: true,
          status,
        });

        successCount++;
      } catch (error) {
        const errorMessage = (error as Error).message;
        await this.stateStore.recordError(target.id, errorMessage);

        results.push({
          targetId: target.id,
          success: false,
          error: errorMessage,
        });

        failedCount++;
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      results,
    };
  }

  /**
   * 检查是否需要发送通知
   */
  async shouldNotify(
    target: MonitorTarget,
    newStatus: StockStatus
  ): Promise<{
    shouldNotify: boolean;
    reason?: string;
  }> {
    const state = await this.stateStore.get(target.id);

    // 首次检查，不通知
    if (!state || !state.lastStatus) {
      return { shouldNotify: false, reason: "First check" };
    }

    const lastStatus = state.lastStatus;
    const now = new Date();

    // 检查最小通知间隔
    if (state.lastNotifiedAt) {
      const lastNotified = new Date(state.lastNotifiedAt);
      const minInterval = (target.minNotifyInterval || 60) * 60 * 1000; // 转换为毫秒
      const elapsed = now.getTime() - lastNotified.getTime();

      if (elapsed < minInterval) {
        return {
          shouldNotify: false,
          reason: `Too soon (${Math.round(elapsed / 60000)} min < ${target.minNotifyInterval || 60} min)`,
        };
      }
    }

    // 检查补货通知
    if (
      (target.notifyOnRestock ?? true) &&
      !lastStatus.inStock &&
      newStatus.inStock
    ) {
      return { shouldNotify: true, reason: "Restocked" };
    }

    // 检查缺货通知
    if (
      (target.notifyOnOutOfStock ?? false) &&
      lastStatus.inStock &&
      !newStatus.inStock
    ) {
      return { shouldNotify: true, reason: "Out of stock" };
    }

    // 检查价格变化通知
    if (target.notifyOnPriceChange ?? false) {
      if (
        lastStatus.price !== undefined &&
        newStatus.price !== undefined &&
        lastStatus.price !== newStatus.price
      ) {
        return {
          shouldNotify: true,
          reason: `Price changed: ${lastStatus.price} → ${newStatus.price}`,
        };
      }
    }

    return { shouldNotify: false, reason: "No significant change" };
  }

  /**
   * 获取目标存储服务
   */
  getTargetStore(): TargetStore {
    return this.targetStore;
  }

  /**
   * 获取状态存储服务
   */
  getStateStore(): StateStore {
    return this.stateStore;
  }
}
