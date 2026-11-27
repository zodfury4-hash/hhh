import {
  $, $$, state, isUserAuthenticated, getAuthToken, setAppUser, clearStoredSession,
  refreshAuthTokenIfNeeded, syncLinksFromServer, syncQrsFromServer, syncPagesFromServer,
  initDashboard3DMotion, renderProLockScreen, toast, openWhatModal, closeWhatModal
} from './state.js';
import { renderHome } from './home.js';
import { renderCreateLink, renderLinks } from './links.js';
import { renderQr, renderQrDetail } from './qr.js';
import { renderPages } from './bio.js';
import { renderAnalytics, renderCampaigns } from './analytics.js';
import { renderDomains } from './domains.js';
import { renderIntegrations } from './integrations.js';
import { renderSettings, renderApiKeys, updateDrawerForTab } from './settings.js';
import { renderNotifications } from './notifications.js';
import { renderAssist, setupAssistChat } from './assist.js';
import { getVerifiedSession, setActiveSession } from './billing.js';

export function renderActiveView() {
  return navigate(state.activeTab || 'home');
}

export function navigate(tab, param) {

  if (!isUserAuthenticated()) {

    document.body.classList.remove('app-mode');

    const as = $('#appShell');

    if (as) as.hidden = true;

    window.location.href = '/#login';

    return;

  }

  document.body.classList.add('app-mode');

  const as = $('#appShell');

  if (as) as.hidden = false;

  if (!tab) tab = 'home';

  if (tab === 'dashboard' || tab === 'app') tab = 'home';

  state.activeTab = tab;

  // Update right sidebar drawer based on active tab
  try {
    updateDrawerForTab(tab);
  } catch (err) {
    console.warn('Error in updateDrawerForTab:', err);
  }

  $$('#sidebarNav .sidebar-nav-item').forEach(item => {

    item.classList.toggle('active', item.dataset.tab === tab);

  });

  // Sync Mobile Bottom Navigation Tabs (< 768px)
  $$('.mobile-tab-item[data-tab]').forEach(tabBtn => {
    const t = tabBtn.dataset.tab;
    const isActive = (t === tab) || (t === 'home' && (tab === 'dashboard' || tab === 'app')) || (t === 'links' && tab === 'create-link') || (t === 'qr' && tab === 'qr-detail');
    tabBtn.classList.toggle('active', isActive);
  });

  // Auto-close off-canvas drawer on navigation
  const mSidebar = $('#appSidebar') || $('.app-sidebar');
  if (mSidebar) {
    mSidebar.classList.remove('mobile-open', 'open');
  }
  const mBackdrop = $('#sidebarBackdrop');
  if (mBackdrop) mBackdrop.hidden = true;

  const topTitle = $('#topbarTitle');
  const topSubtitle = $('#topbarSubtitle');
  if (topTitle) {
    const titles = {
      home: 'Dashboard',
      links: 'Links',
      'create-link': 'Create Link',
      qr: 'QR Codes',
      'qr-detail': 'QR Code Details',
      pages: 'Bio Pages',
      analytics: 'Analytics',
      campaigns: 'Campaigns',
      domains: 'Custom Domains',
      'custom-domains': 'Custom Domains',
      integrations: 'Integrations',
      settings: 'Settings',
      keys: 'API Keys',
      assist: 'HEA Assist AI',
      notifications: 'Notifications',
      resources: 'Help & Resources'
    };
    topTitle.textContent = titles[tab] || 'Dashboard';
  }
  if (topSubtitle) {
    if (tab === 'notifications') {
      topSubtitle.textContent = 'Stay updated with link clicks, domain verifications, and system alerts';
      topSubtitle.style.display = 'block';
    } else if (tab === 'home') {
      topSubtitle.textContent = 'Track, manage and grow your links';
      topSubtitle.style.display = 'block';
    } else {
      topSubtitle.style.display = 'none';
    }
  }

  const pane = $('#appMainPane');

  if (!pane) return;

  pane.scrollTop = 0;
    try {

    switch (tab) {

      case 'home':

        renderHome(pane);

        break;

      case 'create-link':

        renderCreateLink(pane);

        break;

      case 'links':
        renderLinks(pane);
        syncLinksFromServer().then(() => {
          if (state.activeTab === 'links') renderLinks(pane);
        }).catch(() => {});
        break;

      case 'qr':
        renderQr(pane);
        syncLinksFromServer().then(() => syncQrsFromServer()).then(() => {
          if (state.activeTab === 'qr') renderQr(pane);
        }).catch(() => {});
        break;

      case 'qr-detail':
        renderQrDetail(pane, param || state.activeQrId);
        break;

      case 'pages':
        renderPages(pane);
        syncPagesFromServer().then(() => {
          if (state.activeTab === 'pages') renderPages(pane);
        }).catch(() => {});
        break;

      case 'analytics':

        renderAnalytics(pane);

        break;

      case 'campaigns':

        renderCampaigns(pane);

        break;

      case 'domains':

        if (!window.isUserPro || !window.isUserPro()) {

          renderProLockScreen(pane, 'Custom Branded Domains', 'Free plan does not include custom domains. Connect your own brand URL (e.g. brand.link/drop) to increase trust and clicks by 2x. Upgrade to Pro!');

        } else {

          renderDomains(pane);

        }

        break;

      case 'integrations':

        renderIntegrations(pane);

        break;

      case 'settings':

        renderSettings(pane);

        break;

      case 'keys':

        renderApiKeys(pane);

        break;

      case 'notifications':

        renderNotifications(pane);

        break;

      case 'assist':

        renderAssist(pane);

        break;

      default:

        renderHome(pane);

    }

  } catch (err) {

    console.error('Error rendering dashboard view:', tab, err);

    try { renderHome(pane); } catch (e) {}

  }

  try { initDashboard3DMotion(); } catch (e) {}

  // Phase 4: Dashboard Page Switch (No animation for settings page as requested)
  if (tab === 'settings') {
    if (pane) {
      pane.classList.remove('page-switching');
      pane.style.opacity = '1';
      pane.style.transform = 'none';
    }
  } else {
    const isReducedMotion = (typeof window.matchMedia === 'function') && window.matchMedia('(prefers-reduced-motion: reduce)')?.matches;
    if (!isReducedMotion && pane) {
      pane.classList.remove('page-switching');
      void pane.offsetWidth; // force reflow
      pane.classList.add('page-switching');
      setTimeout(() => {
        pane.classList.remove('page-switching');
        pane.style.opacity = '1';
        pane.style.transform = 'none';
      }, 250);
    } else if (pane) {
      pane.style.opacity = '1';
      pane.style.transform = 'none';
    }
  }

  // Sticky Header Shadow after 8px scroll
  if (pane && !pane._hasScrollShadowListener) {
    pane._hasScrollShadowListener = true;
    pane.addEventListener('scroll', () => {
      const isScrolled = pane.scrollTop > 8;
      const stickyHeader = pane.querySelector('.view-header');
      if (stickyHeader) {
        stickyHeader.classList.toggle('has-scroll-shadow', isScrolled);
      }
    }, { passive: true });
  }

  if (!window._hasDashScrollShadowListener) {
    window._hasDashScrollShadowListener = true;
    window.addEventListener('scroll', () => {
      const isScrolled = (window.scrollY || window.pageYOffset || 0) > 8;
      const topbar = document.querySelector('.app-topbar');
      if (topbar) {
        topbar.classList.toggle('has-scroll-shadow', isScrolled);
      }
    }, { passive: true });
  }

  // Clean, zero-jitter instant rendering for dashboard views
  // animatePageText removed here to prevent UI shifts and element bounce

}

