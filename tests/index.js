const { spawnSync } = require('child_process');
const path = require('path');

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

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY ACROSS BOTH TEST SUITES!');
