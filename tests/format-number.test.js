const assert = require('assert');

// Test suite for formatNumber & formatTrend helper
function formatNumber(val) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const num = Number(val);
  if (num === 0) return '0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs < 1000) {
    return sign + String(Math.round(num));
  }
  if (abs < 1000000) {
    const k = (abs / 1000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${k}K`;
  }
  if (abs < 1000000000) {
    const m = (abs / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${m}M`;
  }
  const b = (abs / 1000000000).toFixed(1).replace(/\.0$/, '');
  return `${sign}${b}B`;
}

function formatWithCommas(val) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const num = Number(val);
  return num.toLocaleString('en-US');
}

function formatTrend(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return '—';
  const num = Number(pct);
  if (num === 0) return '0%';
  if (num > 0) return `↑ +${num}%`;
  return `↓ ${num}%`;
}

console.log('🧪 Starting Format Number & Trend Helpers Test Suite...');

// 1. formatNumber tests
assert.strictEqual(formatNumber(null), '0');
assert.strictEqual(formatNumber(undefined), '0');
assert.strictEqual(formatNumber(0), '0');
assert.strictEqual(formatNumber(42), '42');
assert.strictEqual(formatNumber(999), '999');
assert.strictEqual(formatNumber(1000), '1K');
assert.strictEqual(formatNumber(1200), '1.2K');
assert.strictEqual(formatNumber(12340), '12.3K');
assert.strictEqual(formatNumber(48700), '48.7K');
assert.strictEqual(formatNumber(1000000), '1M');
assert.strictEqual(formatNumber(1500000), '1.5M');
assert.strictEqual(formatNumber(2400000000), '2.4B');
console.log('  ✅ PASS: formatNumber scales correctly across K, M, B tiers');

// 2. formatWithCommas tests
assert.strictEqual(formatWithCommas(null), '0');
assert.strictEqual(formatWithCommas(0), '0');
assert.strictEqual(formatWithCommas(999), '999');
assert.strictEqual(formatWithCommas(1234), '1,234');
assert.strictEqual(formatWithCommas(1000000), '1,000,000');
console.log('  ✅ PASS: formatWithCommas formats comma separators accurately');

// 3. formatTrend tests
assert.strictEqual(formatTrend(null), '—');
assert.strictEqual(formatTrend(undefined), '—');
assert.strictEqual(formatTrend(0), '0%');
assert.strictEqual(formatTrend(12), '↑ +12%');
assert.strictEqual(formatTrend(48.6), '↑ +48.6%');
assert.strictEqual(formatTrend(-15), '↓ -15%');
console.log('  ✅ PASS: formatTrend formats nulls, positives, negatives and zero');

console.log('\n🎉 ALL Format Number tests passed successfully!\n');

module.exports = { formatNumber, formatWithCommas, formatTrend };
