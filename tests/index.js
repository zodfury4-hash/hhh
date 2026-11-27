const { spawnSync } = require('child_process');
const path = require('path');

process.env.NODE_ENV = 'test';

console.log('🧪 ========================================');
console.log('🧪 HEA LINK FULL AUTOMATED TEST RUNNER');
console.log('🧪 ========================================\n');

const suite1 = spawnSync(process.execPath, [path.join(__dirname, 'baseline.test.js')], { stdio: 'inherit' });
if (suite1.status !== 0) {
  process.exit(suite1.status || 1);
}

const suite2 = spawnSync(process.execPath, [path.join(__dirname, 'e2e.test.js')], { stdio: 'inherit' });
if (suite2.status !== 0) {
  process.exit(suite2.status || 1);
}

const suite3 = spawnSync(process.execPath, [path.join(__dirname, 'analytics.test.js')], { stdio: 'inherit' });
if (suite3.status !== 0) {
  process.exit(suite3.status || 1);
}

const suite4 = spawnSync(process.execPath, [path.join(__dirname, 'password-expiry.test.js')], { stdio: 'inherit' });
if (suite4.status !== 0) {
  process.exit(suite4.status || 1);
}

const suite5 = spawnSync(process.execPath, [path.join(__dirname, 'utm.test.js')], { stdio: 'inherit' });
if (suite5.status !== 0) {
  process.exit(suite5.status || 1);
}

const suite6 = spawnSync(process.execPath, [path.join(__dirname, 'domains.test.js')], { stdio: 'inherit' });
if (suite6.status !== 0) {
  process.exit(suite6.status || 1);
}

const suite7 = spawnSync(process.execPath, [path.join(__dirname, 'ai-slugs.test.js')], { stdio: 'inherit' });
if (suite7.status !== 0) {
  process.exit(suite7.status || 1);
}

const suite8 = spawnSync(process.execPath, [path.join(__dirname, 'assist.test.js')], { stdio: 'inherit' });
if (suite8.status !== 0) {
  process.exit(suite8.status || 1);
}

const suite9 = spawnSync(process.execPath, [path.join(__dirname, 'mcp.test.js')], { stdio: 'inherit' });
if (suite9.status !== 0) {
  process.exit(suite9.status || 1);
}

const suite10 = spawnSync(process.execPath, [path.join(__dirname, 'api-v1.test.js')], { stdio: 'inherit' });
if (suite10.status !== 0) {
  process.exit(suite10.status || 1);
}

const suite11 = spawnSync(process.execPath, [path.join(__dirname, 'integrations.test.js')], { stdio: 'inherit' });
if (suite11.status !== 0) {
  process.exit(suite11.status || 1);
}

const suite12 = spawnSync(process.execPath, [path.join(__dirname, 'utm-guide.test.js')], { stdio: 'inherit' });
if (suite12.status !== 0) {
  process.exit(suite12.status || 1);
}

const suite13 = spawnSync(process.execPath, [path.join(__dirname, 'help.test.js')], { stdio: 'inherit' });
if (suite13.status !== 0) {
  process.exit(suite13.status || 1);
}

const suite14 = spawnSync(process.execPath, [path.join(__dirname, 'plans.test.js')], { stdio: 'inherit' });
if (suite14.status !== 0) {
  process.exit(suite14.status || 1);
}

const suite15 = spawnSync(process.execPath, [path.join(__dirname, 'workspaces.test.js')], { stdio: 'inherit' });
if (suite15.status !== 0) {
  process.exit(suite15.status || 1);
}

const suite16 = spawnSync(process.execPath, [path.join(__dirname, 'dashboard-summary.test.js')], { stdio: 'inherit' });
if (suite16.status !== 0) {
  process.exit(suite16.status || 1);
}

const suite17 = spawnSync(process.execPath, [path.join(__dirname, 'format-number.test.js')], { stdio: 'inherit' });
if (suite17.status !== 0) {
  process.exit(suite17.status || 1);
}

const suite18 = spawnSync(process.execPath, [path.join(__dirname, 'notifications.test.js')], { stdio: 'inherit' });
if (suite18.status !== 0) {
  process.exit(suite18.status || 1);
}

const suite19 = spawnSync(process.execPath, [path.join(__dirname, 'no-fake-numbers.test.js')], { stdio: 'inherit' });
if (suite19.status !== 0) {
  process.exit(suite19.status || 1);
}

const suite20 = spawnSync(process.execPath, [path.join(__dirname, 'phase1-deploy.test.js')], { stdio: 'inherit' });
if (suite20.status !== 0) {
  process.exit(suite20.status || 1);
}

const suite21 = spawnSync(process.execPath, [path.join(__dirname, 'phase2-auth-db.test.js')], { stdio: 'inherit' });
if (suite21.status !== 0) {
  process.exit(suite21.status || 1);
}

const suite22 = spawnSync(process.execPath, [path.join(__dirname, 'phase3-security.test.js')], { stdio: 'inherit' });
if (suite22.status !== 0) {
  process.exit(suite22.status || 1);
}

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY ACROSS ALL 22 TEST SUITES!');
