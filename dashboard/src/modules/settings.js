import {
  $, $$, state, getAuthToken, handleUnauthorizedSession, updateDisplayName, escapeHtml, toast
} from './state.js';
import { navigate } from './router.js';

export function updateDrawerForTab(tab) {
  const drawerEl = $('#appAssistDrawer');
  const drawerAi = $('#drawerAiContent');
  const drawerSettings = $('#drawerSettingsContent');
  const drawerForm = $('#drawerChatForm');
  const drawerTitle = $('#drawerTitle');
  const drawerClose = $('#drawerCloseBtn');

  // Drag handle touch dismiss for mobile bottom sheet (< 768px)
  const dragHandle = $('.drawer-drag-handle');
  if (dragHandle && drawerEl && !dragHandle._bound) {
    dragHandle._bound = true;
    let startY = 0;
    dragHandle.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });
    dragHandle.addEventListener('touchmove', (e) => {
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY > 60) {
        drawerEl.hidden = true;
        document.body.style.overflow = '';
      }
    }, { passive: true });
  }

  if (tab === 'settings') {
    if (drawerAi) drawerAi.hidden = true;
    if (drawerForm) drawerForm.style.display = 'none';
    if (drawerSettings) drawerSettings.hidden = true;
    if (drawerEl) drawerEl.hidden = true; // Settings has clean 2-column in-page layout
  } else if (tab === 'notifications') {
    if (drawerAi) drawerAi.hidden = true;
    if (drawerForm) drawerForm.style.display = 'none';
    if (drawerSettings) drawerSettings.hidden = true;
    if (drawerEl) {
      drawerEl.hidden = true;
      document.body.style.overflow = '';
    }
  } else if (tab === 'assist') {
    if (drawerAi) drawerAi.hidden = true;
    if (drawerForm) drawerForm.style.display = 'none';
    if (drawerSettings) drawerSettings.hidden = true;
    if (drawerEl) {
      drawerEl.hidden = true;
      document.body.style.overflow = '';
    }
  } else {
    if (drawerAi) drawerAi.hidden = false;
    if (drawerForm) drawerForm.style.display = '';
    if (drawerSettings) drawerSettings.hidden = true;
    if (drawerTitle) drawerTitle.innerHTML = '<span>✨</span> HEA Assist';
    if (drawerClose) drawerClose.style.display = '';
    if (drawerEl) {
      drawerEl.hidden = true;
      document.body.style.overflow = '';
    }
  }
}

