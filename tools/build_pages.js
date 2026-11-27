'use strict';

/**
 * Synchronizes shared footer/nav partials across standalone HTML marketing/docs pages
 * under /pages so navigation links and legal links stay uniform without drift.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pagesDir = path.join(rootDir, 'pages');
const footerPartialPath = path.join(rootDir, 'partials', 'pages', 'footer.html');

const TARGET_PAGES = [
  'developers.html',
  'integrations.html',
  'ai-assist.html',
  'ai-mcp.html',
  'ai-slug-generator.html',
  'resources-utm-guide.html'
];

function syncPages() {
  if (!fs.existsSync(footerPartialPath)) {
    throw new Error(`Missing partial: ${footerPartialPath}`);
  }
  const footerHtml = fs.readFileSync(footerPartialPath, 'utf8').trim();
  let updatedCount = 0;

  for (const filename of TARGET_PAGES) {
    const filePath = path.join(pagesDir, filename);
    if (!fs.existsSync(filePath)) continue;

    let html = fs.readFileSync(filePath, 'utf8');
    const markerRegex = /<!-- HEA:FOOTER_START -->[\s\S]*?<!-- HEA:FOOTER_END -->/m;
    const footerTagRegex = /<footer\b[^>]*>[\s\S]*?<\/footer>/i;

    if (markerRegex.test(html)) {
      html = html.replace(markerRegex, footerHtml);
    } else if (footerTagRegex.test(html)) {
      html = html.replace(footerTagRegex, footerHtml);
    } else {
      html = html.replace(/<\/body>/i, `${footerHtml}\n</body>`);
    }

    fs.writeFileSync(filePath, html, 'utf8');
    updatedCount++;
  }

  console.log(`[build_pages] Synchronized shared footer partial across ${updatedCount} standalone pages.`);
  return updatedCount;
}

if (require.main === module) {
  syncPages();
}

module.exports = { syncPages };
