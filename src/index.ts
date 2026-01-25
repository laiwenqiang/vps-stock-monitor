import { Hono } from "hono";
import { DmitProvider } from "./providers/dmit.js";
import type { MonitorTarget } from "./models/types.js";

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
 */
app.use("/api/*", async (c, next) => {
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
 * API 路由占位
 * TODO: 实现具体的 API 路由
 */
app.get("/api/targets", (c) => {
  return c.json(
    {
      success: false,
      error: "Not implemented yet",
      code: 501,
    },
    501
  );
});

app.post("/api/targets", (c) => {
  return c.json(
    {
      success: false,
      error: "Not implemented yet",
      code: 501,
    },
    501
  );
});

app.get("/api/status", (c) => {
  return c.json(
    {
      success: false,
      error: "Not implemented yet",
      code: 501,
    },
    501
  );
});

app.post("/api/check", (c) => {
  return c.json(
    {
      success: false,
      error: "Not implemented yet",
      code: 501,
    },
    501
  );
});

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
 * TODO: 实现定时监控逻辑
 */
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log("Cron triggered at:", new Date(event.scheduledTime).toISOString());
    // TODO: 调用监控服务检查所有目标
    // await checkAllTargets(env);
  },
};