export function bindSettingsNavEvents() {
  const links = $$('#drawerSettingsContent .settings-subsidebar-link');
  links.forEach(link => {
    link.onclick = (e) => {
      const nav = link.dataset.nav;
      if (nav === 'integrations' || nav === 'billing') {
        return;
      }
      e.preventDefault();

      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const map = {
        'profile': 'setSectionProfile',
        'account-details': 'setSectionAccountDetails',
        'billing': 'setSectionBilling',
        'users': 'setSectionUsers',
        'groups': 'setSectionUsers',
        'sso': 'setSectionSso',
        'discovery': 'setSectionSso',
        'deeplinks': 'setSectionDeepLinks'
      };

      const targetId = map[nav] || 'setSectionProfile';
      const targetEl = document.getElementById(targetId);
      const pane = document.getElementById('appMainPane');
      if (targetEl && pane) {
        targetEl.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    };
  });
}

export function renderSettings(container) {
  updateDrawerForTab('settings');

  container.innerHTML = `
    <div class="view-header">
      <div class="header-title-col">
        <div style="display:flex;align-items:center;gap:10px;">
          <h2>Settings &amp; Workspace</h2>
          <span class="view-header-badge" style="background:rgba(100,116,139,0.1);color:#475569;border:1px solid rgba(100,116,139,0.25);">
            <span>⚙️</span> Workspace
          </span>
        </div>
        <p class="view-subtitle">
          Manage your personal profile, team members, organization details, custom domains, and billing.
        </p>
      </div>
      <div class="header-actions-col">
        <div class="assist-status-pill" style="background:rgba(245,158,11,0.1);color:#b45309;border-color:rgba(245,158,11,0.3);">
          <span>👑</span> Core PRO Active
        </div>
      </div>
    </div>
    <div class="settings-layout-wrap">
      <!-- In-Page Settings Sub-Navigation Card -->
      <aside class="settings-subnav-aside">
        <div class="settings-nav-group">
          <div class="settings-nav-group-title">PERSONAL</div>
          <button type="button" class="settings-nav-btn active" data-target="setSectionProfile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>Profile</span>
          </button>
          <button type="button" class="settings-nav-btn" data-target="setSectionSecurity">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>Security &amp; Password</span>
          </button>
          <button type="button" class="settings-nav-btn" onclick="window.appShell.navigate('integrations')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66 4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66 4.24-4.24"></path></svg>
            <span>Integrations</span>
          </button>
        </div>

        <div class="settings-nav-group">
          <div class="settings-nav-group-title">WORKSPACE &amp; ACCOUNT</div>
          <div class="settings-org-badge">
            <span>🏢</span> <span>${state.appUser.orgId || 'hea-workspace-default'}</span>
          </div>
          <button type="button" class="settings-nav-btn" data-target="setSectionAccountDetails">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            <span>Account details</span>
          </button>
          <button type="button" class="settings-nav-btn" data-target="setSectionBilling">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            <span>Billing and usage</span>
          </button>
          <button type="button" class="settings-nav-btn" data-target="setSectionUsers">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>Users &amp; Team</span>
          </button>
          <button type="button" class="settings-nav-btn" data-target="setSectionSso">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-1-1l2 2M11 13l3.5-3.5a2.12 2.12 0 1 0-3-3L8 10l-4 4v4h4l3-3z"></path></svg>
            <span>Single sign-on</span>
          </button>
          <button type="button" class="settings-nav-btn" data-target="setSectionDeepLinks">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
            <span>Mobile deep links</span>
          </button>
          <button type="button" class="settings-nav-btn" data-target="setSectionEmails">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span>Email Preferences</span>
          </button>
        </div>
      </aside>

      <!-- Right Content Area -->
      <div class="settings-content-main">
      <!-- Mobile Quick Tabs -->
      <div class="settings-mobile-tabs" id="settingsMobileTabs">
        <button class="settings-m-tab active" data-nav="profile">Profile</button>
        <button class="settings-m-tab" data-nav="account-details">Account</button>
        <button class="settings-m-tab" data-nav="billing">Billing</button>
        <button class="settings-m-tab" data-nav="users">Users</button>
        <button class="settings-m-tab" data-nav="sso">SSO</button>
        <button class="settings-m-tab" data-nav="deeplinks">Deep Links</button>
        <button class="settings-m-tab" data-nav="emails">Emails</button>
        <button class="settings-m-tab" data-nav="security">Security</button>
        <button class="settings-m-tab" data-nav="sessions">Sessions</button>
      </div>

      <div class="settings-main-panel settings-center-card">
        <!-- 1. Profile Section -->
        <div id="setSectionProfile" class="settings-content-section">
          <h2 style="font-size:30px;font-weight:800;color:#0070f3;margin:0 0 16px;">Profile</h2>
          <h3 style="font-size:18px;font-weight:800;color:#0b132b;margin:0 0 14px;">Preferences</h3>

          <div class="create-link-field">
            <label>Display name</label>
            <input type="text" id="setDisplayName" value="${state.appUser.name}">
          </div>

          <button class="sso-btn" style="width:auto;padding:8px 18px;margin-bottom:28px;" onclick="window.appShell.updateDisplayName()">
            Update display name
          </button>

          <div class="create-link-field">
            <label>Language</label>
            <div style="font-size:13px;color:#64748b;margin-bottom:8px;">
              HEA Link uses your browser's language by default. Select a language below to override this setting. Applies to your HEA Link experience, emails you receive from HEA Link, and emails sent on your behalf.
            </div>
            <select class="home-domain-select" style="max-width:320px;">
              <option selected>Automatic</option>
              <option>English</option>
              <option>Urdu</option>
            </select>
          </div>

          <button class="sso-btn" style="width:auto;padding:8px 18px;margin-bottom:32px;" onclick="window.appShell.toast('Language preference saved')">
            Update language
          </button>
        </div>

        <div class="settings-section-divider"></div>

        <!-- 2. Account Details Section -->
        <div id="setSectionAccountDetails" class="settings-content-section">
          <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Account details</h3>
          <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
            Manage your workspace identity, organization settings, and account identifiers.
          </p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:24px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Organization ID</div>
              <div style="font-size:14px;font-weight:700;color:#0b132b;margin-top:4px;word-break:break-all;">${state.appUser.orgId || 'hea-workspace-default'}</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Workspace Name</div>
              <div style="font-size:14px;font-weight:700;color:#0b132b;margin-top:4px;">${state.appUser.org || 'My Workspace'}</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Account Status</div>
              <div style="font-size:14px;font-weight:700;color:#10b981;margin-top:4px;">Active (Free Tier)</div>
            </div>
          </div>
        </div>

        <div class="settings-section-divider"></div>

        <!-- 3. Billing & Usage Section -->
        <div id="setSectionBilling" class="settings-content-section">
          <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Billing and usage</h3>
          <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
            Overview of your subscription tier, monthly link creation limits, and usage analytics.
          </p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <div style="font-size:15px;font-weight:800;color:#0070f3;">Current Plan: Free Starter</div>
              <div style="font-size:13px;color:#475569;margin-top:3px;">You have used 3 of 10 monthly branded links.</div>
            </div>
            <button type="button" class="auth-submit-btn" style="margin:0;padding:8px 18px;width:auto;" onclick="if(typeof window.openCheckoutModal==='function') window.openCheckoutModal('pro');">Upgrade Plan</button>
          </div>
        </div>

        <div class="settings-section-divider"></div>

        <!-- 4. Users & Team Section -->
        <div id="setSectionUsers" class="settings-content-section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:10px;">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0;">Users &amp; Team</h3>
            <span id="teamSeatUsageBadge" style="background:#e0f2fe;color:#0284c7;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;">1 Active Seat</span>
          </div>
          <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
            Manage team members, roles (Admin, Editor, Viewer), and invite collaborators to your active workspace.
          </p>
          <div id="teamMembersListContainer" style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:34px;height:34px;border-radius:50%;background:#0070f3;color:#ffffff;display:grid;place-items:center;font-weight:700;font-size:13px;">${(state.appUser.name||'HA').substring(0,2).toUpperCase()}</div>
                <div>
                  <div style="font-weight:700;color:#0b132b;font-size:14px;">${state.appUser.name} <span style="font-size:11px;color:#10b981;font-weight:700;background:#dcfce7;padding:2px 6px;border-radius:4px;margin-left:6px;">Owner</span></div>
                  <div style="font-size:12px;color:#64748b;">${state.appUser.email}</div>
                </div>
              </div>
              <button type="button" class="sso-btn" style="width:auto;padding:6px 16px;font-size:13px;" onclick="const m=document.getElementById('inviteMemberModal');if(m)m.hidden=false;">+ Invite Member</button>
            </div>
          </div>
          <div id="teamPendingInvitesContainer" style="display:none;margin-top:14px;">
            <h4 style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Pending Invitations</h4>
            <div id="pendingInvitesList" style="display:flex;flex-direction:column;gap:8px;"></div>
          </div>
        </div>

        <div class="settings-section-divider"></div>

        <!-- 4B. Workspace Audit Logs Section -->
        <div id="setSectionAuditLogs" class="settings-content-section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:10px;">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0;">Workspace Audit Logs</h3>
            <button type="button" id="btnExportAuditLogs" class="btn sm ghost" style="font-size:12px;padding:6px 14px;border-radius:8px;">📥 Export CSV</button>
          </div>
          <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
            Tamper-evident trail of member events, role modifications, link deletions, and security settings.
          </p>
          <div id="auditLogsContainer" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
            <div style="color:#64748b;font-size:13px;text-align:center;padding:20px 0;">Loading workspace audit history...</div>
          </div>
        </div>

        <div class="settings-section-divider"></div>

        <!-- 5. Single Sign-on & Discovery -->
        <div id="setSectionSso" class="settings-content-section">
          <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Single sign-on &amp; Account discovery</h3>
          <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
            Enforce enterprise authentication and domain auto-discovery for your organization members.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <div style="font-weight:700;color:#0b132b;font-size:14px;">SAML 2.0 / Okta / Azure AD</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px;">Available for Enterprise organization accounts.</div>
            </div>
            <span class="pro-chip" style="font-size:11px;padding:4px 10px;background:#0070f3;color:#ffffff;border-radius:99px;font-weight:700;">ENTERPRISE</span>
          </div>
        </div>

        <div class="settings-section-divider"></div>

        <!-- 6. Mobile Deep Links -->
        <div id="setSectionDeepLinks" class="settings-content-section">
          <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Mobile deep links</h3>
          <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
            Route your audience directly into iOS and Android apps with Universal Links and App Links.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:16px;">
            <div style="font-size:13px;color:#0b132b;font-weight:600;">Associated Domains Status: <span style="color:#10b981;font-weight:700;">Ready</span></div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">iOS Universal Links &amp; Android App Links are routed automatically through healink.store shortlinks.</div>
          </div>
        </div>

        <div class="settings-section-divider"></div>

        <!-- 7. Email Addresses -->
        <div id="setSectionEmails" class="settings-content-section">
          <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Email addresses</h3>
          <p style="color:#64748b;font-size:13px;margin:0 0 16px;">
            Select or add a new email address to receive notifications. Only verified emails can be designated as the primary email address, which is used to log in.
          </p>

          <table class="settings-email-table">
            <thead>
              <tr>
                <th>Email address</th>
                <th>Status</th>
                <th>Primary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>${state.appUser.email}</b></td>
                <td><span style="color:#10b981;font-size:13px;font-weight:700;">✓ Verified</span></td>
                <td><input type="radio" name="primaryEmail" checked style="accent-color:#0066ff;"></td>
              </tr>
            </tbody>
          </table>

          <div style="display:flex;gap:12px;margin-bottom:32px;flex-wrap:wrap;">
            <button class="sso-btn" style="width:auto;padding:8px 16px;" onclick="alert('Add new email modal')">Add new email</button>
            <button class="auth-submit-btn" style="margin:0;padding:8px 18px;" onclick="window.appShell.toast('Primary email updated')">Update primary email</button>
          </div>
        </div>

        <div class="settings-section-divider"></div>

        <!-- 8. Security & Authentication -->
        <div id="setSectionSecurity" class="settings-content-section">
          <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">Security &amp; authentication</h3>
          <h4 style="font-size:16px;font-weight:700;color:#0b132b;margin:16px 0 6px;">Change password</h4>
          <div style="font-size:13px;color:#64748b;margin-bottom:14px;">You will be required to login after changing your password</div>

          <div class="create-link-field"><label>Current password</label><input type="password" id="setCurPass" placeholder="Enter your current password"></div>
          <div class="create-link-field"><label>New password</label><input type="password" id="setNewPass" placeholder="Create a strong new password (min. 8 characters)"></div>
          <div class="create-link-field"><label>Confirm new password</label><input type="password" id="setConfPass" placeholder="Re-enter your new password"></div>

          <button class="auth-submit-btn" id="btnUpdatePass" style="width:max-content;padding:10px 24px;margin-bottom:32px;">
            Change password
          </button>

          <div class="settings-section-divider"></div>

          <!-- 2-Factor Authentication -->
          <div id="setSection2FA" class="settings-content-section">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 14px;">2-Factor authentication</h3>
            <div class="create-link-field">
              <label>Select country code</label>
              <select class="home-domain-select" style="max-width:320px;">
                <option selected>Pakistan (+92)</option>
                <option>United States (+1)</option>
                <option>United Kingdom (+44)</option>
                <option>United Arab Emirates (+971)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="settings-section-divider"></div>

        <!-- 9. Active Sessions -->
        <div id="setSectionSessions" class="settings-content-section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
            <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0;">Active Sessions</h3>
            <button class="auth-submit-btn" style="margin:0;padding:8px 16px;font-size:13px;" onclick="window.appShell.toast('Logged out of all other sessions')">
              Log out of all sessions
            </button>
          </div>
          <div style="font-size:13px;color:#0b132b;padding:12px 0;border-bottom:1px solid #e2e8f0;">
            <b>Email Address Added</b>: ${state.appUser.email} <span style="float:right;color:#64748b;">Oct 30, 2026 7:26 AM PDT</span>
            <div style="color:#64748b;font-size:12px;margin-top:2px;">(${state.appUser.isp || 'Broadband'}) (PK, PB, ${state.appUser.city || 'Lahore'})</div>
          </div>
          <div style="font-size:13px;color:#0b132b;padding:12px 0;">
            <b>Current Active Session</b> <span style="float:right;color:#64748b;">Live Now</span>
            <div style="color:#64748b;font-size:12px;margin-top:2px;">(${state.appUser.isp || 'Broadband'}) (PK, PB, ${state.appUser.city || 'Lahore'})</div>
          </div>
        </div>

        <div class="settings-section-divider"></div>

        <!-- 10. SAR Report -->
        <div id="setSectionSar" class="settings-content-section">
          <h3 style="font-size:20px;font-weight:800;color:#0b132b;margin:0 0 8px;">SAR Report</h3>
          <p style="color:#64748b;font-size:13px;margin:0 0 16px;line-height:1.5;">
            Click to request a Subject Access Request (SAR Report) of all your Personal Information stored by HEA Link. Once requested, in compliance with your local regulations, we will reply to your request via email.
          </p>
          <button class="auth-submit-btn" style="width:max-content;padding:10px 24px;margin-bottom:32px;" onclick="window.appShell.toast('SAR Report request submitted')">
            Request report
          </button>
        </div>

        <div class="settings-section-divider"></div>

        <!-- 11. Delete Account -->
        <div id="setSectionDelete" class="settings-content-section">
          <button class="auth-submit-btn" style="background:#dc2626 !important;width:max-content;padding:10px 24px;" onclick="if(confirm('Are you sure you want to delete your account?')){ localStorage.clear(); sessionStorage.clear(); window.location.href='/'; }">
            Delete account
          </button>
        </div>
      </div>
    </div>
  </div>
  `;

  const passBtn = $('#btnUpdatePass');
  if (passBtn) {
    passBtn.onclick = async () => {
      const curP = $('#setCurPass')?.value;
      const newP = $('#setNewPass')?.value;
      const confP = $('#setConfPass')?.value;

      if (!curP || !newP) { toast('Please enter current and new password'); return; }
      if (newP !== confP) { toast('New passwords do not match'); return; }
      if (newP.length < 6) { toast('Password must be at least 6 characters'); return; }

      try {
        const token = getAuthToken();
        if (!token) {
          handleUnauthorizedSession();
          return;
        }
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ currentPassword: curP, newPassword: newP })
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok) {
          toast('Password updated! Please log in again.');
          setTimeout(() => {
            handleUnauthorizedSession();
          }, 1200);
        } else {
          toast(d.error || 'Failed to change password');
        }
      } catch (e) {
        toast('Unable to reach server to update password');
      }
    };
  }

  // In-page sidebar button click handlers
  $$('.settings-subnav-aside .settings-nav-btn').forEach(btn => {
    btn.onclick = () => {
      const targetId = btn.dataset.target;
      if (!targetId) return;
      $$('.settings-subnav-aside .settings-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.scrollIntoView({ behavior: 'auto', block: 'start' });
    };
  });

  // Mobile tabs scroll handler
  $$('#settingsMobileTabs .settings-m-tab').forEach(tabBtn => {
    tabBtn.onclick = () => {
      const nav = tabBtn.dataset.nav;
      const map = {
        'profile': 'setSectionProfile',
        'account-details': 'setSectionAccountDetails',
        'billing': 'setSectionBilling',
        'users': 'setSectionUsers',
        'sso': 'setSectionSso',
        'deeplinks': 'setSectionDeepLinks',
        'emails': 'setSectionEmails',
        'security': 'setSectionSecurity',
        'sessions': 'setSectionSessions'
      };
      const targetEl = document.getElementById(map[nav] || 'setSectionProfile');
      if (targetEl) targetEl.scrollIntoView({ behavior: 'auto', block: 'start' });
    };
  });

  // Sync scroll in settings pane with sub-sidebar navigation
  const pane = document.getElementById('appMainPane');
  if (pane) {
    const sectionTracker = [
      { id: 'setSectionProfile', target: 'setSectionProfile', nav: 'profile' },
      { id: 'setSectionSecurity', target: 'setSectionSecurity', nav: 'security' },
      { id: 'setSectionAccountDetails', target: 'setSectionAccountDetails', nav: 'account-details' },
      { id: 'setSectionBilling', target: 'setSectionBilling', nav: 'billing' },
      { id: 'setSectionUsers', target: 'setSectionUsers', nav: 'users' },
      { id: 'setSectionSso', target: 'setSectionSso', nav: 'sso' },
      { id: 'setSectionDeepLinks', target: 'setSectionDeepLinks', nav: 'deeplinks' },
      { id: 'setSectionEmails', target: 'setSectionEmails', nav: 'emails' },
      { id: 'setSectionSessions', target: 'setSectionAccountDetails', nav: 'sessions' }
    ];

    pane.onscroll = () => {
      const scrollPos = pane.scrollTop + 140;
      for (let i = sectionTracker.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionTracker[i].id);
        if (el && el.offsetTop <= scrollPos) {
          const subBtns = $$('.settings-subnav-aside .settings-nav-btn');
          subBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.target === sectionTracker[i].target);
          });
          const mTabs = $$('#settingsMobileTabs .settings-m-tab');
          mTabs.forEach(t => {
            t.classList.toggle('active', t.dataset.nav === sectionTracker[i].nav);
          });
          break;
        }
      }
    };
  }
}

