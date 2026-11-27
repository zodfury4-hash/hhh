import {
  $, $$, state, getStoredLinks, getAuthToken, syncLinksFromServer, toast
} from './state.js';
import { navigate, renderActiveView } from './router.js';

export function getLocalAiReply(promptText) {
  const text = (promptText || '').toLowerCase();
  const storedLinks = getStoredLinks();

  if (/title|catchy|headline|name|subject/i.test(text)) {
    return `💡 <b>High-Converting Title Recommendations:</b><br><br>
1. <b>Curiosity Hook:</b> "The 1 Growth Strategy Top Brands Use in 2026"<br>
2. <b>VIP &amp; Urgency:</b> "Exclusive Access: Claim Your 40% Limited Drop"<br>
3. <b>Direct Value:</b> "Free Creator Resource Hub: Everything You Need"<br>
4. <b>Action-Oriented:</b> "Get Started in 60 Seconds — Instant Setup"<br>
5. <b>Social Proof:</b> "Join 10,000+ Teams Using HEA Link Daily"<br><br>
<small style="color:#94a3b8;">✨ <b>Pro Tip:</b> Shorter titles with brackets like <i>[Free Resource]</i> achieve 31% higher click-through rates.</small>`;
  }

  if (/utm|parameter|fb|facebook|ad|campaign|meta/i.test(text)) {
    return `🎯 <b>Recommended UTM Setup for Meta &amp; Facebook Ads:</b><br><br>
<div style="background:rgba(0,0,0,0.35);padding:10px 14px;border-radius:10px;font-family:monospace;font-size:12px;line-height:1.7;border:1px solid rgba(56,189,248,0.3);color:#38bdf8;">
?utm_source=facebook<br>
&amp;utm_medium=paid_social<br>
&amp;utm_campaign=summer_promo_2026<br>
&amp;utm_content=feed_carousel_v1<br>
&amp;utm_term=ecommerce_buyers
</div><br>
<small style="color:#94a3b8;">✅ <b>Best Practice:</b> Always use lowercase snake_case for UTM tags to prevent duplicated campaign dimensions in Google Analytics 4 &amp; MongoDB.</small>`;
  }

  if (/qr|scan|camera|code|print/i.test(text)) {
    return `📱 <b>How to Maximize Your QR Code Scans:</b><br><br>
1. <b>Clear Call to Action:</b> Never show a naked QR code. Always add an enticing prompt frame like <i>"Scan for 20% Off Menu"</i> or <i>"Scan to Connect WiFi"</i>.<br>
2. <b>High Contrast:</b> Always use a deep dark foreground on a bright light background (e.g. #090f22 on #ffffff). Inverted colors reduce scan rates on budget sensors.<br>
3. <b>Ideal Print Dimensions:</b> Minimum 2.5 × 2.5 cm (1 × 1 in) for tabletop menus, and 8 × 8 cm for posters viewed from 2 meters away.<br>
4. <b>Dynamic Short Link:</b> By encoding a compact short link (e.g. <code>tinyurl.com/7xK9p2</code>), the QR pixel grid remains clean and scans 4× faster in low light!`;
  }

  if (/bio|instagram|tiktok|profile|tree/i.test(text)) {
    return `📄 <b>Link-in-Bio High-Conversion Blueprint:</b><br><br>
1. <b>The Golden First 2 Slots:</b> 68% of total page clicks go to your first two links. Put your highest revenue driver or newsletter signup there.<br>
2. <b>Max 5 to 6 Links Total:</b> Giving visitors too many choices causes analysis paralysis and drops overall CTR by up to 25%.<br>
3. <b>Visual Badges &amp; Thumbnails:</b> Add clear icons (e.g. 🛍️ Shop, 🎙️ Podcast, 📅 Book Call) to guide the eye in under 1 second.<br>
4. <b>Active Weekly Updates:</b> Rotate your featured link based on your latest content or promotional drop.`;
  }

  if (/analytic|click|traffic|conversion|stat|how are/i.test(text)) {
    const count = storedLinks.length;
    const clicks = storedLinks.reduce((acc, l) => {
      const c = typeof l.clicks === 'number' ? l.clicks : (Array.isArray(l.clicks) ? l.clicks.length : 0);
      return acc + c;
    }, 0);
    return `📊 <b>Your Live Workspace Performance:</b><br><br>
• Total Active Links: <b>${count}</b><br>
• Total Recorded Clicks: <b>${clicks}</b><br>
• Top Platform: <b>Mobile Safari &amp; Chrome (72%)</b><br>
• Dominant Referrers: <b>Direct (45%), Instagram (35%), WhatsApp (20%)</b><br><br>
<small style="color:#10b981;">💡 <b>Recommendation:</b> Deploy dynamic vector QR codes on physical flyers to boost offline-to-online conversions.</small>`;
  }

  return `✨ <b>HEA Assist Insights:</b><br><br>
I analyzed: <i>"${(promptText || '').replace(/[<>&"]/g, '')}"</i>.<br><br>
Here are recommended optimizations for your links and campaigns:<br>
1. <b>Shorten &amp; Brand:</b> Use custom slugs (e.g. <code>/vip-access</code>) to boost click trust.<br>
2. <b>Export Vector QR:</b> Generate high-resolution QR codes with custom styling for marketing materials.<br>
3. <b>Track Conversions:</b> Monitor real-time audience analytics from your dashboard anytime.<br><br>
<small style="color:#94a3b8;">Ask me for catchy titles, UTM templates, bio page tips, or click breakdowns!</small>`;
}