export function route() {
  const sess = getVerifiedSession();
  setActiveSession(sess);
  const rawHash = (location.hash.slice(1) || '').split('?')[0].toLowerCase();

  if (rawHash === 'utm' || rawHash === 'utm-guide' || rawHash === 'campaigns-guide') {
    window.location.href = '/resources/utm-guide';
    return;
  }
  if (rawHash === 'faq') {
    window.location.href = '/faq';
    return;
  }
  if (rawHash === 'developers' || rawHash === 'api-docs') {
    window.location.href = '/developers';
    return;
  }
  if (rawHash === 'help' || rawHash === 'help-center') {
    window.location.href = '/help';
    return;
  }

  if (!sess) {
    if (rawHash === '' || rawHash === 'home') {
      window.location.replace('/');
    } else if (rawHash === 'signup') {
      window.location.replace('/#signup');
    } else {
      window.location.replace('/#login');
    }
    return;
  }

  document.body.classList.add('app-mode');
  const as = $('#appShell');
  if (as) as.hidden = false;

  if (!rawHash || rawHash === 'home' || rawHash === 'app' || rawHash === 'login' || rawHash === 'signup') {
    location.hash = '#dashboard';
    return;
  }

  const appViews = [
    'dashboard', 'create-link', 'links', 'qr', 'qr-detail', 'pages', 'analytics',
    'campaigns', 'domains', 'integrations', 'settings', 'keys', 'assist', 'notifications', 'app'
  ];

  if (appViews.includes(rawHash)) {
    const targetTab = rawHash === 'dashboard' || rawHash === 'app' ? 'home' : rawHash;
    navigate(targetTab);
    window.scrollTo(0, 0);
  }
}

