const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const landingDir = path.join(rootDir, 'frontend-landing');
const distDir = path.join(landingDir, 'dist');
const distAssetsDir = path.join(distDir, 'assets');
const publicAssetsDir = path.join(publicDir, 'assets');

// Clean and empty public/assets before copying fresh build output
if (fs.existsSync(publicAssetsDir)) {
  fs.rmSync(publicAssetsDir, { recursive: true, force: true });
}
fs.mkdirSync(publicAssetsDir, { recursive: true });

// Ensure dependencies are installed in frontend-landing
const nodeModules = path.join(landingDir, 'node_modules');
if (!fs.existsSync(nodeModules)) {
  console.log('[build_landing] Installing frontend-landing dependencies...');
  execSync('npm ci', { cwd: landingDir, stdio: 'inherit' });
}

execSync('npm run build', { cwd: landingDir, stdio: 'inherit' });

fs.copyFileSync(path.join(distDir, 'index.html'), path.join(publicDir, 'index.html'));

for (const file of fs.readdirSync(distAssetsDir)) {
  fs.copyFileSync(path.join(distAssetsDir, file), path.join(publicAssetsDir, file));
}

console.log('[build_landing] Emptied public/assets, built frontend-landing and synced fresh assets.');
