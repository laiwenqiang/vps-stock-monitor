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
