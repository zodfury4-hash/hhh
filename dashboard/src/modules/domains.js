import { $, $$, state, getAuthToken, toast } from './state.js';

export function renderDomains(container) {

  let domainTab = 'ai'; // 'ai' or 'search'

  function renderView() {

    container.innerHTML = `

      <div style="margin-bottom:24px;">

        <h2 class="domain-view-title" style="display:none !important;font-size:28px;font-weight:800;color:#0b132b;margin:0 0 16px;">Brand your links with a custom domain</h2>

        <!-- Tabs matching Frame 22 -->

        <div style="display:flex;gap:10px;margin-bottom:24px;">

          <button class="home-type-tab ${domainTab === 'search' ? 'active' : ''}" type="button" id="tabDomainSearch" style="padding:8px 20px;font-size:14px;">

            🔍 Search for a domain

          </button>

          <button class="home-type-tab ${domainTab === 'ai' ? 'active' : ''}" type="button" id="tabDomainAi" style="padding:8px 20px;font-size:14px;">

            ✨ Find a domain with AI

          </button>

        </div>

      </div>

      <div id="domainTabContent"></div>

    `;

    $('#tabDomainSearch').onclick = () => { domainTab = 'search'; renderView(); };

    $('#tabDomainAi').onclick = () => { domainTab = 'ai'; renderView(); };

    const content = $('#domainTabContent');

    if (!content) return;

    if (domainTab === 'ai') {

      content.innerHTML = `

        <!-- AI Domain Generator matching Frame 22 -->

        <div class="dash-white-card" style="padding:24px;margin-bottom:24px;">

          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">

            <span style="font-size:14px;color:#0b132b;font-weight:700;">Describe your idea, product or service</span>

            <span style="font-size:12px;color:#64748b;" id="domainCharCount">0/200</span>

          </div>

          <div style="display:flex;gap:12px;align-items:center;">

            <input type="text" id="domainAiInput" class="home-shorten-input" style="flex:1;" placeholder="e.g. coffee roasters in Austin, vintage sneaker resale, or AI dev tools..." maxlength="200">

            <button class="auth-submit-btn" id="btnGenerateAiDomains" style="width:auto;margin:0;padding:12px 26px;display:flex;align-items:center;gap:8px;">

              ✨ Generate

            </button>

          </div>

        </div>

        <!-- Results Container -->

        <div id="domainAiResults"></div>

      `;

      const input = $('#domainAiInput');

      const counter = $('#domainCharCount');

      const genBtn = $('#btnGenerateAiDomains');

      const resBox = $('#domainAiResults');

      if (input && counter) {

        input.oninput = () => {

          counter.textContent = `${input.value.length}/200`;

        };

        input.onkeydown = e => {

          if (e.key === 'Enter') genBtn?.click();

        };

      }

      if (genBtn && resBox) {

        genBtn.onclick = () => {

          const raw = (input?.value || '').trim();

          const idea = raw ? raw.toLowerCase().replace(/[^a-z0-9]/g, '') : 'brand';

          // Show 4 animated skeleton loaders matching Frame 22

          resBox.innerHTML = `

            <div style="margin-top:16px;">

              <div class="skeleton-line"></div>

              <div class="skeleton-line"></div>

              <div class="skeleton-line"></div>

              <div class="skeleton-line"></div>

            </div>

          `;

          setTimeout(() => {

            const tlds = [

              { ext: '.link', badge: 'Popular' },

              { ext: '.store', badge: 'Ecommerce' },

              { ext: '.bio', badge: 'Creator' },

              { ext: '.chat', badge: 'Community' },

              { ext: '.io', badge: 'Tech' },

              { ext: '.app', badge: 'Mobile' },

              { ext: '.me', badge: 'Personal' },

              { ext: '.agency', badge: 'Services' }

            ];

            const suggestions = [

              `${idea}.link`,

              `${idea}.store`,

              `${idea}.bio`,

              `get${idea}.com`,

              `${idea}.chat`,

              `${idea}hq.io`,

              `${idea}.app`,

              `${idea}.agency`

            ];

            resBox.innerHTML = `

              <div class="dash-white-card" style="padding:8px 20px;">

                ${suggestions.map((dom, i) => `

                  <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:${i === suggestions.length - 1 ? 'none' : '1px solid #f1f5f9'};">

                    <div style="display:flex;align-items:center;gap:12px;">

                      <span style="font-size:18px;color:#0070f3;">🌐</span>

                      <div>

                        <b style="color:#0b132b;font-size:15.5px;font-weight:800;letter-spacing:-0.01em;">${dom}</b>

                        <span style="font-size:11px;color:#059669;margin-left:8px;background:rgba(16,185,129,0.12);padding:2px 7px;border-radius:4px;font-weight:700;">Available</span>

                      </div>

                    </div>

                    <button class="sso-btn btn-claim-domain" data-domain="${dom}" style="width:auto;padding:8px 18px;font-size:13px;color:#0070f3;border-color:rgba(0,112,243,0.3);font-weight:700;background:#ffffff;">

                      ${state.appUser.isPro ? 'Connect domain' : 'Upgrade to claim'}

                    </button>

                  </div>

                `).join('')}

              </div>

              <div style="text-align:center;color:#64748b;font-size:13px;margin:30px 0;">

                — You've reached the end of your results —

              </div>

            `;

            $$('.btn-claim-domain').forEach(btn => {

              btn.onclick = () => {

                const dName = btn.dataset.domain;

                if (state.appUser.isPro) {

                  window.appShell.toast(`Domain ${dName} selected. Connect it via CNAME below.`);

                  domainTab = 'search';

                  renderView();

                } else {

                  window.appShell.toast(`Selected domain: ${dName}. Upgrading to claim...`);

                  if (typeof window.openCheckoutModal === 'function') {

                    window.openCheckoutModal('pro');

                  }

                }

              };

            });

          }, 450);

        };

      }

    } else {

      // Search & Manual CNAME connection tab

      content.innerHTML = `
        <!-- Add Domain Card -->
        <div class="dash-white-card" style="margin-bottom:24px;padding:24px;">
          <h3 style="color:#0b132b;margin-top:0;font-size:18px;font-weight:700;">🌐 Connect a Custom Domain</h3>
          <p style="color:#64748b;font-size:13px;margin-bottom:16px;">
            Point a CNAME record from your DNS registrar (GoDaddy, Cloudflare, Namecheap) to
            <code style="color:#0070f3;background:rgba(0,112,243,0.08);padding:2px 6px;border-radius:4px;font-weight:600;">cname.healink.store</code>
            or add a TXT verification record.
          </p>
          <div style="display:flex;gap:12px;max-width:540px;">
            <input type="text" id="customDomainInput" class="home-shorten-input" style="flex:1;" placeholder="e.g. links.yourbrand.com or go.domain.io" value="">
            <button class="auth-submit-btn" id="btnAddDomain" style="width:auto;margin:0;padding:10px 22px;">
              + Connect Domain
            </button>
          </div>
        </div>

        <!-- Active Domains Table -->
        <div class="dash-white-card" style="padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h4 style="font-size:16px;font-weight:800;color:#0b132b;margin:0;">Configured Domains</h4>
            <span id="domainsStatusBadge" style="font-size:12px;color:#64748b;">Live Verification</span>
          </div>
          <div id="domainsListContainer" style="display:flex;flex-direction:column;gap:12px;">
            <div style="text-align:center;padding:20px;color:#94a3b8;font-size:13px;">Loading configured domains...</div>
          </div>
        </div>
      `;

      const addBtn = $('#btnAddDomain');
      if (addBtn) {
        addBtn.onclick = async () => {
          const d = $('#customDomainInput')?.value.trim();
          if (!d) {
            toast('Please enter a valid domain name');
            return;
          }

          try {
            const s = JSON.parse(localStorage.getItem('hea_session') || '{}');
            if (!s || !s.token) {
              toast('Please sign in to connect custom domains');
              return;
            }

            const res = await fetch('/api/domains', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.token },
              body: JSON.stringify({ domain: d })
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'Failed to connect domain');
            }

            toast(`Domain "${d}" added! Please configure DNS to verify.`);
            loadUserDomains();
          } catch (err) {
            toast(`Error: ${err.message}`);
          }
        };
      }

      async function loadUserDomains() {
        const listContainer = $('#domainsListContainer');
        if (!listContainer) return;

        const s = JSON.parse(localStorage.getItem('hea_session') || '{}');
        const token = s.token || (state.appUser && state.appUser.token);

        // Primary default row
        const defaultDomainHtml = `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
            <div>
              <b style="color:#0b132b;font-size:15px;font-weight:700;">healink.store</b>
              <div style="font-size:12px;color:#64748b;">Default Platform Domain · SSL Active</div>
            </div>
            <span style="background:rgba(16,185,129,0.15);color:#10b981;font-weight:700;font-size:12px;padding:4px 10px;border-radius:6px;">✓ Primary</span>
          </div>
        `;

        if (!token) {
          listContainer.innerHTML = defaultDomainHtml;
          return;
        }

        try {
          const res = await fetch('/api/domains', {
            headers: { Authorization: 'Bearer ' + token }
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const data = await res.json();
          const domains = Array.isArray(data.domains) ? data.domains : [];

          const userRows = domains.map((dom) => {
            const domId = dom._id || dom.id || dom.domain;
            const isActive = dom.status === 'active';
            const isFailed = dom.status === 'failed';
            const statusBadge = isActive
              ? `<span style="background:rgba(16,185,129,0.15);color:#10b981;font-weight:700;font-size:12px;padding:4px 10px;border-radius:6px;">🟢 Active</span>`
              : isFailed
              ? `<span style="background:rgba(239,68,68,0.12);color:#ef4444;font-weight:700;font-size:12px;padding:4px 10px;border-radius:6px;">🔴 Verification Failed</span>`
              : `<span style="background:rgba(245,158,11,0.12);color:#d97706;font-weight:700;font-size:12px;padding:4px 10px;border-radius:6px;">🟡 Pending DNS</span>`;

            return `
              <div style="padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;display:flex;flex-direction:column;gap:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <b style="color:#0070f3;font-size:15px;font-weight:700;">${dom.domain}</b>
                    <div style="font-size:12px;color:#64748b;margin-top:2px;">
                      CNAME: <code>${dom.cnameTarget || 'cname.healink.store'}</code>
                      ${dom.verificationToken ? ` · TXT: <code style="font-size:11px;">${dom.verificationToken}</code>` : ''}
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;align-items:center;">
                    ${statusBadge}
                    ${!isActive ? `
                      <button class="sso-btn btn-verify-dns" data-id="${domId}" style="width:auto;padding:5px 12px;font-size:12px;color:#0070f3;font-weight:700;">
                        ⚡ Verify DNS
                      </button>
                    ` : ''}
                    <button class="sso-btn btn-delete-domain" data-id="${domId}" style="width:auto;padding:5px 10px;font-size:12px;color:#ef4444;" title="Remove domain">
                      ✕
                    </button>
                  </div>
                </div>
                ${dom.lastError ? `
                  <div style="font-size:11.5px;color:#ef4444;background:#fef2f2;padding:6px 10px;border-radius:6px;border:1px solid #fee2e2;">
                    ⚠️ ${dom.lastError}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('');

          listContainer.innerHTML = defaultDomainHtml + userRows;

          // Wire verify buttons
          $$('.btn-verify-dns').forEach((btn) => {
            btn.onclick = async () => {
              const id = btn.dataset.id;
              btn.textContent = 'Verifying...';
              try {
                const vRes = await fetch(`/api/domains/${encodeURIComponent(id)}/verify`, {
                  method: 'POST',
                  headers: { Authorization: 'Bearer ' + token }
                });
                const vData = await vRes.json();
                if (vData.verified) {
                  toast('🎉 Domain verified and active!');
                } else {
                  toast('⚠️ ' + (vData.error || 'Verification check failed. Check DNS propagation.'));
                }
                loadUserDomains();
              } catch (vErr) {
                toast('Verification error: ' + vErr.message);
                loadUserDomains();
              }
            };
          });

          // Wire delete buttons
          $$('.btn-delete-domain').forEach((btn) => {
            btn.onclick = async () => {
              const id = btn.dataset.id;
              if (!confirm('Are you sure you want to remove this domain?')) return;
              try {
                const dRes = await fetch(`/api/domains/${encodeURIComponent(id)}`, {
                  method: 'DELETE',
                  headers: { Authorization: 'Bearer ' + token }
                });
                if (dRes.ok) {
                  toast('Custom domain removed');
                  loadUserDomains();
                } else {
                  const dData = await dRes.json();
                  toast('Error: ' + dData.error);
                }
              } catch (dErr) {
                toast('Error: ' + dErr.message);
              }
            };
          });
        } catch (err) {
          listContainer.innerHTML = defaultDomainHtml;
        }
      }

      loadUserDomains();
    }
  }

  renderView();
}
