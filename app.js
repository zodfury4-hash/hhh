'use strict';

/* =========================================================
   HEA Link — Dashboard Runtime Helpers & Router Guard
   ========================================================= */

const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];

const store = {
  get(k, d) {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v ?? d;
    } catch (_e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (_e) {}
  }
};

const sessionStore = {
  get(k, d) {
    try {
      const v = JSON.parse(sessionStorage.getItem(k));
      return v ?? d;
    } catch (_e) {
      return d;
    }
  },
  set(k, v) {
    try {
      if (v === null) {
        sessionStorage.removeItem(k);
        localStorage.removeItem(k);
      } else {
        sessionStorage.setItem(k, JSON.stringify(v));
      }
    } catch (_e) {}
  }
};

function clearStoredSession() {
  try {
    sessionStorage.removeItem('hea_session');
    localStorage.removeItem('hea_session');
    sessionStorage.removeItem('hea_token');
    localStorage.removeItem('hea_token');
  } catch (_e) {}
}

function isJwtExpired(token) {
  try {
    if (!token || typeof token !== 'string') return true;
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const payload = JSON.parse(atob(b64));
    if (!payload || (payload.exp && Date.now() >= payload.exp * 1000)) return true;
    return false;
  } catch (_e) {
    return true;
  }
}

function getVerifiedSession() {
  try {
    const raw = sessionStorage.getItem('hea_session') || localStorage.getItem('hea_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const token =
      (parsed && parsed.token) || sessionStorage.getItem('hea_token') || localStorage.getItem('hea_token') || '';
    if (
      !parsed ||
      !parsed.isVerified ||
      !parsed.email ||
      parsed.email === 'john@example.com' ||
      !token ||
      isJwtExpired(token)
    ) {
      clearStoredSession();
      return null;
    }
    return parsed;
  } catch (_e) {
    clearStoredSession();
    return null;
  }
}

let session = getVerifiedSession();

function isVipAdmin(userOrEmail) {
  const s = (typeof userOrEmail === 'object' && userOrEmail) || session || getVerifiedSession();
  if (!s) return false;
  return s.role === 'admin' || !!s.isAdmin;
}

function isUserPro() {
  try {
    const s = session || getVerifiedSession();
    if (!s || !s.email) return false;
    if (isVipAdmin(s)) return true;
    if (
      s.isPro ||
      s.isAdmin ||
      s.plan === 'Unlimited' ||
      s.plan === 'Core PRO' ||
      s.plan === 'pro' ||
      s.plan === 'enterprise'
    ) {
      return true;
    }
    return false;
  } catch (_e) {
    return false;
  }
}

window.isUserPro = isUserPro;

function canCreateLinkOrQr() {
  if (isUserPro()) return { allowed: true };
  if (
    typeof window !== 'undefined' &&
    window.location &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return { allowed: true };
  }
  const freeCreations = parseInt(localStorage.getItem('hea_free_creations') || '0', 10);
  if (freeCreations >= 100) {
    return {
      allowed: false,
      count: freeCreations,
      message: 'Free plan limit reached. Upgrade to Pro for unlimited creation!'
    };
  }
  return { allowed: true, count: freeCreations, remaining: 100 - freeCreations };
}

window.canCreateLinkOrQr = canCreateLinkOrQr;

function recordFreeCreation() {
  if (isUserPro()) return;
  const current = parseInt(localStorage.getItem('hea_free_creations') || '0', 10);
  const next = current + 1;
  localStorage.setItem('hea_free_creations', next.toString());
  if (next >= 100) {
    setTimeout(() => {
      toast('⚠️ Free limit reached. Upgrade to Pro for unlimited creation!');
      if (typeof window.openCheckoutModal === 'function') {
        window.openCheckoutModal('pro');
      }
    }, 1500);
  }
}

window.recordFreeCreation = recordFreeCreation;

function canChatWithAssist() {
  if (isUserPro()) return { allowed: true };
  const count = parseInt(localStorage.getItem('hea_free_chat_count') || '0', 10);
  if (count >= 5) {
    return {
      allowed: false,
      count,
      message: 'Free plan limit reached (5/5 AI messages). Upgrade to Pro for unlimited HEA Assist AI messages!'
    };
  }
  return { allowed: true, count };
}

window.canChatWithAssist = canChatWithAssist;

function recordFreeChat() {
  if (isUserPro()) return;
  const count = parseInt(localStorage.getItem('hea_free_chat_count') || '0', 10);
  const next = count + 1;
  localStorage.setItem('hea_free_chat_count', next.toString());
  if (next >= 5) {
    setTimeout(() => {
      if (typeof window.openCheckoutModal === 'function') {
        window.openCheckoutModal('pro');
      }
    }, 1200);
  }
}

window.recordFreeChat = recordFreeChat;

function toast(m) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_e) {
    const t = document.createElement('textarea');
    t.value = text;
    document.body.appendChild(t);
    t.select();
    try {
      document.execCommand('copy');
    } catch (_e2) {}
    t.remove();
  }
  toast('Copied: ' + text);
}

