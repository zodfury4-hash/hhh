export function renderIntegrations(container) {

  const apps = [
    { name: 'Adobe Express', cat: 'Creative', desc: 'Add short links and QR Codes to your designs without switching apps', icon: '🎨' },
    { name: 'Authvia', cat: 'CRM & Sales', desc: 'Turn text messages into a payment channel with trackable short links', icon: '💳' },
    { name: 'HEA app for Android', cat: 'Mobile App', desc: 'Create and share short links from your Android phone', icon: '🤖' },
    { name: 'HEA app for iPhone', cat: 'Mobile App', desc: 'Create, share, and track from your iPhone or iPad', icon: '🍏' },
    { name: 'HEA Model Context Protocol (MCP)', cat: 'AI', desc: 'Get the full power of HEA Link inside any AI assistant', icon: '⚙️' },
    { name: 'Blog2Social', cat: 'Automation', desc: 'Automatically generate short links for your social posts and manage in one place', icon: '🔄' }
  ];

  const categories = ['All', 'AI', 'Automation', 'Creative', 'CRM & Sales', 'Mobile App'];
  let selectedCat = 'All';

  function drawIntegrations() {
    const visibleApps = selectedCat === 'All' ? apps : apps.filter((a) => a.cat === selectedCat);
    container.innerHTML = `
      <div class="view-header">
        <h2>Integrations</h2>
        <a href="/integrations" style="color:#38bdf8;font-size:14px;font-weight:700;text-decoration:none;">Manage my integrations ↗</a>
      </div>

      <div class="shopify-cream-banner">
        <div>
          <div style="font-size:28px;font-weight:900;color:#0070f3;margin-bottom:12px;">🛍️ shopify</div>
          <h3 style="font-size:22px;font-weight:800;color:#0070f3;margin:0 0 10px;">Automatically attribute orders to specific HEA links</h3>
          <p style="color:#334155;font-size:13px;line-height:1.5;margin:0 0 18px;">
            Shorten links to products, collections, and more directly from Shopify to identify which campaigns generate real ROI.
          </p>
          <a href="/integrations" class="sso-btn" style="display:inline-flex;align-items:center;width:auto;padding:10px 20px;font-weight:700;background:#0070f3;color:#ffffff;border:none;border-radius:10px;text-decoration:none;box-shadow:0 4px 14px rgba(0,112,243,0.3);">
            Configure Webhooks &amp; Apps
          </a>
        </div>
        <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px;box-shadow:0 4px 12px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px;font-size:11px;font-weight:700;color:#64748b;">
            <span>Link title</span>
            <span>Short link</span>
            <span>Orders</span>
          </div>
          <div style="font-size:12px;color:#0b132b;font-weight:600;padding:6px 0;">Maven Armchair • yourbrand.co/3yt77uB • 3</div>
          <div style="font-size:12px;color:#0b132b;font-weight:600;padding:6px 0;">Floral Accent Chair • yourbrand.co/instagram • 56</div>
          <div style="text-align:right;font-size:18px;font-weight:900;color:#0070f3;margin-top:10px;">$26,880.00</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;margin-bottom:20px;">
        ${categories.map((p) => `
          <button type="button" class="home-type-tab int-cat-pill ${selectedCat === p ? 'active' : ''}" data-cat="${p}" style="white-space:nowrap;padding:6px 14px;font-size:12px;">${p}</button>
        `).join('')}
      </div>

      <div class="dash-grid-3 integrations-grid" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;">
        ${visibleApps.map((a) => `
          <div class="integration-card-white" style="cursor:pointer;" onclick="window.location.href='/integrations'">
            <div style="font-size:28px;margin-bottom:12px;">${a.icon}</div>
            <h4 style="font-size:16px;font-weight:700;color:#0b132b;margin:0 0 6px;">${a.name}</h4>
            <p style="color:#64748b;font-size:13px;line-height:1.4;margin:0;">${a.desc}</p>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.int-cat-pill').forEach((btn) => {
      btn.onclick = () => {
        selectedCat = btn.dataset.cat || 'All';
        drawIntegrations();
      };
    });
  }

  drawIntegrations();

}
