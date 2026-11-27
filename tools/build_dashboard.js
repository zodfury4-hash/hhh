'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const entryFile = path.join(rootDir, 'dashboard', 'src', 'main.js');
const outDir = path.join(rootDir, 'public', 'dashboard');
const scriptsPartial = path.join(rootDir, 'partials', 'layout', 'scripts.html');

const esbuild = require(path.join(rootDir, 'frontend-landing', 'node_modules', 'esbuild'));

async function buildDashboard() {
  fs.mkdirSync(outDir, { recursive: true });

  // Clean previous hashed bundles
  for (const f of fs.readdirSync(outDir)) {
    if (/^app(\.[a-f0-9]+)?\.js$/i.test(f)) {
      fs.unlinkSync(path.join(outDir, f));
    }
  }

  const result = await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    minify: true,
    sourcemap: false,
    format: 'iife',
    target: ['es2020'],
    write: false,
    outfile: 'app.js'
  });

  const code = result.outputFiles[0].contents;
  const hash = crypto.createHash('sha256').update(code).digest('hex').slice(0, 8);
  const outName = `app.${hash}.js`;
  const outPath = path.join(outDir, outName);
  fs.writeFileSync(outPath, code);

  const scriptsHtml = [
    '<script src="js/shared/qrcode.js"></script>',
    '<script src="js/shared/utm.js?v=1"></script>',
    `<script src="/dashboard/${outName}"></script>`
  ].join('\n');

  fs.writeFileSync(scriptsPartial, scriptsHtml + '\n', 'utf8');
  console.log(`[build_dashboard] Built modular dashboard -> public/dashboard/${outName} (${code.length} bytes)`);

  const buildHtml = require('./build_html');
  buildHtml.buildRoot();
}

if (require.main === module) {
  buildDashboard().catch((err) => {
    console.error('[build_dashboard] Build failed:', err);
    process.exit(1);
  });
}

module.exports = { buildDashboard };