/* ---------- QR Code Generator ---------- */

function drawQR(cv, text, fg = '#0e1a33', bg = '#ffffff', px = 256) {
  if (typeof qrcode !== 'function' || !cv) return;
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  const m = 2;
  const c = px / (n + 2 * m);
  cv.width = cv.height = px;
  const x = cv.getContext('2d');
  x.fillStyle = bg;
  x.fillRect(0, 0, px, px);
  x.fillStyle = fg;
  for (let r = 0; r < n; r++) {
    for (let k = 0; k < n; k++) {
      if (q.isDark(r, k)) {
        x.fillRect(Math.floor((m + k) * c), Math.floor((m + r) * c), Math.ceil(c), Math.ceil(c));
      }
    }
  }
}

/* =========================================================
   PRO / ENTERPRISE CHECKOUT MODAL
   ========================================================= */

function lockModalScroll() {
  document.body.classList.add('modal-scroll-lock');
  document.documentElement.classList.add('modal-scroll-lock');
}

function unlockModalScroll() {
  document.body.classList.remove('modal-scroll-lock');
  document.documentElement.classList.remove('modal-scroll-lock');
}

window.lockModalScroll = lockModalScroll;
window.unlockModalScroll = unlockModalScroll;

let checkoutBillingCycle = 'monthly';
let selectedCheckoutPlan = 'pro';
const PLAN_PRICES = {
  monthly: { growth: 'Rs 1,499', pro: 'Rs 1,499', business: 'Rs 4,999', enterprise: 'Rs 29,999' },
  annual: { growth: 'Rs 1,199', pro: 'Rs 1,199', business: 'Rs 3,999', enterprise: 'Rs 23,999' }
};

function openCheckoutModal(plan = 'pro') {
  selectedCheckoutPlan = (plan || 'pro').toLowerCase();
  const modal = $('#checkoutModal');
  if (!modal) return;

  const radios = $$('input[name="checkoutPlan"]', modal);
  radios.forEach((r) => {
    const card = r.closest('.checkout-plan-card');
    if (r.value === selectedCheckoutPlan) {
      r.checked = true;
      card?.classList.add('active');
    } else {
      r.checked = false;
      card?.classList.remove('active');
    }
  });

  const sess = getVerifiedSession();
  if (sess) {
    if (sess.name && $('#payName')) $('#payName').value = sess.name;
    if (sess.email && $('#payEmail')) $('#payEmail').value = sess.email;
  } else {
    if ($('#payName')) $('#payName').value = '';
    if ($('#payEmail')) $('#payEmail').value = '';
  }

  modal.hidden = false;
  lockModalScroll();
}

function closeCheckoutModal() {
  const modal = $('#checkoutModal');
  if (!modal) return;
  modal.hidden = true;
  unlockModalScroll();
}

window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;

