/**
 * 监控目标配置（存储模型）
 */
export type MonitorTarget = {
  /** 唯一标识符 */
  id: string;
  /** Provider ID（如 "dmit"） */
  provider: string;
  /** 监控的 URL */
  url: string;
  /** 名称（可选，用于显示） */
  name?: string;
  /** 地区（如 "us-west"） */
  region?: string;
  /** 套餐名称（如 "premium"） */
  plan?: string;
  /** 数据源类型 */
  sourceType?: "auto" | "api" | "json" | "html";
  /** 是否启用 */
  enabled: boolean;

  // 通知策略（可选，未设置时使用全局配置）
  /** 补货时通知 */
  notifyOnRestock?: boolean;
  /** 缺货时通知 */
  notifyOnOutOfStock?: boolean;
  /** 价格变化时通知 */
  notifyOnPriceChange?: boolean;
  /** 最小通知间隔（分钟） */
  minNotifyInterval?: number;

  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
};

/**
 * 监控目标输入（API 请求）
 * createdAt 和 updatedAt 由服务端自动生成
 */
export type MonitorTargetInput = Omit<MonitorTarget, "id" | "createdAt" | "updatedAt">;

/**
 * 监控目标更新（API PATCH 请求）
 * 所有字段都是可选的
 */
export type MonitorTargetPatch = Partial<MonitorTargetInput>;

/**
 * 库存状态
 */
export type StockStatus = {
  /** 是否有库存 */
  inStock: boolean;
  /** 库存数量（如果可获取） */
  qty?: number;
  /** 价格（如果可获取） */
  price?: number;
  /** 地区 */
  region?: string;
  /** 原始数据片段（截断至 500 字符，用于调试） */
  rawSource?: string;
  /** 检查时间 */
  timestamp: string;
};

/**
 * 监控状态
 */
export type MonitorState = {
  /** 关联的监控目标 ID */
  targetId: string;
  /** 上次检查的状态 */
  lastStatus?: StockStatus;
  /** 上次检查时间 */
  lastCheckedAt?: string;
  /** 上次通知时间 */
  lastNotifiedAt?: string;
  /** 连续错误次数 */
  errorCount: number;
  /** 最后一次错误信息 */
  lastError?: string;
};

/**
 * 全局配置
 */
export type GlobalConfig = {
  // 通知策略（目标级配置可覆盖）
  /** 默认：补货时通知 */
  notifyOnRestock: boolean;
  /** 默认：缺货时通知 */
  notifyOnOutOfStock: boolean;
  /** 默认：价格变化时通知 */
  notifyOnPriceChange: boolean;
  /** 默认：最小通知间隔（分钟） */
  minNotifyInterval: number;

  // 监控配置
  /** 连续错误次数阈值，超过后暂停目标 */
  maxErrorCount: number;
  /** 请求超时时间（秒） */
  requestTimeout: number;
};

/**
 * 默认全局配置
 */
export const DEFAULT_CONFIG: GlobalConfig = {
  notifyOnRestock: true,
  notifyOnOutOfStock: false,
  notifyOnPriceChange: false,
  minNotifyInterval: 60, // 1 小时
  maxErrorCount: 5,
  requestTimeout: 10,
};