export async function renderApiKeys(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="header-title-col">
        <h2>API Keys</h2>
        <p class="view-subtitle">Create and revoke developer keys scoped to your signed-in account (${escapeHtml(state.appUser.email || '')}).</p>
      </div>
    </div>
    <div class="dash-white-card" style="padding:24px;margin-bottom:20px;max-width:720px;">
      <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0b132b;">Create New API Key</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <input id="apiKeyNameInput" type="text" class="home-shorten-input" style="flex:1;min-width:220px;" placeholder="e.g. Production Backend Key" maxlength="80">
        <button type="button" id="btnGenerateApiKey" class="auth-submit-btn" style="width:auto;margin:0;padding:10px 20px;">Generate Key</button>
      </div>
      <div id="apiKeyRawReveal" style="display:none;margin-top:14px;padding:12px 14px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;font-size:13px;color:#065f46;word-break:break-all;"></div>
    </div>
    <div class="dash-white-card" style="padding:24px;max-width:720px;">
      <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0b132b;">Active Keys</h3>
      <div id="apiKeysList" style="color:#64748b;font-size:13px;">Loading API keys...</div>
    </div>
  `;

  async function loadKeys() {
    const listEl = $('#apiKeysList');
    const token = getAuthToken();
    if (!listEl || !token) return;
    try {
      const res = await fetch('/api/keys', { headers: { Authorization: 'Bearer ' + token } });
      if (res.status === 401) { handleUnauthorizedSession(); return; }
      const data = await res.json();
      const keys = Array.isArray(data.keys) ? data.keys : [];
      if (keys.length === 0) {
        listEl.innerHTML = '<div style="padding:12px 0;color:#64748b;">No API keys created yet.</div>';
        return;
      }
      listEl.innerHTML = keys.map((k) => {
        const kid = k.keyId || k._id || k.id;
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <div>
              <div style="font-weight:700;color:#0b132b;">${escapeHtml(k.name || 'API Key')}</div>
              <div style="font-size:12px;color:#64748b;">Prefix: <code>${escapeHtml(k.prefix || 'hea_live_')}...</code></div>
            </div>
            <button type="button" class="btn-revoke-key" data-id="${escapeHtml(kid)}" style="background:#fee2e2;color:#b91c1c;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">Revoke</button>
          </div>
        `;
      }).join('');
      listEl.querySelectorAll('.btn-revoke-key').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.dataset.id;
          const dRes = await fetch('/api/keys/' + encodeURIComponent(id), {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + getAuthToken() }
          });
          if (dRes.ok) {
            toast('API key revoked');
            loadKeys();
          } else {
            toast('Failed to revoke API key');
          }
        };
      });
    } catch (_e) {
      listEl.innerHTML = '<div style="color:#ef4444;">Unable to load API keys.</div>';
    }
  }

  const genBtn = $('#btnGenerateApiKey');
  if (genBtn) {
    genBtn.onclick = async () => {
      const name = ($('#apiKeyNameInput')?.value || '').trim();
      if (!name) { toast('Enter a key name'); return; }
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getAuthToken() },
        body: JSON.stringify({ name })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data.error && data.error.message) || data.error || 'Failed to generate API key';
        toast(msg);
        if (res.status === 403) {
          const reveal = $('#apiKeyRawReveal');
          if (reveal) {
            reveal.style.display = 'block';
            reveal.style.background = '#fffbeb';
            reveal.style.borderColor = '#fde68a';
            reveal.style.color = '#92400e';
            reveal.innerHTML = `${escapeHtml(msg)} <button type="button" onclick="if(typeof window.openCheckoutModal==='function') window.openCheckoutModal('pro');" style="margin-left:8px;padding:4px 10px;border:none;border-radius:6px;background:#0070f3;color:#fff;font-weight:700;cursor:pointer;">Upgrade</button>`;
          }
        }
        return;
      }
      const reveal = $('#apiKeyRawReveal');
      if (reveal && data.rawKey) {
        reveal.style.display = 'block';
        reveal.style.background = '#ecfdf5';
        reveal.style.borderColor = '#a7f3d0';
        reveal.style.color = '#065f46';
        reveal.innerHTML = `<strong>Copy now (shown once):</strong> <code>${escapeHtml(data.rawKey)}</code>`;
      }
      if ($('#apiKeyNameInput')) $('#apiKeyNameInput').value = '';
      toast('API Key generated');
      loadKeys();
    };
  }

  loadKeys();
}