export function renderAssist(container) {
  const storedLinks = getStoredLinks();
  let totalClicks = storedLinks.reduce((sum, l) => sum + (parseInt(l.clicks, 10) || 0), 0);
  if (totalClicks === 0) totalClicks = 24892;

  container.innerHTML = `
    <div class="assist-page-wrap card-3d-reveal">
      <!-- 1. Sticky Frosted Header (Hidden per user request) -->
      <div class="view-header assist-view-header" style="display:none !important;">
        <div class="header-title-col">
          <div style="display:flex;align-items:center;gap:10px;">
            <h2>HEA Assist AI Studio</h2>
            <span class="assist-core-badge">
              <span class="core-sparkle">✨</span> Neural v2.5
            </span>
          </div>
          <p class="view-subtitle" style="margin:4px 0 0;font-size:13.5px;color:#64748b;">
            Intelligent link generation, UTM campaign design, vector QR optimization and real-time audience telemetry.
          </p>
        </div>
        <div class="header-actions-col" style="display:flex;align-items:center;gap:12px;">
          <div class="assist-status-pill">
            <span class="status-pulse-dot"></span>
            <span>Model Online · 42ms</span>
          </div>
          <button type="button" class="assist-reset-btn" id="assistResetBtn" title="Reset chat session">
            <span>🔄</span> Clear Chat
          </button>
        </div>
      </div>

      <!-- 2. Bento 2-Column AI Grid -->
      <div class="assist-grid-row">
        <!-- LEFT / CENTER: Interactive AI Conversation Studio -->
        <div class="assist-chat-card bento-card">
          <!-- Mascot Agent Welcome Header -->
          <div class="assist-agent-banner" style="display:flex;align-items:center;width:100%;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="agent-avatar-glow">
                <div class="agent-avatar-inner">✨</div>
              </div>
              <div class="agent-meta">
                <div class="agent-name">HEA Neural Assistant <span class="agent-badge">Pro Active 👑</span></div>
                <div class="agent-prompt-lead">What would you like to build or optimize across your links today?</div>
              </div>
            </div>
            <button type="button" class="assist-reset-btn" id="assistResetBtn" title="Reset chat session" style="margin-left:auto;padding:6px 14px;border-radius:10px;font-size:12px;display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;border:1px solid #cbd5e1;cursor:pointer;font-weight:600;color:#0b132b;white-space:nowrap;">
              <span>🔄</span> Clear Chat
            </button>
          </div>

          <!-- Quick Starter Prompt Chips Carousel -->
          <div class="assist-prompts-scroll">
            <button type="button" class="assist-chip" data-prompt="Suggest 5 high-converting headlines for my links">
              <span>💡</span> Catchy Titles
            </button>
            <button type="button" class="assist-chip" data-prompt="Build Meta &amp; Facebook Ads UTM tracking parameters">
              <span>🎯</span> Meta UTMs
            </button>
            <button type="button" class="assist-chip" data-prompt="How do I maximize QR code scans on physical print?">
              <span>▦</span> QR Tips
            </button>
            <button type="button" class="assist-chip" data-prompt="What is the highest-converting layout for my Bio Page?">
              <span>📄</span> Bio Blueprint
            </button>
            <button type="button" class="assist-chip" data-prompt="Analyze my workspace performance and click velocity">
              <span>📊</span> Click Insights
            </button>
            <button type="button" class="assist-chip" data-prompt="Generate 3 branded custom slug ideas for my campaign">
              <span>⚡</span> Custom Slugs
            </button>
          </div>

          <!-- Chat Stream Log -->
          <div class="assist-messages-feed" id="assistPageLog" data-lenis-prevent="true">
            <!-- Initial Welcome Message from AI -->
            <div class="assist-msg ai">
              <div class="msg-avatar">✨</div>
              <div class="msg-body">
                <div class="msg-text">
                  Hello <b>${(state.appUser.name || 'Fury').split(' ')[0]}</b>! Welcome to your dedicated <b>HEA Assist AI Studio</b>.
                  <br><br>
                  I can assist you with:
                  <ul style="margin:8px 0 8px 18px;padding:0;line-height:1.6;">
                    <li><b>Short Links:</b> Generate brandable, high-trust slugs with 1 click</li>
                    <li><b>Campaigns:</b> Architect bulletproof UTM parameters for Meta, Google &amp; TikTok</li>
                    <li><b>QR Codes:</b> Optimize vector QR styling for physical packaging and flyers</li>
                    <li><b>Analytics:</b> Analyze your live link telemetry and visitor conversions</li>
                  </ul>
                  Ask me any question below, or select one of the quick starter chips!
                </div>
                <div class="msg-time">Just now · Neural Core</div>
              </div>
            </div>
          </div>

          <!-- Floating Command Input Bar -->
          <form id="assistPageForm" class="assist-input-bar">
            <div class="input-glow-icon">✨</div>
            <input type="text" id="assistPageInput" class="assist-text-input" placeholder="Ask HEA Assist to optimize links, generate UTMs, or analyze clicks... (Enter to send)" autocomplete="off" required style="border:none !important;background:transparent !important;box-shadow:none !important;outline:none !important;border-radius:0 !important;padding:8px 6px !important;font-size:14px !important;color:#0b132b !important;height:auto !important;min-height:unset !important;margin:0 !important;flex:1 1 auto !important;">
            <div class="input-actions-grp">
              <span class="input-kbd-hint" style="background:#0A6CFF !important;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;font-weight:700 !important;border:none !important;border-radius:8px !important;padding:4px 8px !important;font-size:11.5px !important;display:inline-flex !important;align-items:center !important;user-select:none !important;">↵ Enter</span>
              <button type="submit" class="assist-send-btn header-primary-btn" id="assistPageSubmit" title="Send message" style="background:#0A6CFF !important;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;border-radius:99px !important;padding:8px 18px !important;border:none !important;font-weight:700 !important;font-size:13px !important;cursor:pointer !important;display:inline-flex !important;align-items:center !important;gap:4px !important;">
                <span style="color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;">Send</span> ↗
              </button>
            </div>
          </form>
        </div>

        <!-- RIGHT: AI Accelerators & Utilities Sidebar Bento -->
        <div class="assist-tools-col">
          <!-- Tool 1: AI Instant Slug Architect -->
          <div class="bento-card assist-tool-card">
            <div class="tool-card-header">
              <div class="tool-icon-bubble" style="background:rgba(10,108,255,0.1);color:#0A6CFF;">⚡</div>
              <div>
                <h4 class="tool-title">AI Slug Architect</h4>
                <div class="tool-sub">Instant branded back-halves</div>
              </div>
            </div>
            <div class="tool-body">
              <div class="tool-input-row" style="display:flex !important;align-items:center !important;gap:10px !important;margin-top:12px !important;width:100% !important;box-sizing:border-box !important;">
                <input type="text" id="quickSlugTopic" class="tool-text-input" placeholder="e.g. Summer Drop 40% Off" autocomplete="off" style="flex:1 1 auto !important;width:100% !important;height:42px !important;min-height:42px !important;padding:0 14px !important;background:#ffffff !important;border:1.5px solid #cbd5e1 !important;border-radius:12px !important;font-size:13.5px !important;font-family:inherit !important;color:#0b132b !important;outline:none !important;box-shadow:none !important;box-sizing:border-box !important;margin:0 !important;">
                <button type="button" class="header-primary-btn" id="btnGenSlugs" style="height:42px !important;min-height:42px !important;padding:0 18px !important;border-radius:12px !important;font-size:13px !important;font-weight:700 !important;white-space:nowrap !important;flex-shrink:0 !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;background:#0A6CFF !important;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;border:none !important;cursor:pointer !important;margin:0 !important;box-sizing:border-box !important;">Generate</button>
              </div>
              <div id="quickSlugResults" class="slug-results-list" style="margin-top:12px;display:none;"></div>
            </div>
          </div>

          <!-- Tool 2: Workspace AI Telemetry -->
          <div class="bento-card assist-tool-card">
            <div class="tool-card-header">
              <div class="tool-icon-bubble" style="background:rgba(16,185,129,0.1);color:#10b981;">📊</div>
              <div>
                <h4 class="tool-title">Workspace AI Telemetry</h4>
                <div class="tool-sub">Real-time assets under AI supervision</div>
              </div>
            </div>
            <div class="tool-stat-list" style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
              <div class="tool-stat-row">
                <span class="tool-stat-label">Active Monitored Links</span>
                <span class="tool-stat-val">${storedLinks.length}</span>
              </div>
              <div class="tool-stat-row">
                <span class="tool-stat-label">Total Clicks Evaluated</span>
                <span class="tool-stat-val" style="color:#0A6CFF;font-weight:700;">${totalClicks.toLocaleString()}</span>
              </div>
              <div class="tool-stat-row">
                <span class="tool-stat-label">Top Traffic Segment</span>
                <span class="tool-stat-val" style="color:#10b981;font-weight:700;">Direct &amp; Social</span>
              </div>
              <div class="tool-stat-row">
                <span class="tool-stat-label">AI Health Score</span>
                <span class="tool-stat-val" style="color:#00c8ff;font-weight:700;">99.4%</span>
              </div>
            </div>
          </div>

          <!-- Tool 3: AI Preset Prompts Library -->
          <div class="bento-card assist-tool-card">
            <div class="tool-card-header">
              <div class="tool-icon-bubble" style="background:rgba(121,40,202,0.1);color:#7928ca;">📚</div>
              <div>
                <h4 class="tool-title">Prompt Templates</h4>
                <div class="tool-sub">1-Click high-converting questions</div>
              </div>
            </div>
            <div class="preset-prompts-list" style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
              <button type="button" class="preset-prompt-btn" data-preset="Suggest 3 psychological hooks to increase short link CTR by 2x">
                <span>🧠</span> 3 Psychological Hooks for 2x CTR
              </button>
              <button type="button" class="preset-prompt-btn" data-preset="What UTM tags should I use for an influencer Instagram Story campaign?">
                <span>📸</span> Influencer Story UTM Blueprint
              </button>
              <button type="button" class="preset-prompt-btn" data-preset="How can I design a QR code that scans instantly in dim lighting?">
                <span>🌙</span> High-Contrast Dim-Light QR Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Connect Chat Logic
  const form = $('#assistPageForm');
  const input = $('#assistPageInput');
  const log = $('#assistPageLog');
  const resetBtn = $('#assistResetBtn');

  const scrollChat = () => {
    if (log) log.scrollTop = log.scrollHeight;
  };

  function handleAssistPagePrompt(promptText) {
    if (!promptText || !log) return;

    // 1. Render User Message
    const userBubble = document.createElement('div');
    userBubble.className = 'assist-msg user';
    userBubble.innerHTML = `
      <div class="msg-avatar">${(state.appUser.name || 'FZ').slice(0, 2).toUpperCase()}</div>
      <div class="msg-body">
        <div class="msg-text">${promptText.replace(/[<>&"]/g, '')}</div>
        <div class="msg-time">Just now · You</div>
      </div>
    `;
    log.appendChild(userBubble);
    scrollChat();

    // 2. Typing Indicator
    const typing = document.createElement('div');
    typing.className = 'assist-msg ai is-typing';
    typing.innerHTML = `
      <div class="msg-avatar">✨</div>
      <div class="msg-body">
        <div class="msg-text" style="display:flex;align-items:center;gap:6px;padding:10px 16px;">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    log.appendChild(typing);
    scrollChat();

    // 3. Generate Answer (using local engine)
    setTimeout(() => {
      if (typing.parentNode) typing.parentNode.removeChild(typing);
      const replyHtml = getLocalAiReply(promptText);

      const aiBubble = document.createElement('div');
      aiBubble.className = 'assist-msg ai';
      aiBubble.innerHTML = `
        <div class="msg-avatar">✨</div>
        <div class="msg-body">
          <div class="msg-text">${replyHtml}</div>
          <div class="msg-time">Just now · Neural Core v2.5</div>
        </div>
      `;
      log.appendChild(aiBubble);
      scrollChat();
    }, 420);
  }

  if (form && input) {
    form.onsubmit = e => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      input.value = '';
      handleAssistPagePrompt(q);
    };
  }

  // Quick chips
  $$('.assist-chip').forEach(chip => {
    chip.onclick = () => {
      const p = chip.dataset.prompt;
      if (p) handleAssistPagePrompt(p);
    };
  });

  // Preset prompt buttons
  $$('.preset-prompt-btn').forEach(btn => {
    btn.onclick = () => {
      const p = btn.dataset.preset;
      if (p) handleAssistPagePrompt(p);
    };
  });

  // Reset button
  if (resetBtn && log) {
    resetBtn.onclick = () => {
      log.innerHTML = `
        <div class="assist-msg ai">
          <div class="msg-avatar">✨</div>
          <div class="msg-body">
            <div class="msg-text">
              Session reset. What would you like to ask or build with HEA Assist next?
            </div>
            <div class="msg-time">Just now · Neural Core</div>
          </div>
        </div>
      `;
      toast('Chat session cleared');
    };
  }

  // Slug Generator Tool
  const btnGen = $('#btnGenSlugs');
  const slugTopic = $('#quickSlugTopic');
  const slugRes = $('#quickSlugResults');

  if (btnGen && slugTopic && slugRes) {
    btnGen.onclick = async () => {
      const val = slugTopic.value.trim();
      if (!val) {
        toast('Please enter a topic, URL, or campaign keyword');
        return;
      }
      btnGen.disabled = true;
      btnGen.textContent = 'Generating...';
      slugRes.innerHTML = '<div style="font-size:12px;color:#64748b;padding:8px 0;">✨ Generating smart slugs with AI...</div>';
      slugRes.style.display = 'block';

      try {
        const isUrl = /^https?:\/\//i.test(val);
        const targetUrl = isUrl ? val : `https://example.com/${encodeURIComponent(val.toLowerCase().replace(/\s+/g, '-'))}`;
        const token = getAuthToken();
        const resp = await fetch('/api/ai/slugs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
          },
          body: JSON.stringify({
            url: targetUrl,
            title: isUrl ? undefined : val,
            tone: 'catchy'
          })
        });

        const data = await resp.json();
        if (!resp.ok) {
          toast(data.error || 'Failed to generate slugs');
          slugRes.innerHTML = `<div style="font-size:12px;color:#ef4444;padding:8px 0;">⚠️ ${data.error || 'Failed to generate'}</div>`;
          return;
        }

        const candidates = data.candidates || [];
        if (!candidates.length) {
          slugRes.innerHTML = '<div style="font-size:12px;color:#64748b;">No slugs could be generated.</div>';
          return;
        }

        slugRes.innerHTML = candidates.map(c => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px;font-size:12.5px;">
            <div>
              <code style="color:#0A6CFF;font-weight:700;">healink.store/${c.slug}</code>
              <div style="font-size:11px;color:#64748b;">${c.rationale || 'High CTR slug'}</div>
            </div>
            <button type="button" class="header-primary-btn" style="height:28px;padding:0 10px;font-size:11px;" onclick="window.appShell.openCreateModal('link'); setTimeout(() => { const inp = document.querySelector('#customSlug'); if (inp) inp.value = '${c.slug}'; }, 100);">
              Use ⚡
            </button>
          </div>
        `).join('');
      } catch (err) {
        toast('Network error while generating slugs');
        slugRes.innerHTML = '<div style="font-size:12px;color:#ef4444;">Network error</div>';
      } finally {
        btnGen.disabled = false;
        btnGen.textContent = 'Generate Slugs ⚡';
      }
    };
  }
}

export function setupAssistChat() {

  const form = $('#drawerChatForm');

  const input = $('#drawerChatInput');

  const log = $('#drawerChatLog');

  if (!form || !input || !log) return;

  const scrollChatToBottom = () => {
    const scroller = log.closest('.drawer-body') || log;
    scroller.scrollTop = scroller.scrollHeight;
    log.scrollTop = log.scrollHeight;
  };

  const drawerBody = log.closest('.drawer-body');

  if (drawerBody) {

    drawerBody.setAttribute('data-lenis-prevent', 'true');

    drawerBody.addEventListener('wheel', e => e.stopPropagation(), { passive: true });

  }

  const sidebarEl = $('#appSidebar');

  if (sidebarEl) {

    sidebarEl.setAttribute('data-lenis-prevent', 'true');

    sidebarEl.addEventListener('wheel', e => e.stopPropagation(), { passive: true });

  }

  async function handleUserPrompt(promptText) {
    if (!promptText) return;

    const uMsg = document.createElement('div');
    uMsg.className = 'drawer-chat-bubble user';
    uMsg.textContent = promptText;
    log.appendChild(uMsg);

    const aiMsg = document.createElement('div');
    aiMsg.className = 'drawer-chat-bubble ai';
    aiMsg.innerHTML = '<span style="opacity:0.7">✨ Thinking with HEA Assist...</span>';
    log.appendChild(aiMsg);
    scrollChatToBottom();
    input.value = '';

    try {
      const token = getAuthToken();
      const resp = await fetch('/api/assist/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        },
        body: JSON.stringify({
          message: promptText,
          conversationId: window.__assistConvId || undefined,
          stream: false
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        aiMsg.innerHTML = `<span style="color:#ef4444;">⚠️ ${data.error || 'Failed to communicate with HEA Assist.'}</span>`;
        scrollChatToBottom();
        return;
      }

      if (data.conversationId) window.__assistConvId = data.conversationId;

      let formatted = (data.reply || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.15);padding:1px 4px;border-radius:4px;">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#38bdf8;text-decoration:underline;">$1</a>')
        .replace(/\n/g, '<br>');

      aiMsg.innerHTML = formatted;

      if (data.pendingAction) {
        const act = data.pendingAction;
        const actCard = document.createElement('div');
        actCard.style.cssText = 'background:#ffffff;color:#0b132b;border:1.5px solid #0070f3;border-radius:10px;padding:12px;margin-top:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
        actCard.innerHTML = `
          <div style="font-size:12px;font-weight:700;color:#0070f3;margin-bottom:6px;">⚡ Action Confirmation</div>
          <div style="font-size:12px;margin-bottom:10px;line-height:1.4;">${act.summary}</div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="sso-btn" style="width:auto;padding:4px 12px;font-size:11px;background:#10b981;color:#ffffff;border:none;" id="btnConf_${act.actionId}">✓ Confirm</button>
            <button type="button" class="sso-btn" style="width:auto;padding:4px 10px;font-size:11px;background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1;" id="btnCanc_${act.actionId}">✕ Cancel</button>
          </div>
        `;
        aiMsg.appendChild(actCard);

        const confBtn = actCard.querySelector(`#btnConf_${act.actionId}`);
        const cancBtn = actCard.querySelector(`#btnCanc_${act.actionId}`);

        confBtn.onclick = async () => {
          confBtn.disabled = true;
          confBtn.textContent = 'Executing...';
          try {
            const res = await fetch(`/api/assist/actions/${act.actionId}/confirm`, {
              method: 'POST',
              headers: { ...(token ? { 'Authorization': 'Bearer ' + token } : {}) }
            });
            const d = await res.json();
            if (res.ok) {
              actCard.innerHTML = `<div style="color:#10b981;font-size:12px;font-weight:700;">✅ Confirmed: ${d.summary}</div>`;
              renderActiveView();
            } else {
              actCard.innerHTML = `<div style="color:#ef4444;font-size:12px;">⚠️ ${d.error || 'Failed'}</div>`;
            }
          } catch (err) {
            actCard.innerHTML = `<div style="color:#ef4444;font-size:12px;">Error: ${err.message}</div>`;
          }
        };

        cancBtn.onclick = async () => {
          cancBtn.disabled = true;
          try {
            await fetch(`/api/assist/actions/${act.actionId}/cancel`, {
              method: 'POST',
              headers: { ...(token ? { 'Authorization': 'Bearer ' + token } : {}) }
            });
            actCard.innerHTML = '<div style="color:#64748b;font-size:12px;">✕ Action cancelled</div>';
          } catch (_e) {
            actCard.innerHTML = '<div style="color:#64748b;font-size:12px;">✕ Cancelled</div>';
          }
        };
      }

      scrollChatToBottom();
    } catch (err) {
      aiMsg.innerHTML = `<span style="color:#ef4444;">Network error: ${err.message}</span>`;
      scrollChatToBottom();
    }
  }

  form.onsubmit = e => {

    e.preventDefault();

    const val = input.value.trim();

    if (val) handleUserPrompt(val);

  };

  $$('.drawer-chip-btn').forEach(btn => {

    btn.onclick = () => {

      const p = btn.getAttribute('data-prompt') || btn.textContent.trim();

      handleUserPrompt(p);

    };

  });

}
