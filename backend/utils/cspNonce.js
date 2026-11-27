'use strict';

const fs = require('fs');

function sendHtmlWithNonce(res, filePath) {
  const nonce = res && res.locals ? res.locals.cspNonce : '';
  if (!nonce) return res.sendFile(filePath);
  try {
    let html = fs.readFileSync(filePath, 'utf8');
    html = html.replace(/<script(?![^>]*\bsrc=)(?![^>]*\bnonce=)([^>]*)>/gi, `<script nonce="${nonce}"$1>`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    return res.send(html);
  } catch (_err) {
    return res.sendFile(filePath);
  }
}

module.exports = { sendHtmlWithNonce };
