const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const landingDir = path.join(rootDir, 'frontend-landing');
const distDir = path.join(landingDir, 'dist');
const distAssetsDir = path.join(distDir, 'assets');
const rootAssetsDir = path.join(rootDir, 'assets');

execSync('npm run build', { cwd: landingDir, stdio: 'inherit' });

if (!fs.existsSync(rootAssetsDir)) {
  fs.mkdirSync(rootAssetsDir, { recursive: true });
}

for (const file of fs.readdirSync(rootAssetsDir)) {
  if (/^index-.*\.(js|css)$/i.test(file)) {
    fs.unlinkSync(path.join(rootAssetsDir, file));
  }
}

fs.copyFileSync(path.join(distDir, 'index.html'), path.join(rootDir, 'index.html'));

for (const file of fs.readdirSync(distAssetsDir)) {
  fs.copyFileSync(path.join(distAssetsDir, file), path.join(rootAssetsDir, file));
}

console.log('[build_landing] Built frontend-landing and synced index.html + assets/ to repo root.');
