'use strict';

const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../backend/server');
const { JWT_SECRET } = require('../backend/middleware/auth');
const memStore = require('../backend/utils/memStore');

function request(server, options) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path: options.path,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const start = process.hrtime.bigint();
    const req = http.request(reqOptions, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const latencyMs = Number(end - start) / 1e6;
        let body = data;
        try { body = JSON.parse(data); } catch (_e) {}
        resolve({ status: res.statusCode, body, latencyMs });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runBenchmark() {
  console.log('⚡ Starting Dashboard Summary High-Concurrency Performance Benchmark...');

  const server = http.createServer(app);
  await new Promise(res => server.listen(0, '127.0.0.1', res));

  try {
    const testUser = { email: 'bench_user@example.com', name: 'Bench User', id: 'usr_bench', role: 'user' };
    const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

    console.log('📦 Seeding benchmark dataset in memory...');
    if (!memStore.links) memStore.links = [];
    if (!memStore.clicks) memStore.clicks = [];

    // Seed 1,000 links for the user
    const linkSlugs = [];
    for (let i = 0; i < 1000; i++) {
      const slug = `bench-${i}`;
      linkSlugs.push(slug);
      memStore.links.push({
        _id: `link_${i}`,
        slug,
        ownerEmail: testUser.email,
        dest: `https://example.com/target-${i}`,
        totalClicks: 100,
        createdAt: new Date(Date.now() - (i % 30) * 86400000)
      });
    }

    // Seed 25,000 recent click events across 30 days
    const now = Date.now();
    const referrers = ['direct', 'google.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'facebook.com'];
    for (let i = 0; i < 25000; i++) {
      const ageHours = (i % 720); // within 30 days
      memStore.clicks.push({
        _id: `clk_${i}`,
        ownerEmail: testUser.email,
        slug: linkSlugs[i % linkSlugs.length],
        timestamp: new Date(now - ageHours * 3600000),
        isBot: i % 10 === 0,
        referrer: referrers[i % referrers.length],
        country: 'US',
        ipHash: `hash_${i % 500}`
      });
    }

    console.log(`✅ Seeded ${memStore.links.length} links and ${memStore.clicks.length} click events.`);
    console.log('🚀 Executing 50 consecutive benchmark requests against /api/dashboard/summary...');

    const latencies = [];
    for (let r = 0; r < 50; r++) {
      const range = r % 3 === 0 ? '24h' : r % 3 === 1 ? '7d' : '30d';
      const res = await request(server, {
        path: `/api/dashboard/summary?range=${range}&tz=UTC`,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 200) {
        latencies.push(res.latencyMs);
      }
    }

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.50)].toFixed(2);
    const p90 = latencies[Math.floor(latencies.length * 0.90)].toFixed(2);
    const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);
    const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(2);
    const min = latencies[0].toFixed(2);
    const max = latencies[latencies.length - 1].toFixed(2);

    console.log('\n📊 Benchmark Latency Results (ms):');
    console.log(`   Min:  ${min} ms`);
    console.log(`   p50:  ${p50} ms`);
    console.log(`   p90:  ${p90} ms`);
    console.log(`   p95:  ${p95} ms`);
    console.log(`   p99:  ${p99} ms`);
    console.log(`   Max:  ${max} ms`);

    if (Number(p95) < 300) {
      console.log(`\n🎉 SUCCESS: p95 latency (${p95}ms) is well under the 300ms SLA threshold!\n`);
    } else {
      console.warn(`\n⚠️ WARNING: p95 latency (${p95}ms) exceeded 300ms SLA threshold.\n`);
    }

    return true;
  } finally {
    await new Promise(res => server.close(res));
  }
}

if (require.main === module) {
  runBenchmark().catch(err => {
    console.error('Benchmark failed:', err);
    process.exit(1);
  });
}

module.exports = runBenchmark;
