/**
 * Render modern, responsive HTML for password-protected links.
 * @param {object} params
 * @param {string} params.slug
 * @param {string} [params.error]
 * @returns {string}
 */
function renderPasswordChallengeHtml({ slug, error = '' }) {
  const safeSlug = String(slug || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeError = error
    ? `<div class="err-banner" role="alert"><span class="err-icon">⚠️</span> ${String(error)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Password Protected · HEA Link</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at top, #0c1733 0%, #060b18 100%);
      color: #ffffff;
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #090f22;
      border: 1px solid rgba(56, 189, 248, 0.22);
      border-radius: 20px;
      padding: 40px 32px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(0, 112, 243, 0.15);
      text-align: center;
    }
    .icon-wrap {
      width: 64px;
      height: 64px;
      background: rgba(0, 112, 243, 0.12);
      border: 1px solid rgba(0, 112, 243, 0.35);
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    p.sub {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .err-banner {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      font-size: 13.5px;
      font-weight: 500;
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-align: left;
    }
    .err-icon { font-size: 16px; flex-shrink: 0; }
    form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .input-wrap {
      position: relative;
      text-align: left;
    }
    label {
      display: block;
      font-size: 12.5px;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    input[type="password"] {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1.5px solid rgba(255, 255, 255, 0.18);
      border-radius: 12px;
      padding: 14px 16px;
      color: #ffffff;
      font-size: 15px;
      outline: none;
      transition: all 0.2s ease;
    }
    input[type="password"]:focus {
      border-color: #0070f3;
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.25);
    }
    button.submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #0070f3 0%, #00d2ff 100%);
      border: none;
      color: #ffffff;
      padding: 14px 20px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      font-size: 15px;
      letter-spacing: 0.01em;
      box-shadow: 0 4px 15px rgba(0, 112, 243, 0.35);
      transition: opacity 0.2s ease, transform 0.1s ease;
    }
    button.submit-btn:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }
    button.submit-btn:active {
      transform: translateY(0);
    }
    .footer-note {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
    }
    .footer-note a {
      color: #38bdf8;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">🔒</div>
    <h1>Password Protected Link</h1>
    <p class="sub">This short link is encrypted with a passcode by its owner. Enter the password below to access the destination.</p>
    ${safeError}
    <form method="POST" action="/${safeSlug}">
      <div class="input-wrap">
        <label for="linkPassword">Passcode</label>
        <input id="linkPassword" type="password" name="password" placeholder="Enter password..." required autofocus autocomplete="current-password">
      </div>
      <button type="submit" class="submit-btn">Unlock &amp; Proceed →</button>
    </form>
    <div class="footer-note">
      Powered securely by <a href="/#home" target="_blank" rel="noopener">HEA Link</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Render modern, responsive HTML for expired links or click limits reached (HTTP 410).
 * @param {object} params
 * @param {'date'|'clicks'} [params.reason]
 * @returns {string}
 */
function renderExpiredLinkHtml({ reason = 'date' } = {}) {
  const isClicks = reason === 'clicks';
  const icon = isClicks ? '📊' : '⏳';
  const heading = isClicks ? 'Click Limit Reached' : 'This Link Has Expired';
  const message = isClicks
    ? 'This link has reached its maximum allowable click capacity configured by the creator.'
    : 'The creator configured a time-based expiration for this short link, which has now elapsed.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${heading} · HEA Link</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at top, #0c1733 0%, #060b18 100%);
      color: #ffffff;
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #090f22;
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 20px;
      padding: 40px 32px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65);
      text-align: center;
    }
    .icon-wrap {
      width: 64px;
      height: 64px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #f87171;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    p.sub {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    a.action-btn {
      display: inline-block;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #38bdf8;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      transition: background 0.2s ease;
    }
    a.action-btn:hover {
      background: rgba(255, 255, 255, 0.14);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">${icon}</div>
    <h1>${heading}</h1>
    <p class="sub">${message}</p>
    <a href="/#home" class="action-btn">Learn more about HEA Link →</a>
  </div>
</body>
</html>`;
}

module.exports = {
  renderPasswordChallengeHtml,
  renderExpiredLinkHtml
};
