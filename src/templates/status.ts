/**
 * 状态监控页面模板
 */

import { renderLayout, icons } from './layout.js';

/**
 * 渲染状态监控页面
 */
export function renderStatusPage(): string {
  const cardStyles = `
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }
    @media (max-width: 1024px) {
      .status-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .status-grid { grid-template-columns: 1fr; }
    }
    .server-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      transition: all 0.2s ease;
    }
    .server-card:hover {
      transform: translateY(-2px);
      border-color: #414868;
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    .srv-name {
      color: #fff;
      font-weight: 600;
      font-size: 1rem;
    }
    .srv-flag {
      background: rgba(255,255,255,0.05);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .srv-meta {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 0.5rem;
    }
    .card-bot {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .price {
      color: var(--text);
      font-weight: 700;
      font-size: 1.125rem;
    }
    .stock-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .stock-badge.ok {
      background: rgba(158,206,106,0.15);
      color: var(--success);
    }
    .stock-badge.no {
      background: rgba(247,118,142,0.15);
      color: var(--error);
    }
    .stock-badge.warn {
      background: rgba(224,175,104,0.15);
      color: var(--warning);
    }
    .stock-badge.muted {
      background: rgba(255,255,255,0.05);
      color: var(--text-muted);
    }
    .card-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .card-actions .btn {
      flex: 1;
      justify-content: center;
    }
    .empty-grid {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }
  `;

  const content = `
    <style>${cardStyles}</style>

    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">状态监控</h1>
        <p class="page-subtitle">实时查看所有监控目标的状态</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" onclick="loadStatus()" id="refreshBtn">
          刷新
        </button>
        <button class="btn btn-primary" onclick="checkAll()" id="checkAllBtn" data-requires-auth>
          检查全部
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="card mb-4">
      <div class="flex gap-4" style="flex-wrap: wrap;">
        <div class="form-group" style="margin-bottom: 0; min-width: 150px;">
          <label class="form-label">状态筛选</label>
          <select id="filterStatus" class="form-select" onchange="applyFilter()">
            <option value="all">全部</option>
            <option value="in_stock">有库存</option>
            <option value="out_of_stock">无库存</option>
            <option value="error">错误</option>
            <option value="unchecked">未检查</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0; min-width: 150px;">
          <label class="form-label">Provider</label>
          <select id="filterProvider" class="form-select" onchange="applyFilter()">
            <option value="all">全部</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 状态卡片网格 -->
    <div class="status-grid" id="statusGrid">
      <div class="empty-grid">
        <span class="spinner"></span>
        <p class="mt-2">加载中...</p>
      </div>
    </div>

    <!-- 状态详情 Modal -->
    <div class="modal-overlay" id="detailModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">状态详情</h3>
          <button class="modal-close" onclick="Modal.hide('detailModal')">&times;</button>
        </div>
        <div class="modal-body" id="detailContent">
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.hide('detailModal')">关闭</button>
        </div>
      </div>
    </div>
  `;

  const scripts = `
    let statusData = [];
    let filteredData = [];

    async function loadStatus() {
      const grid = document.getElementById('statusGrid');
      const refreshBtn = document.getElementById('refreshBtn');

      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<span class="spinner"></span>';

      try {
        const result = await API.get('/status');
        statusData = result.data || [];
        updateProviderFilter();
        applyFilter();
      } catch (error) {
        console.error('Failed to load status:', error);
        grid.innerHTML = '<div class="empty-grid text-error">加载失败</div>';
        Toast.error('加载状态失败');
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '刷新';
      }
    }

    function updateProviderFilter() {
      const select = document.getElementById('filterProvider');
      const providers = [...new Set(statusData.map(d => d.target.provider))];
      const currentValue = select.value;
      select.innerHTML = '<option value="all">全部</option>' +
        providers.map(p => \`<option value="\${p}">\${p}</option>\`).join('');
      if (providers.includes(currentValue)) select.value = currentValue;
    }

    function applyFilter() {
      const statusFilter = document.getElementById('filterStatus').value;
      const providerFilter = document.getElementById('filterProvider').value;

      filteredData = statusData.filter(item => {
        const target = item.target;
        const state = item.state;
        const status = state?.lastStatus;

        if (providerFilter !== 'all' && target.provider !== providerFilter) return false;
        if (statusFilter !== 'all') {
          if (statusFilter === 'in_stock' && !status?.inStock) return false;
          if (statusFilter === 'out_of_stock' && (status?.inStock || !status)) return false;
          if (statusFilter === 'error' && !state?.errorCount) return false;
          if (statusFilter === 'unchecked' && state?.lastCheckedAt) return false;
        }
        return true;
      });

      renderCards();
    }

    function renderCards() {
      const grid = document.getElementById('statusGrid');

      if (statusData.length === 0) {
        grid.innerHTML = \`
          <div class="empty-grid">
            <p>暂无监控目标</p>
            <a href="/targets" class="btn btn-primary mt-4">添加目标</a>
          </div>
        \`;
        return;
      }

      if (filteredData.length === 0) {
        grid.innerHTML = '<div class="empty-grid">无匹配数据</div>';
        return;
      }

      grid.innerHTML = filteredData.map(item => {
        const target = item.target;
        const state = item.state;
        const status = state?.lastStatus;

        let stockBadge = '<span class="stock-badge muted">未检查</span>';
        let stockClass = 'muted';
        if (state?.errorCount > 0) {
          stockBadge = '<span class="stock-badge no">错误</span>';
          stockClass = 'no';
        } else if (status) {
          if (status.inStock) {
            const qtyText = status.qty !== undefined ? \` (\${status.qty})\` : '';
            stockBadge = \`<span class="stock-badge ok">有货\${qtyText}</span>\`;
            stockClass = 'ok';
          } else {
            stockBadge = '<span class="stock-badge warn">无货</span>';
            stockClass = 'warn';
          }
        }

        const priceText = status?.price !== undefined ? '$' + status.price : '-';
        const displayName = target.name || target.url;
        const regionTag = target.region ? \`<span class="srv-flag">\${target.region.toUpperCase()}</span>\` : '';
        const configInfo = target.plan || target.provider;

        return \`
          <div class="server-card">
            <div class="card-top">
              <span class="srv-name" title="\${target.url}">\${displayName}</span>
              \${regionTag}
            </div>
            <div class="srv-meta">
              <div>\${target.provider}</div>
              <div>\${configInfo}</div>
            </div>
            <div class="card-bot">
              <span class="price">\${priceText}</span>
              \${stockBadge}
            </div>
            <div class="card-actions">
              <button class="btn btn-secondary btn-sm" onclick="checkSingle('\${target.id}')">检查</button>
              <button class="btn btn-secondary btn-sm" onclick="showDetail('\${target.id}')">详情</button>
            </div>
          </div>
        \`;
      }).join('');
    }

    // 检查单个目标
    async function checkSingle(id) {
      if (!requireAuth()) return;
      try {
        Toast.show('正在检查...', 'warning', 2000);
        const result = await API.post('/check/' + id);
        const status = result.data.status;

        if (status.inStock) {
          Toast.success('有库存！');
        } else {
          Toast.warning('暂无库存');
        }

        loadStatus();
      } catch (error) {
        Toast.error('检查失败: ' + error.message);
        loadStatus();
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
        loadStatus();
      } catch (error) {
        Toast.error('检查失败: ' + error.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '检查全部';
      }
    }

    // 显示详情
    function showDetail(id) {
      const item = statusData.find(d => d.target.id === id);
      if (!item) return;

      const target = item.target;
      const state = item.state;
      const status = state?.lastStatus;

      const content = document.getElementById('detailContent');
      content.innerHTML = \`
        <div class="mb-4">
          <h4 style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">目标信息</h4>
          <table class="table" style="font-size: 0.875rem;">
            <tr><td style="width: 100px;"><strong>名称</strong></td><td>\${target.name || '-'}</td></tr>
            <tr><td><strong>URL</strong></td><td style="word-break: break-all;">\${target.url}</td></tr>
            <tr><td><strong>Provider</strong></td><td>\${target.provider}</td></tr>
            <tr><td><strong>地区</strong></td><td>\${target.region || '-'}</td></tr>
            <tr><td><strong>套餐</strong></td><td>\${target.plan || '-'}</td></tr>
            <tr><td><strong>启用</strong></td><td>\${target.enabled ? '是' : '否'}</td></tr>
          </table>
        </div>

        <div class="mb-4">
          <h4 style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">状态信息</h4>
          <table class="table" style="font-size: 0.875rem;">
            <tr><td style="width: 100px;"><strong>库存</strong></td><td>\${status ? (status.inStock ? '有货' : '无货') : '未检查'}</td></tr>
            <tr><td><strong>数量</strong></td><td>\${status?.qty !== undefined ? status.qty : '-'}</td></tr>
            <tr><td><strong>价格</strong></td><td>\${status?.price !== undefined ? '$' + status.price : '-'}</td></tr>
            <tr><td><strong>最后检查</strong></td><td>\${Format.date(state?.lastCheckedAt)}</td></tr>
            <tr><td><strong>最后通知</strong></td><td>\${Format.date(state?.lastNotifiedAt)}</td></tr>
            <tr><td><strong>错误次数</strong></td><td>\${state?.errorCount || 0}</td></tr>
            \${state?.lastError ? \`<tr><td><strong>错误信息</strong></td><td class="text-error">\${state.lastError}</td></tr>\` : ''}
          </table>
        </div>

        \${status?.rawSource ? \`
          <div>
            <h4 style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">原始数据</h4>
            <pre style="background: var(--bg); padding: 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; overflow-x: auto; max-height: 200px;">\${status.rawSource}</pre>
          </div>
        \` : ''}
      \`;

      Modal.show('detailModal');
    }

    // 页面加载时获取数据
    document.addEventListener('DOMContentLoaded', loadStatus);
  `;

  return renderLayout({
    title: '状态监控',
    activePage: 'status',
    content,
    scripts,
  });
}
