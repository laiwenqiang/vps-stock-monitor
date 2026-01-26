/**
 * 目标管理页面模板
 */

import { renderLayout } from './layout.js';

/**
 * 渲染目标管理页面
 */
export function renderTargetsPage(): string {
  const content = `
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">目标管理</h1>
        <p class="page-subtitle">管理 VPS 库存监控目标</p>
      </div>
      <button class="btn btn-primary" onclick="showCreateModal()" data-requires-auth>
        + 添加目标
      </button>
    </div>

    <!-- 目标列表 -->
    <div class="card">
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>名称/URL</th>
              <th>Provider</th>
              <th>状态</th>
              <th>启用</th>
              <th class="hide-mobile">创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="targetsTable">
            <tr>
              <td colspan="6" class="text-center text-muted">加载中...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 创建/编辑 Modal -->
    <div class="modal-overlay" id="targetModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="modalTitle">添加目标</h3>
          <button class="modal-close" onclick="Modal.hide('targetModal')">&times;</button>
        </div>
        <form id="targetForm" onsubmit="handleSubmit(event)">
          <div class="modal-body">
            <input type="hidden" id="targetId">

            <div class="form-group">
              <label class="form-label" for="targetUrl">监控 URL *</label>
              <input
                type="url"
                id="targetUrl"
                class="form-input"
                placeholder="https://www.dmit.io/cart.php?gid=1"
                required
              >
            </div>

            <div class="form-group">
              <label class="form-label" for="targetProvider">Provider *</label>
              <select id="targetProvider" class="form-select" required>
                <option value="">选择 Provider</option>
                <option value="dmit">DMIT</option>
                <option value="bandwagon">BandwagonHost</option>
                <option value="racknerd">RackNerd</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="targetName">名称（可选）</label>
              <input
                type="text"
                id="targetName"
                class="form-input"
                placeholder="例如：DMIT LAX Pro"
              >
            </div>

            <div class="form-group">
              <label class="form-label" for="targetRegion">地区（可选）</label>
              <input
                type="text"
                id="targetRegion"
                class="form-input"
                placeholder="例如：us-west, hk"
              >
            </div>

            <div class="form-group">
              <label class="form-label" for="targetPlan">套餐（可选）</label>
              <input
                type="text"
                id="targetPlan"
                class="form-input"
                placeholder="例如：premium, standard"
              >
            </div>

            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" id="targetEnabled" checked>
                <span>启用监控</span>
              </label>
            </div>

            <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border);">

            <h4 style="font-size: 0.875rem; margin-bottom: 0.75rem;">通知设置</h4>

            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" id="notifyOnRestock" checked>
                <span>补货时通知</span>
              </label>
            </div>

            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" id="notifyOnOutOfStock">
                <span>缺货时通知</span>
              </label>
            </div>

            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" id="notifyOnPriceChange">
                <span>价格变化时通知</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="Modal.hide('targetModal')">取消</button>
            <button type="submit" class="btn btn-primary" id="submitBtn">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认 Modal -->
    <div class="modal-overlay" id="deleteModal">
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
          <button class="modal-close" onclick="Modal.hide('deleteModal')">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要删除这个监控目标吗？此操作不可撤销。</p>
          <p class="text-muted text-sm mt-2" id="deleteTargetInfo"></p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.hide('deleteModal')">取消</button>
          <button class="btn btn-danger" onclick="confirmDelete()" id="deleteBtn">删除</button>
        </div>
      </div>
    </div>
  `;

  const scripts = `
    let targets = [];
    let states = {};
    let deleteTargetId = null;

    // 加载目标列表
    async function loadTargets() {
      const tbody = document.getElementById('targetsTable');

      try {
        // 并行加载目标和状态
        const [targetsResult, statusResult] = await Promise.all([
          API.get('/targets'),
          API.get('/status')
        ]);

        targets = targetsResult.data || [];

        // 构建状态映射
        states = {};
        (statusResult.data || []).forEach(item => {
          if (item.state) {
            states[item.target.id] = item.state;
          }
        });

        if (targets.length === 0) {
          tbody.innerHTML = \`
            <tr>
              <td colspan="6" class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>暂无监控目标</p>
                <button class="btn btn-primary mt-4" onclick="showCreateModal()">添加第一个目标</button>
              </td>
            </tr>
          \`;
          return;
        }

        tbody.innerHTML = targets.map(target => {
          const state = states[target.id];
          const status = state?.lastStatus;

          let statusBadge = '<span class="badge badge-muted">未检查</span>';
          if (state?.errorCount > 0) {
            statusBadge = \`<span class="badge badge-error" title="\${state.lastError || ''}">错误 (\${state.errorCount})</span>\`;
          } else if (status) {
            statusBadge = status.inStock
              ? '<span class="badge badge-success">有货</span>'
              : '<span class="badge badge-warning">无货</span>';
          }

          const displayName = target.name || target.url;

          return \`
            <tr>
              <td>
                <div class="truncate" style="max-width: 250px;" title="\${target.url}">
                  \${displayName}
                </div>
                \${target.name ? \`<div class="text-xs text-muted truncate" style="max-width: 250px;">\${target.url}</div>\` : ''}
              </td>
              <td>\${target.provider}</td>
              <td>\${statusBadge}</td>
              <td>
                <div class="toggle \${target.enabled ? 'active' : ''}" onclick="toggleEnabled('\${target.id}', \${!target.enabled})"></div>
              </td>
              <td class="text-muted text-sm hide-mobile">\${Format.date(target.createdAt)}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-secondary btn-sm" onclick="checkTarget('\${target.id}')" title="检查">
                    🔍
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="editTarget('\${target.id}')" title="编辑">
                    ✏️
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="showDeleteModal('\${target.id}')" title="删除">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          \`;
        }).join('');
      } catch (error) {
        console.error('Failed to load targets:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-error">加载失败</td></tr>';
        Toast.error('加载目标列表失败');
      }
    }

    // 显示创建 Modal
    function showCreateModal() {
      if (!requireAuth()) return;
      document.getElementById('modalTitle').textContent = '添加目标';
      document.getElementById('targetForm').reset();
      document.getElementById('targetId').value = '';
      document.getElementById('targetEnabled').checked = true;
      document.getElementById('notifyOnRestock').checked = true;
      Modal.show('targetModal');
    }

    // 编辑目标
    function editTarget(id) {
      if (!requireAuth()) return;
      const target = targets.find(t => t.id === id);
      if (!target) return;

      document.getElementById('modalTitle').textContent = '编辑目标';
      document.getElementById('targetId').value = target.id;
      document.getElementById('targetUrl').value = target.url;
      document.getElementById('targetProvider').value = target.provider;
      document.getElementById('targetName').value = target.name || '';
      document.getElementById('targetRegion').value = target.region || '';
      document.getElementById('targetPlan').value = target.plan || '';
      document.getElementById('targetEnabled').checked = target.enabled;
      document.getElementById('notifyOnRestock').checked = target.notifyOnRestock !== false;
      document.getElementById('notifyOnOutOfStock').checked = target.notifyOnOutOfStock === true;
      document.getElementById('notifyOnPriceChange').checked = target.notifyOnPriceChange === true;

      Modal.show('targetModal');
    }

    // 提交表单
    async function handleSubmit(e) {
      e.preventDefault();

      const id = document.getElementById('targetId').value;
      const submitBtn = document.getElementById('submitBtn');

      const data = {
        url: document.getElementById('targetUrl').value.trim(),
        provider: document.getElementById('targetProvider').value,
        name: document.getElementById('targetName').value.trim() || undefined,
        region: document.getElementById('targetRegion').value.trim() || undefined,
        plan: document.getElementById('targetPlan').value.trim() || undefined,
        enabled: document.getElementById('targetEnabled').checked,
        notifyOnRestock: document.getElementById('notifyOnRestock').checked,
        notifyOnOutOfStock: document.getElementById('notifyOnOutOfStock').checked,
        notifyOnPriceChange: document.getElementById('notifyOnPriceChange').checked,
      };

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> 保存中...';

      try {
        if (id) {
          await API.patch('/targets/' + id, data);
          Toast.success('目标已更新');
        } else {
          await API.post('/targets', data);
          Toast.success('目标已创建');
        }

        Modal.hide('targetModal');
        loadTargets();
      } catch (error) {
        Toast.error('保存失败: ' + error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '保存';
      }
    }

    // 切换启用状态
    async function toggleEnabled(id, enabled) {
      if (!requireAuth()) return;
      try {
        await API.patch('/targets/' + id, { enabled });
        Toast.success(enabled ? '已启用' : '已禁用');
        loadTargets();
      } catch (error) {
        Toast.error('操作失败: ' + error.message);
      }
    }

    // 检查单个目标
    async function checkTarget(id) {
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

        loadTargets();
      } catch (error) {
        Toast.error('检查失败: ' + error.message);
        loadTargets();
      }
    }

    // 显示删除确认
    function showDeleteModal(id) {
      if (!requireAuth()) return;
      const target = targets.find(t => t.id === id);
      if (!target) return;

      deleteTargetId = id;
      document.getElementById('deleteTargetInfo').textContent = target.name || target.url;
      Modal.show('deleteModal');
    }

    // 确认删除
    async function confirmDelete() {
      if (!deleteTargetId) return;

      const deleteBtn = document.getElementById('deleteBtn');
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = '<span class="spinner"></span> 删除中...';

      try {
        await API.delete('/targets/' + deleteTargetId);
        Toast.success('目标已删除');
        Modal.hide('deleteModal');
        loadTargets();
      } catch (error) {
        Toast.error('删除失败: ' + error.message);
      } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = '删除';
        deleteTargetId = null;
      }
    }

    // 页面加载时获取数据
    document.addEventListener('DOMContentLoaded', loadTargets);
  `;

  return renderLayout({
    title: '目标管理',
    activePage: 'targets',
    content,
    scripts,
  });
}
