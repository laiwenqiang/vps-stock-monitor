import type { Env } from "../index.js";
import type {
  MonitorTarget,
  MonitorTargetInput,
  MonitorTargetPatch,
  MonitorState,
  StockStatus,
} from "../models/types.js";

/**
 * KV 存储的键前缀
 */
const KV_PREFIX = {
  TARGET: "target:",
  STATE: "state:",
  CONFIG: "config:",
  HISTORY_CHECK: "history:check:",
  HISTORY_NOTIFY: "history:notify:",
} as const;

/**
 * 监控目标存储服务
 */
export class TargetStore {
  constructor(private kv: KVNamespace) {}

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 获取所有监控目标
   */
  async list(): Promise<MonitorTarget[]> {
    const list = await this.kv.list({ prefix: KV_PREFIX.TARGET });
    const targets: MonitorTarget[] = [];

    for (const key of list.keys) {
      const value = await this.kv.get(key.name, "json");
      if (value) {
        targets.push(value as MonitorTarget);
      }
    }

    return targets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * 获取单个监控目标
   */
  async get(id: string): Promise<MonitorTarget | null> {
    const key = `${KV_PREFIX.TARGET}${id}`;
    return await this.kv.get(key, "json");
  }

  /**
   * 创建监控目标
   */
  async create(input: MonitorTargetInput): Promise<MonitorTarget> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const target: MonitorTarget = {
      id,
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    const key = `${KV_PREFIX.TARGET}${id}`;
    await this.kv.put(key, JSON.stringify(target));

    return target;
  }

  /**
   * 更新监控目标
   */
  async update(id: string, patch: MonitorTargetPatch): Promise<MonitorTarget> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Target not found: ${id}`);
    }

    const updated: MonitorTarget = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    const key = `${KV_PREFIX.TARGET}${id}`;
    await this.kv.put(key, JSON.stringify(updated));

    return updated;
  }

  /**
   * 删除监控目标
   */
  async delete(id: string): Promise<void> {
    const key = `${KV_PREFIX.TARGET}${id}`;
    await this.kv.delete(key);

    // 同时删除关联的状态
    const stateKey = `${KV_PREFIX.STATE}${id}`;
    await this.kv.delete(stateKey);
  }

  /**
   * 获取启用的监控目标
   */
  async listEnabled(): Promise<MonitorTarget[]> {
    const all = await this.list();
    return all.filter((t) => t.enabled);
  }
}

/**
 * 监控状态存储服务
 */
export class StateStore {
  constructor(private kv: KVNamespace) {}

  /**
   * 获取监控状态
   */
  async get(targetId: string): Promise<MonitorState | null> {
    const key = `${KV_PREFIX.STATE}${targetId}`;
    return await this.kv.get(key, "json");
  }

  /**
   * 更新监控状态
   */
  async update(targetId: string, state: Partial<MonitorState>): Promise<void> {
    const existing = await this.get(targetId);
    const updated: MonitorState = {
      targetId,
      errorCount: 0,
      ...existing,
      ...state,
    };

    const key = `${KV_PREFIX.STATE}${targetId}`;
    await this.kv.put(key, JSON.stringify(updated));
  }

  /**
   * 记录成功检查
   */
  async recordSuccess(
    targetId: string,
    status: StockStatus
  ): Promise<void> {
    await this.update(targetId, {
      lastStatus: status,
      lastCheckedAt: new Date().toISOString(),
      errorCount: 0,
      lastError: undefined,
    });
  }

  /**
   * 记录失败检查
   */
  async recordError(targetId: string, error: string): Promise<void> {
    const existing = await this.get(targetId);
    const errorCount = (existing?.errorCount || 0) + 1;

    await this.update(targetId, {
      lastCheckedAt: new Date().toISOString(),
      errorCount,
      lastError: error,
    });
  }

  /**
   * 获取所有状态
   */
  async listAll(): Promise<Record<string, MonitorState>> {
    const list = await this.kv.list({ prefix: KV_PREFIX.STATE });
    const states: Record<string, MonitorState> = {};

    for (const key of list.keys) {
      const value = await this.kv.get(key.name, "json");
      if (value) {
        const state = value as MonitorState;
        states[state.targetId] = state;
      }
    }

    return states;
  }
}

/**
 * 检查历史记录
 */
export type CheckHistoryRecord = {
  id: string;
  targetId: string;
  timestamp: string;
  status?: StockStatus;
  error?: string;
  duration?: number;
};

/**
 * 通知历史记录
 */
export type NotifyHistoryRecord = {
  id: string;
  targetId: string;
  timestamp: string;
  reason: string;
  message?: string;
};

/**
 * 历史记录存储服务
 */
export class HistoryStore {
  constructor(private kv: KVNamespace) {}

  /**
   * 生成唯一 ID（基于时间戳，便于排序）
   */
  private generateId(): string {
    // 使用反向时间戳，使得最新的记录排在前面
    const reverseTimestamp = (9999999999999 - Date.now()).toString().padStart(13, '0');
    return `${reverseTimestamp}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 记录检查历史
   */
  async recordCheck(
    targetId: string,
    status?: StockStatus,
    error?: string,
    duration?: number
  ): Promise<void> {
    const id = this.generateId();
    const record: CheckHistoryRecord = {
      id,
      targetId,
      timestamp: new Date().toISOString(),
      status,
      error,
      duration,
    };

    const key = `${KV_PREFIX.HISTORY_CHECK}${id}`;
    // 设置 30 天过期
    await this.kv.put(key, JSON.stringify(record), {
      expirationTtl: 30 * 24 * 60 * 60,
    });
  }

  /**
   * 记录通知历史
   */
  async recordNotify(
    targetId: string,
    reason: string,
    message?: string
  ): Promise<void> {
    const id = this.generateId();
    const record: NotifyHistoryRecord = {
      id,
      targetId,
      timestamp: new Date().toISOString(),
      reason,
      message,
    };

    const key = `${KV_PREFIX.HISTORY_NOTIFY}${id}`;
    // 设置 30 天过期
    await this.kv.put(key, JSON.stringify(record), {
      expirationTtl: 30 * 24 * 60 * 60,
    });
  }

  /**
   * 获取检查历史
   */
  async listCheckHistory(options: {
    targetId?: string;
    since?: Date;
    limit?: number;
    cursor?: string;
  } = {}): Promise<{ data: CheckHistoryRecord[]; cursor?: string; total: number }> {
    const { targetId, since, limit = 50, cursor } = options;

    const list = await this.kv.list({
      prefix: KV_PREFIX.HISTORY_CHECK,
      limit: limit + 1, // 多取一个用于判断是否有下一页
      cursor,
    });

    const records: CheckHistoryRecord[] = [];
    let total = 0;

    for (const key of list.keys) {
      const value = await this.kv.get(key.name, "json");
      if (value) {
        const record = value as CheckHistoryRecord;

        // 筛选目标
        if (targetId && record.targetId !== targetId) {
          continue;
        }

        // 筛选时间
        if (since && new Date(record.timestamp) < since) {
          continue;
        }

        if (records.length < limit) {
          records.push(record);
        }
        total++;
      }
    }

    return {
      data: records,
      cursor: list.list_complete ? undefined : list.cursor,
      total,
    };
  }

  /**
   * 获取通知历史
   */
  async listNotifyHistory(options: {
    targetId?: string;
    since?: Date;
    limit?: number;
    cursor?: string;
  } = {}): Promise<{ data: NotifyHistoryRecord[]; cursor?: string; total: number }> {
    const { targetId, since, limit = 50, cursor } = options;

    const list = await this.kv.list({
      prefix: KV_PREFIX.HISTORY_NOTIFY,
      limit: limit + 1,
      cursor,
    });

    const records: NotifyHistoryRecord[] = [];
    let total = 0;

    for (const key of list.keys) {
      const value = await this.kv.get(key.name, "json");
      if (value) {
        const record = value as NotifyHistoryRecord;

        // 筛选目标
        if (targetId && record.targetId !== targetId) {
          continue;
        }

        // 筛选时间
        if (since && new Date(record.timestamp) < since) {
          continue;
        }

        if (records.length < limit) {
          records.push(record);
        }
        total++;
      }
    }

    return {
      data: records,
      cursor: list.list_complete ? undefined : list.cursor,
      total,
    };
  }
}
