'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const BANNED_PATTERNS = [
  { label: "'48.7K'", pattern: /48\.7K/ },
  { label: "'32.4K'", pattern: /32\.4K/ },
  { label: "'1.5K'", pattern: /1\.5K/ },
  { label: "'2m 24s'", pattern: /2m 24s/ },
  { label: "'42 visitors'", pattern: /42 visitors/i },
  { label: "'+1.4k active'", pattern: /\+1\.4k active/i },
  { label: "'fury.link'", pattern: /fury\.link/i },
  { label: "'abc123'", pattern: /abc123/i },
  { label: "': 247' fallback links count", pattern: /:\s*247\b/ }
];

const TARGET_FILES = [
  'app.html',
  'js/dashboard/app-shell.js',
  'app-shell.js',
  'partials/dashboard/kpi-cards.html',
  'partials/dashboard/hero-shorten-grid.html',
  'partials/dashboard/analytics-grid.html',
  'partials/dashboard/topbar.html',
  'partials/dashboard/views/view-home.html',
  'partials/dashboard/views/view-links.html',
  'partials/dashboard/views/view-pages.html',
  'partials/dashboard/views/view-qr.html',
  'partials/dashboard/views/view-analytics.html'
];

async function runNoFakeNumbersTest() {
  console.log('\n🔍 Running Suite: Zero-Fake-Numbers Static Guard Verification...');
  const projectRoot = path.join(__dirname, '..');

  let violations = 0;

  for (const relPath of TARGET_FILES) {
    const fullPath = path.join(projectRoot, relPath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    for (const { label, pattern } of BANNED_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`  ❌ VIOLATION: Found banned string ${label} in ${relPath}`);
        violations++;
      }
    }
  }

  assert.strictEqual(violations, 0, `Detected ${violations} occurrences of banned fake/sample strings!`);
  console.log(`  ✅ PASS: 0 occurrences of banned fake numbers across all ${TARGET_FILES.length} production files.`);
  console.log('✨ Zero-Fake-Numbers Static Guard passed cleanly!\n');
  return true;
}

if (require.main === module) {
  runNoFakeNumbersTest().catch(err => {
    console.error('❌ Static verification failed:', err);
    process.exit(1);
  });
}

module.exports = runNoFakeNumbersTest;
