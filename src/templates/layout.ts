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
 * 通用样式
 */
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --primary: #3b82f6;
    --primary-dark: #2563eb;
    --success: #22c55e;
    --warning: #f59e0b;
    --error: #ef4444;
    --bg: #f8fafc;
    --bg-card: #ffffff;
    --text: #1e293b;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --shadow: 0 1px 3px rgba(0,0,0,0.1);
    --shadow-lg: 0 4px 6px rgba(0,0,0,0.1);
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
    transition: all 0.15s;
  }

  .nav-link:hover {
    background: var(--bg);
    color: var(--text);
  }

  .nav-link.active {
    background: var(--primary);
    color: white;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Main content */
  .main {
    padding: 1.5rem 0;
  }

  .page-header {
    margin-bottom: 1.5rem;
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
    padding: 1.25rem;
    box-shadow: var(--shadow);
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
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1.25rem;
    box-shadow: var(--shadow);
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
    transition: all 0.15s;
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
    transition: border-color 0.15s;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid var(--border);
    border-radius: 0.375rem;
    background: var(--bg-card);
    cursor: pointer;
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
    padding: 0.75rem 1rem;
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

  .table tr:hover {
    background: var(--bg);
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
    background: #dcfce7;
    color: #166534;
  }

  .badge-warning {
    background: #fef3c7;
    color: #92400e;
  }

  .badge-error {
    background: #fee2e2;
    color: #991b1b;
  }

  .badge-muted {
    background: var(--bg);
    color: var(--text-muted);
  }

  /* Toggle switch */
  .toggle {
    position: relative;
    width: 2.5rem;
    height: 1.25rem;
    background: var(--border);
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
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: var(--shadow);
  }

  .toggle.active::after {
    transform: translateX(1.25rem);
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s;
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
    transform: scale(0.95);
    transition: transform 0.2s;
  }

  .modal-overlay.active .modal {
    transform: scale(1);
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
    background: rgba(255, 255, 255, 0.8);
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
