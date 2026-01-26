/**
 * 状态监控页面模板
 */

import { renderLayout } from './layout.js';

/**
 * 渲染状态监控页面
 */
export function renderStatusPage(): string {
  const content = `
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

    <!-- 状态列表 -->
    <div class="card">
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>目标</th>
              <th>Provider</th>
              <th>库存状态</th>
              <th>价格</th>
              <th>最后检查</th>
              <th>错误</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="statusTable">
            <tr>
              <td colspan="7" class="text-center text-muted">加载中...</td>
            </tr>
          </tbody>
        </table>
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
          <!-- 动态内容 -->
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

    // 加载状态数据
    async function loadStatus() {
      const tbody = document.getElementById('statusTable');
      const refreshBtn = document.getElementById('refreshBtn');

      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<span class="spinner"></span>';

      try {
        const result = await API.get('/status');
        statusData = result.data || [];

        // 更新 Provider 筛选器
        updateProviderFilter();

        // 应用筛选
        applyFilter();
      } catch (error) {
        console.error('Failed to load status:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-error">加载失败</td></tr>';
        Toast.error('加载状态失败');
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '刷新';
      }
    }

    // 更新 Provider 筛选器选项
    function updateProviderFilter() {
      const select = document.getElementById('filterProvider');
      const providers = [...new Set(statusData.map(d => d.target.provider))];

      const currentValue = select.value;
      select.innerHTML = '<option value="all">全部</option>' +
        providers.map(p => \`<option value="\${p}">\${p}</option>\`).join('');

      if (providers.includes(currentValue)) {
        select.value = currentValue;
      }
    }

    // 应用筛选
    function applyFilter() {
      const statusFilter = document.getElementById('filterStatus').value;
      const providerFilter = document.getElementById('filterProvider').value;

      filteredData = statusData.filter(item => {
        const target = item.target;
        const state = item.state;
        const status = state?.lastStatus;

        // Provider 筛选
        if (providerFilter !== 'all' && target.provider !== providerFilter) {
          return false;
        }

        // 状态筛选
        if (statusFilter !== 'all') {
          if (statusFilter === 'in_stock' && !status?.inStock) return false;
          if (statusFilter === 'out_of_stock' && (status?.inStock || !status)) return false;
          if (statusFilter === 'error' && !state?.errorCount) return false;
          if (statusFilter === 'unchecked' && state?.lastCheckedAt) return false;
        }

        return true;
      });

      renderTable();
    }

    // 渲染表格
    function renderTable() {
      const tbody = document.getElementById('statusTable');

      if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">无匹配数据</td></tr>';
        return;
      }

      tbody.innerHTML = filteredData.map(item => {
        const target = item.target;
        const state = item.state;
        const status = state?.lastStatus;

        // 库存状态
        let stockBadge = '<span class="badge badge-muted">未检查</span>';
        if (state?.errorCount > 0) {
          stockBadge = '<span class="badge badge-error">错误</span>';
        } else if (status) {
          if (status.inStock) {
            const qtyText = status.qty !== undefined ? \` (\${status.qty})\` : '';
            stockBadge = \`<span class="badge badge-success">有货\${qtyText}</span>\`;
          } else {
            stockBadge = '<span class="badge badge-warning">无货</span>';
          }
        }

        // 价格
        const priceText = status?.price !== undefined ? \`$\${status.price}\` : '-';

        // 错误信息
        let errorText = '-';
        if (state?.errorCount > 0) {
          errorText = \`<span class="text-error" title="\${state.lastError || ''}">\${state.errorCount} 次</span>\`;
        }

        const displayName = target.name || target.url;

        return \`
          <tr>
            <td>
              <div class="truncate" style="max-width: 200px;" title="\${target.url}">
                \${displayName}
              </div>
              \${target.region ? \`<div class="text-xs text-muted">\${target.region}</div>\` : ''}
            </td>
            <td>\${target.provider}</td>
            <td>\${stockBadge}</td>
            <td>\${priceText}</td>
            <td class="text-muted text-sm">\${Format.relativeTime(state?.lastCheckedAt)}</td>
            <td>\${errorText}</td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-secondary btn-sm" onclick="checkSingle('\${target.id}')" title="检查">
                  🔍
                </button>
                <button class="btn btn-secondary btn-sm" onclick="showDetail('\${target.id}')" title="详情">
                  📋
                </button>
              </div>
            </td>
          </tr>
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
