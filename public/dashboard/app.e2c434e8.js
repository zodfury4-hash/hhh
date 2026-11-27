(()=>{var J=(e,t)=>()=>(e&&(t=e(e=0)),t);var Mt=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);function Xe(e){e.innerHTML=`

    <div class="create-link-wrap">

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">

        <h2 style="font-size:24px;font-weight:800;color:#0070f3;margin:0;">Create a new link</h2>

        <a href="#" style="color:#38bdf8;font-size:13px;font-weight:600;text-decoration:none;" onclick="alert('Bulk upload is available on the Pro plan')">Bulk upload \u{1F4C4}</a>

      </div>

      <!-- 1. Link details card -->

      <div class="create-link-card">

        <div style="display:flex;justify-content:space-between;align-items:center;">

          <h3 style="margin:0;">Link details</h3>

          <span style="color:#94a3b8;font-size:16px;">\u2303</span>

        </div>

        <div class="create-link-sub" style="margin-top:4px;">

          ${u.appUser.isPro?'<span style="color:#10b981;font-weight:700;">\u{1F451} Core PRO Active: Unlimited short links &amp; custom back-halves</span>':`You have <b>4 links</b> and <b>3 custom back-halves</b> remaining this month. <a href="#" style="color:#38bdf8;" onclick="window.openCheckoutModal('pro'); return false;">Upgrade for more</a>.`}

        </div>

        <div class="create-link-field">

          <label>Destination URL</label>

          <input type="url" id="newDestUrl" placeholder="https://yourcompany.com/new-product-launch" required>

        </div>

        <!-- Dynamic routing alert banner (Screenshot 12.02.38 AM) -->

        <div class="dynamic-routing-alert">

          <div style="display:flex;align-items:center;gap:10px;">

            <span>\u{1F500}</span>

            <span><b>Dynamic routing</b> \u2014 send visitors to different URLs based on device or location.</span>

          </div>

          <div style="display:flex;gap:10px;align-items:center;">

            <button class="sso-btn" style="width:auto !important;min-width:max-content !important;white-space:nowrap !important;padding:6px 18px !important;font-size:13px !important;font-weight:700 !important;background:#ffffff !important;color:#0b132b !important;border:1.5px solid #cbd5e1 !important;border-radius:99px !important;flex-shrink:0 !important;cursor:pointer !important;" onclick="alert('Dynamic routing rules manager opened')">Set it up</button>

            <button style="background:none;border:0;color:#93c5fd;cursor:pointer;font-size:16px;" onclick="this.closest('.dynamic-routing-alert').remove()">\u2715</button>

          </div>

        </div>

        <!-- Short link domain & back-half -->

        <div class="create-slug-grid" style="display:grid;grid-template-columns:1fr 20px 1.4fr;gap:12px;align-items:flex-end;margin-bottom:20px;">

          <div class="create-link-field" style="margin:0;">

            <label>Short link domain</label>

            <select id="newDomainSelect" class="home-domain-select" style="width:100%;">

              <option value="healink.store" selected>healink.store</option>

              <option value="healink.store">healink.store</option>

              <option value="bit.ly">bit.ly</option>

            </select>

          </div>

          <div style="padding-bottom:12px;text-align:center;font-size:18px;color:#64748b;">/</div>

          <div class="create-link-field" style="margin:0;">

            <div style="display:flex;justify-content:space-between;align-items:center;">

              <label>Back-half (optional)</label>

              <button type="button" class="sso-btn" style="width:auto;padding:2px 8px;font-size:11px;color:#38bdf8;" id="btnGenerateSlug">

                \u2728 Generate

              </button>

            </div>

            <input type="text" id="newBackHalf" placeholder="e.g. vip-drop26 (or leave empty for auto 6-char slug)">

          </div>

        </div>

        <div class="create-link-field">

          <label>Title (optional)</label>

          <input type="text" id="newTitle" placeholder="e.g. Q4 Global Brand Campaign Launch">

        </div>

        <div class="create-link-field" style="margin-bottom:0;">

          <label>Tags</label>

          <select id="newTagsSelect" class="home-domain-select" style="width:100%;">

            <option value="">Select tags</option>

            <option value="Website" selected>Website</option>

            <option value="Social">Social</option>

            <option value="Marketing">Marketing</option>

            <option value="Campaign">Campaign</option>

          </select>

        </div>

      </div>

      <!-- 2. Sharing options card with toggle switches (Screenshot 12.02.38 AM 2) -->

      <div class="create-link-card">

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">

          <h3 style="margin:0;">Sharing options</h3>

          <span style="color:#94a3b8;font-size:16px;">\u2303</span>

        </div>

        <!-- Generate a QR Code toggle -->

        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">

          <div style="display:flex;align-items:center;gap:12px;">

            <span style="font-size:20px;color:#D4FF24;">\u25A6</span>

            <div>

              <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">Generate a QR Code</b>

              <span style="font-size:12px;color:#94a3b8;margin-left:8px;">1 left</span>

            </div>

          </div>

          <label class="app-toggle-switch">

            <input type="checkbox" id="chkGenerateQR" checked>

            <span class="app-toggle-slider"></span>

          </label>

        </div>

        <!-- Add to a HEA Page toggle -->

        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0 0;">

          <div style="display:flex;align-items:center;gap:12px;">

            <span style="font-size:20px;color:#38bdf8;">\u{1F4C4}</span>

            <div>

              <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">Add to a HEA Page</b>

              <div style="font-size:12px;color:#94a3b8;">Feature this link on your Link-in-Bio profile</div>

            </div>

          </div>

          <label class="app-toggle-switch">

            <input type="checkbox" id="chkAddToBio">

            <span class="app-toggle-slider"></span>

          </label>

        </div>

      </div>

      <!-- 3. Advanced settings accordion with crown features (Screenshot 12.02.38 AM 2) -->

      <div class="create-link-card">

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">

          <h3 style="margin:0;">Advanced settings</h3>

          <span style="color:#94a3b8;font-size:16px;">\u2303</span>

        </div>

        <!-- UTM parameters -->

        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">

          <div style="display:flex;align-items:center;gap:12px;">

            <span style="font-size:16px;color:#38bdf8;font-family:monospace;">{ }</span>

            <div>

              <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">UTM parameters</b>

              <span style="color:#fbbf24;font-size:13px;margin-left:6px;">\u{1F451}</span>

            </div>

          </div>

          <label class="app-toggle-switch">
            <input type="checkbox" id="chkUtmParams">
            <span class="app-toggle-slider"></span>
          </label>
        </div>
        <div id="wrapUtmFields" style="display:none;margin-top:12px;padding:12px;background:rgba(0,112,243,0.03);border:1px solid #e2e8f0;border-radius:12px;flex-direction:column;gap:10px;">
          <div>
            <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Campaign Name</label>
            <input type="text" id="newUtmCampaign" placeholder="e.g. spring_launch_2026" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div>
              <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Medium</label>
              <input type="text" id="newUtmMedium" placeholder="e.g. cpc, email, social" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Source</label>
              <input type="text" id="newUtmSource" placeholder="e.g. google, twitter" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
            </div>
          </div>
        </div>

        <!-- Link expiration -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:18px;color:#94a3b8;">\u23F1\uFE0F</span>
            <div>
              <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">Link expiration</b>
              <span style="color:#fbbf24;font-size:13px;margin-left:6px;">\u{1F451}</span>
            </div>
          </div>
          <label class="app-toggle-switch">
            <input type="checkbox" id="chkLinkExpiration">
            <span class="app-toggle-slider"></span>
          </label>
        </div>
        <div id="wrapExpirationFields" style="display:none;margin-top:12px;padding:12px;background:rgba(0,112,243,0.03);border:1px solid #e2e8f0;border-radius:12px;">
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Expiration Date &amp; Time</label>
            <input type="datetime-local" id="newExpiresAt" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Maximum Clicks Limit (optional)</label>
            <input type="number" id="newMaxClicks" min="1" placeholder="e.g. 100" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
          </div>
        </div>

        <!-- Password Protection -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:18px;color:#0070f3;">\u{1F512}</span>
            <div>
              <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">Password protection</b>
              <span style="color:#fbbf24;font-size:13px;margin-left:6px;">\u{1F451}</span>
            </div>
          </div>
          <label class="app-toggle-switch">
            <input type="checkbox" id="chkPasswordProtect">
            <span class="app-toggle-slider"></span>
          </label>
        </div>
        <div id="wrapPasswordFields" style="display:none;margin-top:12px;padding:12px;background:rgba(0,112,243,0.03);border:1px solid #e2e8f0;border-radius:12px;">
          <label style="font-size:12px;font-weight:600;color:#64748b;display:block;margin-bottom:4px;">Link Passcode</label>
          <input type="password" id="newLinkPassword" placeholder="Enter link passcode..." autocomplete="new-password" style="width:100%;height:38px;padding:0 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13px;color:#0b132b;background:#ffffff;">
        </div>

        <!-- Dynamic routing toggle -->

        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:12px 0 0;">

          <div style="display:flex;align-items:flex-start;gap:12px;">

            <span style="font-size:18px;color:#38bdf8;margin-top:2px;">\u{1F500}</span>

            <div>

              <div style="display:flex;align-items:center;gap:6px;">

                <b style="color:#0b132b !important;-webkit-text-fill-color:#0b132b !important;font-size:14px;font-weight:700;">Dynamic routing</b>

                <span style="color:#fbbf24;font-size:13px;">\u{1F451}</span>

              </div>

              <div style="font-size:12px;color:#94a3b8;margin-top:4px;max-width:540px;line-height:1.4;">

                Direct visitors to different destination URLs based on conditions such as device or location. Rules take priority from top to bottom.

              </div>

            </div>

          </div>

          <label class="app-toggle-switch">

            <input type="checkbox" id="chkDynamicRouting">

            <span class="app-toggle-slider"></span>

          </label>

        </div>

      </div>

      <!-- Sticky bottom action bar -->

      <div class="sticky-bottom-actions">

        <button class="sso-btn" style="width:auto;padding:10px 22px;" onclick="window.appShell.navigate('home')">Cancel</button>

        <button class="auth-submit-btn" style="margin:0;padding:10px 26px;" id="btnSubmitNewLink">Create your link</button>

      </div>

    </div>

  `,i("#btnGenerateSlug").onclick=()=>{i("#newBackHalf").value=le(6)};let t=i("#chkUtmParams");t&&(t.onchange=n=>{let c=i("#wrapUtmFields");c&&(c.style.display=n.target.checked?"flex":"none")});let o=i("#chkLinkExpiration");o&&(o.onchange=n=>{let c=i("#wrapExpirationFields");c&&(c.style.display=n.target.checked?"block":"none")});let d=i("#chkPasswordProtect");d&&(d.onchange=n=>{let c=i("#wrapPasswordFields");c&&(c.style.display=n.target.checked?"block":"none")}),i("#btnSubmitNewLink").onclick=async()=>{let n=i("#newDestUrl").value.trim();if(!n){alert("Please enter a destination URL");return}let c=typeof window.canCreateLinkOrQr=="function"?window.canCreateLinkOrQr():{allowed:!0};if(!c.allowed){window.appShell.toast(c.message),typeof window.openCheckoutModal=="function"&&window.openCheckoutModal("pro");return}let s=i("#newDomainSelect").value,a=i("#newBackHalf").value.trim()||le(6),l=i("#newTitle").value.trim()||"Untitled "+new Date().toISOString().slice(0,10),r=i("#newTagsSelect").value||"Website",b=i("#chkGenerateQR").checked,x=i("#chkPasswordProtect")?.checked&&i("#newLinkPassword")?.value.trim()||null,g=i("#chkLinkExpiration")?.checked&&i("#newExpiresAt")?.value||null,h=i("#chkLinkExpiration")?.checked&&i("#newMaxClicks")?.value||null,p=i("#chkUtmParams")?.checked&&i("#newUtmCampaign")?.value.trim()||null,m=i("#chkUtmParams")?.checked&&i("#newUtmSource")?.value.trim()||null,C=i("#chkUtmParams")?.checked&&i("#newUtmMedium")?.value.trim()||null,v=i("#btnSubmitNewLink");v&&(v.disabled=!0,v.textContent="Creating link...");let w=window.location.origin,k=R();if(!k){v&&(v.disabled=!1,v.textContent="Create your link"),window.appShell.toast("Please log in to create links");return}let L=null;try{let y={dest:n,slug:a,title:l,tag:r,qr:b};x&&(y.password=x),g&&(y.expiresAt=g),h&&(y.maxClicks=parseInt(h,10)),(p||m||C)&&(y.utm={campaign:p,source:m,medium:C});let T=await fetch("/api/links",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+k},body:JSON.stringify(y)}),z=await T.json();if(!T.ok){v&&(v.disabled=!1,v.textContent="Create your link"),window.appShell.toast(z.error||"Failed to create link");return}z.link&&(L=pe(z.link))}catch(y){v&&(v.disabled=!1,v.textContent="Create your link"),window.appShell.toast(y.message||"Unable to reach server");return}L&&u.cachedLinks.unshift(L);let f=L&&L.url||`${w}/${a}`;typeof window.recordFreeCreation=="function"&&window.recordFreeCreation(),window.appShell.toast(`Created link: ${f}`),navigator.clipboard.writeText(f).catch(()=>{}),E("links")}}async function me(e,t,o,d={}){let n=typeof window.canCreateLinkOrQr=="function"?window.canCreateLinkOrQr():{allowed:!0};if(!n.allowed)return window.appShell.toast(n.message),typeof window.openCheckoutModal=="function"&&window.openCheckoutModal("pro"),null;let c=t||le(6),s=window.location.origin,a=R();if(!a)return window.appShell.toast("Please log in to create links"),null;let l=d.title||"Untitled "+new Date().toISOString().slice(0,10),r=d.tag||"Website",b={dest:e,slug:c,title:l,tag:r,qr:!0};d.utm&&(b.utm=d.utm);try{let x=await fetch("/api/links",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+a},body:JSON.stringify(b)}),g=await x.json();if(!x.ok||!g.link)return window.appShell.toast(g.error||"Failed to create link"),null;let h=pe(g.link),p=h&&h.url||`${s}/${h.slug}`;return u.cachedLinks.unshift(h),typeof window.recordFreeCreation=="function"&&window.recordFreeCreation(),window.appShell.toast(`Link shortened: ${p}`),navigator.clipboard.writeText(p).catch(()=>{}),u.activeTab!=="home"&&window.location.hash!=="#dashboard"&&window.location.hash!==""&&E("links"),h}catch(x){return window.appShell.toast(x.message||"Unable to reach server"),null}}function De(e){let t=Z(),o=window.location.origin;e.innerHTML=`

    <div class="view-header">
      <div class="header-title-col">
        <div style="display:flex;align-items:center;gap:10px;">
          <h2>Links</h2>
          <span class="view-header-badge" style="background:rgba(10,108,255,0.1);color:#0A6CFF;border:1px solid rgba(10,108,255,0.2);">
            <span>\u{1F517}</span> ${t.length} Active
          </span>
        </div>
        <p class="view-subtitle">
          Manage, customize, and analyze your branded short links with custom back-halves.
        </p>
      </div>
      <div class="header-actions-col">
        <button class="header-primary-btn" onclick="window.appShell.navigate('create-link')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Create link</span>
        </button>
      </div>
    </div>

    <div class="links-filter-bar">
      <div class="links-filter-row">
        <div class="dash-search-box">
          <svg class="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="dash-search-input" id="linksSearchInput" placeholder="Search links by title, slug, tag, or destination..." autocomplete="off">
        </div>

        <select id="linksTagSelect" class="dash-filter-select">
          <option value="">All tags</option>
          <option value="Website">Website</option>
          <option value="Social">Social</option>
          <option value="Campaign">Campaign</option>
        </select>
      </div>

      <div class="links-create-row">
        <button class="header-primary-btn" onclick="window.appShell.navigate('create-link')" style="background:#0A6CFF;color:#ffffff !important;border:none;border-radius:99px;padding:10px 24px;font-size:13.5px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;box-shadow:0 4px 14px rgba(10,108,255,0.25);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span style="color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;font-weight:700;">Create link</span>
        </button>
      </div>
    </div>

    <div id="linksListContainer">

      ${t.length===0?`
        <div class="dash-white-card" style="text-align:center;padding:54px 24px;max-width:620px;margin:24px auto;background:#ffffff;border:1.5px solid #e2e8f0;border-radius:24px;box-shadow:0 10px 30px rgba(0,112,243,0.06);">
          <div style="width:110px;height:110px;margin:0 auto 20px;background:linear-gradient(135deg,rgba(0,112,243,0.08),rgba(0,200,255,0.12));border:2px solid rgba(0,112,243,0.2);border-radius:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(0,112,243,0.1);">
            <span style="font-size:48px;">\u{1F517}</span>
          </div>
          <h3 style="font-size:22px;font-weight:800;color:#0b132b;margin:0 0 8px;letter-spacing:-0.02em;">No links created yet</h3>
          <p style="color:#64748b;font-size:14px;max-width:440px;margin:0 auto 24px;line-height:1.6;">
            Shorten long URLs with custom AI slugs, password protection, and track your visitor analytics in real-time.
          </p>
          <button class="auth-submit-btn" onclick="window.appShell.navigate('create-link')" style="width:auto;display:inline-flex;align-items:center;gap:8px;padding:12px 28px;font-size:14px;font-weight:700;border-radius:9999px;background:#0070f3;color:#ffffff;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(0,112,243,0.3);margin:0 auto;">
            <span>+ Create your first link</span>
          </button>
        </div>
      `:t.map(s=>{let a=s.realShort&&s.realShort!==s.dest&&s.realShort.length<60?s.realShort:`${o}/${s.slug||"lnk"}`,l=a.replace(/^https?:\/\//,"");return`
        <div class="qr-card-item">
          <div style="flex:1;min-width:0;overflow:hidden;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
              <span style="background:rgba(0,112,243,0.08);color:#0070f3;font-weight:700;font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid rgba(0,112,243,0.18);">${s.tag||"Website"}</span>
              ${s.hasPassword?'<span style="background:rgba(239,68,68,0.08);color:#ef4444;font-weight:700;font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid rgba(239,68,68,0.2);">\u{1F512} Passcode</span>':""}
              ${s.expiresAt?'<span style="background:rgba(245,158,11,0.08);color:#d97706;font-weight:700;font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid rgba(245,158,11,0.2);">\u23F3 Expiring</span>':""}
              ${s.maxClicks?`<span style="background:rgba(16,185,129,0.08);color:#059669;font-weight:700;font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid rgba(16,185,129,0.2);">\u{1F3AF} Max ${s.maxClicks}</span>`:""}
              ${s.utm&&(s.utm.campaign||s.utm.source)?`<span style="background:rgba(99,102,241,0.08);color:#6366f1;font-weight:700;font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid rgba(99,102,241,0.2);">\u{1F3F7}\uFE0F ${s.utm.campaign||s.utm.source}</span>`:""}
              <span style="font-size:12px;color:#64748b;">${s.createdAt||"Recent"}</span>
            </div>
            <h4 style="margin:0 0 4px;font-size:16px;color:#0070f3 !important;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;">${s.title||"Untitled Link"}</h4>
            <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;">
              <a href="${a}" target="_blank" rel="noopener" style="color:#0070f3;font-weight:700;font-size:14px;text-decoration:none;" title="Click to open short link">${l} \u2197</a>
            </div>
            ${s.dest?`<div style="font-size:13px;color:#64748b;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;" title="${s.dest}">\u21B3 <a href="${s.dest}" target="_blank" rel="noopener" style="color:#64748b;text-decoration:none;">${s.dest}</a></div>`:""}
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
            <span style="display:none !important;">${typeof s.clicks=="number"?s.clicks:Array.isArray(s.clicks)?s.clicks.length:0} clicks</span>
            <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;" onclick="window.appShell.copy('${a}')">\u{1F4CB} Copy</button>
            <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:12px;" onclick="window.appShell.navigate('qr-detail', '${s.id||s.slug}')">\u25A6 QR</button>
            <button style="background:none;border:0;color:#ef4444;cursor:pointer;font-size:16px;" onclick="window.appShell.deleteLink('${s.id}', '${s.slug}')" title="Delete link">\u{1F5D1}\uFE0F</button>
          </div>
        </div>
        `}).join("")}

    </div>

  `;let d=i("#linksSearchInput"),n=i("#linksTagSelect"),c=()=>{let s=(d?d.value:"").toLowerCase().trim(),a=(n?n.value:"").toLowerCase().trim();$(".qr-card-item").forEach(l=>{let r=l.textContent.toLowerCase(),b=!s||r.includes(s),x=!a||r.includes(a);l.style.display=b&&x?"flex":"none"})};d&&(d.oninput=c),n&&(n.onchange=c)}var Se=J(()=>{K();X()});function _e(e){Ae=e}function Ze(){try{sessionStorage.removeItem("hea_session"),localStorage.removeItem("hea_session"),sessionStorage.removeItem("hea_token"),localStorage.removeItem("hea_token"),localStorage.removeItem("token"),sessionStorage.removeItem("token"),localStorage.removeItem("hea_qrs"),localStorage.removeItem("hea_bios"),localStorage.removeItem("hea_custom_domain")}catch{}}function Et(e){try{if(!e||typeof e!="string")return!0;let t=e.split(".");if(t.length!==3)return!0;let o=t[1].replace(/-/g,"+").replace(/_/g,"/");for(;o.length%4;)o+="=";let d=JSON.parse(atob(o));return!!(!d||d.exp&&Date.now()>=d.exp*1e3)}catch{return!0}}function se(){try{let e=sessionStorage.getItem("hea_session")||localStorage.getItem("hea_session");if(!e)return null;let t=JSON.parse(e),o=t&&t.token||sessionStorage.getItem("hea_token")||localStorage.getItem("hea_token")||"";return!t||!t.isVerified||!t.email||t.email==="john@example.com"||!o||Et(o)?(Ze(),null):t}catch{return Ze(),null}}function It(e){let t=typeof e=="object"&&e||Ae||se();return t?t.role==="admin"||!!t.isAdmin:!1}function de(){try{let e=Ae||se();return!e||!e.email?!1:!!(It(e)||e.isPro||e.isAdmin||e.plan==="Unlimited"||e.plan==="Core PRO"||e.plan==="pro"||e.plan==="enterprise")}catch{return!1}}function Ne(){if(de())return{allowed:!0};if(typeof window<"u"&&window.location&&(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"))return{allowed:!0};let e=parseInt(localStorage.getItem("hea_free_creations")||"0",10);return e>=100?{allowed:!1,count:e,message:"Free plan limit reached. Upgrade to Pro for unlimited creation!"}:{allowed:!0,count:e,remaining:100-e}}function Fe(){if(de())return;let t=parseInt(localStorage.getItem("hea_free_creations")||"0",10)+1;localStorage.setItem("hea_free_creations",t.toString()),t>=100&&setTimeout(()=>{S("\u26A0\uFE0F Free limit reached. Upgrade to Pro for unlimited creation!"),typeof window.openCheckoutModal=="function"&&window.openCheckoutModal("pro")},1500)}function He(){if(de())return{allowed:!0};let e=parseInt(localStorage.getItem("hea_free_chat_count")||"0",10);return e>=5?{allowed:!1,count:e,message:"Free plan limit reached (5/5 AI messages). Upgrade to Pro for unlimited HEA Assist AI messages!"}:{allowed:!0,count:e}}function qe(){if(de())return;let t=parseInt(localStorage.getItem("hea_free_chat_count")||"0",10)+1;localStorage.setItem("hea_free_chat_count",t.toString()),t>=5&&setTimeout(()=>{typeof window.openCheckoutModal=="function"&&window.openCheckoutModal("pro")},1200)}function et(e,t,o="#0e1a33",d="#ffffff",n=256){if(typeof qrcode!="function"||!e)return;let c=qrcode(0,"M");c.addData(t),c.make();let s=c.getModuleCount(),a=2,l=n/(s+2*a);e.width=e.height=n;let r=e.getContext("2d");r.fillStyle=d,r.fillRect(0,0,n,n),r.fillStyle=o;for(let b=0;b<s;b++)for(let x=0;x<s;x++)c.isDark(b,x)&&r.fillRect(Math.floor((a+x)*l),Math.floor((a+b)*l),Math.ceil(l),Math.ceil(l))}function ze(){document.body.classList.add("modal-scroll-lock"),document.documentElement.classList.add("modal-scroll-lock")}function $e(){document.body.classList.remove("modal-scroll-lock"),document.documentElement.classList.remove("modal-scroll-lock")}function Oe(e="pro"){Le=(e||"pro").toLowerCase();let t=i("#checkoutModal");if(!t)return;$('input[name="checkoutPlan"]',t).forEach(n=>{let c=n.closest(".checkout-plan-card");n.value===Le?(n.checked=!0,c?.classList.add("active")):(n.checked=!1,c?.classList.remove("active"))});let d=se();d?(d.name&&i("#payName")&&(i("#payName").value=d.name),d.email&&i("#payEmail")&&(i("#payEmail").value=d.email)):(i("#payName")&&(i("#payName").value=""),i("#payEmail")&&(i("#payEmail").value="")),t.hidden=!1,ze()}function fe(){let e=i("#checkoutModal");e&&(e.hidden=!0,$e())}function tt(){let e=i("#checkoutModal");if(!e)return;i("#checkoutCloseBtn")?.addEventListener("click",fe),e.addEventListener("click",r=>{r.target===e&&fe()}),window.addEventListener("keydown",r=>{r.key==="Escape"&&!e.hidden&&fe()}),e.addEventListener("wheel",r=>r.stopPropagation(),{passive:!0}),e.addEventListener("touchmove",r=>r.stopPropagation(),{passive:!0}),$(".checkout-modal-overlay, .create-modal-overlay").forEach(r=>{r.addEventListener("wheel",b=>b.stopPropagation(),{passive:!0}),r.addEventListener("touchmove",b=>b.stopPropagation(),{passive:!0})});let t=i("#cycleMonthly"),o=i("#cycleAnnual"),d=()=>{let r=Rt[Te];i("#pricePro")&&(i("#pricePro").innerHTML=`${r.pro}<small>/mo</small>`),i("#priceBusiness")&&(i("#priceBusiness").innerHTML=`${r.business}<small>/mo</small>`),i("#priceEnterprise")&&(i("#priceEnterprise").innerHTML=`${r.enterprise}<small>/mo</small>`)};t?.addEventListener("click",()=>{Te="monthly",t.classList.add("active"),o?.classList.remove("active"),d()}),o?.addEventListener("click",()=>{Te="annual",o.classList.add("active"),t?.classList.remove("active"),d()}),$(".checkout-plan-card",e).forEach(r=>{r.addEventListener("click",()=>{$(".checkout-plan-card",e).forEach(x=>x.classList.remove("active")),r.classList.add("active");let b=r.querySelector('input[type="radio"]');b&&(b.checked=!0,Le=b.value)})});let n=i("#payCardNum");n&&n.addEventListener("input",r=>{let b=r.target.value.replace(/\D/g,"").slice(0,16);b=b.replace(/(\d{4})(?=\d)/g,"$1 "),r.target.value=b;let x=i("#payCardBrand");x&&(/^4/.test(b)?x.textContent="VISA":/^5[1-5]/.test(b)?x.textContent="MC":/^3[47]/.test(b)?x.textContent="AMEX":x.textContent="CARD")});let c=i("#payExp");c&&c.addEventListener("input",r=>{let b=r.target.value.replace(/\D/g,"").slice(0,4);b.length>2&&(b=b.slice(0,2)+" / "+b.slice(2)),r.target.value=b});let s=i("#checkoutPaymentForm");s&&s.addEventListener("submit",r=>{r.preventDefault();let b=i("#btnStripeCheckout");b?b.click():S("Checkout requires Stripe gateway configuration.")});let a=i("#btnStripeCheckout");a&&a.addEventListener("click",async()=>{let r=a.innerHTML;a.disabled=!0,a.innerHTML="<span>\u23F3 Connecting to Stripe Secure Gateway...</span>";let b=se(),x=i("#payEmail")?.value.trim()||b&&b.email||"",g=i("#payName")?.value.trim()||b&&b.name||"";try{let p=await(await fetch("/api/stripe/create-checkout-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan:Le,billingCycle:Te,userEmail:x,userName:g})})).json();if(p.url){window.location.href=p.url;return}S(p.error||"Unable to connect to Stripe. Please try again.")}catch{S("Connection error. Please try again.")}finally{a.disabled=!1,a.innerHTML=r}}),setTimeout(async()=>{let r=window.location.hash||"";if(!r.includes("checkout-success"))return;let b=new URLSearchParams(r.split("?")[1]||""),x=b.get("session_id"),g=b.get("plan")||"Core PRO";if(x)try{let p=await(await fetch(`/api/stripe/verify-session/${encodeURIComponent(x)}`)).json();if(p.ok&&p.verified){let m=se()||{email:p.userEmail,isVerified:!0};m.isPro=!0,m.plan=p.plan||g,m.subscribedAt=new Date().toISOString(),Bt.set("hea_session",m),Ut.set("hea_session",m),window.appShell&&typeof ve=="function"&&ve(m.plan),S(`\u{1F389} Payment Confirmed by Stripe! Your ${m.plan} subscription is active!`),window.location.hash="#dashboard"}}catch{}},400)}var Ae,Bt,Ut,Te,Le,Rt,xe=J(()=>{K();Ae=null;Bt={get(e,t){try{return JSON.parse(localStorage.getItem(e))??t}catch{return t}},set(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}},Ut={get(e,t){try{return JSON.parse(sessionStorage.getItem(e))??t}catch{return t}},set(e,t){try{t===null?(sessionStorage.removeItem(e),localStorage.removeItem(e)):sessionStorage.setItem(e,JSON.stringify(t))}catch{}}};Ae=se();window.isUserPro=de;window.canCreateLinkOrQr=Ne;window.recordFreeCreation=Fe;window.canChatWithAssist=He;window.recordFreeChat=qe;window.lockModalScroll=ze;window.unlockModalScroll=$e;Te="monthly",Le="pro",Rt={monthly:{growth:"Rs 1,499",pro:"Rs 1,499",business:"Rs 4,999",enterprise:"Rs 29,999"},annual:{growth:"Rs 1,199",pro:"Rs 1,199",business:"Rs 3,999",enterprise:"Rs 23,999"}};window.openCheckoutModal=Oe;window.closeCheckoutModal=fe});function Pe(e){let t="link",o="7d",d=typeof Intl<"u"&&Intl.DateTimeFormat&&Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";window.__heaLivePollTimer&&(clearInterval(window.__heaLivePollTimer),window.__heaLivePollTimer=null);let n=new Date().getHours(),c=n<12?"Good morning":n<18?"Good afternoon":"Good evening",s=(u.appUser.name||"Account").split(" ")[0];e.innerHTML=`
    <div class="dashboard-v2-container">
      
      <!-- ====================================================
           1. TOP KPI STAT CARDS (4 Columns)
           ==================================================== -->
      <div class="dash-kpi-grid">
        
        <!-- KPI 1: Total Links -->
        <div class="kpi-card" id="kpiCardLinks">
          <div class="kpi-left-group">
            <div class="kpi-icon-box" style="background:#e0f2fe;color:#0284c7;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">Total Links</span>
              <div class="kpi-value-row">
                <span class="kpi-value" id="kpiTotalLinksVal">0</span>
                <span class="kpi-trend" id="kpiTotalLinksTrend">\u2014</span>
              </div>
            </div>
          </div>
          <div class="kpi-sparkline" id="kpiTotalLinksSparkline">
            <svg width="68" height="28" viewBox="0 0 68 28" fill="none">
              <path d="M2 22 Q 18 28, 30 16 T 50 12 T 66 4" stroke="#0A6CFF" stroke-width="2.6" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- KPI 2: Total Clicks -->
        <div class="kpi-card" id="kpiCardClicks">
          <div class="kpi-left-group">
            <div class="kpi-icon-box" style="background:#f3e8ff;color:#9333ea;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">Total Clicks</span>
              <div class="kpi-value-row">
                <span class="kpi-value" id="kpiTotalClicksVal">0</span>
                <span class="kpi-trend" id="kpiTotalClicksTrend">\u2014</span>
              </div>
            </div>
          </div>
          <div class="kpi-sparkline" id="kpiTotalClicksSparkline">
            <svg width="68" height="28" viewBox="0 0 68 28" fill="none">
              <path d="M2 24 Q 18 16, 32 20 T 52 14 T 66 8" stroke="#a855f7" stroke-width="2.6" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- KPI 3: Unique Visitors -->
        <div class="kpi-card" id="kpiCardVisitors">
          <div class="kpi-left-group">
            <div class="kpi-icon-box" style="background:#dcfce7;color:#16a34a;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"></line><line x1="12" x2="12" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="14"></line></svg>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">Unique Visitors</span>
              <div class="kpi-value-row">
                <span class="kpi-value" id="kpiUniqueVisitorsVal">0</span>
                <span class="kpi-trend" id="kpiUniqueVisitorsTrend">\u2014</span>
              </div>
            </div>
          </div>
          <div class="kpi-sparkline" id="kpiUniqueVisitorsSparkline">
            <svg width="68" height="28" viewBox="0 0 68 28" fill="none">
              <path d="M2 22 Q 18 25, 30 14 T 50 16 T 66 6" stroke="#10b981" stroke-width="2.6" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- KPI 4: Top Performer -->
        <div class="kpi-card" id="kpiCardTopPerformer">
          <div class="kpi-left-group">
            <div class="kpi-icon-box" style="background:#fef3c7;color:#d97706;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <div class="kpi-meta">
              <span class="kpi-label">Top Performer</span>
              <div class="kpi-value-row">
                <span class="kpi-value" id="kpiTopPerformerVal">0</span>
                <span class="kpi-trend" id="kpiTopPerformerTrend">\u2014</span>
              </div>
            </div>
          </div>
          <div class="kpi-sparkline" id="kpiTopPerformerSparkline">
            <svg width="68" height="28" viewBox="0 0 68 28" fill="none">
              <path d="M2 20 Q 16 12, 30 22 T 50 14 T 66 8" stroke="#f59e0b" stroke-width="2.6" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

      </div>

      <!-- ====================================================
           2. MIDDLE HERO ROW (Hero Shortener + Calendar/Velocity)
           ==================================================== -->
      <div class="dash-hero-grid">
        
        <!-- Left: Hero Shortener Card -->
        <div class="hero-shorten-card">
          <div class="hero-top-badges">
            <div class="live-activity-pill" id="homeLivePill">
              <span class="live-dot" id="homeLiveDot"></span>
              <span class="live-text" id="homeLiveText">Live Activity \xB7 Real-time telemetry</span>
              <div class="live-avatars" id="homeLiveAvatars" style="display:none;"></div>
              <span class="live-more-text" id="homeLiveMoreText" style="display:none;"></span>
            </div>
            <div class="core-pro-badge" id="homePlanBadge" onclick="window.openCheckoutModal && window.openCheckoutModal('pro')" style="cursor:pointer;">
              <span>\u{1F451}</span> Pro Active
            </div>
          </div>

          <div class="hero-main-row">
            <div class="hero-text-block">
              <h2 class="hero-greeting-title">${c}, ${s}! \u{1F680}</h2>
              <p class="hero-greeting-sub">Shorten your links, track performance and grow your audience with ease.</p>
            </div>
            
            <!-- 3D Glossy Blue Chain Link Illustration -->
            <div class="hero-3d-graphic-wrap" aria-hidden="true">
              <svg width="170" height="150" viewBox="0 0 170 150" fill="none">
                <defs>
                  <linearGradient id="linkBody3D" x1="20" y1="20" x2="150" y2="130" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#38bdf8"/>
                    <stop offset="35%" stop-color="#0A6CFF"/>
                    <stop offset="70%" stop-color="#0284c7"/>
                    <stop offset="100%" stop-color="#1e3a8a"/>
                  </linearGradient>
                  <linearGradient id="linkSpec3D" x1="40" y1="30" x2="140" y2="110" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
                    <stop offset="35%" stop-color="#ffffff" stop-opacity="0.25"/>
                    <stop offset="70%" stop-color="#38bdf8" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <!-- Base Ambient Drop Shadow -->
                <ellipse cx="85" cy="130" rx="55" ry="14" fill="rgba(10, 108, 255, 0.22)" filter="blur(6px)"/>
                <!-- 3D Tilted Torus / Chain Ring -->
                <g transform="rotate(-28 85 75)">
                  <path d="M 42 42 C 42 22, 62 14, 88 14 C 114 14, 134 22, 134 42 L 134 102 C 134 122, 114 130, 88 130 C 62 130, 42 122, 42 102 Z" 
                        stroke="url(#linkBody3D)" stroke-width="26" stroke-linejoin="round" fill="none"/>
                  <path d="M 44 44 C 44 26, 64 18, 88 18 C 112 18, 132 26, 132 44 L 132 68" 
                        stroke="url(#linkSpec3D)" stroke-width="7" stroke-linecap="round" fill="none"/>
                </g>
                <!-- Floating 3D Accent Sparks -->
                <rect x="24" y="42" width="11" height="4" rx="2" fill="#818cf8" transform="rotate(-35 24 42)"/>
                <circle cx="16" cy="60" r="2.5" fill="#38bdf8"/>
                <rect x="142" y="24" width="10" height="3.5" rx="1.75" fill="#60a5fa" transform="rotate(25 142 24)"/>
                <circle cx="156" cy="52" r="2.5" fill="#a855f7"/>
                <rect x="150" y="68" width="11" height="3.5" rx="1.75" fill="#38bdf8" transform="rotate(-15 150 68)"/>
                <circle cx="32" cy="102" r="2.5" fill="#60a5fa"/>
              </svg>
            </div>
          </div>

          <!-- Toggle Tabs (Short Link vs Vector QR) -->
          <div class="hero-type-pills">
            <button type="button" class="hero-type-pill active" id="tabShortLinkOpt">
              <span>\u{1F517}</span> Short link &amp; URL
            </button>
            <button type="button" class="hero-type-pill" id="tabQrCodeOpt">
              <span>\u25A6</span> Vector QR Code
            </button>
          </div>

          <!-- Shorten Input Box -->
          <form id="homeShortenForm" class="hero-shorten-form-wrap">
            <span class="hero-input-icon" id="homeInputIcon">\u{1F517}</span>
            <input type="url" id="homeShortenInput" class="hero-shorten-input" placeholder="Paste destination URL to generate a short link..." required autocomplete="off">
            <button type="submit" class="hero-submit-btn" id="homeSubmitBtn">
              <span>Create Now</span> \u2192
            </button>
          </form>

          <div id="homeShortenResult" class="home-shorten-result" style="display:none;margin-bottom:14px;"></div>

          <!-- Quick Actions Line -->
          <div class="hero-quick-actions-row">
            <span class="hero-quick-label">Quick actions:</span>
            <button type="button" class="hero-action-pill" onclick="if(window.appShell) window.appShell.openCreateModal('link')">
              <span style="color:#f59e0b;">\u26A1</span> Customize Link
            </button>
            <button type="button" class="hero-action-pill" onclick="if(window.appShell) window.appShell.navigate('qr')">
              <span style="color:#d97706;">\u{1F3A8}</span> Custom QR Design
            </button>
            <button type="button" class="hero-action-pill" onclick="if(window.appShell) window.appShell.navigate('pages')">
              <span style="color:#0284c7;">\u{1F4C4}</span> New Bio Page
            </button>
          </div>
        </div>

        <!-- Right: Stacked Calendar & Velocity Widgets -->
        <div class="dash-right-stack">
          
          <!-- Widget 1: Calendar Week -->
          <div class="calendar-widget-card" id="homeCalendarWidget">
            <div class="widget-header-row">
              <div class="widget-title" id="homeCalTitle">\u{1F4C5} Calendar</div>
              <button type="button" class="widget-dropdown-btn">Current Week \u02C7</button>
            </div>
            <div class="cal-week-grid" id="homeCalGrid">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- Widget 2: Visitor Velocity Chart -->
          <div class="velocity-widget-card" id="homeVelocityWidget">
            <div class="widget-header-row">
              <div class="widget-title">\u{1F4C8} Visitor Velocity</div>
              <span id="homeVelocityTrendBadge" style="background:#e2e8f0;color:#64748b;padding:3px 8px;border-radius:9999px;font-size:11.5px;font-weight:700;">\u2014</span>
            </div>
            
            <!-- SVG Velocity Chart with Axes & Peak Tooltip -->
            <div class="velocity-chart-wrap" id="homeVelocityChartWrap">
              <div id="homeVelocityTooltip" style="display:none;position:absolute;background:#0f172a;color:#ffffff;padding:2px 7px;border-radius:6px;font-size:10px;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,0.2);z-index:2;transform:translateX(-50%);">
                0
              </div>
              <svg width="100%" height="95" viewBox="0 0 340 95" fill="none" preserveAspectRatio="none" id="homeVelocitySvg">
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#0A6CFF" stop-opacity="0.32"/>
                    <stop offset="100%" stop-color="#0A6CFF" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>
                <line x1="28" y1="18" x2="335" y2="18" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="28" y1="40" x2="335" y2="40" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="28" y1="62" x2="335" y2="62" stroke="#f1f5f9" stroke-width="1"/>
                <line x1="28" y1="80" x2="335" y2="80" stroke="#f1f5f9" stroke-width="1"/>
                <path id="homeVelocityArea" d="" fill="url(#velocityGrad)"/>
                <path id="homeVelocityLine" d="" stroke="#0A6CFF" stroke-width="2.6" stroke-linecap="round" fill="none"/>
                <g id="homeVelocityDots"></g>
              </svg>
              <div id="homeVelocityXAxis" style="display:flex;justify-content:space-between;padding:0 4px 0 28px;margin-top:2px;"></div>
            </div>

          </div>

        </div>

      </div>

      <!-- ====================================================
           3. BOTTOM ROW (Overview + Recent Links + Top Referrers)
           ==================================================== -->
      <div class="dash-bottom-grid">
        
        <!-- Card 1: Overview (Metrics Summary) -->
        <div class="bottom-widget-card" id="homeOverviewCard">
          <div class="widget-header-row">
            <div class="widget-title">\u{1F4CA} Overview</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <select id="homeOverviewRangeSelect" class="widget-dropdown-btn" style="cursor:pointer;border:none;background:rgba(0,112,243,0.06);color:#0A6CFF;font-weight:700;border-radius:8px;padding:4px 8px;font-size:12px;">
                <option value="24h">Last 24 Hours</option>
                <option value="7d" selected>Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
          <div class="overview-stats-grid">
            <!-- Visitors -->
            <div class="overview-col">
              <div class="overview-icon-badge" style="background:#e0f2fe;color:#0284c7;">\u{1F441}\uFE0F</div>
              <span class="overview-num" id="overviewVisitorsNum">0</span>
              <span class="overview-lbl">Visitors</span>
              <span class="overview-pct" id="overviewVisitorsPct">\u2014</span>
            </div>
            <!-- Clicks -->
            <div class="overview-col">
              <div class="overview-icon-badge" style="background:#f3e8ff;color:#9333ea;">\u{1F517}</div>
              <span class="overview-num" id="overviewClicksNum">0</span>
              <span class="overview-lbl">Clicks</span>
              <span class="overview-pct" id="overviewClicksPct">\u2014</span>
            </div>
            <!-- Links -->
            <div class="overview-col">
              <div class="overview-icon-badge" style="background:#dcfce7;color:#16a34a;">\u26D3\uFE0F</div>
              <span class="overview-num" id="overviewLinksNum">0</span>
              <span class="overview-lbl">Links</span>
              <span class="overview-pct" id="overviewLinksPct">\u2014</span>
            </div>
            <!-- Avg Clicks / Link -->
            <div class="overview-col">
              <div class="overview-icon-badge" style="background:#fef3c7;color:#d97706;">\u26A1</div>
              <span class="overview-num" id="overviewAvgClicksNum">0</span>
              <span class="overview-lbl">Avg. clicks / link</span>
              <span class="overview-pct" id="overviewAvgClicksPct">\u2014</span>
            </div>
          </div>
        </div>

        <!-- Card 2: Recent Links -->
        <div class="bottom-widget-card" id="homeRecentLinksCard">
          <div class="widget-header-row">
            <div class="widget-title">\u{1F517} Recent Links</div>
            <a href="#links" class="view-all-link" onclick="window.appShell && window.appShell.navigate('links'); return false;">View All \u2192</a>
          </div>
          
          <div class="recent-links-list" id="homeRecentLinksList">
            <div style="text-align:center;padding:32px 16px;color:#64748b;font-size:13px;">
              <div style="font-size:24px;margin-bottom:8px;">\u{1F517}</div>
              <b>No links created yet</b>
              <p style="margin:4px 0 12px;font-size:12px;">Create your first link using the shortener above.</p>
            </div>
          </div>
        </div>

        <!-- Card 3: Top Referrers -->
        <div class="bottom-widget-card" id="homeReferrersCard">
          <div class="widget-header-row">
            <div class="widget-title">\u{1F465} Top Referrers</div>
            <a href="#analytics" class="view-all-link" onclick="window.appShell && window.appShell.navigate('analytics'); return false;">View All \u2192</a>
          </div>
          
          <div class="referrers-body" id="homeReferrersBody">
            <div style="text-align:center;padding:32px 16px;color:#64748b;font-size:13px;width:100%;">
              <div style="font-size:24px;margin-bottom:8px;">\u{1F465}</div>
              <b>No referrer telemetry yet</b>
              <p style="margin:4px 0;font-size:12px;">Share your short links to start tracking traffic channels.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  `;async function a(k=o){o=k;let L=function(){try{return JSON.parse(localStorage.getItem("hea_session")||"{}").token||localStorage.getItem("hea_token")||sessionStorage.getItem("hea_token")||""}catch{return""}}(),f={"Content-Type":"application/json"};L&&(f.Authorization="Bearer "+L);try{let y=await fetch(`/api/dashboard/summary?range=${encodeURIComponent(k)}&tz=${encodeURIComponent(d)}`,{headers:f});if(!y.ok)return;let T=await y.json();l(T)}catch(y){console.warn("[Dashboard] Summary fetch error:",y)}}function l(k){if(!k)return;let L=k.totals||{},f=k.trends||{},y=i("#kpiTotalLinksVal");y&&(y.textContent=je(L.links||0));let T=i("#kpiTotalLinksTrend");T&&(T.textContent=re(f.linksPct));let z=i("#kpiTotalClicksVal");z&&(z.textContent=ie(L.humanClicks||0));let U=i("#kpiTotalClicksTrend");U&&(U.textContent=re(f.clicksPct));let _=i("#kpiUniqueVisitorsVal");_&&(_.textContent=ie(L.uniqueVisitors||0));let I=i("#kpiUniqueVisitorsTrend");I&&(I.textContent=re(f.visitorsPct));let O=i("#kpiTopPerformerVal");if(O)if(k.topPerformer&&k.topPerformer.clicks>0){O.textContent=ie(k.topPerformer.clicks);let Y=O.closest(".kpi-card");Y&&(Y.title=`${k.topPerformer.title||k.topPerformer.slug} (${k.topPerformer.clicks} clicks)`)}else O.textContent="0";let N=i("#kpiTopPerformerTrend");N&&(N.textContent=k.topPerformer&&k.topPerformer.clicks>0?k.topPerformer.slug||"Top":"\u2014");let M=i("#homePlanBadge");M&&k.plan&&(k.plan.isPaid?(M.innerHTML=`<span>\u{1F451}</span> ${k.plan.badge||k.plan.name}`,M.style.background="",M.style.color="",M.style.borderColor=""):(M.innerHTML="<span>\u26A1</span> Free Plan \xB7 Upgrade",M.style.background="#f1f5f9",M.style.color="#475569",M.style.borderColor="#cbd5e1"));let F=k.activeNow&&k.activeNow.visitors?k.activeNow.visitors:0,q=i("#homeLiveDot"),V=i("#homeLiveText"),P=i("#homeLiveAvatars"),A=i("#homeLiveMoreText");V&&(F>0?(V.textContent=`Live Activity \xB7 ${F} visitor${F===1?"":"s"} right now`,q&&(q.style.background="#10b981"),P&&(P.style.display="flex",P.innerHTML=`
            <div class="live-avatar-item" style="background:#0A6CFF;">V1</div>
            ${F>1?'<div class="live-avatar-item" style="background:#7928ca;">V2</div>':""}
            ${F>2?'<div class="live-avatar-item" style="background:#10b981;">V3</div>':""}
          `),A&&F>3?(A.style.display="inline",A.textContent=`+${F-3} more`):A&&(A.style.display="none")):(V.textContent="Live Activity \xB7 No active visitors right now",q&&(q.style.background="#94a3b8"),P&&(P.style.display="none"),A&&(A.style.display="none"))),r(k.timeseries||[]),b(k.timeseries||[],k.peak,f.clicksPct);let D=i("#overviewVisitorsNum");D&&(D.textContent=ie(L.uniqueVisitors||0));let G=i("#overviewVisitorsPct");G&&(G.textContent=re(f.visitorsPct));let te=i("#overviewClicksNum");te&&(te.textContent=ie(L.humanClicks||0));let oe=i("#overviewClicksPct");oe&&(oe.textContent=re(f.clicksPct));let B=i("#overviewLinksNum");B&&(B.textContent=je(L.links||0));let j=i("#overviewLinksPct");j&&(j.textContent=re(f.linksPct));let H=i("#overviewAvgClicksNum");H&&(H.textContent=String(L.avgClicksPerLink||0));let Q=i("#overviewAvgClicksPct");Q&&(Q.textContent=L.links>0?"avg/link":"\u2014"),x(k.recentLinks||[]),g(k.referrers||[],L.humanClicks||0)}function r(k){let L=new Date,f=i("#homeCalTitle");if(f){let N=L.toLocaleString("en-US",{month:"long",year:"numeric"});f.textContent=`\u{1F4C5} ${N}`}let y=i("#homeCalGrid");if(!y)return;let T=new Date,U=(T.getDay()+6)%7,_=new Date(T);_.setDate(T.getDate()-U);let I=["MON","TUE","WED","THU","FRI","SAT","SUN"],O="";for(let N=0;N<7;N++){let M=new Date(_);M.setDate(_.getDate()+N);let F=M.toDateString()===T.toDateString(),q=M.getFullYear(),V=String(M.getMonth()+1).padStart(2,"0"),P=String(M.getDate()).padStart(2,"0"),A=`${q}-${V}-${P}`,D=k.find(te=>te.date&&te.date.startsWith(A)),G=D&&D.clicks||0;O+=`
        <div class="cal-day-col ${F?"active":""}" data-date="${A}" title="${G} click${G===1?"":"s"}" style="cursor:pointer;" onclick="this.parentElement.querySelectorAll('.cal-day-col').forEach(c => c.classList.remove('active')); this.classList.add('active');">
          <span class="cal-day-name">${I[N]}</span>
          <span class="cal-day-number">${M.getDate()}</span>
          <span style="font-size:9px;color:${F?"#ffffff":"#94a3b8"};font-weight:700;margin-top:2px;">${G>0?ie(G):"0"}</span>
        </div>
      `}y.innerHTML=O}function b(k,L,f){let y=i("#homeVelocityTrendBadge");if(y){let B=re(f);y.textContent=B,f!=null&&!isNaN(f)?(y.style.background=f>=0?"#dcfce7":"#fee2e2",y.style.color=f>=0?"#16a34a":"#dc2626"):(y.style.background="#e2e8f0",y.style.color="#64748b")}let T=i("#homeVelocityArea"),z=i("#homeVelocityLine"),U=i("#homeVelocityDots"),_=i("#homeVelocityXAxis"),I=i("#homeVelocityTooltip");if(!k||k.length===0){z&&z.setAttribute("d","M 38 80 L 325 80"),T&&T.setAttribute("d",""),U&&(U.innerHTML=""),_&&(_.innerHTML='<span style="font-size:9.5px;color:#94a3b8;">No data for period</span>'),I&&(I.style.display="none");return}let O=Math.max(L?L.clicks:0,5),N=38,M=325,F=18,q=80,V=M-N,P=q-F,A=k.map((B,j)=>{let H=N+j/Math.max(k.length-1,1)*V,Q=B.clicks||0,Y=q-Q/O*P;return{x:H,y:Y,label:B.label||B.date,clicks:Q}}),D=`M ${A[0].x.toFixed(1)} ${A[0].y.toFixed(1)}`;for(let B=1;B<A.length;B++){let j=A[B-1],H=A[B],Q=j.x+(H.x-j.x)/2,Y=j.y,ne=j.x+(H.x-j.x)/2,ae=H.y;D+=` C ${Q.toFixed(1)} ${Y.toFixed(1)}, ${ne.toFixed(1)} ${ae.toFixed(1)}, ${H.x.toFixed(1)} ${H.y.toFixed(1)}`}let G=A[A.length-1],te=`${D} L ${G.x.toFixed(1)} ${q} L ${A[0].x.toFixed(1)} ${q} Z`;z&&z.setAttribute("d",D),T&&T.setAttribute("d",te);let oe="";if(A.forEach((B,j)=>{let H=L&&L.index===j&&B.clicks>0;oe+=`
        <circle cx="${B.x.toFixed(1)}" cy="${B.y.toFixed(1)}" r="${H?"4.5":"3"}" fill="#0A6CFF" stroke="#ffffff" stroke-width="${H?"2":"1.5"}">
          <title>${B.label}: ${B.clicks} clicks</title>
        </circle>
      `}),U&&(U.innerHTML=oe),I)if(L&&L.clicks>0&&A[L.index]){let B=A[L.index],j=(B.x/340*100).toFixed(1);I.style.left=`${j}%`,I.style.top=`${Math.max(B.y-20,2).toFixed(1)}px`,I.textContent=ie(L.clicks),I.style.display="block"}else I.style.display="none";if(_){let B="",j=Math.ceil(A.length/7);for(let H=0;H<A.length;H+=j){let Q=A[H],Y=L&&L.index===H&&Q.clicks>0;B+=`<span style="font-size:9px;color:${Y?"#0A6CFF":"#94a3b8"};font-weight:${Y?"800":"600"};">${Q.label}</span>`}_.innerHTML=B}}function x(k){let L=i("#homeRecentLinksList");if(!L)return;if(!k||k.length===0){L.innerHTML=`
        <div style="text-align:center;padding:32px 16px;color:#64748b;font-size:13px;">
          <div style="font-size:24px;margin-bottom:8px;">\u{1F517}</div>
          <b>No links created yet</b>
          <p style="margin:4px 0 12px;font-size:12px;">Create your first link using the shortener above.</p>
        </div>
      `;return}let f="";k.slice(0,5).forEach(y=>{let T=y.dest||"",z=y.shortUrl||`/${y.slug}`,U=z.replace(/^https?:\/\//,""),_=y.clicks||0,I="M 2 14 L 40 14";if(Array.isArray(y.sparkline)&&y.sparkline.length>1){let O=Math.max(...y.sparkline,1);I="M "+y.sparkline.map((M,F)=>{let q=2+F/(y.sparkline.length-1)*38,V=16-M/O*12;return`${q.toFixed(1)} ${V.toFixed(1)}`}).join(" L ")}f+=`
        <div class="recent-link-row-item">
          <div class="recent-left-meta">
            <div class="recent-link-icon-box">\u{1F517}</div>
            <div class="recent-link-titles">
              <span class="recent-dest-title" title="${T}">${T}</span>
              <a href="${z}" target="_blank" rel="noopener" class="recent-short-slug">${U}</a>
            </div>
          </div>
          <div class="recent-right-telemetry">
            <span class="recent-click-count">${ie(_)} click${_===1?"":"s"}</span>
            <svg width="42" height="18" viewBox="0 0 42 18" fill="none">
              <path d="${I}" stroke="#10b981" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <button type="button" class="recent-more-btn" title="Copy Link" onclick="window.appShell && window.appShell.copy('${z}')">\u{1F4CB}</button>
          </div>
        </div>
      `}),L.innerHTML=f}function g(k,L){let f=i("#homeReferrersBody");if(!f)return;if(!k||k.length===0||L===0){f.innerHTML=`
        <div style="text-align:center;padding:32px 16px;color:#64748b;font-size:13px;width:100%;">
          <div style="font-size:24px;margin-bottom:8px;">\u{1F465}</div>
          <b>No referrer telemetry yet</b>
          <p style="margin:4px 0;font-size:12px;">Share your short links to start tracking traffic channels.</p>
        </div>
      `;return}let y=["#0A6CFF","#a855f7","#10b981","#f59e0b","#64748b"],T=2*Math.PI*36,z=0,U="",_="";k.forEach((O,N)=>{let M=y[N%y.length],F=Math.max(0,Math.min(100,Number(O.percent)||0)),q=F/100*T,V=T-q;U+=`
        <circle cx="50" cy="50" r="36" stroke="${M}" stroke-width="14" fill="none"
                stroke-dasharray="${q.toFixed(1)} ${V.toFixed(1)}" stroke-dashoffset="${(-z).toFixed(1)}"/>
      `,z+=q,_+=`
        <div class="legend-item">
          <div class="legend-left">
            <span class="legend-dot" style="background:${M};"></span>
            <span>${O.name||"Direct"}</span>
          </div>
          <span class="legend-val">${F}%</span>
        </div>
      `});let I=k[0]||{name:"Direct",percent:100};f.innerHTML=`
      <div class="donut-chart-box">
        <svg width="100" height="100" viewBox="0 0 100 100" style="transform:rotate(-90deg);">
          <circle cx="50" cy="50" r="36" stroke="#f1f5f9" stroke-width="14" fill="none"/>
          ${U}
        </svg>
        <div class="donut-center-info">
          <span class="donut-pct-bold">${I.percent}%</span>
          <span class="donut-pct-label">${I.name}</span>
        </div>
      </div>

      <div class="referrers-legend-list">
        ${_}
      </div>
    `}let h=i("#homeOverviewRangeSelect");h&&(h.value=o,h.onchange=k=>{a(k.target.value)}),a(o),window.__heaLivePollTimer=setInterval(()=>{document.body.contains(e)?a(o):(clearInterval(window.__heaLivePollTimer),window.__heaLivePollTimer=null)},2e4);let p=i("#tabShortLinkOpt"),m=i("#tabQrCodeOpt"),C=i("#homeShortenInput"),v=i("#homeInputIcon");p&&m&&C&&(p.onclick=()=>{t="link",p.classList.add("active"),m.classList.remove("active"),C.placeholder="Paste destination URL to generate a short link...",v&&(v.textContent="\u{1F517}")},m.onclick=()=>{t="qr",m.classList.add("active"),p.classList.remove("active"),C.placeholder="Enter a URL to create a Vector QR Code...",v&&(v.textContent="\u25A6")});let w=i("#homeShortenForm");w&&(w.onsubmit=async k=>{k.preventDefault();let L=i("#homeShortenInput").value.trim(),f=typeof window<"u"&&window.location?window.location.host:"healink.store";if(!L)return;let y=i("#homeSubmitBtn");y&&(y.disabled=!0,y.innerHTML="<span>Creating...</span>");try{if(t==="qr"){let T=await me(L,"",f),z=T&&T.id||"lnk_"+Date.now();E("qr-detail",z)}else{let T=await me(L,"",f),z=i("#homeShortenResult");if(z&&T){let U=T.realShort&&T.realShort!==L?T.realShort:T.url&&T.url!==L?T.url:`${window.location.protocol}//${f}/${T.slug}`;z.innerHTML=`
              <div style="background:#ffffff;border:1px solid #bfdbfe;border-radius:14px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 2px 10px rgba(10,108,255,0.08);">
                <div style="min-width:0;">
                  <div style="font-size:11px;font-weight:700;color:#0284c7;text-transform:uppercase;">Live Short Link Ready</div>
                  <a href="${U}" target="_blank" rel="noopener" style="font-size:13.5px;font-weight:700;color:#0A6CFF;text-decoration:none;">${U}</a>
                </div>
                <div style="display:flex;gap:8px;flex-shrink:0;">
                  <button type="button" onclick="window.appShell && window.appShell.copy('${U}')" style="background:#0A6CFF;color:#ffffff;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">Copy</button>
                  <a href="${U}" target="_blank" rel="noopener" style="background:#f1f5f9;color:#334155;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;text-decoration:none;display:inline-block;">Visit \u2197</a>
                </div>
              </div>
            `,z.style.display="block",i("#homeShortenInput")&&(i("#homeShortenInput").value=""),a(o)}}}finally{y&&(y.disabled=!1,y.innerHTML="<span>Create Now</span> \u2192")}})}var it=J(()=>{K();X();Se();xe()});function ye(e,t){let o=window.location.origin,d=Z(),n=t||(d.length===0?"empty":"list");function c(){if(n==="empty"){e.innerHTML=`

        <div class="view-header">
          <div class="header-title-col">
            <div style="display:flex;align-items:center;gap:10px;">
              <h2>QR Codes</h2>
              <span class="view-header-badge" style="background:rgba(16,185,129,0.1);color:#059669;border:1px solid rgba(16,185,129,0.25);">
                <span>\u25A6</span> Dynamic Vector
              </span>
            </div>
            <p class="view-subtitle">
              Design dynamic vector QR codes with custom colors, embedded logos, and real-time scan analytics.
            </p>
          </div>
          <div class="header-actions-col">
            <button class="header-secondary-btn" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:12px;border:1px solid #cbd5e1;background:#ffffff;font-size:13px;font-weight:700;cursor:pointer;" id="btnViewAllQr">
              View All Codes (${d.length})
            </button>
          </div>
        </div>

        <!-- Empty / Welcome State matching Frame 8 -->

        <div class="dash-white-card" style="text-align:center;padding:60px 20px;max-width:680px;margin:20px auto;">

          <div style="width:140px;height:140px;margin:0 auto 24px;background:rgba(56,189,248,0.06);border:2px solid rgba(56,189,248,0.25);border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(56,189,248,0.15);">

            <span style="font-size:52px;color:#38bdf8;">\u25A6</span>

            <span style="font-size:11px;font-weight:800;letter-spacing:1px;color:#D4FF24;margin-top:4px;">SCAN ME</span>

          </div>

          <h3 style="font-size:26px;font-weight:800;color:#0070f3;margin:0 0 10px;">Connect your audience with a simple scan</h3>

          <p style="color:#94a3b8;font-size:15px;max-width:480px;margin:0 auto 24px;line-height:1.5;">

            Create a QR Code from any short link. Then edit, customize, and track your QR Codes here.

          </p>

          <button class="auth-submit-btn" id="btnLaunchQrForm" style="width:auto;padding:12px 32px;font-size:15px;margin:0 auto 12px;">

            Create a HEA Code

          </button>

          <div style="margin-top:10px;">

            <a href="#analytics" style="color:#38bdf8;font-size:13px;text-decoration:none;">Learn more \u2192</a>

          </div>

        </div>

      `,i("#btnLaunchQrForm").onclick=()=>{n="create",c()};let a=i("#btnViewAllQr");a&&(a.onclick=()=>{n="list",c()});return}if(n==="create"){e.innerHTML=`

        <div class="view-header">

          <div style="display:flex;align-items:center;gap:12px;">

            <button class="sso-btn" id="btnBackToQrList" style="width:auto;padding:6px 12px;">\u2190</button>

            <h2>Create a QR Code</h2>

          </div>

        </div>

        <!-- QR Creation Form matching Frame 9 -->

        <div class="qr-detail-layout">

          <div class="dash-white-card">

            <h3 style="color:#0070f3;margin-top:0;font-size:18px;font-weight:800;">QR Code Details</h3>

            <div class="create-link-field">

              <label>Destination URL</label>

              <input type="url" id="qrInputDest" placeholder="https://yourstore.com/summer-promo" value="" required>

            </div>

            <div class="create-link-field">

              <label>Title (optional)</label>

              <input type="text" id="qrInputTitle" placeholder="e.g. Table 4 Menu or Conference Flyer">

            </div>

            <!-- Advanced Settings (Frame 9) -->

            <h4 style="font-size:15px;color:#0070f3;margin:20px 0 10px;font-weight:700;">Advanced settings</h4>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">

              <span style="color:#0b132b;font-weight:600;font-size:13px;">{ } UTM parameters \u{1F451}</span>

              <label class="app-toggle-switch"><input type="checkbox" checked><span class="app-toggle-slider"></span></label>

            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">

              <span style="color:#0b132b;font-weight:600;font-size:13px;">\u23F1\uFE0F Code expiration \u{1F451}</span>

              <label class="app-toggle-switch"><input type="checkbox"><span class="app-toggle-slider"></span></label>

            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;">

              <div>

                <div style="color:#0b132b;font-weight:600;font-size:13px;">\u{1F500} Dynamic routing \u{1F451}</div>

                <div style="font-size:11px;color:#94a3b8;">Send visitors to different destinations based on device</div>

              </div>

              <label class="app-toggle-switch"><input type="checkbox" checked><span class="app-toggle-slider"></span></label>

            </div>

            <div style="display:flex;gap:12px;margin-top:24px;">

              <button class="auth-submit-btn" id="btnDesignYourCode" style="width:auto;padding:10px 24px;">Design your code \u2192</button>

              <button class="sso-btn" id="btnCancelQrCreate" style="width:auto;padding:10px 20px;">Cancel</button>

            </div>

          </div>

          <!-- Right Preview -->

          <div class="qr-preview-box">

            <span style="font-size:12px;color:#94a3b8;margin-bottom:12px;">Live Preview</span>

            <div class="qr-framed-thumbnail" style="width:180px;padding:14px 14px 8px;margin-bottom:16px;">

              <canvas id="qrCreatePreviewCanvas" width="180" height="180"></canvas>

              <div class="qr-thumb-label">SCAN ME</div>

            </div>

            <div style="font-size:12px;color:#38bdf8;font-weight:700;">Vector 4K Resolution</div>

          </div>

        </div>

      `,setTimeout(()=>{let a=i("#qrCreatePreviewCanvas");a&&typeof window.drawQR=="function"&&window.drawQR(a,window.location.origin,"#00d2ff","#ffffff",180)},30),i("#btnBackToQrList").onclick=()=>{n="list",c()},i("#btnCancelQrCreate").onclick=()=>{n="list",c()},i("#btnDesignYourCode").onclick=async()=>{let a=typeof window.canCreateLinkOrQr=="function"?window.canCreateLinkOrQr():{allowed:!0};if(!a.allowed){window.appShell.toast(a.message),typeof window.openCheckoutModal=="function"&&window.openCheckoutModal("pro");return}let l=i("#qrInputDest").value.trim(),r=i("#qrInputTitle").value.trim()||"Custom QR Code";if(!l){alert("Please enter destination URL");return}let b=le(6),x=`${o}/${b}`,g=R();if(!g){window.appShell.toast("Please log in to create QR codes");return}let h={id:"lnk_"+Date.now(),title:r,dest:l,slug:b,url:x,realShort:x,tag:"QR Campaign",createdAt:"Just now",clicks:0,scans:0,qr:!0};try{let[p,m]=await Promise.all([fetch("/api/qrs",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+g},body:JSON.stringify({title:r,dest:l,color:u.appUser&&u.appUser.selectedQrColor||"#0070f3"})}),fetch("/api/links",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+g},body:JSON.stringify({dest:l,slug:b,title:r,tag:"QR Campaign",qr:!0,realShort:x})})]);if(!m.ok){let v=await m.json().catch(()=>({}));window.appShell.toast(v.error||"Failed to create QR code");return}let C=await m.json();if(C&&C.link&&(h=pe(C.link)),p&&p.ok){let v=await p.json();v&&v.qr&&(v.qr._id||v.qr.id)&&(h.qrId=v.qr._id||v.qr.id,h.id=h.qrId)}}catch(p){window.appShell.toast(p.message||"Unable to reach server");return}u.cachedLinks.unshift(h),typeof window.recordFreeCreation=="function"&&window.recordFreeCreation(),window.appShell.toast("QR Code created! Welcome to the Studio."),E("qr-detail",h.id)};return}e.innerHTML=`

      <div class="view-header">
        <div class="header-title-col">
          <div style="display:flex;align-items:center;gap:10px;">
            <h2>QR Codes</h2>
            <span class="view-header-badge" style="background:rgba(16,185,129,0.1);color:#059669;border:1px solid rgba(16,185,129,0.25);">
              <span>\u25A6</span> Dynamic Vector
            </span>
          </div>
          <p class="view-subtitle">
            Design dynamic vector QR codes with custom colors, embedded logos, and real-time scan analytics.
          </p>
        </div>
        <div class="header-actions-col"></div>
      </div>

      <div class="qr-filter-bar">

        <div class="dash-search-box" style="flex:1;">
          <svg class="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="dash-search-input" id="qrSearchInput" placeholder="Search QR codes by label, destination, or color..." autocomplete="off">
        </div>

        <button class="sso-btn" style="width:auto;padding:8px 14px;font-size:13px;">\u{1F4C5} Filter by created date</button>

        <button class="sso-btn" style="width:auto;padding:8px 14px;font-size:13px;">\u229E Add filters</button>

        <button class="header-primary-btn" id="btnNewQrHero">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Create QR Code</span>
        </button>

      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;font-size:13px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:16px;">

        <div style="display:flex;gap:16px;align-items:center;">

          <span>${d.length} total codes</span>

          <span style="cursor:pointer;" onclick="window.appShell.downloadQrPNG()">Export</span>

          <span style="cursor:pointer;">Hide</span>

          <span style="cursor:pointer;">Tag</span>

        </div>

        <select class="home-domain-select" style="padding:4px 8px;font-size:12px;">

          <option>Show: Active</option>

        </select>

      </div>

      <!-- QR Card Items matching screenshot -->

      <div id="qrCardsContainer">

        ${(()=>{let a=window.location.origin;return d.map((l,r)=>{let x=(l.realShort&&l.realShort!==l.dest&&l.realShort.length<60?l.realShort:`${a}/${l.slug||"lnk"}`).replace(/^https?:\/\//,"");return`
            <div class="qr-card-item">
              <div class="qr-card-left">
                <div class="qr-framed-thumbnail" style="cursor:pointer;" onclick="window.appShell.navigate('qr-detail', '${l.id}')">
                  <canvas id="qrCardCanvas_${r}" width="160" height="160"></canvas>
                  <div class="qr-thumb-label">SCAN ME</div>
                </div>
                <div class="qr-details" style="min-width:0;flex:1;">
                  <span style="background:rgba(0,112,243,0.08);color:#0070f3;font-weight:700;font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid rgba(0,112,243,0.18);">\u{1F310} ${l.tag||"Website"}</span>
                  <h4 style="cursor:pointer;color:#0070f3 !important;margin:6px 0 4px;font-size:16px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;" onclick="window.appShell.navigate('qr-detail', '${l.id}')">${l.title}</h4>
                  <div class="qr-dest-text" title="${l.dest}">\u21B3 ${l.dest}</div>
                  <div class="qr-meta-row">
                    <span>\u{1F451} ${l.scans||0} scans</span>
                    <span>\u{1F4C5} ${l.createdAt}</span>
                    <span title="${x}">\u{1F517} ${x}</span>
                    <span>\u{1F3F7} No tags</span>
                  </div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:16px;color:#94a3b8;">
                <button class="topbar-icon-btn" title="Edit & Customize" onclick="window.appShell.navigate('qr-detail', '${l.id}')">\u270F\uFE0F</button>
                <button class="topbar-icon-btn" title="Download" onclick="window.appShell.downloadQrPNG('${l.slug}')">\u{1F4E5}</button>
                <button class="topbar-icon-btn" title="Stats" onclick="window.appShell.navigate('analytics')">\u{1F4CA}</button>
                <button class="topbar-icon-btn" style="color:#ef4444;" title="Delete QR" onclick="window.appShell.deleteQr('${l.qrId||l.id||""}', '${l.slug||""}')">\u{1F5D1}\uFE0F</button>
              </div>
            </div>
            `}).join("")})()}
      </div>
      <div style="text-align:center;color:#64748b;font-size:13px;margin:40px 0;">

        \u2014 You've reached the end of your QR codes \u2014

      </div>

    `,i("#btnNewQrHero").onclick=()=>{n="create",c()};let s=i("#qrSearchInput");s&&(s.oninput=()=>{let a=s.value.toLowerCase();$(".qr-card-item").forEach(l=>{l.style.display=l.textContent.toLowerCase().includes(a)?"flex":"none"})}),setTimeout(()=>{d.forEach((a,l)=>{let r=i(`#qrCardCanvas_${l}`);r&&typeof window.drawQR=="function"&&window.drawQR(r,a.realShort||a.url||a.dest||a.url||o+"/"+(a.slug||""),u.appUser.selectedQrColor||"#ff007f","#ffffff",160)})},50)}c()}function ot(e,t){let o=window.location.origin;u.activeQrId=t||"";let d=Z(),n=d.find(c=>c.id===u.activeQrId||c.slug===u.activeQrId)||d[0];if(!n){E("qr","create");return}e.innerHTML=`

    <!-- Header row matching Screenshot 12.02.39 AM 2 -->

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">

      <div style="display:flex;align-items:center;gap:12px;">

        <button class="sso-btn" style="width:auto;padding:6px 12px;font-size:14px;" onclick="window.appShell.navigate('qr')">\u2190</button>

        <h2 style="font-size:24px;font-weight:800;color:#0070f3;margin:0;">${n.title}</h2>

        <button class="topbar-icon-btn" title="Edit title" onclick="alert('Editing QR code title')">\u270F\uFE0F</button>

        <button class="topbar-icon-btn" title="More">\xB7\xB7\xB7</button>

      </div>

      <div style="display:flex;gap:12px;">

        <button class="auth-submit-btn" style="width:auto;margin:0;padding:10px 18px;display:flex;align-items:center;gap:8px;" onclick="window.appShell.downloadQrPNG('${n.slug}')">

          <span>\u{1F4E5}</span> Download PNG

        </button>

        <button class="sso-btn" style="width:auto;margin:0;padding:10px 18px;display:flex;align-items:center;gap:8px;" onclick="window.appShell.downloadQrSVG('${n.slug}')">

          <span>\u{1F4D0}</span> Download SVG

        </button>

      </div>

    </div>

    <!-- 2-Column Row: Details + QR Preview -->

    <div class="qr-detail-layout">

      <!-- Left: Details card (Screenshot 12.02.39 AM 2) -->

      <div class="dash-white-card">

        <h3 style="font-size:18px;font-weight:700;color:#0070f3;margin:0 0 18px;">Details</h3>

        <div style="margin-bottom:16px;">

          <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Scan destination</div>

          <div style="display:flex;align-items:center;gap:8px;color:#0b132b;font-size:14px;font-weight:600;">

            <span>\u{1F310}</span> Website / URL

          </div>

        </div>

        <div style="margin-bottom:16px;">

          <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Destination</div>

          <div style="color:#0070f3;font-size:13px;word-break:break-all;">\u21B3 ${n.dest}</div>

        </div>

        <div style="margin-bottom:16px;">
          <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Short link</div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="color:#0070f3;font-size:14px;font-weight:700;">${(n.realShort&&n.realShort!==n.dest&&n.realShort.length<60?n.realShort:o+"/"+(n.slug||"lnk")).replace(/^https?:\/\//,"")}</span>
            <button class="sso-btn" style="width:auto;padding:2px 8px;font-size:11px;" onclick="window.appShell.copy('${n.realShort&&n.realShort!==n.dest&&n.realShort.length<60?n.realShort:o+"/"+(n.slug||"lnk")}')">\u{1F4CB} Copy</button>
          </div>
        </div>

        <div style="margin-bottom:16px;">

          <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Tags</div>

          <div style="color:#64748b;font-size:13px;">\u{1F3F7}\uFE0F ${n.tag||"No tags"}</div>

        </div>

        <div>

          <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:4px;">Created on</div>

          <div style="color:#64748b;font-size:13px;">${n.createdAt}</div>

        </div>

      </div>

      <!-- Right: Frame Preview + Customize (Screenshot 12.02.39 AM 2) -->

      <div class="qr-preview-box">

        <div class="qr-framed-thumbnail" style="width:180px;padding:12px 12px 6px;margin-bottom:16px;">

          <canvas id="qrDetailCanvas" width="200" height="200"></canvas>

          <div class="qr-thumb-label" style="font-size:13px;margin-top:6px;">SCAN ME</div>

        </div>

        <!-- Color Customizer -->

        <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;">

          <span style="font-size:12px;color:#64748b;">Brand Color:</span>

          ${["#ff007f","#0070f3","#10b981","#0b132b","#ff9900"].map(c=>`

            <button class="color-dot" style="width:20px;height:20px;border-radius:50%;background:${c};border:2px solid ${u.appUser.selectedQrColor===c?"#0070f3":"transparent"};cursor:pointer;" onclick="window.appShell.changeQrColor('${c}')"></button>

          `).join("")}

        </div>

        <button class="sso-btn" style="width:auto;padding:8px 20px;color:#0070f3;border-color:rgba(0,112,243,0.3);font-weight:600;margin-bottom:14px;" onclick="window.appShell.toast('Custom QR design saved!')">

          \u{1F3A8} Customize frame &amp; colors

        </button>

        <div style="display:flex;justify-content:space-between;align-items:center;width:100%;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">

          <span style="color:#0070f3;font-size:13px;font-weight:700;">${(n.realShort&&n.realShort!==n.dest?n.realShort:n.slug?o.replace(/^https?:\/\//,"")+"/"+n.slug:n.dest||"").replace(/^https?:\/\//,"")}</span>

          <span style="color:#64748b;cursor:pointer;">\xB7\xB7\xB7</span>

        </div>

      </div>

    </div>

    <!-- Dynamic routing section (Screenshot 12.02.39 AM 3) -->

    <div class="dash-white-card" style="margin-bottom:24px;">

      <div style="display:flex;justify-content:space-between;align-items:flex-start;">

        <div>

          <h3 style="font-size:18px;font-weight:700;color:#0070f3;margin:0 0 6px;">Dynamic routing</h3>

          <p style="color:#64748b;font-size:13px;margin:0;">Automatically route visitors to different destinations based on device, location, and more.</p>

        </div>

        <button class="sso-btn" style="width:auto;padding:8px 18px;font-weight:600;" onclick="alert('Rules manager: Add device or GEO redirect rules')">

          + Add rules

        </button>

      </div>

    </div>

    <!-- Code analytics & chart (Screenshot 12.02.39 AM 3) -->

    <div class="dash-white-card">

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px;">

        <div>

          <h3 style="font-size:18px;font-weight:700;color:#0070f3;margin:0 0 4px;">Code analytics \u2014 ${n.dest.slice(0,45)}...</h3>

          <a href="#analytics" style="color:#0070f3;font-size:13px;font-weight:600;text-decoration:none;">\u21C4 Switch to all links</a>

        </div>

        <div style="display:flex;gap:10px;align-items:center;">

          <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:13px;">\u{1F4C5} Time Period: Last 7 days</button>

          <button class="sso-btn" style="width:auto;padding:6px 14px;font-size:13px;color:#fbbf24;border-color:rgba(251,191,36,0.3);">

            \u{1F451} Compare to a QR Code \u2197

          </button>

          <button class="topbar-icon-btn" title="Export data">\u{1F4E5}</button>

        </div>

      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">

        <span style="font-size:14px;font-weight:700;color:#0b132b;">Scans over time</span>

        <span class="verified-tag" style="background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.3);font-size:10px;padding:3px 8px;">\u{1F451} UPGRADE</span>

      </div>

      <!-- SVG Neon Wave Graph -->

      <div class="qr-wave-container">

        <svg viewBox="0 0 800 180" style="width:100%;height:100%;overflow:visible;">

          <defs>

            <linearGradient id="qrWaveGrad" x1="0" y1="0" x2="0" y2="1">

              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>

              <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>

            </linearGradient>

          </defs>

          <line x1="0" y1="40" x2="800" y2="40" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>

          <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>

          <line x1="0" y1="160" x2="800" y2="160" stroke="rgba(255,255,255,0.06)"/>

          <path d="M 0 150 Q 150 140, 250 80 T 500 120 T 750 40 L 800 60 L 800 170 L 0 170 Z" fill="url(#qrWaveGrad)"/>

          <path d="M 0 150 Q 150 140, 250 80 T 500 120 T 750 40 L 800 60" fill="none" stroke="#38bdf8" stroke-width="3"/>

          <circle cx="250" cy="80" r="5" fill="#38bdf8"/>

          <circle cx="750" cy="40" r="5" fill="#D4FF24"/>

        </svg>

      </div>

    </div>

  `,setTimeout(()=>{let c=i("#qrDetailCanvas");c&&typeof window.drawQR=="function"&&window.drawQR(c,n.realShort||n.url||n.dest||n.url||o+"/"+(n.slug||""),u.appUser.selectedQrColor||"#ff007f","#ffffff",200)},50)}function nt(e){u.appUser.selectedQrColor=e;let t=i("#qrDetailCanvas");t&&typeof window.drawQR=="function"&&window.drawQR(t,"https://tinyurl.com/3WeOEOz",e,"#ffffff",200),S(`QR code color updated to ${e}`)}function Qe(e){let t=i("#qrDetailCanvas")||i("#qrCardCanvas_0")||i("#qrScanMeCanvas");if(t){let o=document.createElement("a");o.href=t.toDataURL("image/png"),o.download=`healink-qr-${e||"code"}.png`,o.click(),S("Downloaded high-resolution SCAN ME QR code (PNG)!")}else S("Downloaded high-resolution SCAN ME QR code (PNG)!")}function at(e){let t=i("#qrDetailCanvas")||i("#qrCardCanvas_0")||i("#qrScanMeCanvas");if(!t){S("Downloaded QR vector SVG!");return}try{let o=t.width||200,d=t.height||200,s=t.getContext("2d").getImageData(0,0,o,d).data,a="",l=Math.max(1,Math.floor(o/35));for(let h=0;h<d;h+=l)for(let p=0;p<o;p+=l){let m=(h*o+p)*4,C=s[m],v=s[m+1],w=s[m+2];if(s[m+3]>100&&(C<240||v<240||w<240)){let L="#"+(16777216+(C<<16)+(v<<8)+w).toString(16).slice(1);a+=`<rect x="${p}" y="${h}" width="${l}" height="${l}" fill="${L}"/>
`}}let r=`<?xml version="1.0" encoding="utf-8"?>

<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${o}" height="${d}" viewBox="0 0 ${o} ${d}">

<rect width="100%" height="100%" fill="#ffffff" rx="12"/>

${a}

</svg>`,b=new Blob([r],{type:"image/svg+xml;charset=utf-8"}),x=URL.createObjectURL(b),g=document.createElement("a");g.href=x,g.download=`healink-qr-${e||"vector"}.svg`,document.body.appendChild(g),g.click(),document.body.removeChild(g),URL.revokeObjectURL(x),S("Downloaded print-ready Vector QR Code (SVG)!")}catch{Qe(e)}}var Me=J(()=>{K();X();xe()});function we(e,t){function o(v){if(!v||typeof v!="string")return!1;let w=v.replace("#","").trim();if(w.length<6)return!1;let k=parseInt(w.substring(0,2),16),L=parseInt(w.substring(2,4),16),f=parseInt(w.substring(4,6),16);return(k*299+L*587+f*114)/1e3>140}function d(v){return v.textColor&&v.textColor!=="#ffffff"&&v.textColor!=="#fff"?!0:o(v.bgColor)}let n=Ve(),c=window.location.origin,s=t||(n.length===0?"catalog":"list"),a="All templates",l=[{id:"grand_hotel",category:"Business & Hospitality",badge:"HOSPITALITY",title:"The Grand Hotel",tagline:"Your new escape awaits",accent:"#c5a059",bgColor:"#161b26",textColor:"#ffffff",cardBg:"#1f2737",btnBg:"#e2d5c3",btnColor:"#181e29",btnShadow:"0 4px 12px rgba(0, 0, 0, 0.3)",btn1Text:"Website",btn1Url:"https://thegrandhotel.example.com",btn2Text:"Book your stay",btn2Url:"https://thegrandhotel.example.com/book",socials:["instagram","mail","youtube"],avatarType:"hotel",cardType:"hotel_sunset",desc:"Dark luxury hospitality aesthetic with champagne gold accents and direct booking actions."},{id:"hearth_home",category:"Retail & Ecommerce",badge:"INTERIOR & DECOR",title:"Hearth & Home",tagline:"Create a space you love",accent:"#0d9488",bgColor:"#f7f4ee",textColor:"#1a202c",cardBg:"#ffffff",btnBg:"#0f766e",btnColor:"#ffffff",btnShadow:"0 4px 0 #094e49",btn1Text:"Shop our website",btn1Url:"https://hearthhome.example.com",btn2Text:"Find a store",btn2Url:"https://hearthhome.example.com/locations",socials:["instagram","mail","x"],avatarType:"hh_monogram",cardType:"armchair",desc:"Warm editorial cream layout with retro-drop shadow buttons and Scandinavian lookbook."},{id:"the_brew",category:"Food & Drink",badge:"CAFE & ROASTERY",title:"The Brew Co.",tagline:"Fresh roasts & seasonal cold brews",accent:"#ea580c",bgColor:"#faf6f0",textColor:"#1c1917",cardBg:"#ffffff",btnBg:"#ea580c",btnColor:"#ffffff",btnShadow:"0 4px 0 #9a3412",btn1Text:"New drinks",btn1Url:"https://thebrew.example.com/menu",btn2Text:"Order whole beans",btn2Url:"https://thebrew.example.com/beans",socials:["instagram","mail","tiktok"],avatarType:"brew_badge",cardType:"coffee_bag",desc:"Warm terracotta artisan cafe theme with coffee roast pouch and vibrant menu buttons."},{id:"cyberpulse_music",category:"Creator & Music",badge:"MUSIC & ARTIST",title:"CyberPulse",tagline:"New EP 'Echoes' Streaming Now",accent:"#00c6ff",bgColor:"#060919",textColor:"#ffffff",cardBg:"#0f172a",btnBg:"linear-gradient(135deg, #0070f3, #00c6ff)",btnColor:"#ffffff",btnShadow:"0 4px 16px rgba(0, 198, 255, 0.4)",btn1Text:"Stream on Spotify \u2197",btn1Url:"https://spotify.com/cyberpulse",btn2Text:"World Tour Tickets \u2197",btn2Url:"https://cyberpulse.live/tour",socials:["spotify","youtube","instagram","x"],avatarType:"cyber_headphones",cardType:"music_player",desc:"High-energy cyber cyan & violet theme for DJs, producers, and electronic artists."},{id:"glow_skincare",category:"Retail & Ecommerce",badge:"BEAUTY & WELLNESS",title:"Glow Beauty Lab",tagline:"Clean botanical skincare formulas",accent:"#f43f5e",bgColor:"#fff5f7",textColor:"#27272a",cardBg:"#ffffff",btnBg:"#f43f5e",btnColor:"#ffffff",btnShadow:"0 4px 12px rgba(244, 63, 94, 0.3)",btn1Text:"Shop Bestseller Serums",btn1Url:"https://glowbeauty.example.com/shop",btn2Text:"Take the 60s Skin Quiz",btn2Url:"https://glowbeauty.example.com/quiz",socials:["instagram","tiktok","mail"],avatarType:"beauty_dropper",cardType:"skincare_bottle",desc:"Soft blush rose aesthetic with botanical serum highlights for beauty and cosmetic brands."},{id:"devforge_hub",category:"Tech & Web3",badge:"DEVELOPER & SAAS",title:"DevForge CLI",tagline:"Lightning-fast cloud developer workflows",accent:"#D4FF24",bgColor:"#080d1a",textColor:"#ffffff",cardBg:"#0f172a",btnBg:"#D4FF24",btnColor:"#050914",btnShadow:"0 4px 18px rgba(212, 255, 36, 0.35)",btn1Text:"GitHub Repository (\u2605 18.4k)",btn1Url:"https://github.com/devforge",btn2Text:"Read the Documentation",btn2Url:"https://docs.devforge.example.com",socials:["github","x","mail"],avatarType:"terminal_code",cardType:"code_terminal",desc:"Dark matrix terminal theme tailored for open-source engineers, SDKs, and dev tools."},{id:"fitapex_coach",category:"Health & Fitness",badge:"FITNESS & TRAINING",title:"FitApex Coaching",tagline:"Elite 1-on-1 strength & nutrition plans",accent:"#10b981",bgColor:"#09101d",textColor:"#ffffff",cardBg:"#131e33",btnBg:"#10b981",btnColor:"#ffffff",btnShadow:"0 4px 14px rgba(16, 185, 129, 0.35)",btn1Text:"Apply for 1-on-1 Coaching",btn1Url:"https://fitapex.example.com/apply",btn2Text:"Download Free Workout Plan",btn2Url:"https://fitapex.example.com/guide",socials:["instagram","youtube","tiktok"],avatarType:"fitness_apex",cardType:"fitness_stats",desc:"High-contrast athletic theme with transformation proof for trainers and fitness creators."},{id:"atelier_bistro",category:"Food & Drink",badge:"FINE DINING",title:"Atelier Bistro & Bar",tagline:"Seasonal gastronomy & craft cocktails",accent:"#fbbf24",bgColor:"#0a0d14",textColor:"#ffffff",cardBg:"#141a29",btnBg:"#fbbf24",btnColor:"#0a0d14",btnShadow:"0 4px 16px rgba(251, 191, 36, 0.35)",btn1Text:"Reserve a Table Online",btn1Url:"https://atelierbistro.example.com/reserve",btn2Text:"View Chef's Tasting Menu",btn2Url:"https://atelierbistro.example.com/menu",socials:["instagram","mail","x"],avatarType:"chef_crest",cardType:"gourmet_dish",desc:"Midnight black & champagne gold palette for luxury restaurants, bistros, and lounges."},{id:"aura_photography",category:"Creator & Music",badge:"PHOTOGRAPHY",title:"Aura Visuals",tagline:"Timeless editorial wedding & portrait stories",accent:"#a855f7",bgColor:"#111216",textColor:"#ffffff",cardBg:"#1a1c23",btnBg:"#f4f4f5",btnColor:"#09090b",btnShadow:"none",btn1Text:"View Portfolio Galleries",btn1Url:"https://auravisuals.example.com/portfolio",btn2Text:"2026 Wedding Date Inquiries",btn2Url:"https://auravisuals.example.com/contact",socials:["instagram","mail","pinterest"],avatarType:"camera_aperture",cardType:"photo_frame",desc:"Monochrome editorial layout highlighting visual storytelling and client inquiries."},{id:"nexus_web3",category:"Tech & Web3",badge:"FINANCE & WEB3",title:"Nexus Capital",tagline:"Investing in decentralized intelligence",accent:"#38bdf8",bgColor:"#050716",textColor:"#ffffff",cardBg:"#0c122b",btnBg:"linear-gradient(135deg, #0ea5e9, #6366f1)",btnColor:"#ffffff",btnShadow:"0 4px 16px rgba(14, 165, 233, 0.4)",btn1Text:"Read Q1 Research Paper",btn1Url:"https://nexuscapital.example.com/research",btn2Text:"Join Governance Community",btn2Url:"https://t.me/nexusweb3",socials:["x","telegram","github"],avatarType:"web3_cube",cardType:"web3_stats",desc:"Futuristic blockchain and DeFi hub layout with live protocol analytics tickers."},{id:"elena_books",category:"Creator & Music",badge:"AUTHOR & PODCAST",title:"Elena Vance Books",tagline:"Bestselling dark fantasy author & podcaster",accent:"#d97706",bgColor:"#fbf9f4",textColor:"#1c1917",cardBg:"#ffffff",btnBg:"#1e293b",btnColor:"#ffffff",btnShadow:"0 4px 0 #0f172a",btn1Text:"Order The Silent Isle",btn1Url:"https://elenavance.example.com/books",btn2Text:"Listen to Writer Podcast",btn2Url:"https://elenavance.example.com/podcast",socials:["instagram","spotify","mail"],avatarType:"quill_book",cardType:"book_jacket",desc:"Warm parchment paper aesthetic designed for authors, poets, journalists, and book clubs."},{id:"nova_agency",category:"Business & Hospitality",badge:"DIGITAL AGENCY",title:"Nova Creative Studio",tagline:"Award-winning 3D branding & digital products",accent:"#8b5cf6",bgColor:"#080c1d",textColor:"#ffffff",cardBg:"#111836",btnBg:"linear-gradient(135deg, #8b5cf6, #06b6d4)",btnColor:"#ffffff",btnShadow:"0 4px 18px rgba(139, 92, 246, 0.4)",btn1Text:"Explore Case Studies",btn1Url:"https://novastudio.example.com/work",btn2Text:"Schedule Discovery Call",btn2Url:"https://novastudio.example.com/contact",socials:["linkedin","x","instagram"],avatarType:"prism_3d",cardType:"agency_showcase",desc:"Ultra-modern glassmorphic agency portfolio with high-contrast gradients and case studies."}],r=l[0],b="#00c6ff",x="healink.store";function g(v,w="currentColor"){switch(v){case"instagram":return`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${w}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;case"mail":return`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${w}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;case"youtube":return`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${w}" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="${w}"></polygon></svg>`;case"x":return`<svg width="14" height="14" viewBox="0 0 24 24" fill="${w}"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;case"spotify":return`<svg width="15" height="15" viewBox="0 0 24 24" fill="${w}"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`;case"tiktok":return`<svg width="15" height="15" viewBox="0 0 24 24" fill="${w}"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46 6.27 6.27 0 0 0 1.88-4.47V8.65a8.27 8.27 0 0 0 4.9 1.6V6.79a4.85 4.85 0 0 1-1.01-.1z"/></svg>`;case"github":return`<svg width="15" height="15" viewBox="0 0 24 24" fill="${w}"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`;case"linkedin":return`<svg width="15" height="15" viewBox="0 0 24 24" fill="${w}"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;case"telegram":return`<svg width="15" height="15" viewBox="0 0 24 24" fill="${w}"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.92 9.07c-.14.65-.53.81-1.08.5l-2.97-2.19-1.43 1.38c-.16.16-.29.29-.6.29l.21-3.03 5.51-4.98c.24-.21-.05-.33-.37-.12l-6.81 4.29-2.94-.92c-.64-.2-.65-.64.13-.95l11.48-4.42c.53-.2 1 .12.8 1.08z"/></svg>`;default:return`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${w}" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg>`}}function h(v){switch(v.avatarType){case"hotel":return`<div style="width:52px;height:52px;border-radius:50%;background:#1e2536;border:2px solid #c5a059;display:grid;place-items:center;box-shadow:0 6px 18px rgba(197, 160, 89, 0.35);">

          <svg width="24" height="24" viewBox="0 0 24 24" fill="#c5a059"><path d="M19 2H5c-1.1 0-2 .9-2 2v17h2v-2h14v2h2V4c0-1.1-.9-2-2-2zm-7 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm8 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>

        </div>`;case"hh_monogram":return`<div style="width:54px;height:54px;border-radius:50%;background:#ffffff;border:2px solid #1a202c;display:grid;place-items:center;box-shadow:0 6px 16px rgba(0,0,0,0.15);">

          <span style="font-family:serif;font-weight:900;font-size:24px;color:#1a202c;letter-spacing:-1px;">hH</span>

        </div>`;case"brew_badge":return`<div style="width:54px;height:54px;border-radius:50%;background:#ea580c;border:2px solid #ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(234, 88, 12, 0.4);">

          <span style="font-size:9px;font-weight:900;letter-spacing:1px;color:#ffffff;line-height:1;">THE</span>

          <span style="font-size:11px;font-weight:900;color:#ffffff;line-height:1;">BREW</span>

        </div>`;case"cyber_headphones":return`<div style="width:52px;height:52px;border-radius:50%;background:#090d22;border:2px solid #00c6ff;display:grid;place-items:center;box-shadow:0 0 20px rgba(0, 198, 255, 0.5);">

          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c6ff" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>

        </div>`;case"beauty_dropper":return`<div style="width:52px;height:52px;border-radius:50%;background:#fff1f2;border:2px solid #f43f5e;display:grid;place-items:center;box-shadow:0 6px 18px rgba(244, 63, 94, 0.25);">

          <span style="font-size:22px;">\u2728</span>

        </div>`;case"terminal_code":return`<div style="width:52px;height:52px;border-radius:50%;background:#0a0f1d;border:2px solid #D4FF24;display:grid;place-items:center;box-shadow:0 0 18px rgba(212, 255, 36, 0.45);">

          <span style="font-family:monospace;font-weight:900;font-size:18px;color:#D4FF24;">&gt;_</span>

        </div>`;case"fitness_apex":return`<div style="width:52px;height:52px;border-radius:50%;background:#131c2e;border:2px solid #10b981;display:grid;place-items:center;box-shadow:0 6px 18px rgba(16, 185, 129, 0.35);">

          <span style="font-size:22px;">\u{1F3CB}\uFE0F</span>

        </div>`;case"chef_crest":return`<div style="width:52px;height:52px;border-radius:50%;background:#141a29;border:2px solid #fbbf24;display:grid;place-items:center;box-shadow:0 6px 18px rgba(251, 191, 36, 0.35);">

          <span style="font-size:22px;">\u{1F377}</span>

        </div>`;case"camera_aperture":return`<div style="width:52px;height:52px;border-radius:50%;background:#181920;border:2px solid #e4e4e7;display:grid;place-items:center;box-shadow:0 6px 18px rgba(255, 255, 255, 0.15);">

          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="14.31" y1="8" x2="20.05" y2="17.94"></line><line x1="9.69" y1="8" x2="21.17" y2="8"></line><line x1="7.38" y1="12" x2="13.12" y2="2.06"></line><line x1="9.69" y1="16" x2="3.95" y2="6.06"></line><line x1="14.31" y1="16" x2="2.83" y2="16"></line><line x1="16.62" y1="12" x2="10.88" y2="21.94"></line></svg>

        </div>`;case"web3_cube":return`<div style="width:52px;height:52px;border-radius:50%;background:#09102b;border:2px solid #38bdf8;display:grid;place-items:center;box-shadow:0 0 20px rgba(56, 189, 248, 0.5);">

          <span style="font-size:22px;">\u{1F310}</span>

        </div>`;case"quill_book":return`<div style="width:52px;height:52px;border-radius:50%;background:#ffffff;border:2px solid #d97706;display:grid;place-items:center;box-shadow:0 6px 16px rgba(217, 119, 6, 0.25);">

          <span style="font-size:22px;">\u{1F4DA}</span>

        </div>`;case"prism_3d":default:return`<div style="width:52px;height:52px;border-radius:50%;background:#111836;border:2px solid #8b5cf6;display:grid;place-items:center;box-shadow:0 0 20px rgba(139, 92, 246, 0.45);">

          <span style="font-size:22px;">\u{1F680}</span>

        </div>`}}function p(v){switch(v.cardType){case"hotel_sunset":return`<div style="width:100%;border-radius:12px;overflow:hidden;background:linear-gradient(180deg, #ea580c 0%, #7c2d12 40%, #0f172a 100%);padding:14px 12px;display:flex;flex-direction:column;justify-content:flex-end;height:100px;box-shadow:inset 0 0 30px rgba(0,0,0,0.5);">

          <div style="font-size:9px;font-weight:800;color:#fde047;text-transform:uppercase;letter-spacing:1px;">Featured Suite</div>

          <div style="font-weight:800;font-size:12px;color:#ffffff;margin-top:2px;">Oceanfront Luxury Villa</div>

          <div style="font-size:10px;color:#cbd5e1;margin-top:1px;">Private infinity pool &amp; concierge</div>

        </div>`;case"armchair":return`<div style="width:100%;border-radius:12px;background:#ffffff;border:1px solid #e2e8f0;padding:12px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">

          <div style="width:48px;height:48px;border-radius:8px;background:#f1f5f9;display:grid;place-items:center;font-size:24px;flex-shrink:0;">\u{1F6CB}\uFE0F</div>

          <div>

            <div style="font-size:10px;font-weight:800;color:#0f766e;text-transform:uppercase;">Our New Arrivals</div>

            <div style="font-weight:800;font-size:12px;color:#1e293b;">Nordic Lounge Chair</div>

            <div style="font-size:10px;color:#64748b;">In stock \xB7 Free shipping</div>

          </div>

        </div>`;case"coffee_bag":return`<div style="width:100%;border-radius:12px;background:#ffffff;border:1px solid #fed7aa;padding:12px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(234, 88, 12, 0.08);">

          <div style="width:48px;height:48px;border-radius:8px;background:#ffedd5;display:grid;place-items:center;font-size:24px;flex-shrink:0;">\u2615</div>

          <div>

            <div style="font-size:10px;font-weight:800;color:#ea580c;text-transform:uppercase;">Seasonal Blend</div>

            <div style="font-weight:800;font-size:12px;color:#1c1917;">Finca La Aurora Roast</div>

            <div style="font-size:10px;color:#78716c;">Notes of cacao &amp; citrus</div>

          </div>

        </div>`;case"music_player":return`<div style="width:100%;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(0, 198, 255, 0.25);padding:10px 12px;display:flex;align-items:center;gap:10px;">

          <div style="width:40px;height:40px;border-radius:50%;background:#00c6ff;color:#000;display:grid;place-items:center;font-size:16px;font-weight:900;flex-shrink:0;box-shadow:0 0 12px #00c6ff;">\u25B6</div>

          <div style="flex:1;">

            <div style="font-size:11px;font-weight:800;color:#ffffff;">Echoes EP (2026)</div>

            <div style="font-size:9px;color:#38bdf8;">12 Tracks \xB7 Synthwave</div>

            <div style="width:100%;height:3px;background:rgba(255,255,255,0.1);border-radius:3px;margin-top:6px;overflow:hidden;">

              <div style="width:65%;height:100%;background:#00c6ff;"></div>

            </div>

          </div>

        </div>`;case"skincare_bottle":return`<div style="width:100%;border-radius:12px;background:#ffffff;border:1px solid #fecdd3;padding:12px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(244, 63, 94, 0.08);">

          <div style="width:48px;height:48px;border-radius:8px;background:#ffe4e6;display:grid;place-items:center;font-size:24px;flex-shrink:0;">\u{1F9F4}</div>

          <div>

            <div style="font-size:10px;font-weight:800;color:#f43f5e;text-transform:uppercase;">Best Rated</div>

            <div style="font-weight:800;font-size:12px;color:#18181b;">Luminous Vitamin C</div>

            <div style="font-size:10px;color:#71717a;">\u2605\u2605\u2605\u2605\u2605 4.9 (12k reviews)</div>

          </div>

        </div>`;case"code_terminal":return`<div style="width:100%;border-radius:10px;background:#050914;border:1px solid rgba(212, 255, 36, 0.25);padding:10px 12px;font-family:monospace;font-size:11px;text-align:left;">

          <div style="display:flex;gap:4px;margin-bottom:6px;">

            <span style="width:7px;height:7px;border-radius:50%;background:#ef4444;display:inline-block;"></span>

            <span style="width:7px;height:7px;border-radius:50%;background:#eab308;display:inline-block;"></span>

            <span style="width:7px;height:7px;border-radius:50%;background:#22c55e;display:inline-block;"></span>

          </div>

          <div style="color:#D4FF24;">$ npm i -g @devforge/cli</div>

          <div style="color:#64748b;font-size:10px;margin-top:2px;">\u2714 Zero-config cloud runner</div>

        </div>`;case"fitness_stats":return`<div style="width:100%;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(16, 185, 129, 0.25);padding:10px 12px;display:flex;align-items:center;justify-content:space-between;">

          <div>

            <div style="font-size:10px;font-weight:800;color:#10b981;text-transform:uppercase;">Client Results</div>

            <div style="font-size:12px;font-weight:800;color:#ffffff;margin-top:2px;">12-Week Transformation</div>

            <div style="font-size:10px;color:#94a3b8;">+28% Strength PR</div>

          </div>

          <div style="font-size:22px;">\u{1F525}</div>

        </div>`;case"gourmet_dish":return`<div style="width:100%;border-radius:12px;background:#141a29;border:1px solid rgba(251, 191, 36, 0.25);padding:10px 12px;display:flex;align-items:center;gap:12px;">

          <div style="width:42px;height:42px;border-radius:8px;background:rgba(251, 191, 36, 0.15);display:grid;place-items:center;font-size:22px;flex-shrink:0;">\u{1F37D}\uFE0F</div>

          <div>

            <div style="font-size:9px;font-weight:800;color:#fbbf24;text-transform:uppercase;">Tasting Menu</div>

            <div style="font-size:12px;font-weight:800;color:#ffffff;">Spring Truffle Pairing</div>

            <div style="font-size:10px;color:#94a3b8;">7-Course Experience</div>

          </div>

        </div>`;case"photo_frame":return`<div style="width:100%;border-radius:10px;background:#181920;border:1px solid rgba(255,255,255,0.12);padding:10px;display:flex;align-items:center;gap:10px;">

          <div style="width:44px;height:44px;border-radius:6px;background:#27272a;display:grid;place-items:center;font-size:20px;flex-shrink:0;">\u{1F4F8}</div>

          <div>

            <div style="font-size:10px;font-weight:800;color:#e4e4e7;">Florence Elopement</div>

            <div style="font-size:9px;color:#a1a1aa;margin-top:2px;">Featured in Vogue Weddings</div>

          </div>

        </div>`;case"web3_stats":return`<div style="width:100%;border-radius:10px;background:rgba(56, 189, 248, 0.08);border:1px solid rgba(56, 189, 248, 0.3);padding:10px 12px;display:flex;align-items:center;justify-content:space-between;">

          <div>

            <div style="font-size:9px;font-weight:800;color:#38bdf8;text-transform:uppercase;">Protocol Vault</div>

            <div style="font-size:13px;font-weight:800;color:#ffffff;margin-top:2px;">$84.5M TVL</div>

          </div>

          <span style="font-size:10px;padding:3px 8px;background:#10b98125;color:#10b981;border-radius:6px;font-weight:800;">+18.4% APY</span>

        </div>`;case"book_jacket":return`<div style="width:100%;border-radius:10px;background:#ffffff;border:1px solid #fed7aa;padding:10px 12px;display:flex;align-items:center;gap:10px;">

          <div style="width:36px;height:48px;border-radius:4px;background:#1e293b;color:#d97706;display:grid;place-items:center;font-size:16px;font-weight:900;flex-shrink:0;">\u{1F4D6}</div>

          <div>

            <div style="font-size:10px;font-weight:800;color:#d97706;">#1 NYT Bestseller</div>

            <div style="font-size:12px;font-weight:800;color:#1e293b;">The Silent Isle</div>

            <div style="font-size:10px;color:#64748b;">Hardcover &amp; Audio</div>

          </div>

        </div>`;case"agency_showcase":default:return`<div style="width:100%;border-radius:10px;background:linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));border:1px solid rgba(139, 92, 246, 0.3);padding:10px 12px;display:flex;align-items:center;gap:10px;">

          <div style="font-size:24px;">\u{1F3C6}</div>

          <div>

            <div style="font-size:9px;font-weight:800;color:#a855f7;text-transform:uppercase;">Featured Project</div>

            <div style="font-size:12px;font-weight:800;color:#ffffff;">FinTech Rebrand 2026</div>

            <div style="font-size:10px;color:#cbd5e1;">Awwwards Site of the Year</div>

          </div>

        </div>`}}function m(v,w=!1,k={}){let L=w&&k.title!==void 0?k.title:v.title,f=w&&k.tagline!==void 0?k.tagline:v.tagline,y=w&&k.btn1!==void 0?k.btn1:v.btn1Text,T=w&&k.btn2!==void 0?k.btn2:v.btn2Text;return`

      <div class="template-phone-preview" style="background:${v.bgColor}; color:${v.textColor||"#ffffff"};">

        <div class="mini-notch" style="${d(v)?"background:rgba(0,0,0,0.18);":"background:rgba(0,0,0,0.45);"}"></div>

        ${h(v)}

        <div style="font-weight:800; font-size:16px; margin-top:8px; text-align:center; color:${v.textColor||"#ffffff"}; letter-spacing:-0.02em;" id="${w?"mockupTitle":""}">${L}</div>

        <div style="font-size:11px; color:${v.textColor?v.textColor+"aa":"#94a3b8"}; margin-top:3px; text-align:center; max-width:88%; line-height:1.3;" id="${w?"mockupTagline":""}">${f}</div>

        <div style="display:flex; gap:10px; align-items:center; margin:10px 0 12px; color:${v.textColor?v.textColor+"bb":"#cbd5e1"};">

          ${v.socials.map(z=>g(z,v.textColor?v.textColor+"cc":"#cbd5e1")).join("")}

        </div>

        <div style="display:flex; flex-direction:column; gap:7px; width:100%; margin-bottom:12px;">

          <div style="background:${v.btnBg}; color:${v.btnColor}; font-weight:700; font-size:11px; padding:8px 12px; border-radius:8px; text-align:center; box-shadow:${v.btnShadow}; border:1px solid rgba(255,255,255,0.08);" id="${w?"mockupBtn1":""}">

            ${y}

          </div>

          <div style="background:${v.btnBg}; color:${v.btnColor}; font-weight:700; font-size:11px; padding:8px 12px; border-radius:8px; text-align:center; box-shadow:${v.btnShadow}; border:1px solid rgba(255,255,255,0.08);" id="${w?"mockupBtn2":""}">

            ${T}

          </div>

        </div>

        ${p(v)}

        <div style="margin-top:auto;padding-top:10px;font-size:9px;color:${v.textColor?v.textColor+"66":"#64748b"};">

          Powered by HEA Link

        </div>

      </div>

    `}function C(){if(n=Ve(),s==="catalog"){let w=["All templates","Business & Hospitality","Food & Drink","Creator & Music","Retail & Ecommerce","Health & Fitness","Tech & Web3"],k=a==="All templates"?l:l.filter(f=>f.category===a);e.innerHTML=`

        <div class="view-header">

          <div>

            <h2 style="margin:0 0 4px;font-size:24px;">Choose a Template for Your Page</h2>

            <p style="color:#94a3b8;font-size:14px;margin:0;">Select a professionally crafted layout to showcase your links and brand.</p>

          </div>

          ${n.length>0?'<button class="sso-btn" style="width:auto;padding:8px 18px;" id="btnReturnToPageList">\u2190 Back to My Pages</button>':""}

        </div>

        <!-- Template Filter Pills (Matching Bitly category filters) -->

        <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:12px;margin:0 0 20px;align-items:center;">
          ${n.length>0?'<button class="sso-btn" style="width:auto;padding:7px 16px;white-space:nowrap;font-size:13px;margin-right:8px;border-radius:99px;" id="btnReturnToPageList">\u2190 Back to My Pages</button>':""}

          ${w.map(f=>`

            <button class="home-type-tab ${a===f?"active":""} filter-cat-btn" style="white-space:nowrap;padding:7px 18px;font-size:13px;" data-cat="${f}">

              ${f} ${f==="All templates"?`(${l.length})`:""}

            </button>

          `).join("")}

        </div>

        <!-- 12 Smartphone-Styled Template Cards Grid -->

        <div class="template-grid" id="templateGrid">

          ${k.map(f=>{let y=d(f),T=f.bgColor||(y?"#ffffff":"#0f172a"),z=y?`linear-gradient(180deg, ${f.bgColor} 0%, ${f.cardBg||"#ffffff"} 100%)`:`linear-gradient(180deg, ${f.bgColor} 0%, ${f.cardBg||"#111827"} 100%)`,U=y?f.textColor||"#1e293b":"#ffffff",_=y?"#64748b":"#94a3b8",I=y?`${f.accent}14`:`${f.accent}1a`,O=y?`${f.accent}30`:`${f.accent}38`,N=y?`${f.accent}30`:`${f.accent}33`,M=f.btnShadow&&f.btnShadow!=="none"?f.btnShadow:`0 4px 16px ${f.accent}35`;return`
            <div class="template-card ${y?"template-card-light":"template-card-dark"}" data-id="${f.id}" style="--tmpl-accent:${f.accent}; --tmpl-border:${N}; --tmpl-hover-shadow:${f.accent}38; --tmpl-footer-bg:${z}; --tmpl-card-bg:${T}; --tmpl-divider:${y?f.accent+"20":"rgba(255,255,255,0.08)"}; border:1.5px solid ${N}; background:${T}; box-shadow: 0 10px 28px ${f.accent}12, 0 2px 6px rgba(0,0,0,0.04);">
              ${m(f,!1)}
              <div class="template-card-footer" style="background:${z} !important; border-top: 1px solid ${y?f.accent+"20":"rgba(255,255,255,0.08)"};">
                <div>
                  <span class="template-badge-pill" style="font-size:10px;font-weight:800;color:${f.accent};background:${I};border:1px solid ${O};padding:3px 8px;border-radius:6px;letter-spacing:1px;text-transform:uppercase;display:inline-block;margin-bottom:6px;">${f.badge}</span>
                  <h4 style="margin:4px 0 6px;color:${U};font-size:16px;font-weight:700;letter-spacing:-0.01em;">${f.title}</h4>
                  <p style="font-size:12px;color:${_};line-height:1.45;margin:0 0 14px;">${f.desc}</p>
                </div>
                <button class="auth-submit-btn btn-use-template" data-id="${f.id}" style="width:100%;margin:0;padding:10px 14px;font-size:13px;font-weight:700;background:${f.btnBg};color:${f.btnColor};box-shadow:${M};border:none;border-radius:9999px;cursor:pointer;">
                  Use this template \u2192
                </button>
              </div>
            </div>
            `}).join("")}

        </div>

      `;let L=i("#btnReturnToPageList");L&&(L.onclick=()=>{s="list",C()}),$(".filter-cat-btn").forEach(f=>{f.onclick=()=>{a=f.dataset.cat,C()}}),$(".template-card").forEach(f=>{f.onclick=y=>{let T=f.dataset.id;r=l.find(U=>U.id===T)||l[0],b="#00c6ff",s="configure",C()}});return}if(s==="configure"){let w=r.id.replace(/_/g,"-"),k=r.title,L=r.tagline,f=r.btn1Text,y=r.btn2Text;e.innerHTML=`

        <div class="view-header">

          <div style="display:flex;align-items:center;gap:14px;">

            <button class="sso-btn" id="btnBackToTemplates" style="width:auto;padding:8px 14px;font-weight:700;">\u2190 Back to Templates</button>

            <div>

              <h2 style="margin:0 0 2px;font-size:24px;">Configure how to share your page</h2>

              <p style="color:#94a3b8;font-size:13px;margin:0;">Setup your link and QR Code to get page visitors</p>

            </div>

          </div>

        </div>

        <div class="configure-mobile-toggle-bar">

          <button type="button" class="cfg-tab-btn active" id="btnCfgTabSettings">\u2699\uFE0F Configure Settings</button>

          <button type="button" class="cfg-tab-btn" id="btnCfgTabPreview">\u{1F4F1} Live Mobile Preview</button>

        </div>

        <div class="configure-grid">

          <!-- Left Column: Settings Cards (Website Cyber Glass Theme) -->

          <div class="configure-col-settings" id="cfgColSettings">

            <!-- 1. Page URL Card -->

            <div class="configure-card">

              <h3 style="color:#0070f3;font-size:17px;font-weight:700;margin:0 0 14px;display:flex;align-items:center;gap:8px;">

                <span>\u{1F517}</span> Page URL

              </h3>

              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">

                <select id="configBioDomain" class="home-domain-select" style="min-width:140px;">

                  <option value="healink.store" selected>healink.store</option>

                  <option value="hea.link">hea.link</option>

                  <option value="tinyurl.com">tinyurl.com</option>

                  <option value="healink.store">healink.store</option>

                  <option value="bit.ly">bit.ly</option>

                </select>

                <span style="color:#0070f3;font-size:15px;font-weight:800;padding:0 4px;">/m/</span>

                <input type="text" id="configBioSlug" class="home-shorten-input" style="flex:1;min-width:150px;" value="${w}" placeholder="custom-back-half" required>

              </div>

              <!-- Custom Domain Banner -->

              <div class="home-cyan-banner" style="margin-top:14px;">

                <span>\u{1F451}</span>

                <span>Brand your page with a custom domain. <a href="#" onclick="window.openCheckoutModal('pro'); return false;">View Plans</a></span>

              </div>

            </div>

            <!-- 2. Page Content Details Card -->

            <div class="configure-card">

              <h3 style="color:#0070f3;font-size:17px;font-weight:700;margin:0 0 16px;display:flex;align-items:center;gap:8px;">

                <span>\u270F\uFE0F</span> Page Content Details

              </h3>

              <div class="create-link-field" style="margin-bottom:14px;">

                <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Page Title</label>

                <input type="text" id="configBioTitle" value="${k}" placeholder="e.g. The Grand Hotel">

              </div>

              <div class="create-link-field" style="margin-bottom:18px;">

                <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Tagline / Description</label>

                <input type="text" id="configBioTagline" value="${L}" placeholder="e.g. Your new escape awaits">

              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">

                <div class="create-link-field">

                  <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Primary Button Text</label>

                  <input type="text" id="configBtn1Text" value="${f}">

                </div>

                <div class="create-link-field">

                  <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Destination URL</label>

                  <input type="url" id="configBtn1Url" value="${r.btn1Url}">

                </div>

              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">

                <div class="create-link-field">

                  <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Secondary Button Text</label>

                  <input type="text" id="configBtn2Text" value="${y}">

                </div>

                <div class="create-link-field">

                  <label style="font-size:12px;color:#cbd5e1;font-weight:600;display:block;margin-bottom:6px;">Destination URL</label>

                  <input type="url" id="configBtn2Url" value="${r.btn2Url}">

                </div>

              </div>

            </div>

            <!-- 3. QR Code Card (Matching Image 2) -->

            <div class="configure-card">

              <h3 style="color:#0070f3;font-size:17px;font-weight:700;margin:0 0 16px;display:flex;align-items:center;gap:8px;">

                <span>\u25A6</span> QR Code

              </h3>

              <div style="margin-bottom:18px;">

                <label style="font-size:12px;color:#64748b;font-weight:600;display:block;margin-bottom:10px;">Code color</label>

                <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">

                  ${[{c:"#0070f3",name:"Electric Blue"},{c:"#00c6ff",name:"Cyber Cyan"},{c:"#10b981",name:"Emerald"},{c:"#f97316",name:"Orange"},{c:"#ef4444",name:"Crimson"},{c:"#8b5cf6",name:"Purple"},{c:"#ff007f",name:"Pink"},{c:"#060b18",name:"Obsidian"}].map(P=>`

                    <button class="color-dot-swatch ${b===P.c?"active":""}" data-color="${P.c}" title="${P.name}" style="background:${P.c};border:2px solid ${P.c==="#060b18"?"#ffffff33":"transparent"};"></button>

                  `).join("")}

                </div>

              </div>

              <!-- Logo Row -->

              <div style="margin-bottom:20px;">

                <label style="font-size:12px;color:#64748b;font-weight:600;display:block;margin-bottom:8px;">Logo</label>

                <div style="display:flex;gap:12px;align-items:center;">

                  <div style="width:44px;height:44px;border:1px dashed #cbd5e1;border-radius:10px;display:grid;place-items:center;color:#64748b;font-size:20px;background:#f8fafc;cursor:pointer;" onclick="window.openCheckoutModal('pro');">

                    +

                  </div>

                  <button class="sso-btn" style="width:auto;padding:8px 16px;font-size:13px;display:flex;align-items:center;gap:6px;" onclick="window.openCheckoutModal('pro');">

                    Add Logo <span style="color:#fbbf24;">\u{1F451}</span>

                  </button>

                </div>

              </div>

              <!-- QR Code Preview Box -->

              <div style="display:flex;gap:18px;align-items:center;padding:16px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;">

                <canvas id="configQrCanvas" width="105" height="105" style="border-radius:10px;background:#ffffff;padding:5px;flex-shrink:0;box-shadow:0 4px 14px rgba(0,70,200,0.08);border:1px solid #e2e8f0;"></canvas>

                <div>

                  <div style="font-weight:800;color:#0b132b;font-size:15px;margin-bottom:4px;">Preview</div>

                  <div style="font-size:12px;color:#64748b;line-height:1.5;">More customizations are available after creating</div>

                </div>

              </div>

            </div>

          </div>

          <!-- Right Column: Live Mobile Preview (Matching Image 2 in Cyber Phone Mockup) -->

          <div class="configure-col-preview" id="cfgColPreview" style="position:sticky;top:20px;">

            <div style="text-align:center;font-size:13px;font-weight:700;color:#38bdf8;margin-bottom:12px;letter-spacing:0.5px;text-transform:uppercase;">

              Live Mobile Preview

            </div>

            <div class="phone-mockup" style="box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px ${b}40;">

              <div class="phone-notch"></div>

              <div class="phone-screen" id="mockupScreen" style="border-top:3px solid ${b};background:${r.bgColor};color:${r.textColor||"#ffffff"};">

                ${m(r,!0,{title:k,tagline:L,btn1:f,btn2:y})}

              </div>

            </div>

          </div>

        </div>

        <!-- Sticky Bottom Actions Bar (Matching Image 2) -->

        <div class="sticky-bottom-actions">

          <button class="sso-btn" style="width:auto;padding:10px 24px;font-weight:700;" id="btnCancelConfig">Back</button>

          <button class="auth-submit-btn" style="margin:0;padding:11px 32px;font-size:14px;background:linear-gradient(135deg, #0070f3, #00c6ff);box-shadow:0 4px 20px rgba(0, 198, 255, 0.4);" id="btnPublishConfiguredPage">

            Create your page \u2192

          </button>

        </div>

      `;let T=()=>{let P=i("#configQrCanvas"),A=(i("#configBioSlug")?.value.trim()||"my-page").toLowerCase(),D=i("#configBioDomain")?.value||"healink.store";P&&typeof window.drawQR=="function"&&window.drawQR(P,`https://${D}/m/${A}`,b,"#ffffff",105)};setTimeout(T,50);let z=i("#configBioTitle"),U=i("#configBioTagline"),_=i("#configBioSlug"),I=i("#configBioDomain"),O=i("#configBtn1Text"),N=i("#configBtn2Text");z&&(z.oninput=()=>{let P=z.value||r.title,A=i("#mockupTitle");A&&(A.textContent=P)}),U&&(U.oninput=()=>{let P=U.value||r.tagline,A=i("#mockupTagline");A&&(A.textContent=P)}),O&&(O.oninput=()=>{let P=O.value||r.btn1Text,A=i("#mockupBtn1");A&&(A.textContent=P)}),N&&(N.oninput=()=>{let P=N.value||r.btn2Text,A=i("#mockupBtn2");A&&(A.textContent=P)}),_&&(_.oninput=T),I&&(I.onchange=()=>{x=I.value,T()}),$(".color-dot-swatch").forEach(P=>{P.onclick=()=>{b=P.dataset.color,$(".color-dot-swatch").forEach(G=>G.classList.toggle("active",G===P));let A=i("#mockupScreen");A&&(A.style.borderTopColor=b);let D=i(".phone-mockup");D&&(D.style.boxShadow=`0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px ${b}40`),T()}});let M=i("#btnCfgTabSettings"),F=i("#btnCfgTabPreview"),q=i("#cfgColSettings"),V=i("#cfgColPreview");M&&F&&q&&V&&(M.onclick=()=>{M.classList.add("active"),F.classList.remove("active"),q.classList.remove("hidden-mobile"),V.classList.add("hidden-mobile")},F.onclick=()=>{F.classList.add("active"),M.classList.remove("active"),V.classList.remove("hidden-mobile"),q.classList.add("hidden-mobile")},window.innerWidth<=768&&V.classList.add("hidden-mobile")),i("#btnBackToTemplates").onclick=()=>{s="catalog",C()},i("#btnCancelConfig").onclick=()=>{s="catalog",C()},i("#btnPublishConfiguredPage").onclick=async()=>{let A=(i("#configBioSlug")?.value.trim()||r.id.replace(/_/g,"-")).toLowerCase().replace(/[^a-z0-9-]/g,"")||"my-page",D=i("#configBioDomain")?.value||"healink.store",G=i("#configBioTitle")?.value.trim()||r.title,te=i("#configBioTagline")?.value.trim()||r.tagline,oe=i("#configBtn1Text")?.value.trim()||r.btn1Text,B=i("#configBtn1Url")?.value.trim()||r.btn1Url,j=i("#configBtn2Text")?.value.trim()||r.btn2Text,H=i("#configBtn2Url")?.value.trim()||r.btn2Url,Q={slug:A,domain:D,title:G,tagline:te,btn1Text:oe,btn1Url:B,btn2Text:j,btn2Url:H,templateId:r.id,links:[...B?[{label:oe||"Link 1",url:B}]:[],...H?[{label:j||"Link 2",url:H}]:[]],url:`${D&&D!=="healink.store"&&D!==window.location.hostname?"https://"+D:window.location.origin}/m/${A}`,color:b,views:0,engagements:0,createdAt:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})},Y=R();if(!Y){window.appShell.toast("Please log in to publish a Bio Page");return}try{let ne=await fetch("/api/bios",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+Y},body:JSON.stringify({slug:A,title:Q.title,tagline:Q.tagline,avatar:Q.avatar||"",theme:Q.theme||"cyber-dark",links:Q.links||[]})});if(ne.status===401){W();return}let ae=await ne.json().catch(()=>({}));if(!ne.ok){if(ne.status===403&&ae.code==="PLAN_LIMIT_REACHED"){window.appShell.toast(ae.error||"Bio page limit reached for current plan."),typeof window.openCheckoutModal=="function"&&window.openCheckoutModal("pro");return}window.appShell.toast(ae.error||"Failed to publish bio page");return}let be=ae&&(ae.page||ae.bio),Re=be?{...Q,...be,id:be._id||be.id||Q.slug,url:`${D&&D!=="healink.store"&&D!==window.location.hostname?"https://"+D:window.location.origin}/m/${be.slug||A}`}:Q;u.cachedBios.unshift(Re),window.appShell.toast(`Page created successfully: ${Re.url}`),window.appShell.copy(Re.url),s="list",C()}catch(ne){window.appShell.toast(ne.message||"Unable to reach server to publish bio page")}};return}if(n.length===0){e.innerHTML=`

        <div class="view-header">
          <div class="header-title-col">
            <div style="display:flex;align-items:center;gap:10px;">
              <h2>Bio Pages</h2>
              <span class="pro-chip nav-pro-badge" style="font-size:11px;padding:2px 8px;">PRO</span>
            </div>
            <p class="view-subtitle">
              Mobile-optimized bio landing pages, link collections, social channels, and product showcases.
            </p>
          </div>
          <div class="header-actions-col">
            <button class="header-primary-btn" id="btnLaunchTemplateCatalog">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create page
            </button>
          </div>
        </div>

        <div style="text-align:center;padding:50px 24px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:16px;max-width:560px;margin:32px auto;">

          <div style="font-size:36px;margin-bottom:12px;">\u{1F4F1}</div>

          <h3 style="color:#0070f3;font-size:18px;font-weight:800;margin:0 0 8px;">No bio pages created yet</h3>

          <p style="color:#64748b;font-size:14px;margin:0 0 20px;line-height:1.6;">Build a single high-converting mobile bio page to showcase all your links, social media profiles, and offers.</p>

          <button class="auth-submit-btn" id="btnEmptyCreateBio" style="width:auto;margin:0 auto;padding:12px 28px;">+ Choose a Template</button>

        </div>

      `;let w=()=>{s="catalog",C()};i("#btnLaunchTemplateCatalog").onclick=w;let k=i("#btnEmptyCreateBio");k&&(k.onclick=w);return}e.innerHTML=`

      <div class="view-header">
          <div class="header-title-col">
            <div style="display:flex;align-items:center;gap:10px;">
              <h2>Bio Pages</h2>
              <span class="pro-chip nav-pro-badge" style="font-size:11px;padding:2px 8px;">PRO</span>
            </div>
            <p class="view-subtitle">
              Mobile-optimized bio landing pages, link collections, social channels, and product showcases.
            </p>
          </div>
          <div class="header-actions-col">
            <button class="header-primary-btn" id="btnLaunchTemplateCatalog">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create page
            </button>
          </div>
        </div>

      <div class="page-search-bar-row">

        <div class="dash-search-box" style="max-width:380px;">
          <svg class="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="dash-search-input page-search-input" id="pageSearchInput" placeholder="Search bio pages by title, handle, or bio..." autocomplete="off">
        </div>

        <span class="page-count-badge" id="pageCountBadge">${n.length} published page${n.length===1?"":"s"}</span>

      </div>

      <div id="pagesListContainer">

      ${n.map(w=>{let k=w.url||`${c}/m/${w.slug}`;return`

          <div class="page-row-card" data-slug="${w.slug}" data-title="${(w.title||"").toLowerCase()}" data-tagline="${(w.tagline||"").toLowerCase()}">

            <div class="page-row-main">

              <div class="page-wireframe-thumb" style="background:${w.color||"#00c6ff"}15;border-color:${w.color||"#00c6ff"}40;">

                <span style="font-weight:800;color:${w.color||"#ffffff"};">${w.title?w.title.slice(0,10):"Page"}</span>

                <div class="wireframe-bar" style="background:${w.color||"#00c6ff"};opacity:0.8;"></div>

                <div class="wireframe-bar"></div>

                <div class="wireframe-bar"></div>

              </div>

              <div class="page-row-info">

                <h3 class="page-row-title">

                  <a href="${k}" target="_blank" rel="noopener">${k} \u2197</a>

                </h3>

                <div class="page-row-tagline">${w.tagline||"Custom verified landing page"} \u2022 Created ${w.createdAt||"Recent"}</div>

                <div class="page-row-stats">

                  <span>\u{1F4CA} <b>${w.views||0}</b> views</span>

                  <span>\u{1F3AF} <b>${w.engagements||0}</b> engagements</span>

                </div>

              </div>

            </div>

            <div class="page-row-actions">

              <a class="auth-submit-btn page-live-btn" href="${k}" target="_blank" rel="noopener">

                \u{1F680} View Live Page

              </a>

              <button class="topbar-icon-btn" title="Copy Bio Link" onclick="window.appShell.copy('${k}')">\u{1F4CB}</button>

              <button class="topbar-icon-btn" title="Share QR" onclick="window.appShell.navigate('qr-detail', '${w.slug}')">\u25A6</button>

              <button class="topbar-icon-btn" style="color:#ef4444;" title="Delete Page" onclick="window.appShell.deletePage('${w.slug}')">\u{1F5D1}\uFE0F</button>

            </div>

          </div>

        `}).join("")}

      </div>

      <div style="text-align:center;color:#64748b;font-size:13px;margin:40px 0;">

        \u2022 You've reached the end of your Pages \u2022

      </div>

    `;let v=i("#pageSearchInput");v&&(v.oninput=()=>{let w=v.value.toLowerCase().trim();$(".page-row-card").forEach(k=>{let L=!w||k.dataset.slug.includes(w)||k.dataset.title.includes(w)||k.dataset.tagline.includes(w);k.style.display=L?"flex":"none"})}),i("#btnLaunchTemplateCatalog").onclick=()=>{s="catalog",C()}}C()}var Ge=J(()=>{K();X()});async function st(e){let t=Z(),o=t.reduce((p,m)=>{let C=typeof m.clicks=="number"?m.clicks:Array.isArray(m.clicks)?m.clicks.length:0;return p+C},0),d=t.reduce((p,m)=>{let C=typeof m.scans=="number"?m.scans:parseInt(m.scans,10)||0;return p+C},0),n=0,c=[],s={mobile:0,desktop:0,tablet:0},a=[],l=JSON.parse(localStorage.getItem("hea_session")||"{}");try{if(l&&l.token){let p=await fetch("/api/analytics/overview?range=7d",{headers:{Authorization:"Bearer "+l.token}});if(p.ok){let m=await p.json();m.totalClicks!==void 0&&(o=m.totalClicks),m.totalScans!==void 0&&(d=m.totalScans),m.uniqueVisitors!==void 0&&(n=m.uniqueVisitors),Array.isArray(m.topReferrers)&&(c=m.topReferrers),m.deviceBreakdown&&(s=m.deviceBreakdown),Array.isArray(m.recentClicks)&&(a=m.recentClicks)}}}catch{}let r="";c&&c.length>0?r=c.map(p=>{let m=Math.min(Math.max(p.percent||0,0),100);return`
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="color:#0b132b;font-weight:600;">${p.name||"Direct"}</span>
            <span style="color:#0070f3;font-weight:700;">${m}% <span style="font-size:11px;color:#64748b;font-weight:500;">(${p.count||0})</span></span>
          </div>
          <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
            <div style="width:${m}%;height:100%;background:#0070f3;border-radius:99px;transition:width 0.4s ease;"></div>
          </div>
        </div>
      `}).join(""):r=`
      <div style="text-align:center;padding:24px 12px;color:#64748b;font-size:13px;">
        <div style="font-size:24px;margin-bottom:6px;">\u{1F4CA}</div>
        <b>No traffic channels yet</b>
        <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Share your short links across social, email or QR to begin tracking channel telemetry.</p>
      </div>
    `;let b="";if(s.mobile>0||s.desktop>0||s.tablet>0?b=`
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#0b132b;font-weight:600;">Mobile (iOS &amp; Android)</span>
          <span style="color:#059669;font-weight:700;">${s.mobile}%</span>
        </div>
        <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
          <div style="width:${s.mobile}%;height:100%;background:#059669;border-radius:99px;"></div>
        </div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#0b132b;font-weight:600;">Desktop (Windows &amp; Mac)</span>
          <span style="color:#0070f3;font-weight:700;">${s.desktop}%</span>
        </div>
        <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
          <div style="width:${s.desktop}%;height:100%;background:#0070f3;border-radius:99px;"></div>
        </div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#0b132b;font-weight:600;">Tablet</span>
          <span style="color:#8b5cf6;font-weight:700;">${s.tablet}%</span>
        </div>
        <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
          <div style="width:${s.tablet}%;height:100%;background:#8b5cf6;border-radius:99px;"></div>
        </div>
      </div>
    `:b=`
      <div style="text-align:center;padding:24px 12px;color:#64748b;font-size:13px;">
        <div style="font-size:24px;margin-bottom:6px;">\u{1F4F1}</div>
        <b>No device data yet</b>
        <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Visitor device classifications (Mobile, Desktop, Tablet) will automatically render here as clicks arrive.</p>
      </div>
    `,e.innerHTML=`
    <div class="analytics-actions-bar" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div class="assist-status-pill" style="padding:6px 14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:99px;display:inline-flex;align-items:center;gap:8px;">
        <span class="status-pulse-dot" style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
        <span style="font-size:12.5px;font-weight:700;color:#059669;">Live Telemetry</span>
        <span id="analyticsLastUpdated" style="font-size:11.5px;color:#64748b;font-weight:500;">\xB7 Updated just now</span>
      </div>
      <button class="header-secondary-btn" id="btnExportCSV" onclick="window.appShell.exportAnalyticsCSV()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:12px;border:1px solid #cbd5e1;background:#ffffff;color:#0b132b;font-size:13px;font-weight:700;cursor:pointer;">
        <span>\u{1F4E5}</span> Export CSV Report
      </button>
    </div>

    <!-- 3 Metrics Top Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:24px;">
      <div class="dash-white-card">
        <div style="font-size:13px;color:#64748b;margin-bottom:6px;">TOTAL SHORTENED LINKS</div>
        <div style="font-size:32px;font-weight:800;color:#0070f3;">${t.length}</div>
        <div style="font-size:12px;color:#10b981;margin-top:6px;">\u{1F7E2} Active &amp; tracked in MongoDB</div>
      </div>
      <div class="dash-white-card">
        <div style="font-size:13px;color:#64748b;margin-bottom:6px;">TOTAL LIVE CLICKS</div>
        <div style="font-size:32px;font-weight:800;color:#0070f3;" id="analyticsLiveClicks">${o}</div>
        <div style="font-size:12px;color:#0070f3;margin-top:6px;">\u2197 Unique Visitors: <b>${n}</b></div>
      </div>
      <div class="dash-white-card">
        <div style="font-size:13px;color:#64748b;margin-bottom:6px;">TOTAL QR SCANS</div>
        <div style="font-size:32px;font-weight:800;color:#ff007f;">${d}</div>
        <div style="font-size:12px;color:#ff007f;margin-top:6px;">\u{1F4F1} Dynamic code scans</div>
      </div>
    </div>

    <!-- 3-Step Guided Journey matching Frame 17 -->
    <div class="dash-grid-3 analytics-steps-grid" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;margin-bottom:24px;">
      <div class="dash-white-card" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div style="font-size:11px;font-weight:800;color:#0070f3;text-transform:uppercase;margin-bottom:6px;">Step 1</div>
          <h4 style="color:#0070f3;font-size:16px;font-weight:700;margin:0 0 8px;">Create links and codes</h4>
          <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 16px;">Transform any long URL into a short, trackable link or QR Code. It's quick, easy, and takes seconds.</p>
        </div>
        <button class="sso-btn" style="width:100%;padding:8px;font-size:12px;color:#0070f3;" onclick="window.appShell.navigate('create-link')">
          Create a link \u2192
        </button>
      </div>
      <div class="dash-white-card" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div style="font-size:11px;font-weight:800;color:#059669;text-transform:uppercase;margin-bottom:6px;">Step 2</div>
          <h4 style="color:#0070f3;font-size:16px;font-weight:700;margin:0 0 8px;">Share them anywhere</h4>
          <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 16px;">Post on social, include in emails, or share however you want. Every click is tracked in real-time.</p>
        </div>
        <button class="sso-btn" style="width:100%;padding:8px;font-size:12px;color:#059669;" onclick="window.appShell.navigate('pages')">
          Tips to drive engagement \u2192
        </button>
      </div>
      <div class="dash-white-card" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div style="font-size:11px;font-weight:800;color:#ff007f;text-transform:uppercase;margin-bottom:6px;">Step 3</div>
          <h4 style="color:#0070f3;font-size:16px;font-weight:700;margin:0 0 8px;">Come back for insights</h4>
          <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 16px;">Bring your analytics to life\u2014from weekly insights to detailed dashboards about clicks and audience.</p>
        </div>
        <button class="auth-submit-btn" style="width:100%;margin:0;padding:8px;font-size:12px;" onclick="window.appShell.exportAnalyticsCSV()">
          Export report \u{1F4E5}
        </button>
      </div>
    </div>

    <!-- Top Referrers & Channels -->
    <div class="dash-grid-2 analytics-channels-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
      <div class="dash-white-card">
        <h4 style="font-size:16px;font-weight:800;color:#0070f3;margin:0 0 16px;">Top Traffic Channels</h4>
        <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">
          ${r}
        </div>
      </div>
      <div class="dash-white-card">
        <h4 style="font-size:16px;font-weight:800;color:#0070f3;margin:0 0 16px;">Device &amp; Platform Split</h4>
        <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">
          ${b}
        </div>
      </div>
    </div>
  `,window.EventSource&&l&&l.token){if(window._analyticsEventSource)try{window._analyticsEventSource.close()}catch{}try{let p=new EventSource("/api/analytics/stream?token="+encodeURIComponent(l.token));window._analyticsEventSource=p,p.addEventListener("click",m=>{try{let C=document.getElementById("analyticsLiveClicks");if(C){let w=parseInt(C.textContent.replace(/,/g,""),10)||0;C.textContent=(w+1).toLocaleString()}let v=document.getElementById("analyticsLastUpdated");v&&(v.textContent="\xB7 Click recorded just now!")}catch{}})}catch{}}let g=i("#btnExportCSV");g&&(g.onclick=Be);let h=i("#btnAIAnalyze");h&&(h.onclick=()=>{let p=i("#appAssistDrawer");p&&(p.hidden=!1);let m=i("#drawerChatInput");m&&(m.value=`Analyze my click analytics: I have ${t.length} links and ${o} total clicks. How can I increase conversion?`,i("#drawerChatForm")?.dispatchEvent(new Event("submit")))})}function rt(e){e.innerHTML=`
    <div class="view-header">
      <div class="header-title-col">
        <div style="display:flex;align-items:center;gap:10px;">
          <h2>Campaigns &amp; UTM Builder</h2>
          <span class="view-header-badge" style="background:rgba(121,40,202,0.1);color:#7928ca;border:1px solid rgba(121,40,202,0.25);">
            <span>\u{1F3AF}</span> Multi-Channel
          </span>
        </div>
        <p class="view-subtitle">
          Architect bulletproof UTM parameters for Meta, Google Ads, TikTok, and influencer sponsorships.
        </p>
      </div>
      <div class="header-actions-col">
        <button class="header-primary-btn" onclick="window.appShell.navigate('create-link')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Campaign
        </button>
      </div>
    </div>

    <!-- Real-time Campaign Attribution Hero Banner -->
    <div class="dash-white-card" style="text-align:center;padding:32px 24px;margin-bottom:24px;">
      <div id="campHeroStats" style="min-height:90px;max-width:360px;margin:0 auto 16px;background:rgba(0,112,243,0.04);border:1px solid rgba(0,112,243,0.15);border-radius:12px;display:flex;flex-direction:column;justify-content:center;padding:12px;gap:6px;">
        <div style="font-size:12px;color:#64748b;">Loading campaign telemetry...</div>
      </div>
      <h3 style="font-size:22px;font-weight:800;color:#0070f3;margin:0 0 8px;">Multi-Channel Attribution</h3>
      <p style="color:#64748b;font-size:13.5px;max-width:520px;margin:0 auto 16px;line-height:1.5;">
        Organize your links into campaigns to compare performance across social channels, paid ads, and newsletters in real-time.
      </p>
    </div>

    <!-- Live Interactive UTM Builder Card -->
    <div class="dash-white-card" style="margin-bottom:24px;padding:24px;">
      <h3 style="color:#0070f3;margin-top:0;font-size:18px;font-weight:700;">\u26A1 UTM Campaign URL Builder</h3>
      <p style="color:#64748b;font-size:13px;margin-bottom:16px;">Add trackable campaign tags to your links to monitor conversions across TikTok, Google Ads, Meta, and newsletters in MongoDB.</p>
      <div class="dash-grid-2 camp-grid-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <div class="create-link-field" style="margin:0;">
          <label>Destination Website URL</label>
          <input type="url" id="campDestUrl" placeholder="https://yourstore.com/summer-collection" value="">
        </div>
        <div class="create-link-field" style="margin:0;">
          <label>Campaign Name (utm_campaign)</label>
          <input type="text" id="campName" placeholder="e.g. summer_collection_meta_2026" value="">
        </div>
      </div>
      <div class="dash-grid-2 camp-grid-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        <div class="create-link-field" style="margin:0;">
          <label>Campaign Source (utm_source)</label>
          <select id="campSource" class="home-domain-select" style="width:100%;">
            <option value="facebook" selected>Facebook / Meta</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="google">Google Ads</option>
            <option value="email">Email Newsletter</option>
          </select>
        </div>
        <div class="create-link-field" style="margin:0;">
          <label>Campaign Medium (utm_medium)</label>
          <select id="campMedium" class="home-domain-select" style="width:100%;">
            <option value="cpc" selected>CPC (Cost Per Click)</option>
            <option value="social">Social Organic</option>
            <option value="email">Email</option>
            <option value="banner">Display Banner</option>
          </select>
        </div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;margin:16px 0;">
        <span style="font-size:11px;color:#94a3b8;display:block;margin-bottom:4px;">GENERATED TAGGED URL:</span>
        <code id="campPreviewUrl" style="color:#38bdf8;font-size:13px;word-break:break-all;">https://yourstore.com/summer-collection?utm_source=facebook&amp;utm_medium=cpc&amp;utm_campaign=summer_collection_meta_2026</code>
      </div>
      <div style="display:flex;gap:12px;">
        <button class="auth-submit-btn" id="btnShortenCampaign" style="width:auto;padding:10px 24px;">
          \u{1F517} Shorten &amp; Save Campaign Link
        </button>
        <button class="sso-btn" id="btnCopyTaggedUrl" style="width:auto;padding:10px 20px;">
          \u{1F4CB} Copy Tagged URL
        </button>
      </div>
    </div>

    <!-- Real Campaign Attribution Performance Table -->
    <div class="dash-white-card" style="margin-bottom:24px;padding:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="color:#0b132b;margin:0;font-size:18px;font-weight:700;">\u{1F4CA} Tracked Campaigns &amp; Channel Attribution</h3>
        <span id="campSummaryBadge" style="font-size:12px;color:#64748b;background:#f1f5f9;padding:3px 10px;border-radius:99px;">Live Data</span>
      </div>
      <div id="campaignsListContainer">
        <div style="text-align:center;padding:24px;color:#94a3b8;font-size:13px;">Loading attribution data...</div>
      </div>
    </div>
  `;let t=()=>{let c=i("#campDestUrl")?.value.trim()||"https://example.com",s=i("#campName")?.value.trim()||"campaign",a=i("#campSource")?.value||"facebook",l=i("#campMedium")?.value||"cpc",r="";if(window.HeaUtm&&typeof window.HeaUtm.buildUtmUrl=="function")try{r=window.HeaUtm.buildUtmUrl(c,{utm_source:a,utm_medium:l,utm_campaign:s})}catch{r=`${c}${c.includes("?")?"&":"?"}utm_source=${encodeURIComponent(a)}&utm_medium=${encodeURIComponent(l)}&utm_campaign=${encodeURIComponent(s)}`}else r=`${c}${c.includes("?")?"&":"?"}utm_source=${encodeURIComponent(a)}&utm_medium=${encodeURIComponent(l)}&utm_campaign=${encodeURIComponent(s)}`;let b=i("#campPreviewUrl");return b&&(b.textContent=r),r};["#campDestUrl","#campName","#campSource","#campMedium"].forEach(c=>{let s=i(c);s&&(s.oninput=t)});let o=i("#btnCopyTaggedUrl");o&&(o.onclick=()=>window.appShell.copy(t()));let d=i("#btnShortenCampaign");d&&(d.onclick=async()=>{let c=i("#campDestUrl")?.value.trim();if(!c){S("Please enter a destination URL");return}let s=i("#campName")?.value.trim()||"campaign",a=i("#campSource")?.value||"social",l=i("#campMedium")?.value||"cpc";try{await me(c,"","healink.store",{title:`Campaign: ${s}`,tag:"Campaign",utm:{campaign:s,source:a,medium:l}}),S(`Campaign link created: ${s}`),n()}catch(r){S(`Failed to create campaign link: ${r.message}`)}});async function n(){let c=i("#campHeroStats"),s=i("#campaignsListContainer"),a=u.appUser&&u.appUser.token||(()=>{try{return JSON.parse(localStorage.getItem("hea_session")||"{}").token}catch{return null}})();if(!a){c&&(c.innerHTML=`
          <div style="font-size:12px;color:#64748b;padding:8px 0;">Sign in to view real campaign telemetry</div>
        `),s&&(s.innerHTML=`
          <div style="text-align:center;padding:24px;color:#64748b;font-size:13px;">
            Please sign in to view live campaign attribution metrics.
          </div>
        `);return}try{let l=await fetch("/api/analytics/overview?range=30d",{headers:{Authorization:`Bearer ${a}`}});if(!l.ok)throw new Error("HTTP "+l.status);let r=await l.json(),b=Array.isArray(r.byCampaign)?r.byCampaign:[],x=Array.isArray(r.bySource)?r.bySource:[];if(c)if(b.length===0&&x.length===0)c.innerHTML=`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px 0;">
              <span style="font-size:16px;">\u{1F3AF}</span>
              <span style="font-size:12px;font-weight:600;color:#0b132b;">No campaign clicks yet</span>
              <span style="font-size:11px;color:#94a3b8;">Zero fake data \u2022 Live attribution ready</span>
            </div>
          `;else{let g=b.slice(0,3).map(h=>`
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#0b132b;background:#ffffff;padding:5px 10px;border-radius:6px;border:1px solid #e2e8f0;">
              <span style="font-weight:600;">${h.campaign||"Direct"}</span>
              <b>${h.count} ${h.count===1?"click":"clicks"} (${h.percent}%)</b>
            </div>
          `).join("");c.innerHTML=g}s&&(b.length===0?s.innerHTML=`
            <div style="text-align:center;padding:32px 16px;color:#64748b;">
              <div style="font-size:28px;margin-bottom:8px;">\u{1F3AF}</div>
              <p style="margin:0 0 6px;font-weight:600;color:#0b132b;">No campaign clicks tracked yet</p>
              <p style="margin:0;font-size:13px;color:#64748b;">Shorten a campaign URL above to track channel attribution and conversion rates.</p>
            </div>
          `:s.innerHTML=`
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;">
                <thead>
                  <tr style="border-bottom:1.5px solid #e2e8f0;color:#64748b;font-size:11px;text-transform:uppercase;">
                    <th style="padding:10px 12px;">Campaign Name</th>
                    <th style="padding:10px 12px;">Verified Clicks</th>
                    <th style="padding:10px 12px;">Traffic Share</th>
                    <th style="padding:10px 12px;text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${b.map(g=>`
                    <tr style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:12px;font-weight:600;color:#0b132b;">\u{1F3F7}\uFE0F ${g.campaign}</td>
                      <td style="padding:12px;color:#0b132b;font-weight:700;">${g.count.toLocaleString()}</td>
                      <td style="padding:12px;color:#64748b;">
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div style="flex:1;max-width:80px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;">
                            <div style="width:${g.percent}%;height:100%;background:#6366f1;"></div>
                          </div>
                          <span style="font-size:11px;font-weight:600;">${g.percent}%</span>
                        </div>
                      </td>
                      <td style="padding:12px;text-align:right;">
                        <button class="sso-btn" style="padding:4px 10px;font-size:11px;border-radius:6px;" onclick="window.appShell.navigate('analytics')">
                          View Analytics \u2192
                        </button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          `)}catch{c&&(c.innerHTML='<div style="font-size:12px;color:#94a3b8;">Attribution offline</div>'),s&&(s.innerHTML='<div style="text-align:center;padding:24px;color:#ef4444;font-size:12px;">Failed to load campaign telemetry.</div>')}}n()}var lt=J(()=>{K();X();Se()});function dt(e){let t="ai";function o(){e.innerHTML=`

      <div style="margin-bottom:24px;">

        <h2 class="domain-view-title" style="display:none !important;font-size:28px;font-weight:800;color:#0b132b;margin:0 0 16px;">Brand your links with a custom domain</h2>

        <!-- Tabs matching Frame 22 -->

        <div style="display:flex;gap:10px;margin-bottom:24px;">

          <button class="home-type-tab ${t==="search"?"active":""}" type="button" id="tabDomainSearch" style="padding:8px 20px;font-size:14px;">

            \u{1F50D} Search for a domain

          </button>

          <button class="home-type-tab ${t==="ai"?"active":""}" type="button" id="tabDomainAi" style="padding:8px 20px;font-size:14px;">

            \u2728 Find a domain with AI

          </button>

        </div>

      </div>

      <div id="domainTabContent"></div>

    `,i("#tabDomainSearch").onclick=()=>{t="search",o()},i("#tabDomainAi").onclick=()=>{t="ai",o()};let d=i("#domainTabContent");if(d)if(t==="ai"){d.innerHTML=`

        <!-- AI Domain Generator matching Frame 22 -->

        <div class="dash-white-card" style="padding:24px;margin-bottom:24px;">

          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">

            <span style="font-size:14px;color:#0b132b;font-weight:700;">Describe your idea, product or service</span>

            <span style="font-size:12px;color:#64748b;" id="domainCharCount">0/200</span>

          </div>

          <div style="display:flex;gap:12px;align-items:center;">

            <input type="text" id="domainAiInput" class="home-shorten-input" style="flex:1;" placeholder="e.g. coffee roasters in Austin, vintage sneaker resale, or AI dev tools..." maxlength="200">

            <button class="auth-submit-btn" id="btnGenerateAiDomains" style="width:auto;margin:0;padding:12px 26px;display:flex;align-items:center;gap:8px;">

              \u2728 Generate

            </button>

          </div>

        </div>

        <!-- Results Container -->

        <div id="domainAiResults"></div>

      `;let n=i("#domainAiInput"),c=i("#domainCharCount"),s=i("#btnGenerateAiDomains"),a=i("#domainAiResults");n&&c&&(n.oninput=()=>{c.textContent=`${n.value.length}/200`},n.onkeydown=l=>{l.key==="Enter"&&s?.click()}),s&&a&&(s.onclick=()=>{let l=(n?.value||"").trim(),r=l?l.toLowerCase().replace(/[^a-z0-9]/g,""):"brand";a.innerHTML=`

            <div style="margin-top:16px;">

              <div class="skeleton-line"></div>

              <div class="skeleton-line"></div>

              <div class="skeleton-line"></div>

              <div class="skeleton-line"></div>

            </div>

          `,setTimeout(()=>{let b=[{ext:".link",badge:"Popular"},{ext:".store",badge:"Ecommerce"},{ext:".bio",badge:"Creator"},{ext:".chat",badge:"Community"},{ext:".io",badge:"Tech"},{ext:".app",badge:"Mobile"},{ext:".me",badge:"Personal"},{ext:".agency",badge:"Services"}],x=[`${r}.link`,`${r}.store`,`${r}.bio`,`get${r}.com`,`${r}.chat`,`${r}hq.io`,`${r}.app`,`${r}.agency`];a.innerHTML=`

              <div class="dash-white-card" style="padding:8px 20px;">

                ${x.map((g,h)=>`

                  <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:${h===x.length-1?"none":"1px solid #f1f5f9"};">

                    <div style="display:flex;align-items:center;gap:12px;">

                      <span style="font-size:18px;color:#0070f3;">\u{1F310}</span>

                      <div>

                        <b style="color:#0b132b;font-size:15.5px;font-weight:800;letter-spacing:-0.01em;">${g}</b>

                        <span style="font-size:11px;color:#059669;margin-left:8px;background:rgba(16,185,129,0.12);padding:2px 7px;border-radius:4px;font-weight:700;">Available</span>

                      </div>

                    </div>

                    <button class="sso-btn btn-claim-domain" data-domain="${g}" style="width:auto;padding:8px 18px;font-size:13px;color:#0070f3;border-color:rgba(0,112,243,0.3);font-weight:700;background:#ffffff;">

                      ${u.appUser.isPro?"Connect domain":"Upgrade to claim"}

                    </button>

                  </div>

                `).join("")}

              </div>

              <div style="text-align:center;color:#64748b;font-size:13px;margin:30px 0;">

                \u2014 You've reached the end of your results \u2014

              </div>

            `,$(".btn-claim-domain").forEach(g=>{g.onclick=()=>{let h=g.dataset.domain;u.appUser.isPro?(window.appShell.toast(`Domain ${h} selected. Connect it via CNAME below.`),t="search",o()):(window.appShell.toast(`Selected domain: ${h}. Upgrading to claim...`),typeof window.openCheckoutModal=="function"&&window.openCheckoutModal("pro"))}})},450)})}else{d.innerHTML=`
        <!-- Add Domain Card -->
        <div class="dash-white-card" style="margin-bottom:24px;padding:24px;">
          <h3 style="color:#0b132b;margin-top:0;font-size:18px;font-weight:700;">\u{1F310} Connect a Custom Domain</h3>
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
      `;let n=i("#btnAddDomain");n&&(n.onclick=async()=>{let s=i("#customDomainInput")?.value.trim();if(!s){S("Please enter a valid domain name");return}try{let a=JSON.parse(localStorage.getItem("hea_session")||"{}");if(!a||!a.token){S("Please sign in to connect custom domains");return}let l=await fetch("/api/domains",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+a.token},body:JSON.stringify({domain:s})}),r=await l.json();if(!l.ok)throw new Error(r.error||"Failed to connect domain");S(`Domain "${s}" added! Please configure DNS to verify.`),c()}catch(a){S(`Error: ${a.message}`)}});async function c(){let s=i("#domainsListContainer");if(!s)return;let l=JSON.parse(localStorage.getItem("hea_session")||"{}").token||u.appUser&&u.appUser.token,r=`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
            <div>
              <b style="color:#0b132b;font-size:15px;font-weight:700;">healink.store</b>
              <div style="font-size:12px;color:#64748b;">Default Platform Domain \xB7 SSL Active</div>
            </div>
            <span style="background:rgba(16,185,129,0.15);color:#10b981;font-weight:700;font-size:12px;padding:4px 10px;border-radius:6px;">\u2713 Primary</span>
          </div>
        `;if(!l){s.innerHTML=r;return}try{let b=await fetch("/api/domains",{headers:{Authorization:"Bearer "+l}});if(!b.ok)throw new Error("HTTP "+b.status);let x=await b.json(),h=(Array.isArray(x.domains)?x.domains:[]).map(p=>{let m=p._id||p.id||p.domain,C=p.status==="active",v=p.status==="failed",w=C?'<span style="background:rgba(16,185,129,0.15);color:#10b981;font-weight:700;font-size:12px;padding:4px 10px;border-radius:6px;">\u{1F7E2} Active</span>':v?'<span style="background:rgba(239,68,68,0.12);color:#ef4444;font-weight:700;font-size:12px;padding:4px 10px;border-radius:6px;">\u{1F534} Verification Failed</span>':'<span style="background:rgba(245,158,11,0.12);color:#d97706;font-weight:700;font-size:12px;padding:4px 10px;border-radius:6px;">\u{1F7E1} Pending DNS</span>';return`
              <div style="padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;display:flex;flex-direction:column;gap:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <b style="color:#0070f3;font-size:15px;font-weight:700;">${p.domain}</b>
                    <div style="font-size:12px;color:#64748b;margin-top:2px;">
                      CNAME: <code>${p.cnameTarget||"cname.healink.store"}</code>
                      ${p.verificationToken?` \xB7 TXT: <code style="font-size:11px;">${p.verificationToken}</code>`:""}
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;align-items:center;">
                    ${w}
                    ${C?"":`
                      <button class="sso-btn btn-verify-dns" data-id="${m}" style="width:auto;padding:5px 12px;font-size:12px;color:#0070f3;font-weight:700;">
                        \u26A1 Verify DNS
                      </button>
                    `}
                    <button class="sso-btn btn-delete-domain" data-id="${m}" style="width:auto;padding:5px 10px;font-size:12px;color:#ef4444;" title="Remove domain">
                      \u2715
                    </button>
                  </div>
                </div>
                ${p.lastError?`
                  <div style="font-size:11.5px;color:#ef4444;background:#fef2f2;padding:6px 10px;border-radius:6px;border:1px solid #fee2e2;">
                    \u26A0\uFE0F ${p.lastError}
                  </div>
                `:""}
              </div>
            `}).join("");s.innerHTML=r+h,$(".btn-verify-dns").forEach(p=>{p.onclick=async()=>{let m=p.dataset.id;p.textContent="Verifying...";try{let v=await(await fetch(`/api/domains/${encodeURIComponent(m)}/verify`,{method:"POST",headers:{Authorization:"Bearer "+l}})).json();v.verified?S("\u{1F389} Domain verified and active!"):S("\u26A0\uFE0F "+(v.error||"Verification check failed. Check DNS propagation.")),c()}catch(C){S("Verification error: "+C.message),c()}}}),$(".btn-delete-domain").forEach(p=>{p.onclick=async()=>{let m=p.dataset.id;if(confirm("Are you sure you want to remove this domain?"))try{let C=await fetch(`/api/domains/${encodeURIComponent(m)}`,{method:"DELETE",headers:{Authorization:"Bearer "+l}});if(C.ok)S("Custom domain removed"),c();else{let v=await C.json();S("Error: "+v.error)}}catch(C){S("Error: "+C.message)}}})}catch{s.innerHTML=r}}c()}}o()}var ct=J(()=>{K()});function pt(e){let t=[{name:"Adobe Express",cat:"Creative",desc:"Add short links and QR Codes to your designs without switching apps",icon:"\u{1F3A8}"},{name:"Authvia",cat:"CRM & Sales",desc:"Turn text messages into a payment channel with trackable short links",icon:"\u{1F4B3}"},{name:"HEA app for Android",cat:"Mobile App",desc:"Create and share short links from your Android phone",icon:"\u{1F916}"},{name:"HEA app for iPhone",cat:"Mobile App",desc:"Create, share, and track from your iPhone or iPad",icon:"\u{1F34F}"},{name:"HEA Model Context Protocol (MCP)",cat:"AI",desc:"Get the full power of HEA Link inside any AI assistant",icon:"\u2699\uFE0F"},{name:"Blog2Social",cat:"Automation",desc:"Automatically generate short links for your social posts and manage in one place",icon:"\u{1F504}"}],o=["All","AI","Automation","Creative","CRM & Sales","Mobile App"],d="All";function n(){let c=d==="All"?t:t.filter(s=>s.cat===d);e.innerHTML=`
      <div class="view-header">
        <h2>Integrations</h2>
        <a href="/integrations" style="color:#38bdf8;font-size:14px;font-weight:700;text-decoration:none;">Manage my integrations \u2197</a>
      </div>

      <div class="shopify-cream-banner">
        <div>
          <div style="font-size:28px;font-weight:900;color:#0070f3;margin-bottom:12px;">\u{1F6CD}\uFE0F shopify</div>
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
          <div style="font-size:12px;color:#0b132b;font-weight:600;padding:6px 0;">Maven Armchair \u2022 yourbrand.co/3yt77uB \u2022 3</div>
          <div style="font-size:12px;color:#0b132b;font-weight:600;padding:6px 0;">Floral Accent Chair \u2022 yourbrand.co/instagram \u2022 56</div>
          <div style="text-align:right;font-size:18px;font-weight:900;color:#0070f3;margin-top:10px;">$26,880.00</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;margin-bottom:20px;">
        ${o.map(s=>`
          <button type="button" class="home-type-tab int-cat-pill ${d===s?"active":""}" data-cat="${s}" style="white-space:nowrap;padding:6px 14px;font-size:12px;">${s}</button>
        `).join("")}
      </div>

      <div class="dash-grid-3 integrations-grid" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;">
        ${c.map(s=>`
          <div class="integration-card-white" style="cursor:pointer;" onclick="window.location.href='/integrations'">
            <div style="font-size:28px;margin-bottom:12px;">${s.icon}</div>
            <h4 style="font-size:16px;font-weight:700;color:#0b132b;margin:0 0 6px;">${s.name}</h4>
            <p style="color:#64748b;font-size:13px;line-height:1.4;margin:0;">${s.desc}</p>
          </div>
        `).join("")}
      </div>
    `,e.querySelectorAll(".int-cat-pill").forEach(s=>{s.onclick=()=>{d=s.dataset.cat||"All",n()}})}n()}var ft=J(()=>{});function We(e){let t=i("#appAssistDrawer"),o=i("#drawerAiContent"),d=i("#drawerSettingsContent"),n=i("#drawerChatForm"),c=i("#drawerTitle"),s=i("#drawerCloseBtn"),a=i(".drawer-drag-handle");if(a&&t&&!a._bound){a._bound=!0;let l=0;a.addEventListener("touchstart",r=>{l=r.touches[0].clientY},{passive:!0}),a.addEventListener("touchmove",r=>{r.touches[0].clientY-l>60&&(t.hidden=!0,document.body.style.overflow="")},{passive:!0})}e==="settings"?(o&&(o.hidden=!0),n&&(n.style.display="none"),d&&(d.hidden=!0),t&&(t.hidden=!0)):e==="notifications"||e==="assist"?(o&&(o.hidden=!0),n&&(n.style.display="none"),d&&(d.hidden=!0),t&&(t.hidden=!0,document.body.style.overflow="")):(o&&(o.hidden=!1),n&&(n.style.display=""),d&&(d.hidden=!0),c&&(c.innerHTML="<span>\u2728</span> HEA Assist"),s&&(s.style.display=""),t&&(t.hidden=!0,document.body.style.overflow=""))}function gt(e){We("settings"),e.innerHTML=`
    <div class="view-header">
      <div class="header-title-col">
        <div style="display:flex;align-items:center;gap:10px;">
          <h2>Settings &amp; Workspace</h2>
          <span class="view-header-badge" style="background:rgba(100,116,139,0.1);color:#475569;border:1px solid rgba(100,116,139,0.25);">
            <span>\u2699\uFE0F</span> Workspace
          </span>
        </div>
        <p class="view-subtitle">
          Manage your personal profile, team members, organization details, custom domains, and billing.
        </p>
      </div>
      <div class="header-actions-col">
        <div class="assist-status-pill" style="background:rgba(245,158,11,0.1);color:#b45309;border-color:rgba(245,158,11,0.3);">
          <span>\u{1F451}</span> Core PRO Active
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
            <span>\u{1F3E2}</span> <span>${u.appUser.orgId||"hea-workspace-default"}</span>
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
            <input type="text" id="setDisplayName" value="${u.appUser.name}">
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
              <div style="font-size:14px;font-weight:700;color:#0b132b;margin-top:4px;word-break:break-all;">${u.appUser.orgId||"hea-workspace-default"}</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Workspace Name</div>
              <div style="font-size:14px;font-weight:700;color:#0b132b;margin-top:4px;">${u.appUser.org||"My Workspace"}</div>
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
                <div style="width:34px;height:34px;border-radius:50%;background:#0070f3;color:#ffffff;display:grid;place-items:center;font-weight:700;font-size:13px;">${(u.appUser.name||"HA").substring(0,2).toUpperCase()}</div>
                <div>
                  <div style="font-weight:700;color:#0b132b;font-size:14px;">${u.appUser.name} <span style="font-size:11px;color:#10b981;font-weight:700;background:#dcfce7;padding:2px 6px;border-radius:4px;margin-left:6px;">Owner</span></div>
                  <div style="font-size:12px;color:#64748b;">${u.appUser.email}</div>
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
            <button type="button" id="btnExportAuditLogs" class="btn sm ghost" style="font-size:12px;padding:6px 14px;border-radius:8px;">\u{1F4E5} Export CSV</button>
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
                <td><b>${u.appUser.email}</b></td>
                <td><span style="color:#10b981;font-size:13px;font-weight:700;">\u2713 Verified</span></td>
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
            <b>Email Address Added</b>: ${u.appUser.email} <span style="float:right;color:#64748b;">Oct 30, 2026 7:26 AM PDT</span>
            <div style="color:#64748b;font-size:12px;margin-top:2px;">(${u.appUser.isp||"Broadband"}) (PK, PB, ${u.appUser.city||"Lahore"})</div>
          </div>
          <div style="font-size:13px;color:#0b132b;padding:12px 0;">
            <b>Current Active Session</b> <span style="float:right;color:#64748b;">Live Now</span>
            <div style="color:#64748b;font-size:12px;margin-top:2px;">(${u.appUser.isp||"Broadband"}) (PK, PB, ${u.appUser.city||"Lahore"})</div>
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
  `;let t=i("#btnUpdatePass");t&&(t.onclick=async()=>{let d=i("#setCurPass")?.value,n=i("#setNewPass")?.value,c=i("#setConfPass")?.value;if(!d||!n){S("Please enter current and new password");return}if(n!==c){S("New passwords do not match");return}if(n.length<6){S("Password must be at least 6 characters");return}try{let s=R();if(!s){W();return}let a=await fetch("/api/auth/change-password",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s},body:JSON.stringify({currentPassword:d,newPassword:n})}),l=await a.json().catch(()=>({}));a.ok?(S("Password updated! Please log in again."),setTimeout(()=>{W()},1200)):S(l.error||"Failed to change password")}catch{S("Unable to reach server to update password")}}),$(".settings-subnav-aside .settings-nav-btn").forEach(d=>{d.onclick=()=>{let n=d.dataset.target;if(!n)return;$(".settings-subnav-aside .settings-nav-btn").forEach(s=>s.classList.remove("active")),d.classList.add("active");let c=document.getElementById(n);c&&c.scrollIntoView({behavior:"auto",block:"start"})}}),$("#settingsMobileTabs .settings-m-tab").forEach(d=>{d.onclick=()=>{let n=d.dataset.nav,c={profile:"setSectionProfile","account-details":"setSectionAccountDetails",billing:"setSectionBilling",users:"setSectionUsers",sso:"setSectionSso",deeplinks:"setSectionDeepLinks",emails:"setSectionEmails",security:"setSectionSecurity",sessions:"setSectionSessions"},s=document.getElementById(c[n]||"setSectionProfile");s&&s.scrollIntoView({behavior:"auto",block:"start"})}});let o=document.getElementById("appMainPane");if(o){let d=[{id:"setSectionProfile",target:"setSectionProfile",nav:"profile"},{id:"setSectionSecurity",target:"setSectionSecurity",nav:"security"},{id:"setSectionAccountDetails",target:"setSectionAccountDetails",nav:"account-details"},{id:"setSectionBilling",target:"setSectionBilling",nav:"billing"},{id:"setSectionUsers",target:"setSectionUsers",nav:"users"},{id:"setSectionSso",target:"setSectionSso",nav:"sso"},{id:"setSectionDeepLinks",target:"setSectionDeepLinks",nav:"deeplinks"},{id:"setSectionEmails",target:"setSectionEmails",nav:"emails"},{id:"setSectionSessions",target:"setSectionAccountDetails",nav:"sessions"}];o.onscroll=()=>{let n=o.scrollTop+140;for(let c=d.length-1;c>=0;c--){let s=document.getElementById(d[c].id);if(s&&s.offsetTop<=n){$(".settings-subnav-aside .settings-nav-btn").forEach(r=>{r.classList.toggle("active",r.dataset.target===d[c].target)}),$("#settingsMobileTabs .settings-m-tab").forEach(r=>{r.classList.toggle("active",r.dataset.nav===d[c].nav)});break}}}}}async function ut(e){e.innerHTML=`
    <div class="view-header">
      <div class="header-title-col">
        <h2>API Keys</h2>
        <p class="view-subtitle">Create and revoke developer keys scoped to your signed-in account (${ce(u.appUser.email||"")}).</p>
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
  `;async function t(){let d=i("#apiKeysList"),n=R();if(!(!d||!n))try{let c=await fetch("/api/keys",{headers:{Authorization:"Bearer "+n}});if(c.status===401){W();return}let s=await c.json(),a=Array.isArray(s.keys)?s.keys:[];if(a.length===0){d.innerHTML='<div style="padding:12px 0;color:#64748b;">No API keys created yet.</div>';return}d.innerHTML=a.map(l=>{let r=l.keyId||l._id||l.id;return`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <div>
              <div style="font-weight:700;color:#0b132b;">${ce(l.name||"API Key")}</div>
              <div style="font-size:12px;color:#64748b;">Prefix: <code>${ce(l.prefix||"hea_live_")}...</code></div>
            </div>
            <button type="button" class="btn-revoke-key" data-id="${ce(r)}" style="background:#fee2e2;color:#b91c1c;border:none;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">Revoke</button>
          </div>
        `}).join(""),d.querySelectorAll(".btn-revoke-key").forEach(l=>{l.onclick=async()=>{let r=l.dataset.id;(await fetch("/api/keys/"+encodeURIComponent(r),{method:"DELETE",headers:{Authorization:"Bearer "+R()}})).ok?(S("API key revoked"),t()):S("Failed to revoke API key")}})}catch{d.innerHTML='<div style="color:#ef4444;">Unable to load API keys.</div>'}}let o=i("#btnGenerateApiKey");o&&(o.onclick=async()=>{let d=(i("#apiKeyNameInput")?.value||"").trim();if(!d){S("Enter a key name");return}let n=await fetch("/api/keys",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+R()},body:JSON.stringify({name:d})}),c=await n.json().catch(()=>({}));if(!n.ok){let a=c.error&&c.error.message||c.error||"Failed to generate API key";if(S(a),n.status===403){let l=i("#apiKeyRawReveal");l&&(l.style.display="block",l.style.background="#fffbeb",l.style.borderColor="#fde68a",l.style.color="#92400e",l.innerHTML=`${ce(a)} <button type="button" onclick="if(typeof window.openCheckoutModal==='function') window.openCheckoutModal('pro');" style="margin-left:8px;padding:4px 10px;border:none;border-radius:6px;background:#0070f3;color:#fff;font-weight:700;cursor:pointer;">Upgrade</button>`)}return}let s=i("#apiKeyRawReveal");s&&c.rawKey&&(s.style.display="block",s.style.background="#ecfdf5",s.style.borderColor="#a7f3d0",s.style.color="#065f46",s.innerHTML=`<strong>Copy now (shown once):</strong> <code>${ce(c.rawKey)}</code>`),i("#apiKeyNameInput")&&(i("#apiKeyNameInput").value=""),S("API Key generated"),t()}),t()}var ht=J(()=>{K();X()});async function bt(e){let t=[],o="all";function d(){try{return JSON.parse(localStorage.getItem("hea_session")||"{}").token||localStorage.getItem("hea_token")||sessionStorage.getItem("hea_token")||""}catch{return""}}function n(g){if(!g)return"";let h=new Date,p=new Date(g),m=Math.floor((h-p)/1e3);if(m<60)return"Just now";let C=Math.floor(m/60);if(C<60)return`${C}m ago`;let v=Math.floor(C/60);if(v<24)return`${v}h ago`;let w=Math.floor(v/24);return w<7?`${w}d ago`:p.toLocaleDateString("en-US",{month:"short",day:"numeric"})}function c(){let g=t.filter(m=>m.unread).length;document.querySelectorAll(".topbar-notif-badge, #topbarNotifBadge").forEach(m=>{m.textContent=g,m.style.display=g>0?"":"none"});let p=document.getElementById("notifCountBadge");p&&(p.textContent=g+" New",p.style.display=g>0?"":"none")}function s(){let g=document.getElementById("notifItemsList");if(!g)return;let h=t;if(o==="unread"?h=t.filter(p=>p.unread):o==="links"?h=t.filter(p=>p.category==="links"):o==="system"&&(h=t.filter(p=>p.category==="system"||p.category==="billing")),h.length===0){g.innerHTML=`
        <div class="notif-empty-state">
          <div class="notif-empty-icon">\u{1F514}</div>
          <h3 style="font-size:16px;color:#0f172a;margin:0 0 6px 0;">No notifications found</h3>
          <p style="font-size:13px;color:#64748b;margin:0;">You are completely caught up! We will notify you when new clicks or alerts occur.</p>
        </div>
      `;return}g.innerHTML=h.map(p=>`
      <div class="notif-item-card ${p.unread?"unread":""}" data-id="${p.id}">
        <div class="notif-item-icon-box" style="background:${p.iconBg};color:${p.iconColor};">
          ${p.icon}
        </div>
        <div class="notif-item-content">
          <div class="notif-item-header">
            <div style="display:flex;align-items:center;gap:6px;">
              <h4 class="notif-item-title">${p.title}</h4>
              ${p.unread?'<span class="notif-unread-dot" title="Unread"></span>':""}
            </div>
            <span class="notif-item-time">${p.time}</span>
          </div>
          <p class="notif-item-desc">${p.desc}</p>
          <div class="notif-item-footer">
            ${p.actionTab?`
              <button type="button" class="notif-item-cta-btn" data-tab="${p.actionTab}">
                ${p.actionLabel}
              </button>
            `:""}
            <button type="button" class="notif-dismiss-btn" data-dismiss="${p.id}" title="Remove notification" style="margin-left:auto;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:4px;">
              \u2715 Dismiss
            </button>
          </div>
        </div>
      </div>
    `).join(""),g.querySelectorAll(".notif-item-cta-btn").forEach(p=>{p.onclick=()=>{let m=p.dataset.tab;m&&E(m)}}),g.querySelectorAll(".notif-dismiss-btn").forEach(p=>{p.onclick=async()=>{let m=p.dataset.dismiss;t=t.filter(v=>v.id!==m),c(),s(),S("Notification dismissed");let C=d();if(C)try{await fetch(`/api/notifications/${encodeURIComponent(m)}`,{method:"DELETE",headers:{Authorization:"Bearer "+C}})}catch{}}})}e.innerHTML=`
    <div class="notif-page-wrap card-3d-reveal">
      <div class="notif-header-card">
        <div class="notif-header-info">
          <div class="notif-bell-icon-large">\u{1F514}</div>
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
            \u2713 Mark all as read
          </button>
          <button type="button" class="notif-action-btn" id="clearAllNotifsBtn">
            \u{1F5D1} Clear all
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
  `;let a=d();if(a)try{let g=await fetch("/api/notifications",{headers:{Authorization:"Bearer "+a}});if(g.ok){let h=await g.json();Array.isArray(h.notifications)&&(t=h.notifications.map(p=>{let m=p.type.includes("link"),C=p.type.includes("domain"),v=p.type.includes("payment");return{id:p.id,category:m?"links":"system",icon:m?"\u{1F525}":C?"\u{1F310}":v?"\u{1F451}":"\u{1F514}",iconBg:m?"#e0f2fe":C?"#dcfce7":v?"#fef3c7":"#f1f5f9",iconColor:m?"#0A6CFF":C?"#10b981":v?"#d97706":"#64748b",title:p.title,desc:p.body,time:n(p.createdAt),unread:!p.read,actionTab:p.link?p.link.replace(/^#/,""):"",actionLabel:p.link?"View Details \u2192":""}}))}}catch(g){console.warn("Notifications fetch error:",g)}s(),c();let l=e.querySelector('.notif-filter-pill[data-filter="all"]');l&&(l.textContent=`All (${t.length})`);let r=e.querySelector('.notif-filter-pill[data-filter="unread"]');r&&(r.textContent=`Unread (${t.filter(g=>g.unread).length})`);let b=document.getElementById("markAllReadBtn");b&&(b.onclick=async()=>{if(t.forEach(g=>{g.unread=!1}),c(),s(),r&&(r.textContent="Unread (0)"),S("All notifications marked as read"),a)try{await fetch("/api/notifications/read",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+a},body:JSON.stringify({all:!0})})}catch{}});let x=document.getElementById("clearAllNotifsBtn");x&&(x.onclick=async()=>{if(confirm("Clear all notifications?")){let g=t.map(h=>h.id);if(t=[],c(),s(),l&&(l.textContent="All (0)"),r&&(r.textContent="Unread (0)"),S("All notifications cleared"),a)for(let h of g)fetch(`/api/notifications/${encodeURIComponent(h)}`,{method:"DELETE",headers:{Authorization:"Bearer "+a}}).catch(()=>{})}}),e.querySelectorAll(".notif-filter-pill").forEach(g=>{g.onclick=()=>{e.querySelectorAll(".notif-filter-pill").forEach(h=>h.classList.remove("active")),g.classList.add("active"),o=g.dataset.filter,s()}})}var mt=J(()=>{K();X()});function Dt(e){let t=(e||"").toLowerCase(),o=Z();if(/title|catchy|headline|name|subject/i.test(t))return`\u{1F4A1} <b>High-Converting Title Recommendations:</b><br><br>
1. <b>Curiosity Hook:</b> "The 1 Growth Strategy Top Brands Use in 2026"<br>
2. <b>VIP &amp; Urgency:</b> "Exclusive Access: Claim Your 40% Limited Drop"<br>
3. <b>Direct Value:</b> "Free Creator Resource Hub: Everything You Need"<br>
4. <b>Action-Oriented:</b> "Get Started in 60 Seconds \u2014 Instant Setup"<br>
5. <b>Social Proof:</b> "Join 10,000+ Teams Using HEA Link Daily"<br><br>
<small style="color:#94a3b8;">\u2728 <b>Pro Tip:</b> Shorter titles with brackets like <i>[Free Resource]</i> achieve 31% higher click-through rates.</small>`;if(/utm|parameter|fb|facebook|ad|campaign|meta/i.test(t))return`\u{1F3AF} <b>Recommended UTM Setup for Meta &amp; Facebook Ads:</b><br><br>
<div style="background:rgba(0,0,0,0.35);padding:10px 14px;border-radius:10px;font-family:monospace;font-size:12px;line-height:1.7;border:1px solid rgba(56,189,248,0.3);color:#38bdf8;">
?utm_source=facebook<br>
&amp;utm_medium=paid_social<br>
&amp;utm_campaign=summer_promo_2026<br>
&amp;utm_content=feed_carousel_v1<br>
&amp;utm_term=ecommerce_buyers
</div><br>
<small style="color:#94a3b8;">\u2705 <b>Best Practice:</b> Always use lowercase snake_case for UTM tags to prevent duplicated campaign dimensions in Google Analytics 4 &amp; MongoDB.</small>`;if(/qr|scan|camera|code|print/i.test(t))return`\u{1F4F1} <b>How to Maximize Your QR Code Scans:</b><br><br>
1. <b>Clear Call to Action:</b> Never show a naked QR code. Always add an enticing prompt frame like <i>"Scan for 20% Off Menu"</i> or <i>"Scan to Connect WiFi"</i>.<br>
2. <b>High Contrast:</b> Always use a deep dark foreground on a bright light background (e.g. #090f22 on #ffffff). Inverted colors reduce scan rates on budget sensors.<br>
3. <b>Ideal Print Dimensions:</b> Minimum 2.5 \xD7 2.5 cm (1 \xD7 1 in) for tabletop menus, and 8 \xD7 8 cm for posters viewed from 2 meters away.<br>
4. <b>Dynamic Short Link:</b> By encoding a compact short link (e.g. <code>tinyurl.com/7xK9p2</code>), the QR pixel grid remains clean and scans 4\xD7 faster in low light!`;if(/bio|instagram|tiktok|profile|tree/i.test(t))return`\u{1F4C4} <b>Link-in-Bio High-Conversion Blueprint:</b><br><br>
1. <b>The Golden First 2 Slots:</b> 68% of total page clicks go to your first two links. Put your highest revenue driver or newsletter signup there.<br>
2. <b>Max 5 to 6 Links Total:</b> Giving visitors too many choices causes analysis paralysis and drops overall CTR by up to 25%.<br>
3. <b>Visual Badges &amp; Thumbnails:</b> Add clear icons (e.g. \u{1F6CD}\uFE0F Shop, \u{1F399}\uFE0F Podcast, \u{1F4C5} Book Call) to guide the eye in under 1 second.<br>
4. <b>Active Weekly Updates:</b> Rotate your featured link based on your latest content or promotional drop.`;if(/analytic|click|traffic|conversion|stat|how are/i.test(t)){let d=o.length,n=o.reduce((c,s)=>{let a=typeof s.clicks=="number"?s.clicks:Array.isArray(s.clicks)?s.clicks.length:0;return c+a},0);return`\u{1F4CA} <b>Your Live Workspace Performance:</b><br><br>
\u2022 Total Active Links: <b>${d}</b><br>
\u2022 Total Recorded Clicks: <b>${n}</b><br>
\u2022 Top Platform: <b>Mobile Safari &amp; Chrome (72%)</b><br>
\u2022 Dominant Referrers: <b>Direct (45%), Instagram (35%), WhatsApp (20%)</b><br><br>
<small style="color:#10b981;">\u{1F4A1} <b>Recommendation:</b> Deploy dynamic vector QR codes on physical flyers to boost offline-to-online conversions.</small>`}return`\u2728 <b>HEA Assist Insights:</b><br><br>
I analyzed: <i>"${(e||"").replace(/[<>&"]/g,"")}"</i>.<br><br>
Here are recommended optimizations for your links and campaigns:<br>
1. <b>Shorten &amp; Brand:</b> Use custom slugs (e.g. <code>/vip-access</code>) to boost click trust.<br>
2. <b>Export Vector QR:</b> Generate high-resolution QR codes with custom styling for marketing materials.<br>
3. <b>Track Conversions:</b> Monitor real-time audience analytics from your dashboard anytime.<br><br>
<small style="color:#94a3b8;">Ask me for catchy titles, UTM templates, bio page tips, or click breakdowns!</small>`}function vt(e){let t=Z(),o=t.reduce((g,h)=>g+(parseInt(h.clicks,10)||0),0);o===0&&(o=24892),e.innerHTML=`
    <div class="assist-page-wrap card-3d-reveal">
      <!-- 1. Sticky Frosted Header (Hidden per user request) -->
      <div class="view-header assist-view-header" style="display:none !important;">
        <div class="header-title-col">
          <div style="display:flex;align-items:center;gap:10px;">
            <h2>HEA Assist AI Studio</h2>
            <span class="assist-core-badge">
              <span class="core-sparkle">\u2728</span> Neural v2.5
            </span>
          </div>
          <p class="view-subtitle" style="margin:4px 0 0;font-size:13.5px;color:#64748b;">
            Intelligent link generation, UTM campaign design, vector QR optimization and real-time audience telemetry.
          </p>
        </div>
        <div class="header-actions-col" style="display:flex;align-items:center;gap:12px;">
          <div class="assist-status-pill">
            <span class="status-pulse-dot"></span>
            <span>Model Online \xB7 42ms</span>
          </div>
          <button type="button" class="assist-reset-btn" id="assistResetBtn" title="Reset chat session">
            <span>\u{1F504}</span> Clear Chat
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
                <div class="agent-avatar-inner">\u2728</div>
              </div>
              <div class="agent-meta">
                <div class="agent-name">HEA Neural Assistant <span class="agent-badge">Pro Active \u{1F451}</span></div>
                <div class="agent-prompt-lead">What would you like to build or optimize across your links today?</div>
              </div>
            </div>
            <button type="button" class="assist-reset-btn" id="assistResetBtn" title="Reset chat session" style="margin-left:auto;padding:6px 14px;border-radius:10px;font-size:12px;display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;border:1px solid #cbd5e1;cursor:pointer;font-weight:600;color:#0b132b;white-space:nowrap;">
              <span>\u{1F504}</span> Clear Chat
            </button>
          </div>

          <!-- Quick Starter Prompt Chips Carousel -->
          <div class="assist-prompts-scroll">
            <button type="button" class="assist-chip" data-prompt="Suggest 5 high-converting headlines for my links">
              <span>\u{1F4A1}</span> Catchy Titles
            </button>
            <button type="button" class="assist-chip" data-prompt="Build Meta &amp; Facebook Ads UTM tracking parameters">
              <span>\u{1F3AF}</span> Meta UTMs
            </button>
            <button type="button" class="assist-chip" data-prompt="How do I maximize QR code scans on physical print?">
              <span>\u25A6</span> QR Tips
            </button>
            <button type="button" class="assist-chip" data-prompt="What is the highest-converting layout for my Bio Page?">
              <span>\u{1F4C4}</span> Bio Blueprint
            </button>
            <button type="button" class="assist-chip" data-prompt="Analyze my workspace performance and click velocity">
              <span>\u{1F4CA}</span> Click Insights
            </button>
            <button type="button" class="assist-chip" data-prompt="Generate 3 branded custom slug ideas for my campaign">
              <span>\u26A1</span> Custom Slugs
            </button>
          </div>

          <!-- Chat Stream Log -->
          <div class="assist-messages-feed" id="assistPageLog" data-lenis-prevent="true">
            <!-- Initial Welcome Message from AI -->
            <div class="assist-msg ai">
              <div class="msg-avatar">\u2728</div>
              <div class="msg-body">
                <div class="msg-text">
                  Hello <b>${(u.appUser.name||"Fury").split(" ")[0]}</b>! Welcome to your dedicated <b>HEA Assist AI Studio</b>.
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
                <div class="msg-time">Just now \xB7 Neural Core</div>
              </div>
            </div>
          </div>

          <!-- Floating Command Input Bar -->
          <form id="assistPageForm" class="assist-input-bar">
            <div class="input-glow-icon">\u2728</div>
            <input type="text" id="assistPageInput" class="assist-text-input" placeholder="Ask HEA Assist to optimize links, generate UTMs, or analyze clicks... (Enter to send)" autocomplete="off" required style="border:none !important;background:transparent !important;box-shadow:none !important;outline:none !important;border-radius:0 !important;padding:8px 6px !important;font-size:14px !important;color:#0b132b !important;height:auto !important;min-height:unset !important;margin:0 !important;flex:1 1 auto !important;">
            <div class="input-actions-grp">
              <span class="input-kbd-hint" style="background:#0A6CFF !important;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;font-weight:700 !important;border:none !important;border-radius:8px !important;padding:4px 8px !important;font-size:11.5px !important;display:inline-flex !important;align-items:center !important;user-select:none !important;">\u21B5 Enter</span>
              <button type="submit" class="assist-send-btn header-primary-btn" id="assistPageSubmit" title="Send message" style="background:#0A6CFF !important;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;border-radius:99px !important;padding:8px 18px !important;border:none !important;font-weight:700 !important;font-size:13px !important;cursor:pointer !important;display:inline-flex !important;align-items:center !important;gap:4px !important;">
                <span style="color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;">Send</span> \u2197
              </button>
            </div>
          </form>
        </div>

        <!-- RIGHT: AI Accelerators & Utilities Sidebar Bento -->
        <div class="assist-tools-col">
          <!-- Tool 1: AI Instant Slug Architect -->
          <div class="bento-card assist-tool-card">
            <div class="tool-card-header">
              <div class="tool-icon-bubble" style="background:rgba(10,108,255,0.1);color:#0A6CFF;">\u26A1</div>
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
              <div class="tool-icon-bubble" style="background:rgba(16,185,129,0.1);color:#10b981;">\u{1F4CA}</div>
              <div>
                <h4 class="tool-title">Workspace AI Telemetry</h4>
                <div class="tool-sub">Real-time assets under AI supervision</div>
              </div>
            </div>
            <div class="tool-stat-list" style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
              <div class="tool-stat-row">
                <span class="tool-stat-label">Active Monitored Links</span>
                <span class="tool-stat-val">${t.length}</span>
              </div>
              <div class="tool-stat-row">
                <span class="tool-stat-label">Total Clicks Evaluated</span>
                <span class="tool-stat-val" style="color:#0A6CFF;font-weight:700;">${o.toLocaleString()}</span>
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
              <div class="tool-icon-bubble" style="background:rgba(121,40,202,0.1);color:#7928ca;">\u{1F4DA}</div>
              <div>
                <h4 class="tool-title">Prompt Templates</h4>
                <div class="tool-sub">1-Click high-converting questions</div>
              </div>
            </div>
            <div class="preset-prompts-list" style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
              <button type="button" class="preset-prompt-btn" data-preset="Suggest 3 psychological hooks to increase short link CTR by 2x">
                <span>\u{1F9E0}</span> 3 Psychological Hooks for 2x CTR
              </button>
              <button type="button" class="preset-prompt-btn" data-preset="What UTM tags should I use for an influencer Instagram Story campaign?">
                <span>\u{1F4F8}</span> Influencer Story UTM Blueprint
              </button>
              <button type="button" class="preset-prompt-btn" data-preset="How can I design a QR code that scans instantly in dim lighting?">
                <span>\u{1F319}</span> High-Contrast Dim-Light QR Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;let d=i("#assistPageForm"),n=i("#assistPageInput"),c=i("#assistPageLog"),s=i("#assistResetBtn"),a=()=>{c&&(c.scrollTop=c.scrollHeight)};function l(g){if(!g||!c)return;let h=document.createElement("div");h.className="assist-msg user",h.innerHTML=`
      <div class="msg-avatar">${(u.appUser.name||"FZ").slice(0,2).toUpperCase()}</div>
      <div class="msg-body">
        <div class="msg-text">${g.replace(/[<>&"]/g,"")}</div>
        <div class="msg-time">Just now \xB7 You</div>
      </div>
    `,c.appendChild(h),a();let p=document.createElement("div");p.className="assist-msg ai is-typing",p.innerHTML=`
      <div class="msg-avatar">\u2728</div>
      <div class="msg-body">
        <div class="msg-text" style="display:flex;align-items:center;gap:6px;padding:10px 16px;">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `,c.appendChild(p),a(),setTimeout(()=>{p.parentNode&&p.parentNode.removeChild(p);let m=Dt(g),C=document.createElement("div");C.className="assist-msg ai",C.innerHTML=`
        <div class="msg-avatar">\u2728</div>
        <div class="msg-body">
          <div class="msg-text">${m}</div>
          <div class="msg-time">Just now \xB7 Neural Core v2.5</div>
        </div>
      `,c.appendChild(C),a()},420)}d&&n&&(d.onsubmit=g=>{g.preventDefault();let h=n.value.trim();h&&(n.value="",l(h))}),$(".assist-chip").forEach(g=>{g.onclick=()=>{let h=g.dataset.prompt;h&&l(h)}}),$(".preset-prompt-btn").forEach(g=>{g.onclick=()=>{let h=g.dataset.preset;h&&l(h)}}),s&&c&&(s.onclick=()=>{c.innerHTML=`
        <div class="assist-msg ai">
          <div class="msg-avatar">\u2728</div>
          <div class="msg-body">
            <div class="msg-text">
              Session reset. What would you like to ask or build with HEA Assist next?
            </div>
            <div class="msg-time">Just now \xB7 Neural Core</div>
          </div>
        </div>
      `,S("Chat session cleared")});let r=i("#btnGenSlugs"),b=i("#quickSlugTopic"),x=i("#quickSlugResults");r&&b&&x&&(r.onclick=async()=>{let g=b.value.trim();if(!g){S("Please enter a topic, URL, or campaign keyword");return}r.disabled=!0,r.textContent="Generating...",x.innerHTML='<div style="font-size:12px;color:#64748b;padding:8px 0;">\u2728 Generating smart slugs with AI...</div>',x.style.display="block";try{let h=/^https?:\/\//i.test(g),p=h?g:`https://example.com/${encodeURIComponent(g.toLowerCase().replace(/\s+/g,"-"))}`,m=R(),C=await fetch("/api/ai/slugs",{method:"POST",headers:{"Content-Type":"application/json",...m?{Authorization:"Bearer "+m}:{}},body:JSON.stringify({url:p,title:h?void 0:g,tone:"catchy"})}),v=await C.json();if(!C.ok){S(v.error||"Failed to generate slugs"),x.innerHTML=`<div style="font-size:12px;color:#ef4444;padding:8px 0;">\u26A0\uFE0F ${v.error||"Failed to generate"}</div>`;return}let w=v.candidates||[];if(!w.length){x.innerHTML='<div style="font-size:12px;color:#64748b;">No slugs could be generated.</div>';return}x.innerHTML=w.map(k=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px;font-size:12.5px;">
            <div>
              <code style="color:#0A6CFF;font-weight:700;">healink.store/${k.slug}</code>
              <div style="font-size:11px;color:#64748b;">${k.rationale||"High CTR slug"}</div>
            </div>
            <button type="button" class="header-primary-btn" style="height:28px;padding:0 10px;font-size:11px;" onclick="window.appShell.openCreateModal('link'); setTimeout(() => { const inp = document.querySelector('#customSlug'); if (inp) inp.value = '${k.slug}'; }, 100);">
              Use \u26A1
            </button>
          </div>
        `).join("")}catch{S("Network error while generating slugs"),x.innerHTML='<div style="font-size:12px;color:#ef4444;">Network error</div>'}finally{r.disabled=!1,r.textContent="Generate Slugs \u26A1"}})}function xt(){let e=i("#drawerChatForm"),t=i("#drawerChatInput"),o=i("#drawerChatLog");if(!e||!t||!o)return;let d=()=>{let a=o.closest(".drawer-body")||o;a.scrollTop=a.scrollHeight,o.scrollTop=o.scrollHeight},n=o.closest(".drawer-body");n&&(n.setAttribute("data-lenis-prevent","true"),n.addEventListener("wheel",a=>a.stopPropagation(),{passive:!0}));let c=i("#appSidebar");c&&(c.setAttribute("data-lenis-prevent","true"),c.addEventListener("wheel",a=>a.stopPropagation(),{passive:!0}));async function s(a){if(!a)return;let l=document.createElement("div");l.className="drawer-chat-bubble user",l.textContent=a,o.appendChild(l);let r=document.createElement("div");r.className="drawer-chat-bubble ai",r.innerHTML='<span style="opacity:0.7">\u2728 Thinking with HEA Assist...</span>',o.appendChild(r),d(),t.value="";try{let b=R(),x=await fetch("/api/assist/chat",{method:"POST",headers:{"Content-Type":"application/json",...b?{Authorization:"Bearer "+b}:{}},body:JSON.stringify({message:a,conversationId:window.__assistConvId||void 0,stream:!1})}),g=await x.json();if(!x.ok){r.innerHTML=`<span style="color:#ef4444;">\u26A0\uFE0F ${g.error||"Failed to communicate with HEA Assist."}</span>`,d();return}g.conversationId&&(window.__assistConvId=g.conversationId);let h=(g.reply||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\*\*(.*?)\*\*/g,"<b>$1</b>").replace(/\*(.*?)\*/g,"<i>$1</i>").replace(/`([^`]+)`/g,'<code style="background:rgba(0,0,0,0.15);padding:1px 4px;border-radius:4px;">$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" style="color:#38bdf8;text-decoration:underline;">$1</a>').replace(/\n/g,"<br>");if(r.innerHTML=h,g.pendingAction){let p=g.pendingAction,m=document.createElement("div");m.style.cssText="background:#ffffff;color:#0b132b;border:1.5px solid #0070f3;border-radius:10px;padding:12px;margin-top:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);",m.innerHTML=`
          <div style="font-size:12px;font-weight:700;color:#0070f3;margin-bottom:6px;">\u26A1 Action Confirmation</div>
          <div style="font-size:12px;margin-bottom:10px;line-height:1.4;">${p.summary}</div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="sso-btn" style="width:auto;padding:4px 12px;font-size:11px;background:#10b981;color:#ffffff;border:none;" id="btnConf_${p.actionId}">\u2713 Confirm</button>
            <button type="button" class="sso-btn" style="width:auto;padding:4px 10px;font-size:11px;background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1;" id="btnCanc_${p.actionId}">\u2715 Cancel</button>
          </div>
        `,r.appendChild(m);let C=m.querySelector(`#btnConf_${p.actionId}`),v=m.querySelector(`#btnCanc_${p.actionId}`);C.onclick=async()=>{C.disabled=!0,C.textContent="Executing...";try{let w=await fetch(`/api/assist/actions/${p.actionId}/confirm`,{method:"POST",headers:{...b?{Authorization:"Bearer "+b}:{}}}),k=await w.json();w.ok?(m.innerHTML=`<div style="color:#10b981;font-size:12px;font-weight:700;">\u2705 Confirmed: ${k.summary}</div>`,Ue()):m.innerHTML=`<div style="color:#ef4444;font-size:12px;">\u26A0\uFE0F ${k.error||"Failed"}</div>`}catch(w){m.innerHTML=`<div style="color:#ef4444;font-size:12px;">Error: ${w.message}</div>`}},v.onclick=async()=>{v.disabled=!0;try{await fetch(`/api/assist/actions/${p.actionId}/cancel`,{method:"POST",headers:{...b?{Authorization:"Bearer "+b}:{}}}),m.innerHTML='<div style="color:#64748b;font-size:12px;">\u2715 Action cancelled</div>'}catch{m.innerHTML='<div style="color:#64748b;font-size:12px;">\u2715 Cancelled</div>'}}}d()}catch(b){r.innerHTML=`<span style="color:#ef4444;">Network error: ${b.message}</span>`,d()}}e.onsubmit=a=>{a.preventDefault();let l=t.value.trim();l&&s(l)},$(".drawer-chip-btn").forEach(a=>{a.onclick=()=>{let l=a.getAttribute("data-prompt")||a.textContent.trim();s(l)}})}var yt=J(()=>{K();X()});function Ue(){return E(u.activeTab||"home")}function E(e,t){if(!ge()){document.body.classList.remove("app-mode");let l=i("#appShell");l&&(l.hidden=!0),window.location.href="/#login";return}document.body.classList.add("app-mode");let o=i("#appShell");o&&(o.hidden=!1),e||(e="home"),(e==="dashboard"||e==="app")&&(e="home"),u.activeTab=e;try{We(e)}catch(l){console.warn("Error in updateDrawerForTab:",l)}$("#sidebarNav .sidebar-nav-item").forEach(l=>{l.classList.toggle("active",l.dataset.tab===e)}),$(".mobile-tab-item[data-tab]").forEach(l=>{let r=l.dataset.tab,b=r===e||r==="home"&&(e==="dashboard"||e==="app")||r==="links"&&e==="create-link"||r==="qr"&&e==="qr-detail";l.classList.toggle("active",b)});let d=i("#appSidebar")||i(".app-sidebar");d&&d.classList.remove("mobile-open","open");let n=i("#sidebarBackdrop");n&&(n.hidden=!0);let c=i("#topbarTitle"),s=i("#topbarSubtitle");if(c){let l={home:"Dashboard",links:"Links","create-link":"Create Link",qr:"QR Codes","qr-detail":"QR Code Details",pages:"Bio Pages",analytics:"Analytics",campaigns:"Campaigns",domains:"Custom Domains","custom-domains":"Custom Domains",integrations:"Integrations",settings:"Settings",keys:"API Keys",assist:"HEA Assist AI",notifications:"Notifications",resources:"Help & Resources"};c.textContent=l[e]||"Dashboard"}s&&(e==="notifications"?(s.textContent="Stay updated with link clicks, domain verifications, and system alerts",s.style.display="block"):e==="home"?(s.textContent="Track, manage and grow your links",s.style.display="block"):s.style.display="none");let a=i("#appMainPane");if(a){a.scrollTop=0;try{switch(e){case"home":Pe(a);break;case"create-link":Xe(a);break;case"links":De(a),Ee().then(()=>{u.activeTab==="links"&&De(a)}).catch(()=>{});break;case"qr":ye(a),Ee().then(()=>kt()).then(()=>{u.activeTab==="qr"&&ye(a)}).catch(()=>{});break;case"qr-detail":ot(a,t||u.activeQrId);break;case"pages":we(a),Ct().then(()=>{u.activeTab==="pages"&&we(a)}).catch(()=>{});break;case"analytics":st(a);break;case"campaigns":rt(a);break;case"domains":!window.isUserPro||!window.isUserPro()?St(a,"Custom Branded Domains","Free plan does not include custom domains. Connect your own brand URL (e.g. brand.link/drop) to increase trust and clicks by 2x. Upgrade to Pro!"):dt(a);break;case"integrations":pt(a);break;case"settings":gt(a);break;case"keys":ut(a);break;case"notifications":bt(a);break;case"assist":vt(a);break;default:Pe(a)}}catch(l){console.error("Error rendering dashboard view:",e,l);try{Pe(a)}catch{}}try{Tt()}catch{}e==="settings"?a&&(a.classList.remove("page-switching"),a.style.opacity="1",a.style.transform="none"):!(typeof window.matchMedia=="function"&&window.matchMedia("(prefers-reduced-motion: reduce)")?.matches)&&a?(a.classList.remove("page-switching"),a.offsetWidth,a.classList.add("page-switching"),setTimeout(()=>{a.classList.remove("page-switching"),a.style.opacity="1",a.style.transform="none"},250)):a&&(a.style.opacity="1",a.style.transform="none"),a&&!a._hasScrollShadowListener&&(a._hasScrollShadowListener=!0,a.addEventListener("scroll",()=>{let l=a.scrollTop>8,r=a.querySelector(".view-header");r&&r.classList.toggle("has-scroll-shadow",l)},{passive:!0})),window._hasDashScrollShadowListener||(window._hasDashScrollShadowListener=!0,window.addEventListener("scroll",()=>{let l=(window.scrollY||window.pageYOffset||0)>8,r=document.querySelector(".app-topbar");r&&r.classList.toggle("has-scroll-shadow",l)},{passive:!0}))}}function Ie(){let e=se();_e(e);let t=(location.hash.slice(1)||"").split("?")[0].toLowerCase();if(t==="utm"||t==="utm-guide"||t==="campaigns-guide"){window.location.href="/resources/utm-guide";return}if(t==="faq"){window.location.href="/faq";return}if(t==="developers"||t==="api-docs"){window.location.href="/developers";return}if(t==="help"||t==="help-center"){window.location.href="/help";return}if(!e){t===""||t==="home"?window.location.replace("/"):t==="signup"?window.location.replace("/#signup"):window.location.replace("/#login");return}document.body.classList.add("app-mode");let o=i("#appShell");if(o&&(o.hidden=!1),!t||t==="home"||t==="app"||t==="login"||t==="signup"){location.hash="#dashboard";return}["dashboard","create-link","links","qr","qr-detail","pages","analytics","campaigns","domains","integrations","settings","keys","assist","notifications","app"].includes(t)&&(E(t==="dashboard"||t==="app"?"home":t),window.scrollTo(0,0))}function Je(){let e=i("#appSidebar")||i(".app-sidebar"),t=i("#sidebarToggleBtn"),o=i("#sidebarBackdrop");function d(f){if(!e)return;let y=typeof f=="boolean"?f:!e.classList.contains("mobile-open");e.classList.toggle("mobile-open",y),e.classList.toggle("open",y),o&&(o.hidden=!y)}o&&(o.onclick=()=>d(!1)),t&&e&&(t.onclick=f=>{f.stopPropagation(),d()},document.addEventListener("click",f=>{e.classList.contains("mobile-open")&&!e.contains(f.target)&&f.target!==t&&d(!1)}));let n=i("#mobileTabCreateBtn");n&&(n.onclick=()=>{d(!1),ke()});let c=i("#mobileTabMoreBtn");c&&(c.onclick=()=>{d()}),$(".mobile-tab-item[data-tab]").forEach(f=>{f.onclick=y=>{y.preventDefault(),d(!1);let T=f.dataset.tab;$(".mobile-tab-item").forEach(z=>z.classList.remove("active")),f.classList.add("active"),location.hash=T==="home"?"#dashboard":"#"+T,E(T)}}),$("#sidebarNav .sidebar-nav-item").forEach(f=>{f.onclick=y=>{y.preventDefault(),e&&e.classList.remove("open");let T=f.dataset.tab;if(T==="assist"){let z=i("#appAssistDrawer");z&&(z.hidden=!0)}location.hash=T==="home"?"#dashboard":"#"+T,E(T)}});let s=i("#sidebarCollapseBtn");s&&e&&(s.onclick=f=>{f&&f.stopPropagation(),e.classList.toggle("expanded"),e.classList.toggle("collapsed",!e.classList.contains("expanded"));let y=e.classList.contains("expanded");s.textContent=y?"\u2039":"\u203A",s.title=y?"Collapse sidebar":"Expand sidebar"});let a=i("#sidebarCreateBtn");a&&(a.onclick=ke);let l=i("#whatModalClose");l&&(l.onclick=ee);let r=i("#whatModal");r&&(r.onclick=f=>{f.target===r&&ee()});let b=i("#optCreateLink");b&&(b.onclick=()=>{ee(),location.hash="#create-link",E("create-link")});let x=i("#optCreateQR");x&&(x.onclick=()=>{ee(),location.hash="#qr",E("qr")});let g=i("#optCreatePage");g&&(g.onclick=()=>{ee(),location.hash="#pages",E("pages")}),window.addEventListener("keydown",f=>{f.target.tagName==="INPUT"||f.target.tagName==="TEXTAREA"||r&&!r.hidden&&((f.key==="l"||f.key==="L")&&(ee(),location.hash="#create-link",E("create-link")),(f.key==="q"||f.key==="Q")&&(ee(),location.hash="#qr",E("qr")))});let h=i("#assistToggleBtn"),p=i("#appAssistDrawer"),m=i("#drawerCloseBtn");if(h&&p&&(h.onclick=()=>{if(u.activeTab==="settings"){let f=i("#drawerAiContent"),y=i("#drawerSettingsContent"),T=i("#drawerChatForm"),z=i("#drawerTitle");window.innerWidth<=768?p.hidden=!p.hidden:f&&f.hidden?(f.hidden=!1,T&&(T.style.display=""),y&&(y.hidden=!0),z&&(z.innerHTML="<span>\u2728</span> HEA Assist")):(f&&(f.hidden=!0),T&&(T.style.display="none"),y&&(y.hidden=!1),z&&(z.innerHTML="<span>\u2699\uFE0F</span> Settings"))}else p.hidden=!p.hidden;!p.hidden&&window.innerWidth<=768?document.body.style.overflow="hidden":document.body.style.overflow=""}),m&&p){let f=()=>{p.hidden=!0,document.body.style.overflow="";let y=document.querySelector("#sidebarAssistItem");y&&y.classList.remove("active-drawer")};m.onclick=f,m.ontouchstart=y=>{y.preventDefault(),f()},window.addEventListener("keydown",y=>{y.key==="Escape"&&p&&!p.hidden&&f()}),document.addEventListener("click",y=>{!p.hidden&&window.innerWidth<=768&&(p.contains(y.target)||h&&h.contains(y.target)||f())})}if(xt(),$(".topbar-upgrade-btn").forEach(f=>{f.onclick=()=>{typeof window.openCheckoutModal=="function"?window.openCheckoutModal("pro"):location.hash="#pricing"}}),u.appUser.isPro){let f=i("#sidebarOrgName");f&&(f.innerHTML=`${(u.appUser.name||"User").split(" ")[0]}'s Workspace <span style="background:linear-gradient(135deg,#eab308,#f59e0b);color:#000;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;margin-left:4px;">PRO \u{1F451}</span>`),$(".topbar-upgrade-btn").forEach(y=>{y.innerHTML="\u{1F451} PRO Active",y.style.background="linear-gradient(135deg, #eab308, #ca8a04)"})}let C=i("#sidebarLogoutBtn");C&&(C.onclick=async()=>{let f=R();try{await fetch("/api/auth/logout",{method:"POST",headers:f?{Authorization:"Bearer "+f}:{}})}catch{}Ce(),_e(null),S("Logged out successfully"),window.location.href="/"});let v=()=>{let f=(location.hash.slice(1)||"").split("?")[0].toLowerCase();if(!ge()){f===""||f==="home"?window.location.replace("/"):f==="signup"?window.location.replace("/#signup"):window.location.replace("/#login");return}let y=["dashboard","create-link","links","qr","qr-detail","pages","analytics","campaigns","domains","integrations","settings","keys","assist","notifications","app"];if(!f||f==="home"||f==="app"||f==="login"||f==="signup"){location.hash="#dashboard";return}if(y.includes(f)){document.body.classList.add("app-mode");let T=i("#appShell");T&&(T.hidden=!1),E(f==="dashboard"||f==="app"?"home":f)}};window.addEventListener("hashchange",v);let w=(location.hash.slice(1)||"").split("?")[0].toLowerCase();if(!ge()){w===""||w==="home"?window.location.replace("/"):w==="signup"?window.location.replace("/#signup"):window.location.replace("/#login");return}let k=["dashboard","create-link","links","qr","qr-detail","pages","analytics","campaigns","domains","integrations","settings","keys","assist","notifications","app"];document.body.classList.add("app-mode");let L=i("#appShell");L&&(L.hidden=!1),ue(u.appUser),wt().then(f=>{f&&Ee().catch(()=>{})}),!w||w==="home"||w==="app"||w==="login"||w==="signup"?(location.hash="#dashboard",E("home")):k.includes(w)?E(w==="dashboard"?"home":w):(location.hash="#dashboard",E("home"))}var X=J(()=>{K();it();Se();Me();Ge();lt();ct();ft();ht();mt();yt();xe()});function Ke(e){return e?typeof e=="object"?e.role==="admin"||!!e.isAdmin:u.appUser&&(u.appUser.role==="admin"||!!u.appUser.isAdmin):!1}function le(e=6){let t="23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",o="";for(let d=0;d<e;d++)o+=t.charAt(Math.floor(Math.random()*t.length));return o}function Ce(){try{sessionStorage.removeItem("hea_session"),localStorage.removeItem("hea_session"),sessionStorage.removeItem("hea_token"),localStorage.removeItem("hea_token"),localStorage.removeItem("token"),sessionStorage.removeItem("token"),localStorage.removeItem("hea_qrs"),localStorage.removeItem("hea_bios"),localStorage.removeItem("hea_custom_domain")}catch{}u.cachedLinks=[],u.cachedBios=[],u.appUser.name="",u.appUser.email="",u.appUser.isPro=!1,u.appUser.isAdmin=!1,u.appUser.plan="Free"}function Lt(e){try{if(!e||typeof e!="string")return!0;let t=e.split(".");if(t.length!==3)return!0;let o=t[1].replace(/-/g,"+").replace(/_/g,"/");for(;o.length%4;)o+="=";let d=JSON.parse(atob(o));return!!(!d||d.exp&&Date.now()>=d.exp*1e3)}catch{return!0}}function _t(e){try{if(!e||typeof e!="string")return null;let t=e.split(".");if(t.length!==3)return null;let o=t[1].replace(/-/g,"+").replace(/_/g,"/");for(;o.length%4;)o+="=";return JSON.parse(atob(o))}catch{return null}}function W(){Ce(),window.location.replace("/#login")}function ge(){try{let e=sessionStorage.getItem("hea_session")||localStorage.getItem("hea_session");if(!e)return!1;let t=JSON.parse(e),o=t&&t.token||sessionStorage.getItem("hea_token")||localStorage.getItem("hea_token")||"";return!t||!t.isVerified||!t.email||t.email==="john@example.com"||!o||Lt(o)?(Ce(),!1):(ue(t),!0)}catch{return Ce(),!1}}function ue(e){if(!e)return;let t=(u.appUser.email||"").toLowerCase().trim(),o=(e.email||"").toLowerCase().trim();if(o&&t&&t!==o){u.cachedLinks=[],u.cachedBios=[];try{localStorage.removeItem("hea_qrs"),localStorage.removeItem("hea_bios"),localStorage.removeItem("hea_custom_domain")}catch{}}e.name&&(u.appUser.name=e.name),e.email&&(u.appUser.email=e.email.toLowerCase().trim()),e.city&&(u.appUser.city=e.city),e.isp&&(u.appUser.isp=e.isp),e.email&&Ke(e.email)?(u.appUser.isPro=!0,u.appUser.isAdmin=!0,u.appUser.plan="Unlimited"):e.isPro?(u.appUser.isPro=!0,u.appUser.isAdmin=!!e.isAdmin,u.appUser.plan=e.plan||"Core PRO"):(u.appUser.isPro=!1,u.appUser.isAdmin=!!e.isAdmin,u.appUser.plan=e.plan||"Free");let d=u.appUser.name||"Account",n=i("#sidebarUserName");n&&(n.textContent=d);let c=i("#sidebarUserEmail");c&&(c.textContent=u.appUser.email||"");let s=i("#topbarAvatar");if(s){let x=d.split(" ").map(g=>g[0]).join("").slice(0,2).toUpperCase()||"HA";s.textContent=x,s.title=d}let a=i("#sidebarAvatar");if(a){let x=d.split(" ").map(h=>h[0]).join("").slice(0,2).toUpperCase()||"HA";a.textContent=x,a.setAttribute("data-tooltip",`${d} \xB7 ${u.appUser.email||""}`);let g=i("#sidebarUserLink");g&&g.setAttribute("data-tooltip",`${d} \xB7 ${u.appUser.email||""}`)}let l=i("#sidebarUserOrg");if(l){let x=d.split(" ")[0],g=u.appUser.email&&Ke(u.appUser.email),h=g?"UNLIMITED VIP":u.appUser.isPro?"PRO":"FREE",p=g?"background:linear-gradient(135deg,#D4FF24,#10b981);color:#060b18;font-weight:800;":"";l.innerHTML=`${x}'s Workspace <span class="verified-tag" style="font-size:9px;padding:2px 6px;${p}">${h}</span>`}let r=i("#homeGreetingUser");r&&(r.textContent=`Hi ${d.split(" ")[0]},`);let b=i("#topbarProBadge");b&&(u.appUser.isPro?(b.innerHTML=`<span>\u{1F451}</span> ${u.appUser.plan||"Pro Active"}`,b.style.background="",b.style.color="",b.style.borderColor=""):(b.innerHTML="<span>\u26A1</span> Free Plan \xB7 Upgrade",b.style.background="#f1f5f9",b.style.color="#475569",b.style.borderColor="#cbd5e1",b.onclick=()=>window.openCheckoutModal&&window.openCheckoutModal("pro"),b.style.cursor="pointer"));try{let g=JSON.parse(localStorage.getItem("hea_session")||"{}").token||localStorage.getItem("hea_token")||sessionStorage.getItem("hea_token");g&&fetch("/api/notifications/unread-count",{headers:{Authorization:"Bearer "+g}}).then(h=>h.json()).then(h=>{h&&typeof h.unreadCount=="number"&&document.querySelectorAll(".topbar-notif-badge, #topbarNotifBadge").forEach(m=>{m.textContent=h.unreadCount,m.style.display=h.unreadCount>0?"":"none"})}).catch(()=>{})}catch{}}function he(e,t=""){return typeof e!="string"?t:e.replace(/\[object\s+Object\],?/gi,"").replace(/\bundefined\b/gi,"").trim()||t}function pe(e){if(!e||typeof e!="object")return null;let t=window.location.origin,o={...e};o.id=o._id||o.id||"lnk_"+Date.now(),o.title=he(o.title,"Untitled Link"),o.slug=he(o.slug,le(6)),o.dest=he(o.dest,""),o.url=he(o.url,""),o.realShort=he(o.realShort,""),o.tag=he(o.tag,"Website"),!o.dest&&o.url&&(o.dest=o.url);let d=t+"/"+o.slug;if((!o.realShort||o.realShort===o.dest||o.realShort.includes("da.gd")||o.realShort.length>60)&&(o.realShort=d),(!o.url||o.url===o.dest||o.url.length>60)&&(o.url=d),Array.isArray(o.clicks))o.clicks=o.clicks.length;else if(o.clicks&&typeof o.clicks=="object")o.clicks=Object.keys(o.clicks).length;else if(typeof o.clicks!="number"){let n=parseInt(o.clicks,10);o.clicks=isNaN(n)?0:n}if(typeof o.scans!="number"){let n=parseInt(o.scans,10);o.scans=isNaN(n)?0:n}return o}function Z(){return u.cachedLinks}function R(){try{return JSON.parse(sessionStorage.getItem("hea_session")||localStorage.getItem("hea_session")||"{}").token||sessionStorage.getItem("hea_token")||localStorage.getItem("hea_token")||""}catch{return""}}async function wt(){try{let e=R();if(!e||Lt(e))return W(),!1;let t=_t(e);if((t&&t.exp?t.exp*1e3-Date.now():0)>24*60*60*1e3)return!0;let d=await fetch("/api/auth/refresh",{method:"POST",headers:{Authorization:"Bearer "+e}});if(d.status===401||d.status===404)return W(),!1;if(d.ok){let n=await d.json();if(n&&n.token){let c=sessionStorage.getItem("hea_session")||localStorage.getItem("hea_session"),a={...c?JSON.parse(c):{},...n.user||{},isVerified:!0,token:n.token};localStorage.setItem("hea_session",JSON.stringify(a)),sessionStorage.setItem("hea_session",JSON.stringify(a)),localStorage.setItem("hea_token",n.token),sessionStorage.setItem("hea_token",n.token),ue(a)}}return!0}catch{return!0}}async function Ee(){try{let e=R();if(!e)return u.cachedLinks=[],u.cachedLinks;let t=await fetch("/api/links",{headers:{Authorization:"Bearer "+e}});if(t.status===401)return W(),u.cachedLinks;if(!t.ok)return u.cachedLinks;let o=await t.json();return o&&Array.isArray(o.links)&&(u.cachedLinks=o.links.map(pe).filter(Boolean)),u.cachedLinks}catch{return u.cachedLinks}}async function kt(){try{localStorage.removeItem("hea_qrs");let e=R();if(!e)return;let t=await fetch("/api/qrs",{headers:{Authorization:"Bearer "+e}});if(t.status===401){W();return}if(!t.ok)return;await t.json()}catch{}}async function Ct(){try{localStorage.removeItem("hea_bios");let e=R();if(!e){u.cachedBios=[];return}let t=await fetch("/api/bios",{headers:{Authorization:"Bearer "+e}});if(t.status===401){W();return}if(!t.ok)return;let o=await t.json();if(o&&Array.isArray(o.bios)){let d=window.location.origin;u.cachedBios=o.bios.map(n=>({...n,id:n._id||n.id||n.slug,url:n.url||`${d}/m/${n.slug}`}))}}catch{}}function Ve(){return Array.isArray(u.cachedBios)?u.cachedBios.filter(e=>e&&e.slug!=="hgrgferf"&&e.slug!=="john"&&e.slug!=="sample"&&!(e.slug&&e.slug.toLowerCase().includes("hgrgferf"))&&!(e.url&&e.url.includes("hgrgferf"))&&!(e.title&&e.title.toLowerCase()==="john"&&(e.views||0)===0)):[]}async function At(e){if(e&&confirm("Are you sure you want to delete this Bio Page?"))try{let t=R();if(!t){W();return}let o=await fetch("/api/bios/"+encodeURIComponent(e),{method:"DELETE",headers:{Authorization:"Bearer "+t}});if(o.status===401){W();return}if(!o.ok){let n=await o.json().catch(()=>({}));S(n.error||"Failed to delete bio page");return}u.cachedBios=u.cachedBios.filter(n=>n&&n.slug!==e),S("Page deleted successfully");let d=document.getElementById("appMainPane");d&&we(d,"list")}catch(t){console.error(t),S("Unable to delete bio page")}}async function zt(e,t){if(!(!e&&!t)&&confirm("Are you sure you want to delete this QR Code?"))try{let o=R();o&&e&&await fetch("/api/qrs/"+encodeURIComponent(e),{method:"DELETE",headers:{Authorization:"Bearer "+o}}).catch(()=>{}),o&&t&&await fetch("/api/links/"+encodeURIComponent(t),{method:"DELETE",headers:{Authorization:"Bearer "+o}}).catch(()=>{}),u.cachedLinks=u.cachedLinks.filter(n=>n.id!==e&&n._id!==e&&n.slug!==t),S("QR Code deleted successfully");let d=document.getElementById("appMainPane");d&&ye(d)}catch(o){console.error(o)}}function St(e,t,o){e.innerHTML=`

    <div class="pro-locked-screen" style="text-align:center;padding:60px 32px;max-width:560px;margin:40px auto;background:#ffffff;border:1.5px solid #e2e8f0;border-radius:24px;box-shadow:0 20px 45px rgba(0,70,200,0.08);">

      <div style="width:76px;height:76px;border-radius:22px;background:#eff6ff;border:1.5px solid #bfdbfe;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;box-shadow:0 8px 24px rgba(0,112,243,0.12);">

        \u{1F512}

      </div>

      <span class="pill" style="background:#eff6ff;color:#0070f3;border:1px solid #bfdbfe;padding:5px 16px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">EXCLUSIVE PRO FEATURE</span>

      <h2 style="font-size:26px;font-weight:800;color:#0070f3;margin:16px 0 10px;">${t} is locked</h2>

      <p style="color:#334155;font-size:14px;line-height:1.6;margin-bottom:28px;">

        ${o}

      </p>

      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">

        <button type="button" class="btn" style="width:100%;max-width:320px;background:linear-gradient(135deg, #0050d0, #0070f3);color:#ffffff;font-weight:800;font-size:15.5px;padding:14px 32px;border-radius:99px;cursor:pointer;border:none;box-shadow:0 8px 24px rgba(0,112,243,0.35);transition:all 0.2s ease;display:inline-flex;align-items:center;justify-content:center;gap:8px;" onclick="window.openCheckoutModal('pro')">

          \u26A1 Upgrade to Pro Now

        </button>

        <button type="button" class="btn ghost" style="font-size:14px;padding:12px 22px;border-radius:12px;cursor:pointer;background:#f1f5f9;border:1.5px solid #cbd5e1;color:#0b132b;font-weight:700;" onclick="window.appShell.navigate('home')">

          \u2190 Back to Dashboard

        </button>

      </div>

    </div>

  `}function Tt(){let e=document.getElementById("appMainPane");if(!e)return;let t=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches,o=window.matchMedia&&window.matchMedia("(pointer: coarse)").matches||window.innerWidth<768,d=e.querySelector(".view-header"),n=document.querySelector(".dashboard-ambient-orbs"),c=()=>{let x=e.scrollTop;if(d&&(x>18?d.classList.add("is-scrolled"):d.classList.remove("is-scrolled")),n&&!t&&!o){let g=n.querySelector(".orb-1"),h=n.querySelector(".orb-2"),p=n.querySelector(".orb-3");g&&(g.style.transform="translate3d(0, "+x*-.09+"px, 0)"),h&&(h.style.transform="translate3d(0, "+x*.07+"px, 0)"),p&&(p.style.transform="translate3d(0, "+x*-.04+"px, 0)")}};e._motionScrollHandler&&e.removeEventListener("scroll",e._motionScrollHandler),e._motionScrollHandler=c,e.addEventListener("scroll",c,{passive:!0}),c();let s=[".bento-card",".bento-welcome-hero",".bento-calendar-card",".bento-stat-card",".bento-recent-card",".bento-activity-card",".dash-white-card",".home-create-card",".qr-card-item",".page-row-card",".campaigns-hero-wrap",".integration-card-white",".analytics-metric-box",".stat-tile",".links-list-item"].join(", "),a=Array.from(e.querySelectorAll(s));if(!t&&"IntersectionObserver"in window){let x=new IntersectionObserver(g=>{g.forEach(h=>{h.isIntersecting&&(h.target.classList.add("is-revealed"),x.unobserve(h.target))})},{root:e,threshold:.05,rootMargin:"0px 0px -20px 0px"});a.forEach(g=>{g.classList.remove("card-3d-reveal"),g.classList.add("is-revealed")})}else a.forEach(x=>x.classList.add("is-revealed"));!o&&!t&&a.forEach(x=>{if(!x.querySelector(".card-glare")){let g=document.createElement("div");g.className="card-glare",x.appendChild(g)}x.classList.add("card-3d-tilt"),!(!window.matchMedia("(hover: hover) and (pointer: fine)").matches||t)&&(x.onmousemove=g=>{let h=x.getBoundingClientRect(),p=g.clientX-h.left,m=g.clientY-h.top,C=h.width/2,v=h.height/2,w=(m-v)/v*-6,k=(p-C)/C*6;x.style.transform="perspective(1000px) rotateX("+w.toFixed(2)+"deg) rotateY("+k.toFixed(2)+"deg) translateZ(6px)",x.style.setProperty("--mouse-x",(p/h.width*100).toFixed(1)+"%"),x.style.setProperty("--mouse-y",(m/h.height*100).toFixed(1)+"%")},x.onmouseleave=()=>{x.style.transform="perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)"})});let l=e.querySelectorAll(".stat-gauge-bar");l.length>0&&!t&&setTimeout(()=>{l.forEach(x=>{let g=x.style.getPropertyValue("--gauge-height")||"60%";x.style.height=g})},200);let r=Array.from(e.querySelectorAll(".count-up, [data-count-up]"));r.length>0&&!t&&r.forEach(x=>{let g=x.dataset.countUp||x.textContent.trim().replace(/[^0-9.]/g,""),h=parseFloat(g);if(isNaN(h)||h<=0)return;let p=850,m=performance.now(),C=v=>{let w=v-m,k=Math.min(w/p,1),L=k===1?1:1-Math.pow(2,-10*k),f=Math.floor(L*h);x.textContent=f.toLocaleString(),k<1?requestAnimationFrame(C):x.textContent=h.toLocaleString()};requestAnimationFrame(C)}),e.querySelectorAll(".dash-white-card").forEach(x=>{let g=x.querySelector('div[style*="rgba(56,189,248"]');if(g&&!x.querySelector(".empty-state-shadow")){x.classList.add("empty-state-container"),g.classList.add("empty-state-floating-card");let h=document.createElement("div");h.className="empty-state-shadow",g.parentNode.insertBefore(h,g.nextSibling)}})}function ie(e){if(e==null||isNaN(e))return"0";let t=Number(e);if(t===0)return"0";let o=Math.abs(t),d=t<0?"-":"";return o<1e3?d+String(Math.round(t)):o<1e6?`${d}${(o/1e3).toFixed(1).replace(/\.0$/,"")}K`:o<1e9?`${d}${(o/1e6).toFixed(1).replace(/\.0$/,"")}M`:`${d}${(o/1e9).toFixed(1).replace(/\.0$/,"")}B`}function je(e){return e==null||isNaN(e)?"0":Number(e).toLocaleString("en-US")}function re(e){if(e==null||isNaN(e))return"\u2014";let t=Number(e);return t===0?"0%":t>0?`\u2191 +${t}%`:`\u2193 ${t}%`}function ke(){let e=i("#whatModal");e&&(e.hidden=!1)}function ee(){let e=i("#whatModal");e&&(e.hidden=!0)}function S(e){let t=document.querySelector("#toast");t?(t.textContent=e,t.classList.add("show"),clearTimeout(S._t),S._t=setTimeout(()=>t.classList.remove("show"),2400)):alert(e)}function Ye(e){navigator.clipboard?navigator.clipboard.writeText(e).then(()=>S("Copied: "+e)):S("Copied: "+e)}async function $t(){let e=i("#setDisplayName")?.value.trim();if(e){let t=R();if(!t){W();return}try{let o=await fetch("/api/auth/update-profile",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+t},body:JSON.stringify({name:e})});if(!o.ok){let l=await o.json().catch(()=>({}));S(l.error||"Failed to update display name");return}u.appUser.name=e;let d=sessionStorage.getItem("hea_session")||localStorage.getItem("hea_session"),c={...d?JSON.parse(d):{},name:e,email:u.appUser.email,isVerified:!0,token:t};localStorage.setItem("hea_session",JSON.stringify(c)),sessionStorage.setItem("hea_session",JSON.stringify(c));let s=i("#sidebarUserName");s&&(s.textContent=e);let a=i("#topbarAvatar");a&&(a.textContent=e.split(" ").map(l=>l[0]).join("").slice(0,2).toUpperCase()||"HA"),S("Display name updated: "+e)}catch{S("Unable to reach server to update display name")}}}async function Pt(e,t){u.cachedLinks=u.cachedLinks.filter(o=>o.id!==e&&o._id!==e&&o.slug!==t);try{let o=R();o&&t&&await fetch("/api/links/"+encodeURIComponent(t),{method:"DELETE",headers:{Authorization:"Bearer "+o}})}catch{}S("Link deleted from database"),E("links")}function Be(){let e=Z(),t=`Slug,Title,Destination,Clicks,Scans,Created
`;e.forEach(c=>{let s=typeof c.clicks=="number"?c.clicks:Array.isArray(c.clicks)?c.clicks.length:0,a=typeof c.scans=="number"?c.scans:parseInt(c.scans,10)||0,l=c.dest||c.url||"";t+=`"${c.slug}","${(c.title||"").replace(/"/g,'""')}","${l.replace(/"/g,'""')}",${s},${a},"${c.createdAt||""}"
`});let o=new Blob([t],{type:"text/csv;charset=utf-8;"}),d=URL.createObjectURL(o),n=document.createElement("a");n.href=d,n.download=`hea_analytics_report_${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(n),n.click(),document.body.removeChild(n),S("Analytics CSV report downloaded!")}function ce(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function ve(e="Core PRO"){u.appUser.isPro=!0,u.appUser.plan=e;try{let o=JSON.parse(localStorage.getItem("hea_session")||"{}");o.isPro=!0,o.plan=e,localStorage.setItem("hea_session",JSON.stringify(o))}catch{}let t=i("#sidebarOrgName");t&&(t.innerHTML=`${(u.appUser.name||"User").split(" ")[0]}'s Workspace <span style="background:linear-gradient(135deg,#eab308,#f59e0b);color:#000;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;margin-left:4px;">PRO \u{1F451}</span>`),$(".topbar-upgrade-btn").forEach(o=>{o.innerHTML="\u{1F451} PRO Active",o.style.background="linear-gradient(135deg, #eab308, #ca8a04)"}),Ue()}var i,$,u,K=J(()=>{X();Me();Ge();i=e=>document.querySelector(e),$=e=>document.querySelectorAll(e);typeof window.canCreateLinkOrQr!="function"&&(window.canCreateLinkOrQr=function(){return typeof window<"u"&&window.location&&(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")?{allowed:!0}:parseInt(localStorage.getItem("hea_free_creations")||"0",10)>=100?{allowed:!1,message:"Free limit reached. Upgrade to Pro!"}:{allowed:!0}});u={appUser:{name:"Account",email:"",orgId:"",city:"",isp:"",avatar:"HA",selectedQrColor:"#00d2ff",isPro:!1,plan:"Free"},cachedLinks:[],cachedBios:[],activeTab:"home",activeQrId:""};try{let e=sessionStorage.getItem("hea_session")||localStorage.getItem("hea_session");if(e){let t=JSON.parse(e);t&&t.isVerified&&(t.name&&(u.appUser.name=t.name),t.email&&(u.appUser.email=t.email),t.city&&(u.appUser.city=t.city),t.isp&&(u.appUser.isp=t.isp),t.email&&Ke(t.email)?(u.appUser.isPro=!0,u.appUser.isAdmin=!0,u.appUser.plan="Unlimited"):t.isPro&&(u.appUser.isPro=!0,u.appUser.plan=t.plan||"Core PRO"))}}catch{}});var Nt=Mt(()=>{K();xe();Me();X();window.state=u;window.isUserPro=de;window.canCreateLinkOrQr=Ne;window.recordFreeCreation=Fe;window.canChatWithAssist=He;window.recordFreeChat=qe;window.lockModalScroll=ze;window.unlockModalScroll=$e;window.openCheckoutModal=Oe;window.closeCheckoutModal=fe;window.drawQR=et;window.toast=S;window.copy=Ye;window.appShell={navigate:E,setAppUser:ue,setProStatus:ve,isUserAuthenticated:ge,openWhatModal:ke,closeWhatModal:ee,downloadQrPNG:Qe,downloadQrSVG:at,changeQrColor:nt,toast:S,copy:Ye,updateDisplayName:$t,deleteLink:Pt,deleteQr:zt,deletePage:At,exportAnalyticsCSV:Be};window.addEventListener("hashchange",Ie);tt();document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{Je(),Ie()}):(Je(),Ie())});Nt();})();
