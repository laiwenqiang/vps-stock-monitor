import { Hono } from "hono";
import { DmitProvider } from "./providers/dmit.js";
import type { MonitorTarget, MonitorTargetInput, MonitorTargetPatch } from "./models/types.js";
import { MonitorService } from "./services/monitor.js";
import { NotificationManager } from "./services/notification.js";
import { HistoryStore } from "./services/storage.js";
import { createUIRoutes } from "./routes/ui.js";

/**
 * Cloudflare Workers 环境变量类型
 */
export type Env = {
  /** KV 命名空间 */
  KV: KVNamespace;
  /** API 密钥 */
  API_KEY?: string;
  /** Telegram Bot Token */
  TELEGRAM_BOT_TOKEN?: string;
  /** Telegram Chat ID */
  TELEGRAM_CHAT_ID?: string;
};

/**
 * 创建 Hono 应用实例
 */
const app = new Hono<{ Bindings: Env }>();

/**
 * API 密钥验证中间件
 * GET 请求（查看）无需认证，POST/PATCH/DELETE（写操作）需要认证
 */
app.use("/api/*", async (c, next) => {
  // GET 请求无需认证
  if (c.req.method === "GET") {
    return next();
  }

  const apiKey = c.env.API_KEY;

  // 如果未配置 API_KEY，返回 503（服务不可用）
  if (!apiKey) {
    return c.json(
      {
        success: false,
        error: "Service not configured (API_KEY missing)",
        code: 503,
      },
      503
    );
  }

  // 验证请求头中的 API Key
  const requestKey = c.req.header("X-API-Key");
  if (requestKey !== apiKey) {
    return c.json(
      {
        success: false,
        error: "Unauthorized",
        code: 401,
      },
      401
    );
  }

  return next();
});

/**
 * 健康检查端点
 */
