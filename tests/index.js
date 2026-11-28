const { spawnSync } = require('child_process');
const path = require('path');

process.env.NODE_ENV = 'test';

console.log('🧪 ========================================');
console.log('🧪 HEA LINK AUTOMATED TEST RUNNER');
console.log('🧪 ========================================\n');

const testSuites = [
  'baseline.test.js',
  'core-flows.test.js',
  'e2e.test.js',
  'analytics.test.js',
  'password-expiry.test.js',
  'utm.test.js',
  'domains.test.js',
  'ai-slugs.test.js',
  'assist.test.js',
  'mcp.test.js',
  'api-v1.test.js',
  'integrations.test.js',
  'utm-guide.test.js',
  'help.test.js',
  'plans.test.js',
  'workspaces.test.js',
  'dashboard-summary.test.js',
  'format-number.test.js',
  'notifications.test.js',
  'no-fake-numbers.test.js',
  'phase1-deploy.test.js',
  'phase2-auth-db.test.js',
  'phase3-security.test.js',
  'phase5-ux-seo.test.js',
  'phase7-observability.test.js'
];

const results = [];
let totalFailed = 0;

for (const suite of testSuites) {
  const suitePath = path.join(__dirname, suite);
  const startTime = Date.now();
  console.log(`\n▶️ Running ${suite}...`);
  const run = spawnSync(process.execPath, [suitePath], { stdio: 'inherit' });
  const durationMs = Date.now() - startTime;
  const passed = run.status === 0;

  if (!passed) {
    totalFailed += 1;
  }

  results.push({
    suite,
    passed,
    durationMs,
    exitCode: run.status
  });
}

console.log('\n======================================================');
console.log('📊 TEST EXECUTION SUMMARY');
console.log('======================================================');
console.log('Status | Duration | Suite Name');
console.log('------------------------------------------------------');
for (const r of results) {
  const icon = r.passed ? '✅ PASS' : '❌ FAIL';
  const duration = (r.durationMs / 1000).toFixed(2) + 's';
  console.log(`${icon} | ${duration.padStart(8)} | ${r.suite}`);
}
console.log('------------------------------------------------------');
console.log(`Total Suites: ${testSuites.length} | Passed: ${testSuites.length - totalFailed} | Failed: ${totalFailed}`);
console.log('======================================================\n');

if (totalFailed > 0) {
  console.error(`💥 ${totalFailed} test suite(s) failed.`);
  process.exit(1);
} else {
  console.log('🎉 ALL TEST SUITES COMPLETED WITH 100% PASS RATE!');
  process.exit(0);
}
