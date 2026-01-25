import type { MonitorTarget, StockStatus } from "../models/types.js";

/**
 * Provider 接口
 * 用于屏蔽不同数据源的获取方式，统一输出标准化的库存状态
 */
export interface Provider {
  /** Provider 唯一标识 */
  id: string;

  /** Provider 名称 */
  name: string;

  /**
   * 判断是否支持该监控目标
   * @param target 监控目标
   * @returns 是否支持
   */
  supports(target: MonitorTarget): boolean;

  /**
   * 获取库存状态
   * @param target 监控目标
   * @returns 库存状态
   * @throws Error 当获取失败时抛出异常
   */
  fetchStatus(target: MonitorTarget): Promise<StockStatus>;
}