app.get("/", (c) => {
  return c.json({
    ok: true,
    service: "vps-stock-monitor",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

/**
 * 测试 Dmit 库存检查（无需 API Key）
 * 用于验证在 Workers 环境中是否能绕过 Cloudflare 保护
 *
 * 使用方法:
 * GET /test-dmit?url=https://www.dmit.io/cart.php?gid=1
 */
app.get("/test-dmit", async (c) => {
  const dmitUrl = c.req.query("url");

  if (!dmitUrl) {
    return c.json(
      {
        success: false,
        error: "Missing 'url' parameter",
        usage: "/test-dmit?url=https://www.dmit.io/cart.php?gid=1",
      },
      400
    );
  }

  try {
    const provider = new DmitProvider();
    const target: MonitorTarget = {
      id: "test",
      provider: "dmit",
      url: dmitUrl,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 检查是否支持
    if (!provider.supports(target)) {
      return c.json(
        {
          success: false,
          error: "URL is not a valid Dmit URL",
          url: dmitUrl,
        },
        400
      );
    }

    const startTime = Date.now();
    const status = await provider.fetchStatus(target);
    const duration = Date.now() - startTime;

    return c.json({
      success: true,
      duration: `${duration}ms`,
      url: dmitUrl,
      provider: provider.name,
      status,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
        url: dmitUrl,
      },
      500
    );
  }
});

/**
 * API 路由：获取所有监控目标
 */
app.get("/api/targets", async (c) => {
  try {
    const service = new MonitorService(c.env);
    const targets = await service.getTargetStore().list();

    return c.json({
      success: true,
      data: targets,
      count: targets.length,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

/**
 * API 路由：创建监控目标
 */
app.post("/api/targets", async (c) => {
  try {
    const input = await c.req.json<MonitorTargetInput>();

    // 验证必填字段
    if (!input.provider || !input.url) {
      return c.json(
        {
          success: false,
          error: "Missing required fields: provider, url",
        },
        400
      );
    }

    const service = new MonitorService(c.env);
    const target = await service.getTargetStore().create(input);

    return c.json(
      {
        success: true,
        data: target,
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

/**
 * API 路由：获取单个监控目标
 */
app.get("/api/targets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const service = new MonitorService(c.env);
    const target = await service.getTargetStore().get(id);

    if (!target) {
      return c.json(
        {
          success: false,
          error: "Target not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: target,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

/**
 * API 路由：更新监控目标
 */
app.patch("/api/targets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const patch = await c.req.json<MonitorTargetPatch>();

    const service = new MonitorService(c.env);
    const target = await service.getTargetStore().update(id, patch);

    return c.json({
      success: true,
      data: target,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

/**
 * API 路由：删除监控目标
 */
app.delete("/api/targets/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const service = new MonitorService(c.env);
    await service.getTargetStore().delete(id);

    return c.json({
      success: true,
      message: "Target deleted",
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

/**
 * API 路由：获取所有监控状态
 */
app.get("/api/status", async (c) => {
  try {
    const service = new MonitorService(c.env);
    const targets = await service.getTargetStore().list();
    const states = await service.getStateStore().listAll();

    const data = targets.map((target) => ({
      target,
      state: states[target.id] || null,
    }));

    return c.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

/**
 * API 路由：获取单个目标的状态
 */
app.get("/api/status/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const service = new MonitorService(c.env);

    const target = await service.getTargetStore().get(id);
    if (!target) {
      return c.json(
        {
          success: false,
          error: "Target not found",
        },
        404
      );
    }

    const state = await service.getStateStore().get(id);

    return c.json({
      success: true,
      data: {
        target,
        state,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

/**
 * API 路由：手动检查所有目标
 */
app.post("/api/check", async (c) => {
  try {
    const service = new MonitorService(c.env);
    const notificationManager = new NotificationManager(c.env);

    const result = await service.checkAllTargets();

    // 检查是否需要发送通知
    for (const item of result.results) {
      if (item.success && item.status) {
        const target = await service.getTargetStore().get(item.targetId);
        if (target) {
          const { shouldNotify, reason } = await service.shouldNotify(
            target,
            item.status
          );

          if (shouldNotify && reason) {
            await notificationManager.notify(target, item.status, reason);
            // 更新最后通知时间
            await service.getStateStore().update(item.targetId, {
              lastNotifiedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

/**
 * API 路由：手动检查单个目标
 */
app.post("/api/check/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const service = new MonitorService(c.env);
    const notificationManager = new NotificationManager(c.env);
    const historyStore = new HistoryStore(c.env.KV);

    const target = await service.getTargetStore().get(id);
    if (!target) {
      return c.json(
        {
          success: false,
          error: "Target not found",
        },
        404
      );
    }

    const startTime = Date.now();
    const status = await service.checkTarget(target);
    const duration = Date.now() - startTime;

    await service.getStateStore().recordSuccess(id, status);

    // 记录检查历史
    await historyStore.recordCheck(id, status, undefined, duration);

    // 检查是否需要发送通知
    const { shouldNotify, reason } = await service.shouldNotify(
      target,
      status
    );

    let notified = false;
    if (shouldNotify && reason) {
      await notificationManager.notify(target, status, reason);
      await service.getStateStore().update(id, {
        lastNotifiedAt: new Date().toISOString(),
      });
      // 记录通知历史
      await historyStore.recordNotify(id, reason, `${target.name || target.url} - ${status.inStock ? '有货' : '无货'}`);
      notified = true;
    }

    return c.json({
      success: true,
      data: {
        status,
        duration: `${duration}ms`,
        notified,
        notifyReason: reason,
      },
    });
  } catch (error) {
    const id = c.req.param("id");
    const service = new MonitorService(c.env);
    const historyStore = new HistoryStore(c.env.KV);

    await service.getStateStore().recordError(id, (error as Error).message);
    // 记录错误历史
    await historyStore.recordCheck(id, undefined, (error as Error).message);

    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

/**
 * API 路由：获取历史记录
 */
app.get("/api/history", async (c) => {
  try {
    const type = c.req.query("type") || "check";
    const time = c.req.query("time") || "24h";
    const targetId = c.req.query("targetId");
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "20", 10);

    // 计算时间范围
    let since: Date | undefined;
    const now = new Date();
    switch (time) {
      case "1h":
        since = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "24h":
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const historyStore = new HistoryStore(c.env.KV);

    if (type === "notify") {
      const result = await historyStore.listNotifyHistory({
        targetId: targetId || undefined,
        since,
        limit,
      });

      return c.json({
        success: true,
        data: result.data,
        total: result.total,
        page,
        limit,
      });
    } else {
      const result = await historyStore.listCheckHistory({
        targetId: targetId || undefined,
        since,
        limit,
      });

      return c.json({
        success: true,
        data: result.data,
        total: result.total,
        page,
        limit,
      });
    }
  } catch (error) {
    return c.json(
      {
        success: false,
        error: (error as Error).message,
      },
      500
    );
  }
});

/**
 * 挂载 UI 路由
 */
app.route("/admin", createUIRoutes());

/**
 * 404 处理
 */
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Not Found",
      code: 404,
    },
    404
  );
});

/**
 * 错误处理
 */
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      success: false,
      error: err.message || "Internal Server Error",
      code: 500,
    },
    500
  );
});

/**
 * Cron Trigger 处理
 * 定时检查所有启用的监控目标
 */
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log(
      "Cron triggered at:",
      new Date(event.scheduledTime).toISOString()
    );

    try {
      const service = new MonitorService(env);
      const notificationManager = new NotificationManager(env);

      // 检查所有启用的目标
      const result = await service.checkAllTargets();

      console.log(
        `Checked ${result.success + result.failed} targets: ${result.success} success, ${result.failed} failed`
      );

      // 处理通知
      for (const item of result.results) {
        if (item.success && item.status) {
          const target = await service.getTargetStore().get(item.targetId);
          if (target) {
            const { shouldNotify, reason } = await service.shouldNotify(
              target,
              item.status
            );

            if (shouldNotify && reason) {
              console.log(
                `Sending notification for target ${item.targetId}: ${reason}`
              );
              await notificationManager.notify(target, item.status, reason);

              // 更新最后通知时间
              await service.getStateStore().update(item.targetId, {
                lastNotifiedAt: new Date().toISOString(),
              });
            }
          }
        } else if (!item.success) {
          console.error(
            `Failed to check target ${item.targetId}: ${item.error}`
          );
        }
      }

      console.log("Cron job completed successfully");
    } catch (error) {
      console.error("Cron job failed:", error);
    }
  },
};
