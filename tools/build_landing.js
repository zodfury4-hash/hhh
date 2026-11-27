const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const landingDir = path.join(rootDir, 'frontend-landing');
const distDir = path.join(landingDir, 'dist');
const distAssetsDir = path.join(distDir, 'assets');
const publicAssetsDir = path.join(publicDir, 'assets');

execSync('npm run build', { cwd: landingDir, stdio: 'inherit' });

if (!fs.existsSync(publicAssetsDir)) {
  fs.mkdirSync(publicAssetsDir, { recursive: true });
}

for (const file of fs.readdirSync(publicAssetsDir)) {
  if (/^index-.*\.(js|css)$/i.test(file)) {
    fs.unlinkSync(path.join(publicAssetsDir, file));
  }
}

fs.copyFileSync(path.join(distDir, 'index.html'), path.join(publicDir, 'index.html'));

for (const file of fs.readdirSync(distAssetsDir)) {
  fs.copyFileSync(path.join(distAssetsDir, file), path.join(publicAssetsDir, file));
}

console.log('[build_landing] Built frontend-landing and synced public/index.html + public/assets/.');
