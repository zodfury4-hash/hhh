import { $, $$, state, getAuthToken, toast } from './state.js';
import { navigate } from './router.js';

export async function renderNotifications(container) {
  let items = [];
  let activeFilter = 'all';

  function getAuthToken() {
    try {
      const s = JSON.parse(localStorage.getItem('hea_session') || '{}');
      return s.token || localStorage.getItem('hea_token') || sessionStorage.getItem('hea_token') || '';
    } catch (e) { return ''; }
  }

  function timeAgo(date) {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const diffSec = Math.floor((now - past) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function updateBadge() {
    const unreadCount = items.filter(n => n.unread).length;
    const badges = document.querySelectorAll('.topbar-notif-badge, #topbarNotifBadge');
    badges.forEach(b => {
      b.textContent = unreadCount;
      b.style.display = unreadCount > 0 ? '' : 'none';
    });
    const inPageBadge = document.getElementById('notifCountBadge');
    if (inPageBadge) {
      inPageBadge.textContent = unreadCount + ' New';
      inPageBadge.style.display = unreadCount > 0 ? '' : 'none';
    }
  }

  function renderList() {
    const listContainer = document.getElementById('notifItemsList');
    if (!listContainer) return;

    let filtered = items;
    if (activeFilter === 'unread') {
      filtered = items.filter(n => n.unread);
    } else if (activeFilter === 'links') {
      filtered = items.filter(n => n.category === 'links');
    } else if (activeFilter === 'system') {
      filtered = items.filter(n => n.category === 'system' || n.category === 'billing');
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="notif-empty-state">
          <div class="notif-empty-icon">🔔</div>
          <h3 style="font-size:16px;color:#0f172a;margin:0 0 6px 0;">No notifications found</h3>
          <p style="font-size:13px;color:#64748b;margin:0;">You are completely caught up! We will notify you when new clicks or alerts occur.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(item => `
      <div class="notif-item-card ${item.unread ? 'unread' : ''}" data-id="${item.id}">
        <div class="notif-item-icon-box" style="background:${item.iconBg};color:${item.iconColor};">
          ${item.icon}
        </div>
        <div class="notif-item-content">
          <div class="notif-item-header">
            <div style="display:flex;align-items:center;gap:6px;">
              <h4 class="notif-item-title">${item.title}</h4>
              ${item.unread ? '<span class="notif-unread-dot" title="Unread"></span>' : ''}
            </div>
            <span class="notif-item-time">${item.time}</span>
          </div>
          <p class="notif-item-desc">${item.desc}</p>
          <div class="notif-item-footer">
            ${item.actionTab ? `
              <button type="button" class="notif-item-cta-btn" data-tab="${item.actionTab}">
                ${item.actionLabel}
              </button>
            ` : ''}
            <button type="button" class="notif-dismiss-btn" data-dismiss="${item.id}" title="Remove notification" style="margin-left:auto;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;">
              ✕ Dismiss
            </button>
          </div>
        </div>
      </div>
    `).join('');

    listContainer.querySelectorAll('.notif-item-cta-btn').forEach(btn => {
      btn.onclick = () => {
        const tab = btn.dataset.tab;
        if (tab) navigate(tab);
      };
    });

    listContainer.querySelectorAll('.notif-dismiss-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.dismiss;
        items = items.filter(n => n.id !== id);
        updateBadge();
        renderList();
        toast('Notification dismissed');
        const token = getAuthToken();
        if (token) {
          try {
            await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
          } catch (e) {}
        }
      };
    });
  }

  container.innerHTML = `
    <div class="notif-page-wrap card-3d-reveal">
      <div class="notif-header-card">
        <div class="notif-header-info">
          <div class="notif-bell-icon-large">🔔</div>
          <div>
            <div class="notif-title-row">
              <h2 class="notif-page-title">Notifications Center</h2>
              <span class="notif-count-badge" id="notifCountBadge" style="display:none;">0 New</span>
            </div>
            <p class="notif-page-sub">Track click milestones, system audits, and domain verifications in real-time</p>
          </div>
        </div>
        <div class="notif-header-actions">
          <button type="button" class="notif-action-btn primary" id="markAllReadBtn">
            ✓ Mark all as read
          </button>
          <button type="button" class="notif-action-btn" id="clearAllNotifsBtn">
            🗑 Clear all
          </button>
        </div>
      </div>

      <div class="notif-filter-bar">
        <button type="button" class="notif-filter-pill active" data-filter="all">All (0)</button>
        <button type="button" class="notif-filter-pill" data-filter="unread">Unread (0)</button>
        <button type="button" class="notif-filter-pill" data-filter="links">Links &amp; Clicks</button>
        <button type="button" class="notif-filter-pill" data-filter="system">Security &amp; System</button>
      </div>

      <div class="notif-list-container" id="notifItemsList">
        <div style="text-align:center;padding:32px 16px;color:#64748b;font-size:13px;">
          Loading notifications...
        </div>
      </div>
    </div>
  `;

  // Fetch from real server endpoint
  const token = getAuthToken();
  if (token) {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.notifications)) {
          items = d.notifications.map(n => {
            const isLink = n.type.includes('link');
            const isDomain = n.type.includes('domain');
            const isPay = n.type.includes('payment');
            return {
              id: n.id,
              category: isLink ? 'links' : (isDomain || isPay ? 'system' : 'system'),
              icon: isLink ? '🔥' : (isDomain ? '🌐' : (isPay ? '👑' : '🔔')),
              iconBg: isLink ? '#e0f2fe' : (isDomain ? '#dcfce7' : (isPay ? '#fef3c7' : '#f1f5f9')),
              iconColor: isLink ? '#0A6CFF' : (isDomain ? '#10b981' : (isPay ? '#d97706' : '#64748b')),
              title: n.title,
              desc: n.body,
              time: timeAgo(n.createdAt),
              unread: !n.read,
              actionTab: n.link ? n.link.replace(/^#/, '') : '',
              actionLabel: n.link ? 'View Details →' : ''
            };
          });
        }
      }
    } catch (err) {
      console.warn('Notifications fetch error:', err);
    }
  }

  renderList();
  updateBadge();

  const allPill = container.querySelector('.notif-filter-pill[data-filter="all"]');
  if (allPill) allPill.textContent = `All (${items.length})`;
  const unreadPill = container.querySelector('.notif-filter-pill[data-filter="unread"]');
  if (unreadPill) unreadPill.textContent = `Unread (${items.filter(n => n.unread).length})`;

  const markAllBtn = document.getElementById('markAllReadBtn');
  if (markAllBtn) {
    markAllBtn.onclick = async () => {
      items.forEach(n => { n.unread = false; });
      updateBadge();
      renderList();
      if (unreadPill) unreadPill.textContent = 'Unread (0)';
      toast('All notifications marked as read');
      if (token) {
        try {
          await fetch('/api/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ all: true })
          });
        } catch (e) {}
      }
    };
  }

  const clearAllBtn = document.getElementById('clearAllNotifsBtn');
  if (clearAllBtn) {
    clearAllBtn.onclick = async () => {
      if (confirm('Clear all notifications?')) {
        const ids = items.map(n => n.id);
        items = [];
        updateBadge();
        renderList();
        if (allPill) allPill.textContent = 'All (0)';
        if (unreadPill) unreadPill.textContent = 'Unread (0)';
        toast('All notifications cleared');
        if (token) {
          for (const id of ids) {
            fetch(`/api/notifications/${encodeURIComponent(id)}`, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            }).catch(() => {});
          }
        }
      }
    };
  }

  container.querySelectorAll('.notif-filter-pill').forEach(pill => {
    pill.onclick = () => {
      container.querySelectorAll('.notif-filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.dataset.filter;
      renderList();
    };
  });
}

