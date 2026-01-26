/**
 * 登录页面模板
 */

import { renderLoginLayout } from './layout.js';

/**
 * 渲染登录页面
 */
export function renderLoginPage(): string {
  const content = `
    <div class="login-header">
      <h1 class="login-title">VPS 库存监控</h1>
      <p class="login-subtitle">请输入 API Key 登录管理后台</p>
    </div>

    <div class="card">
      <form id="loginForm" onsubmit="handleLogin(event)">
        <div class="form-group">
          <label class="form-label" for="apiKey">API Key</label>
          <input
            type="password"
            id="apiKey"
            class="form-input"
            placeholder="请输入 API Key"
            required
            autocomplete="current-password"
          >
        </div>

        <div class="form-group">
          <label class="form-checkbox">
            <input type="checkbox" id="rememberKey">
            <span>记住 API Key</span>
          </label>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%;" id="loginBtn">
          登录
        </button>

        <p id="errorMsg" class="text-error text-sm mt-2" style="display: none;"></p>
      </form>
    </div>
  `;

  const scripts = `
    // 检查是否已登录
    (function() {
      const apiKey = localStorage.getItem('apiKey');
      if (apiKey) {
        // 验证 API Key 是否有效
        fetch('/api/targets', {
          headers: { 'X-API-Key': apiKey }
        }).then(res => {
          if (res.ok) {
            window.location.href = '/admin';
          }
        });
      }
    })();

    async function handleLogin(e) {
      e.preventDefault();

      const apiKey = document.getElementById('apiKey').value.trim();
      const rememberKey = document.getElementById('rememberKey').checked;
      const loginBtn = document.getElementById('loginBtn');
      const errorMsg = document.getElementById('errorMsg');

      if (!apiKey) {
        errorMsg.textContent = '请输入 API Key';
        errorMsg.style.display = 'block';
        return;
      }

      loginBtn.disabled = true;
      loginBtn.innerHTML = '<span class="spinner"></span> 验证中...';
      errorMsg.style.display = 'none';

      try {
        // 验证 API Key
        const response = await fetch('/api/targets', {
          headers: { 'X-API-Key': apiKey }
        });

        if (response.ok) {
          // 保存 API Key
          if (rememberKey) {
            localStorage.setItem('apiKey', apiKey);
          } else {
            sessionStorage.setItem('apiKey', apiKey);
            // 同时设置到 localStorage 以便 API 工具使用
            localStorage.setItem('apiKey', apiKey);
          }

          // 跳转到 Dashboard
          window.location.href = '/admin';
        } else {
          const result = await response.json();
          throw new Error(result.error || 'API Key 无效');
        }
      } catch (error) {
        errorMsg.textContent = error.message || '登录失败，请检查 API Key';
        errorMsg.style.display = 'block';
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = '登录';
      }
    }
  `;

  return renderLoginLayout(content, scripts);
}
