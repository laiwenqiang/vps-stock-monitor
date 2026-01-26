/**
 * UI 路由处理
 * 处理所有页面路由
 */

import { Hono } from 'hono';
import type { Env } from '../index.js';
import { renderLoginPage } from '../templates/login.js';
import { renderDashboardPage } from '../templates/dashboard.js';
import { renderTargetsPage } from '../templates/targets.js';
import { renderStatusPage } from '../templates/status.js';
import { renderHistoryPage } from '../templates/history.js';

/**
 * 创建 UI 路由
 */
export function createUIRoutes() {
  const ui = new Hono<{ Bindings: Env }>();

  /**
   * 登录页面
   */
  ui.get('/login', (c) => {
    return c.html(renderLoginPage());
  });

  /**
   * Dashboard 页面
   */
  ui.get('/', (c) => {
    return c.html(renderDashboardPage());
  });

  /**
   * 目标管理页面
   */
  ui.get('/targets', (c) => {
    return c.html(renderTargetsPage());
  });

  /**
   * 状态监控页面
   */
  ui.get('/status', (c) => {
    return c.html(renderStatusPage());
  });

  /**
   * 历史记录页面
   */
  ui.get('/history', (c) => {
    return c.html(renderHistoryPage());
  });

  return ui;
}