export function init() {

  const sidebar = $('#appSidebar') || $('.app-sidebar');

  const toggleBtn = $('#sidebarToggleBtn');
  const sidebarBackdrop = $('#sidebarBackdrop');

  function toggleMobileDrawer(forceState) {
    if (!sidebar) return;
    const isOpen = (typeof forceState === 'boolean') ? forceState : !sidebar.classList.contains('mobile-open');
    sidebar.classList.toggle('mobile-open', isOpen);
    sidebar.classList.toggle('open', isOpen);
    if (sidebarBackdrop) {
      sidebarBackdrop.hidden = !isOpen;
    }
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.onclick = () => toggleMobileDrawer(false);
  }

  if (toggleBtn && sidebar) {
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      toggleMobileDrawer();
    };
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('mobile-open') && !sidebar.contains(e.target) && e.target !== toggleBtn) {
        toggleMobileDrawer(false);
      }
    });
  }

  // Connect Mobile Bottom Navigation Tabs (< 768px)
  const mobileCreate = $('#mobileTabCreateBtn');
  if (mobileCreate) {
    mobileCreate.onclick = () => {
      toggleMobileDrawer(false);
      openWhatModal();
    };
  }

  const mobileMore = $('#mobileTabMoreBtn');
  if (mobileMore) {
    mobileMore.onclick = () => {
      toggleMobileDrawer();
    };
  }

  $$('.mobile-tab-item[data-tab]').forEach(tabBtn => {
    tabBtn.onclick = (e) => {
      e.preventDefault();
      toggleMobileDrawer(false);
      const tab = tabBtn.dataset.tab;
      $$('.mobile-tab-item').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      location.hash = (tab === 'home') ? '#dashboard' : '#' + tab;
      navigate(tab);
    };
  });

  // Sidebar nav clicks

  $$('#sidebarNav .sidebar-nav-item').forEach(btn => {

    btn.onclick = e => {

      e.preventDefault();

      if (sidebar) sidebar.classList.remove('open');

      const tab = btn.dataset.tab;

      // assist navigates to dedicated view
      if (tab === 'assist') { const drawer = $('#appAssistDrawer'); if (drawer) drawer.hidden = true; }

      location.hash = (tab === 'home') ? '#dashboard' : '#' + tab;

      navigate(tab);

    };

  });

  // Sidebar collapse toggle (Screenshot 12.02.42 AM 1)

  const collapseBtn = $('#sidebarCollapseBtn');

  if (collapseBtn && sidebar) {

    collapseBtn.onclick = (e) => {
      if (e) e.stopPropagation();
      sidebar.classList.toggle('expanded');
      sidebar.classList.toggle('collapsed', !sidebar.classList.contains('expanded'));
      const isExp = sidebar.classList.contains('expanded');
      collapseBtn.textContent = isExp ? '‹' : '›';
      collapseBtn.title = isExp ? 'Collapse sidebar' : 'Expand sidebar';
    };

  }

  const createBtn = $('#sidebarCreateBtn');

  if (createBtn) createBtn.onclick = openWhatModal;

  const modalClose = $('#whatModalClose');

  if (modalClose) modalClose.onclick = closeWhatModal;

  const whatModal = $('#whatModal');

  if (whatModal) {

    whatModal.onclick = e => { if (e.target === whatModal) closeWhatModal(); };

  }

  const optL = $('#optCreateLink');

  if (optL) optL.onclick = () => { closeWhatModal(); location.hash = '#create-link'; navigate('create-link'); };

  const optQ = $('#optCreateQR');

  if (optQ) optQ.onclick = () => { closeWhatModal(); location.hash = '#qr'; navigate('qr'); };

  const optP = $('#optCreatePage');

  if (optP) optP.onclick = () => { closeWhatModal(); location.hash = '#pages'; navigate('pages'); };

  // Keyboard shortcuts L & Q for modal options

  window.addEventListener('keydown', e => {

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (whatModal && !whatModal.hidden) {

      if (e.key === 'l' || e.key === 'L') { closeWhatModal(); location.hash = '#create-link'; navigate('create-link'); }

      if (e.key === 'q' || e.key === 'Q') { closeWhatModal(); location.hash = '#qr'; navigate('qr'); }

    }

  });

  // Notifications button\n    const notifBtn = $('#topbarNotifBtn');\n    if (notifBtn) {\n      notifBtn.onclick = (e) => {\n        e.preventDefault();\n        navigate('notifications');\n      };\n    }\n\n    // Assist Drawer

  const assistToggle = $('#assistToggleBtn');

  const drawer = $('#appAssistDrawer');

  const drawerClose = $('#drawerCloseBtn');

  if (assistToggle && drawer) {
    assistToggle.onclick = () => {
      if (state.activeTab === 'settings') {
        const drawerAi = $('#drawerAiContent');
        const drawerSettings = $('#drawerSettingsContent');
        const drawerForm = $('#drawerChatForm');
        const drawerTitle = $('#drawerTitle');

        if (window.innerWidth <= 768) {
          drawer.hidden = !drawer.hidden;
        } else {
          // Toggle between AI view and Settings Navigation on desktop
          if (drawerAi && drawerAi.hidden) {
            drawerAi.hidden = false;
            if (drawerForm) drawerForm.style.display = '';
            if (drawerSettings) drawerSettings.hidden = true;
            if (drawerTitle) drawerTitle.innerHTML = '<span>✨</span> HEA Assist';
          } else {
            if (drawerAi) drawerAi.hidden = true;
            if (drawerForm) drawerForm.style.display = 'none';
            if (drawerSettings) drawerSettings.hidden = false;
            if (drawerTitle) drawerTitle.innerHTML = '<span>⚙️</span> Settings';
          }
        }
      } else {
        drawer.hidden = !drawer.hidden;
      }

      if (!drawer.hidden && window.innerWidth <= 768) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };
  }

  if (drawerClose && drawer) {

    const closeAssistDrawer = () => {
      drawer.hidden = true;
      document.body.style.overflow = '';
      const assistBtn = document.querySelector('#sidebarAssistItem');
      if (assistBtn) assistBtn.classList.remove('active-drawer');
    };

    drawerClose.onclick = closeAssistDrawer;
    drawerClose.ontouchstart = (e) => { e.preventDefault(); closeAssistDrawer(); };

    // Escape key to dismiss drawer
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer && !drawer.hidden) {
        closeAssistDrawer();
      }
    });

    // Swipe / touch outside to close on mobile
    document.addEventListener('click', (e) => {
      if (!drawer.hidden && window.innerWidth <= 768) {
        const isInside = drawer.contains(e.target) || (assistToggle && assistToggle.contains(e.target));
        if (!isInside) {
          closeAssistDrawer();
        }
      }
    });

  }

  setupAssistChat();

  // Upgrade buttons

  $$('.topbar-upgrade-btn').forEach(btn => {

    btn.onclick = () => {

      if (typeof window.openCheckoutModal === 'function') {

        window.openCheckoutModal('pro');

      } else {

        location.hash = '#pricing';

      }

    };

  });

  if (state.appUser.isPro) {

    const orgEl = $('#sidebarOrgName');

    if (orgEl) {

      orgEl.innerHTML = `${(state.appUser.name || 'User').split(' ')[0]}'s Workspace <span style="background:linear-gradient(135deg,#eab308,#f59e0b);color:#000;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;margin-left:4px;">PRO 👑</span>`;

    }

    $$('.topbar-upgrade-btn').forEach(b => {

      b.innerHTML = '👑 PRO Active';

      b.style.background = 'linear-gradient(135deg, #eab308, #ca8a04)';

    });

  }

  // Logout button in sidebar

  const logoutBtn = $('#sidebarLogoutBtn');

  if (logoutBtn) {

    logoutBtn.onclick = async () => {
      const token = getAuthToken();
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: token ? { Authorization: 'Bearer ' + token } : {}
        });
      } catch (_e) {}
      clearStoredSession();
      setActiveSession(null);
      toast('Logged out successfully');
      window.location.href = '/';
    };

  }

  // Route sync on hashchange

  const syncRouteFromHash = () => {

    const raw = (location.hash.slice(1) || '').split('?')[0].toLowerCase();

    if (!isUserAuthenticated()) {
      if (raw === '' || raw === 'home') {
        window.location.replace('/');
      } else if (raw === 'signup') {
        window.location.replace('/#signup');
      } else {
        window.location.replace('/#login');
      }
      return;
    }

    const appViews = ['dashboard', 'create-link', 'links', 'qr', 'qr-detail', 'pages', 'analytics', 'campaigns', 'domains', 'integrations', 'settings', 'keys', 'assist', 'notifications', 'app'];

    if (!raw || raw === 'home' || raw === 'app' || raw === 'login' || raw === 'signup') {
      location.hash = '#dashboard';
      return;
    }

    if (appViews.includes(raw)) {

      document.body.classList.add('app-mode');

      const as = $('#appShell');

      if (as) as.hidden = false;

      const tab = (raw === 'dashboard' || raw === 'app') ? 'home' : raw;

      navigate(tab);

    }

  };

  window.addEventListener('hashchange', syncRouteFromHash);

  // Initial render: ONLY show dashboard if user is verified; otherwise redirect cleanly

  const initialRaw = (location.hash.slice(1) || '').split('?')[0].toLowerCase();

  if (!isUserAuthenticated()) {
    if (initialRaw === '' || initialRaw === 'home') {
      window.location.replace('/');
    } else if (initialRaw === 'signup') {
      window.location.replace('/#signup');
    } else {
      window.location.replace('/#login');
    }
    return;
  }

  const appViews = ['dashboard', 'create-link', 'links', 'qr', 'qr-detail', 'pages', 'analytics', 'campaigns', 'domains', 'integrations', 'settings', 'keys', 'assist', 'notifications', 'app'];
  document.body.classList.add('app-mode');
  const as = $('#appShell');
  if (as) as.hidden = false;
  setAppUser(state.appUser);
  refreshAuthTokenIfNeeded().then((ok) => {
    if (ok) syncLinksFromServer().catch(() => {});
  });
  if (!initialRaw || initialRaw === 'home' || initialRaw === 'app' || initialRaw === 'login' || initialRaw === 'signup') {
    location.hash = '#dashboard';
    navigate('home');
  } else if (appViews.includes(initialRaw)) {
    const tab = initialRaw === 'dashboard' ? 'home' : initialRaw;
    navigate(tab);
  } else {
    location.hash = '#dashboard';
    navigate('home');
  }

}
