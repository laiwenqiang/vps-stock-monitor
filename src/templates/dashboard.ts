/**
 * Dashboard 页面模板
 */

import { renderLayout } from './layout.js';

/**
 * 渲染 Dashboard 页面
 */
export function renderDashboardPage(): string {
  const stageStyles = `
    .stage-container {
      width: 100%; height: 120px;
      background: linear-gradient(180deg, #13141c 0%, #1a1b26 100%);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      position: relative; overflow: hidden;
      margin-bottom: 2rem;
    }
    .web { position: absolute; pointer-events: none; opacity: 0.15; background-repeat: no-repeat; background-size: contain; }
    :root { --web-svg: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L100 100 M0 0 L50 100 M0 0 L100 50 M0 0 L100 0 M0 0 L0 100' stroke='white' stroke-width='1' fill='none'/%3E%3Cpath d='M10 0 Q10 10 0 10 M20 0 Q20 20 0 20 M35 0 Q35 35 0 35 M55 0 Q55 55 0 55 M80 0 Q80 80 0 80' stroke='white' stroke-width='0.5' fill='none'/%3E%3C/svg%3E"); }
    .web-1 { top: 0; left: 0; width: 120px; height: 120px; background-image: var(--web-svg); }
    .web-2 { top: 0; right: 0; width: 80px; height: 80px; background-image: var(--web-svg); transform: scaleX(-1); opacity: 0.1; }
    .firefly {
      width: 8px; height: 8px;
      background: #e0af68; border-radius: 50%;
      position: absolute; bottom: 40px; left: 80%;
      box-shadow: 0 0 4px #e0af68, 0 0 12px rgba(224, 175, 104, 0.6);
      z-index: 2;
    }
    .firefly-glow {
      width: 100%; height: 100%; border-radius: 50%; background: inherit;
      animation: flicker 3s infinite ease-in-out;
    }
    @keyframes flicker { 0%, 100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
    .susu-wrapper {
      position: absolute; bottom: 15px; left: 10%;
      width: 32px; height: 32px; z-index: 1;
      transition: transform 0.3s ease-out;
    }
    .susuwatari {
      width: 100%; height: 100%;
      background: #0f0f14; border-radius: 50%; position: relative;
      box-shadow: 0 0 8px rgba(0,0,0,0.8);
      transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .eye {
      width: 10px; height: 10px; background: #fff; border-radius: 50%;
      position: absolute; top: 6px; overflow: hidden;
      transition: all 0.3s ease;
    }
    .eye.left { left: 4px; } .eye.right { right: 4px; }
    .pupil { width: 3px; height: 3px; background: #000; border-radius: 50%; position: absolute; top: 3px; left: 3px; }
    .eye::before, .eye::after {
      content: ''; position: absolute; left: 0; width: 100%; height: 50%;
      background: #0f0f14;
      transition: transform 0.4s ease-in-out;
      z-index: 2;
    }
    .eye::before { top: 0; transform: translateY(-100%); }
    .eye::after { bottom: 0; transform: translateY(100%); }
    .sweat-drop {
      position: absolute; width: 4px; height: 6px; background: #7aa2f7; border-radius: 50%;
      opacity: 0; top: 5px; pointer-events: none;
    }
    .sweat-drop.s1 { left: -2px; } .sweat-drop.s2 { right: -2px; animation-delay: 0.3s; }
    .walking .susuwatari { animation: walk-bounce 0.3s infinite alternate cubic-bezier(0.5, 0.05, 1, 0.5); }
    .walking .sweat-drop { animation: sweating 0.6s infinite ease-out; }
    .resting .susuwatari {
      transform: translateY(3px);
      animation: breathing 1.5s infinite ease-in-out;
    }
    .resting .eye::before { transform: translateY(0); }
    .resting .eye::after { transform: translateY(0); }
    .resting .sweat-drop { opacity: 0; animation: none; }
    @keyframes sweating { 0% { opacity: 0.8; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-15px) scale(0.5); } }
    @keyframes walk-bounce { 0% { transform: translateY(0) scaleX(1); } 100% { transform: translateY(-4px) scaleX(0.95); } }
    @keyframes breathing { 0%, 100% { transform: translateY(3px) scale(1); } 50% { transform: translateY(1px) scale(1.05, 0.95); } }
  `;

  const stageHtml = `
    <div class="stage-container" id="stage">
      <div class="web web-1"></div><div class="web web-2"></div>
      <div class="firefly" id="firefly"><div class="firefly-glow"></div></div>
      <div class="susu-wrapper" id="susu">
        <div class="sweat-drop s1"></div><div class="sweat-drop s2"></div>
        <div class="susuwatari">
          <div class="eye left"><div class="pupil"></div></div>
          <div class="eye right"><div class="pupil"></div></div>
        </div>
      </div>
    </div>
  `;

  const content = `
    <style>${stageStyles}</style>
    ${stageHtml}

    <div class="page-header">
      <h1 class="page-title">Stock Monitor</h1>
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
        <a href="/targets" class="btn btn-secondary">
          管理目标
        </a>
        <a href="/status" class="btn btn-secondary">
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

    // 舞台动画 (IIFE 隔离作用域)
    (function() {
      const firefly = document.getElementById('firefly');
      const susuWrapper = document.getElementById('susu');
      const stage = document.getElementById('stage');
      if (!firefly || !susuWrapper || !stage) return;

      const state = {
        susuX: 10, susuSpeed: 0, isResting: false, facingRight: true,
        targetX: 80, targetY: 50, fireflyX: 80, fireflyY: 50, time: 0
      };
      const CONFIG = {
        susuMaxSpeed: 0.18, susuAccel: 0.008, friction: 0.94,
        panicDistance: 15, flySpeed: 0.08,
        restThreshold: 500, restDuration: 150
      };
      let fatigueCounter = 0, restTimer = 0, animationId = null, isPaused = false;

      function flee() {
        let newX = Math.random() * 80 + 10;
        if (state.susuX < 50) newX = 60 + Math.random() * 35;
        else newX = 5 + Math.random() * 35;
        state.targetX = newX;
        state.targetY = 30 + Math.random() * 50;
      }

      function loop() {
        if (isPaused) return;
        state.time += 0.05;
        const distX = state.fireflyX - state.susuX;
        if (Math.abs(distX) < CONFIG.panicDistance && !state.isResting) flee();
        state.fireflyX += (state.targetX - state.fireflyX) * CONFIG.flySpeed;
        state.fireflyY += (state.targetY - state.fireflyY) * CONFIG.flySpeed;
        const hoverY = Math.sin(state.time) * 6;
        const hoverX = Math.cos(state.time * 1.5) * 3;
        firefly.style.left = (state.fireflyX + hoverX) + '%';
        firefly.style.bottom = (state.fireflyY + hoverY) + 'px';

        if (state.isResting) {
          susuWrapper.classList.remove('walking');
          susuWrapper.classList.add('resting');
          state.susuSpeed = 0;
          restTimer++;
          if (restTimer > CONFIG.restDuration) {
            state.isResting = false; restTimer = 0; fatigueCounter = 0;
          }
        } else {
          susuWrapper.classList.remove('resting');
          if (Math.abs(distX) > 2) {
            susuWrapper.classList.add('walking');
            state.susuSpeed += distX > 0 ? CONFIG.susuAccel : -CONFIG.susuAccel;
          } else {
            susuWrapper.classList.remove('walking');
            state.susuSpeed *= 0.7;
          }
          state.susuSpeed = Math.max(Math.min(state.susuSpeed, CONFIG.susuMaxSpeed), -CONFIG.susuMaxSpeed);
          state.susuSpeed *= CONFIG.friction;
          state.susuX += state.susuSpeed;
          if (state.susuX < 2) { state.susuX = 2; state.susuSpeed *= -0.5; }
          if (state.susuX > 98) { state.susuX = 98; state.susuSpeed *= -0.5; }
          if (state.susuSpeed > 0.02 && !state.facingRight) {
            state.facingRight = true; susuWrapper.style.transform = 'scaleX(1)';
          } else if (state.susuSpeed < -0.02 && state.facingRight) {
            state.facingRight = false; susuWrapper.style.transform = 'scaleX(-1)';
          }
          susuWrapper.style.left = state.susuX + '%';
          if (Math.abs(state.susuSpeed) > 0.05) {
            fatigueCounter++;
            if (fatigueCounter > CONFIG.restThreshold && Math.random() < 0.02) state.isResting = true;
          }
        }
        animationId = requestAnimationFrame(loop);
      }

      function startLoop() { if (!isPaused && !animationId) animationId = requestAnimationFrame(loop); }
      function stopLoop() { if (animationId) { cancelAnimationFrame(animationId); animationId = null; } }

      document.addEventListener('visibilitychange', () => {
        isPaused = document.hidden;
        if (isPaused) stopLoop(); else startLoop();
      });
      stage.addEventListener('click', () => { if (state.isResting) { state.isResting = false; restTimer = 0; } flee(); });
      startLoop();
    })();
  `;

  return renderLayout({
    title: 'Dashboard',
    activePage: 'dashboard',
    content,
    scripts,
  });
}
