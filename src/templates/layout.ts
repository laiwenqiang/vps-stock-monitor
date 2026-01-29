/**
 * 页面布局模板
 * 提供通用 HTML 结构、导航栏、样式和 JS 工具函数
 */

export interface LayoutOptions {
  title: string;
  activePage?: 'dashboard' | 'targets' | 'status' | 'history';
  content: string;
  scripts?: string;
}

/**
 * SVG 图标集合
 */
export const icons = {
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  edit: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
  delete: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
  copy: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
  plus: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  refresh: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
  settings: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  logout: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  empty: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>',
}

/**
 * 通用样式
 */
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --primary: #7aa2f7;
    --primary-dark: #5d7ec7;
    --success: #9ece6a;
    --warning: #e0af68;
    --error: #f7768e;
    --bg: #1a1b26;
    --bg-card: #24283b;
    --text: #c0caf5;
    --text-muted: #565f89;
    --border: rgba(255,255,255,0.06);
    --shadow: none;
    --shadow-hover: 0 2px 8px rgba(0,0,0,0.3);
    --shadow-lg: 0 4px 6px rgba(0,0,0,0.4);
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    min-height: 100vh;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  /* Navigation */
  .nav {
    background: var(--bg-card);
    border-bottom: 1px solid var(--border);
    padding: 0.75rem 0;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .nav-brand {
    font-weight: 600;
    font-size: 1.125rem;
    color: var(--primary);
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 0.5rem;
    list-style: none;
  }

  .nav-link {
    padding: 0.5rem 1rem;
    color: var(--text-muted);
    text-decoration: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    position: relative;
  }

  .nav-link:hover {
    color: var(--text);
  }

  .nav-link.active {
    color: var(--primary);
    font-weight: 500;
  }

  .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -0.75rem;
    left: 1rem;
    right: 1rem;
    height: 2px;
    background: var(--primary);
    border-radius: 1px;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Main content */
  .main {
    padding: 2rem 0;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .page-subtitle {
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  /* Cards */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1.5rem;
    transition: box-shadow 0.2s ease;
  }

  .card:hover {
    box-shadow: var(--shadow-hover);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .card-title {
    font-size: 1rem;
    font-weight: 600;
  }

  /* Stats grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1.5rem;
    transition: box-shadow 0.2s ease;
  }

  .stat-card:hover {
    box-shadow: var(--shadow-hover);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
  }

  .stat-value.success { color: var(--success); }
  .stat-value.warning { color: var(--warning); }
  .stat-value.error { color: var(--error); }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.375rem;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--primary-dark);
  }

  .btn-secondary {
    background: var(--bg);
    color: var(--text);
    border-color: var(--border);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--border);
  }

  .btn-danger {
    background: var(--error);
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #dc2626;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .btn-icon {
    padding: 0.5rem;
    min-width: 2rem;
  }

  /* Forms */
  .form-group {
    margin-bottom: 1rem;
  }

  .form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.375rem;
  }

  .form-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid var(--border);
    border-radius: 0.375rem;
    background: var(--bg-card);
    transition: all 0.2s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
  }

  .form-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid var(--border);
    border-radius: 0.375rem;
    background: var(--bg-card);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .form-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
  }

  .form-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-checkbox input {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }

  /* Tables */
  .table-container {
    overflow-x: auto;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .table th,
  .table td {
    padding: 1rem 1.25rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  .table th {
    font-weight: 600;
    color: var(--text-muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--bg);
  }

  .table tr {
    transition: background 0.15s ease;
  }

  .table tbody tr:hover {
    background: rgba(255,255,255,0.03);
  }

  /* Status badges */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
  }

  .badge-success {
    background: rgba(158,206,106,0.15);
    color: var(--success);
  }

  .badge-warning {
    background: rgba(224,175,104,0.15);
    color: var(--warning);
  }

  .badge-error {
    background: rgba(247,118,142,0.15);
    color: var(--error);
  }

  .badge-muted {
    background: rgba(255,255,255,0.05);
    color: var(--text-muted);
  }

  /* Toggle switch */
  .toggle {
    position: relative;
    width: 2.5rem;
    height: 1.25rem;
    background: rgba(255,255,255,0.1);
    border-radius: 9999px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .toggle.active {
    background: var(--success);
  }

  .toggle::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 1rem;
    height: 1rem;
    background: #c0caf5;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .toggle.active::after {
    transform: translateX(1.25rem);
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
  }

  .modal-overlay.active {
    opacity: 1;
    visibility: visible;
  }

  .modal {
    background: var(--bg-card);
    border-radius: 0.5rem;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    margin: 1rem;
    transform: scale(0.95) translateY(10px);
    transition: transform 0.2s ease;
  }

  .modal-overlay.active .modal {
    transform: scale(1) translateY(0);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border);
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-muted);
    line-height: 1;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border);
  }

  /* Toast notifications */
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .toast {
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: slideIn 0.2s ease-out;
    max-width: 350px;
    transition: all 0.2s ease;
  }

  .toast.success {
    border-left: 3px solid var(--success);
  }

  .toast.error {
    border-left: 3px solid var(--error);
  }

  .toast.warning {
    border-left: 3px solid var(--warning);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Loading spinner */
  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(26, 27, 38, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-muted);
  }

  .empty-state-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .nav-links {
      display: none;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .table th,
    .table td {
      padding: 0.5rem;
    }

    .hide-mobile {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Utility classes */
  .text-muted { color: var(--text-muted); }
  .text-success { color: var(--success); }
  .text-error { color: var(--error); }
  .text-warning { color: var(--warning); }
  .text-sm { font-size: 0.875rem; }
  .text-xs { font-size: 0.75rem; }
  .font-mono { font-family: monospace; }
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-1 { gap: 0.25rem; }
  .gap-2 { gap: 0.5rem; }
  .gap-4 { gap: 1rem; }
  .mt-2 { margin-top: 0.5rem; }
  .mt-4 { margin-top: 1rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-4 { margin-bottom: 1rem; }
  .relative { position: relative; }
`;

/**
 * 通用 JavaScript 工具函数
 */
const scripts = `
  // API 工具
  const API = {
    baseUrl: '/api',

    getApiKey() {
      return localStorage.getItem('apiKey') || '';
    },

    setApiKey(key) {
      localStorage.setItem('apiKey', key);
    },

    clearApiKey() {
      localStorage.removeItem('apiKey');
    },

    isLoggedIn() {
      return !!this.getApiKey();
    },

    async request(method, path, data = null) {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // 写操作需要 API Key
      if (method !== 'GET') {
        const apiKey = this.getApiKey();
        if (!apiKey) {
          Toast.error('请先登录');
          throw new Error('Not authenticated');
        }
        options.headers['X-API-Key'] = apiKey;
      }

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(this.baseUrl + path, options);
      const result = await response.json();

      if (response.status === 401) {
        this.clearApiKey();
        Toast.error('认证失败，请重新登录');
        updateAuthUI();
        throw new Error('Unauthorized');
      }

      if (!result.success) {
        throw new Error(result.error || 'Request failed');
      }

      return result;
    },

    get(path) { return this.request('GET', path); },
    post(path, data) { return this.request('POST', path, data); },
    patch(path, data) { return this.request('PATCH', path, data); },
    delete(path) { return this.request('DELETE', path); }
  };

  // Toast 通知
  const Toast = {
    container: null,

    init() {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
      }
    },

    show(message, type = 'success', duration = 3000) {
      this.init();

      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.textContent = message;

      this.container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 200);
      }, duration);
    },

    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); }
  };

  // Modal 工具
  const Modal = {
    show(id) {
      const modal = document.getElementById(id);
      if (modal) modal.classList.add('active');
    },

    hide(id) {
      const modal = document.getElementById(id);
      if (modal) modal.classList.remove('active');
    },

    confirm(message) {
      return new Promise((resolve) => {
        if (confirm(message)) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    }
  };

  // 格式化工具
  const Format = {
    date(dateStr) {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    relativeTime(dateStr) {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now - date;

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return '刚刚';
      if (minutes < 60) return minutes + ' 分钟前';
      if (hours < 24) return hours + ' 小时前';
      return days + ' 天前';
    }
  };

  // 更新认证相关 UI
  function updateAuthUI() {
    const authActions = document.getElementById('authActions');
    if (!authActions) return;

    if (API.isLoggedIn()) {
      authActions.innerHTML = '<button onclick="logout()" class="btn btn-secondary btn-sm">登出</button>';
    } else {
      authActions.innerHTML = '<a href="/login" class="btn btn-primary btn-sm">登录</a>';
    }

    // 更新需要登录的按钮状态
    document.querySelectorAll('[data-requires-auth]').forEach(el => {
      if (!API.isLoggedIn()) {
        el.classList.add('auth-required');
        el.title = '需要登录';
      } else {
        el.classList.remove('auth-required');
        el.title = '';
      }
    });
  }

  // 检查是否需要登录才能执行操作
  function requireAuth(callback) {
    if (!API.isLoggedIn()) {
      Toast.warning('请先登录后再执行此操作');
      return false;
    }
    if (callback) callback();
    return true;
  }

  // 登出
  function logout() {
    API.clearApiKey();
    Toast.success('已登出');
    updateAuthUI();
  }

  // 页面加载时更新 UI
  document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
  });
`;

/**
 * 生成页面布局
 */
export function renderLayout(options: LayoutOptions): string {
  const { title, activePage, content, scripts: pageScripts } = options;

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', href: '/' },
    { id: 'targets', label: '目标管理', href: '/targets' },
    { id: 'status', label: '状态监控', href: '/status' },
    { id: 'history', label: '历史记录', href: '/history' },
  ];

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - VPS 库存监控</title>
  <style>${styles}</style>
</head>
<body>
  <nav class="nav">
    <div class="container nav-inner">
      <a href="/" class="nav-brand">VPS Monitor</a>
      <ul class="nav-links">
        ${navLinks.map(link => `
          <li>
            <a href="${link.href}" class="nav-link ${activePage === link.id ? 'active' : ''}">${link.label}</a>
          </li>
        `).join('')}
      </ul>
      <div class="nav-actions" id="authActions">
        <a href="/admin/login" class="btn btn-primary btn-sm">登录</a>
      </div>
    </div>
  </nav>

  <main class="main">
    <div class="container">
      ${content}
    </div>
  </main>

  <script>${scripts}</script>
  ${pageScripts ? `<script>${pageScripts}</script>` : ''}
</body>
</html>`;
}

/**
 * 生成登录页面布局（无导航栏）
 */
export function renderLoginLayout(content: string, pageScripts?: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>登录 - VPS 库存监控</title>
  <style>${styles}</style>
  <style>
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
    }
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .login-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }
    .login-subtitle {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="login-card">
      ${content}
    </div>
  </div>

  <script>${scripts}</script>
  ${pageScripts ? `<script>${pageScripts}</script>` : ''}
</body>
</html>`;
}