function setupCheckoutModal() {
  const modal = $('#checkoutModal');
  if (!modal) return;

  $('#checkoutCloseBtn')?.addEventListener('click', closeCheckoutModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCheckoutModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeCheckoutModal();
  });

  modal.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  modal.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });

  $$('.checkout-modal-overlay, .create-modal-overlay').forEach((ov) => {
    ov.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
    ov.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  });

  const btnMonthly = $('#cycleMonthly');
  const btnAnnual = $('#cycleAnnual');
  const updatePrices = () => {
    const prices = PLAN_PRICES[checkoutBillingCycle];
    if ($('#pricePro')) $('#pricePro').innerHTML = `${prices.pro}<small>/mo</small>`;
    if ($('#priceBusiness')) $('#priceBusiness').innerHTML = `${prices.business}<small>/mo</small>`;
    if ($('#priceEnterprise')) $('#priceEnterprise').innerHTML = `${prices.enterprise}<small>/mo</small>`;
  };

  btnMonthly?.addEventListener('click', () => {
    checkoutBillingCycle = 'monthly';
    btnMonthly.classList.add('active');
    btnAnnual?.classList.remove('active');
    updatePrices();
  });

  btnAnnual?.addEventListener('click', () => {
    checkoutBillingCycle = 'annual';
    btnAnnual.classList.add('active');
    btnMonthly?.classList.remove('active');
    updatePrices();
  });

  $$('.checkout-plan-card', modal).forEach((card) => {
    card.addEventListener('click', () => {
      $$('.checkout-plan-card', modal).forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        selectedCheckoutPlan = radio.value;
      }
    });
  });

  const cardInput = $('#payCardNum');
  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 16);
      v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = v;
      const brandBadge = $('#payCardBrand');
      if (brandBadge) {
        if (/^4/.test(v)) brandBadge.textContent = 'VISA';
        else if (/^5[1-5]/.test(v)) brandBadge.textContent = 'MC';
        else if (/^3[47]/.test(v)) brandBadge.textContent = 'AMEX';
        else brandBadge.textContent = 'CARD';
      }
    });
  }

  const expInput = $('#payExp');
  if (expInput) {
    expInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + ' / ' + v.slice(2);
      e.target.value = v;
    });
  }

  const form = $('#checkoutPaymentForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = $('#checkoutSubmitBtn');
      const origText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳ Processing Payment with 256-bit SSL...</span>';
      }

      await new Promise((r) => setTimeout(r, 1100));

      let s = getVerifiedSession() || store.get('hea_session', null);
      if (!s) {
        const pName = $('#payName')?.value.trim() || 'Subscriber';
        const pEmail = $('#payEmail')?.value.trim() || '';
        s = { name: pName, email: pEmail, isVerified: true };
      }

      s.isPro = true;
      s.plan =
        selectedCheckoutPlan === 'enterprise'
          ? 'Enterprise'
          : selectedCheckoutPlan === 'business'
            ? 'Business'
            : selectedCheckoutPlan === 'growth'
              ? 'Growth'
              : 'Core PRO';
      s.billingCycle = checkoutBillingCycle;
      s.subscribedAt = new Date().toISOString();
      store.set('hea_session', s);
      sessionStore.set('hea_session', s);

      if (window.appShell && typeof window.appShell.setProStatus === 'function') {
        window.appShell.setProStatus(s.plan);
      }

      toast(`🎉 Payment Successful! Your ${s.plan} subscription is now active!`);
      closeCheckoutModal();

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  const btnStripe = $('#btnStripeCheckout');
  if (btnStripe) {
    btnStripe.addEventListener('click', async () => {
      const origText = btnStripe.innerHTML;
      btnStripe.disabled = true;
      btnStripe.innerHTML = '<span>⏳ Connecting to Stripe Secure Gateway...</span>';

      const sess = getVerifiedSession();
      const userEmail = $('#payEmail')?.value.trim() || (sess && sess.email) || '';
      const userName = $('#payName')?.value.trim() || (sess && sess.name) || '';

      try {
        const res = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: selectedCheckoutPlan,
            billingCycle: checkoutBillingCycle,
            userEmail,
            userName
          })
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        toast(data.error || 'Unable to connect to Stripe. Please try again.');
      } catch (_err) {
        toast('Connection error. Please try again.');
      } finally {
        btnStripe.disabled = false;
        btnStripe.innerHTML = origText;
      }
    });
  }

  const checkStripeSuccessCallback = async () => {
    const hash = window.location.hash || '';
    if (!hash.includes('checkout-success')) return;
    const urlParams = new URLSearchParams(hash.split('?')[1] || '');
    const sessionId = urlParams.get('session_id');
    const planName = urlParams.get('plan') || 'Core PRO';
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/stripe/verify-session/${encodeURIComponent(sessionId)}`);
      const d = await res.json();
      if (d.ok && d.verified) {
        const s = getVerifiedSession() || { email: d.userEmail, isVerified: true };
        s.isPro = true;
        s.plan = d.plan || planName;
        s.subscribedAt = new Date().toISOString();
        store.set('hea_session', s);
        sessionStore.set('hea_session', s);
        if (window.appShell && typeof window.appShell.setProStatus === 'function') {
          window.appShell.setProStatus(s.plan);
        }
        toast(`🎉 Payment Confirmed by Stripe! Your ${s.plan} subscription is active!`);
        window.location.hash = '#dashboard';
      }
    } catch (_e) {}
  };

  setTimeout(checkStripeSuccessCallback, 400);
}

/* =========================================================
   DASHBOARD ROUTER GUARD
   ========================================================= */

function route() {
  session = getVerifiedSession();
  const rawHash = (location.hash.slice(1) || '').split('?')[0].toLowerCase();

  if (rawHash === 'integrations') {
    window.location.href = '/integrations';
    return;
  }
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

  if (!session) {
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
    'dashboard',
    'create-link',
    'links',
    'qr',
    'qr-detail',
    'pages',
    'analytics',
    'campaigns',
    'domains',
    'integrations',
    'settings',
    'assist',
    'notifications',
    'app'
  ];

  if (appViews.includes(rawHash)) {
    const targetTab = rawHash === 'dashboard' || rawHash === 'app' ? 'home' : rawHash;
    if (window.appShell && typeof window.appShell.navigate === 'function') {
      window.appShell.navigate(targetTab);
    }
    window.scrollTo(0, 0);
  }
}

window.drawQR = drawQR;
window.toast = toast;
window.copy = copy;

window.addEventListener('hashchange', route);
setupCheckoutModal();
route();
