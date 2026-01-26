/**
 * Dashboard 页面模板
 */

import { renderLayout } from './layout.js';

/**
 * 渲染 Dashboard 页面
 */
export function renderDashboardPage(): string {
  const content = `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">VPS 库存监控系统概览</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid" id="statsGrid">
      <div class="stat-card">
        <div class="stat-label">总目标数</div>
        <div class="stat-value" id="totalTargets">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已启用</div>
        <div class="stat-value success" id="enabledTargets">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">有库存</div>
        <div class="stat-value warning" id="inStockTargets">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">错误数</div>
        <div class="stat-value error" id="errorTargets">-</div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="card mb-4">
      <div class="card-header">
        <h2 class="card-title">快速操作</h2>
      </div>
      <div class="flex gap-2" style="flex-wrap: wrap;">
        <button class="btn btn-primary" onclick="checkAll()" id="checkAllBtn" data-requires-auth>
          检查所有目标
        </button>
        <a href="/admin/targets" class="btn btn-secondary">
          管理目标
        </a>
        <a href="/admin/status" class="btn btn-secondary">
          查看状态
        </a>
      </div>
    </div>

    <!-- 最近状态 -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">最近状态</h2>
        <button class="btn btn-secondary btn-sm" onclick="loadRecentStatus()">
          刷新
        </button>
      </div>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>目标</th>
              <th>Provider</th>
              <th>状态</th>
              <th>最后检查</th>
            </tr>
          </thead>
          <tbody id="recentStatusTable">
            <tr>
              <td colspan="4" class="text-center text-muted">加载中...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const scripts = `
    // 加载统计数据
    async function loadStats() {
      try {
        const result = await API.get('/status');
        const data = result.data || [];

        const total = data.length;
        const enabled = data.filter(d => d.target.enabled).length;
        const inStock = data.filter(d => d.state?.lastStatus?.inStock).length;
        const errors = data.filter(d => d.state?.errorCount > 0).length;

        document.getElementById('totalTargets').textContent = total;
        document.getElementById('enabledTargets').textContent = enabled;
        document.getElementById('inStockTargets').textContent = inStock;
        document.getElementById('errorTargets').textContent = errors;
      } catch (error) {
        console.error('Failed to load stats:', error);
        Toast.error('加载统计数据失败');
      }
    }

    // 加载最近状态
    async function loadRecentStatus() {
      const tbody = document.getElementById('recentStatusTable');

      try {
        const result = await API.get('/status');
        const data = result.data || [];

        if (data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">暂无监控目标</td></tr>';
          return;
        }

        // 按最后检查时间排序，取前 10 个
        const sorted = data
          .filter(d => d.state?.lastCheckedAt)
          .sort((a, b) => new Date(b.state.lastCheckedAt) - new Date(a.state.lastCheckedAt))
          .slice(0, 10);

        if (sorted.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">暂无检查记录</td></tr>';
          return;
        }

        tbody.innerHTML = sorted.map(item => {
          const target = item.target;
          const state = item.state;
          const status = state?.lastStatus;

          let statusBadge = '<span class="badge badge-muted">未检查</span>';
          if (state?.errorCount > 0) {
            statusBadge = '<span class="badge badge-error">错误</span>';
          } else if (status) {
            statusBadge = status.inStock
              ? '<span class="badge badge-success">有货</span>'
              : '<span class="badge badge-warning">无货</span>';
          }

          return \`
            <tr>
              <td>
                <div class="truncate" style="max-width: 200px;" title="\${target.url}">
                  \${target.name || target.url}
                </div>
              </td>
              <td>\${target.provider}</td>
              <td>\${statusBadge}</td>
              <td class="text-muted text-sm">\${Format.relativeTime(state?.lastCheckedAt)}</td>
            </tr>
          \`;
        }).join('');
      } catch (error) {
        console.error('Failed to load recent status:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-error">加载失败</td></tr>';
      }
    }

    // 检查所有目标
    async function checkAll() {
      if (!requireAuth()) return;
      const btn = document.getElementById('checkAllBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> 检查中...';

      try {
        const result = await API.post('/check');
        const data = result.data;

        Toast.success(\`检查完成: \${data.success} 成功, \${data.failed} 失败\`);

        // 刷新数据
        loadStats();
        loadRecentStatus();
      } catch (error) {
        Toast.error('检查失败: ' + error.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '检查所有目标';
      }
    }

    // 页面加载时获取数据
    document.addEventListener('DOMContentLoaded', () => {
      loadStats();
      loadRecentStatus();
    });
  `;

  return renderLayout({
    title: 'Dashboard',
    activePage: 'dashboard',
    content,
    scripts,
  });
}
