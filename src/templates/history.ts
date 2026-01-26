/**
 * 历史记录页面模板
 */

import { renderLayout } from './layout.js';

/**
 * 渲染历史记录页面
 */
export function renderHistoryPage(): string {
  const content = `
    <div class="page-header">
      <h1 class="page-title">历史记录</h1>
      <p class="page-subtitle">查看检查历史和通知历史</p>
    </div>

    <!-- 标签页 -->
    <div class="card mb-4">
      <div class="flex gap-2">
        <button class="btn btn-primary" id="tabCheck" onclick="switchTab('check')">
          检查历史
        </button>
        <button class="btn btn-secondary" id="tabNotify" onclick="switchTab('notify')">
          通知历史
        </button>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="card mb-4">
      <div class="flex gap-4" style="flex-wrap: wrap;">
        <div class="form-group" style="margin-bottom: 0; min-width: 150px;">
          <label class="form-label">时间范围</label>
          <select id="filterTime" class="form-select" onchange="loadHistory()">
            <option value="1h">最近 1 小时</option>
            <option value="24h" selected>最近 24 小时</option>
            <option value="7d">最近 7 天</option>
            <option value="30d">最近 30 天</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0; min-width: 150px;">
          <label class="form-label">目标</label>
          <select id="filterTarget" class="form-select" onchange="loadHistory()">
            <option value="all">全部</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 历史列表 -->
    <div class="card">
      <div class="table-container">
        <table class="table">
          <thead id="historyHeader">
            <tr>
              <th>时间</th>
              <th>目标</th>
              <th>状态</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody id="historyTable">
            <tr>
              <td colspan="4" class="text-center text-muted">加载中...</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="flex justify-between items-center mt-4" id="pagination" style="display: none;">
        <div class="text-sm text-muted" id="pageInfo">显示 1-20 条，共 100 条</div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" id="prevBtn" onclick="prevPage()">上一页</button>
          <button class="btn btn-secondary btn-sm" id="nextBtn" onclick="nextPage()">下一页</button>
        </div>
      </div>
    </div>
  `;

  const scripts = `
    let currentTab = 'check';
    let currentPage = 1;
    let pageSize = 20;
    let totalItems = 0;
    let targets = [];

    // 切换标签页
    function switchTab(tab) {
      currentTab = tab;
      currentPage = 1;

      // 更新按钮样式
      document.getElementById('tabCheck').className = tab === 'check' ? 'btn btn-primary' : 'btn btn-secondary';
      document.getElementById('tabNotify').className = tab === 'notify' ? 'btn btn-primary' : 'btn btn-secondary';

      // 更新表头
      const header = document.getElementById('historyHeader');
      if (tab === 'check') {
        header.innerHTML = \`
          <tr>
            <th>时间</th>
            <th>目标</th>
            <th>状态</th>
            <th>详情</th>
          </tr>
        \`;
      } else {
        header.innerHTML = \`
          <tr>
            <th>时间</th>
            <th>目标</th>
            <th>通知类型</th>
            <th>内容</th>
          </tr>
        \`;
      }

      loadHistory();
    }

    // 加载目标列表（用于筛选器）
    async function loadTargets() {
      try {
        const result = await API.get('/targets');
        targets = result.data || [];

        const select = document.getElementById('filterTarget');
        select.innerHTML = '<option value="all">全部</option>' +
          targets.map(t => \`<option value="\${t.id}">\${t.name || t.url}</option>\`).join('');
      } catch (error) {
        console.error('Failed to load targets:', error);
      }
    }

    // 加载历史记录
    async function loadHistory() {
      const tbody = document.getElementById('historyTable');
      const timeFilter = document.getElementById('filterTime').value;
      const targetFilter = document.getElementById('filterTarget').value;

      try {
        const params = new URLSearchParams({
          type: currentTab,
          time: timeFilter,
          page: currentPage.toString(),
          limit: pageSize.toString()
        });

        if (targetFilter !== 'all') {
          params.append('targetId', targetFilter);
        }

        const result = await API.get('/history?' + params.toString());
        const data = result.data || [];
        totalItems = result.total || data.length;

        if (data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">暂无记录</td></tr>';
          document.getElementById('pagination').style.display = 'none';
          return;
        }

        if (currentTab === 'check') {
          tbody.innerHTML = data.map(item => {
            let statusBadge = '<span class="badge badge-muted">未知</span>';
            if (item.error) {
              statusBadge = '<span class="badge badge-error">错误</span>';
            } else if (item.status) {
              statusBadge = item.status.inStock
                ? '<span class="badge badge-success">有货</span>'
                : '<span class="badge badge-warning">无货</span>';
            }

            const target = targets.find(t => t.id === item.targetId);
            const targetName = target?.name || target?.url || item.targetId;

            let detail = '-';
            if (item.error) {
              detail = \`<span class="text-error">\${item.error}</span>\`;
            } else if (item.status) {
              const parts = [];
              if (item.status.qty !== undefined) parts.push(\`数量: \${item.status.qty}\`);
              if (item.status.price !== undefined) parts.push(\`价格: $\${item.status.price}\`);
              if (item.duration) parts.push(\`耗时: \${item.duration}ms\`);
              detail = parts.join(', ') || '-';
            }

            return \`
              <tr>
                <td class="text-sm">\${Format.date(item.timestamp)}</td>
                <td class="truncate" style="max-width: 200px;" title="\${targetName}">\${targetName}</td>
                <td>\${statusBadge}</td>
                <td class="text-sm text-muted">\${detail}</td>
              </tr>
            \`;
          }).join('');
        } else {
          tbody.innerHTML = data.map(item => {
            const target = targets.find(t => t.id === item.targetId);
            const targetName = target?.name || target?.url || item.targetId;

            let typeBadge = '<span class="badge badge-muted">通知</span>';
            if (item.reason === 'restock') {
              typeBadge = '<span class="badge badge-success">补货</span>';
            } else if (item.reason === 'out_of_stock') {
              typeBadge = '<span class="badge badge-warning">缺货</span>';
            } else if (item.reason === 'price_change') {
              typeBadge = '<span class="badge badge-primary">价格变化</span>';
            }

            return \`
              <tr>
                <td class="text-sm">\${Format.date(item.timestamp)}</td>
                <td class="truncate" style="max-width: 200px;" title="\${targetName}">\${targetName}</td>
                <td>\${typeBadge}</td>
                <td class="text-sm text-muted">\${item.message || '-'}</td>
              </tr>
            \`;
          }).join('');
        }

        // 更新分页
        updatePagination();
      } catch (error) {
        console.error('Failed to load history:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-error">加载失败</td></tr>';
        Toast.error('加载历史记录失败');
      }
    }

    // 更新分页信息
    function updatePagination() {
      const pagination = document.getElementById('pagination');
      const pageInfo = document.getElementById('pageInfo');
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');

      if (totalItems <= pageSize) {
        pagination.style.display = 'none';
        return;
      }

      pagination.style.display = 'flex';

      const start = (currentPage - 1) * pageSize + 1;
      const end = Math.min(currentPage * pageSize, totalItems);
      pageInfo.textContent = \`显示 \${start}-\${end} 条，共 \${totalItems} 条\`;

      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage * pageSize >= totalItems;
    }

    // 上一页
    function prevPage() {
      if (currentPage > 1) {
        currentPage--;
        loadHistory();
      }
    }

    // 下一页
    function nextPage() {
      if (currentPage * pageSize < totalItems) {
        currentPage++;
        loadHistory();
      }
    }

    // 页面加载时获取数据
    document.addEventListener('DOMContentLoaded', async () => {
      await loadTargets();
      loadHistory();
    });
  `;

  return renderLayout({
    title: '历史记录',
    activePage: 'history',
    content,
    scripts,
  });
}
