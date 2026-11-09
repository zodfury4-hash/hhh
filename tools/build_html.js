const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const templatePath = path.join(rootDir, 'index.html');

let cachedHtml = null;
let lastCheckTime = 0;

function compileTemplate(filePath, seen = new Set()) {
  if (seen.has(filePath)) {
    throw new Error(`Circular include detected: ${filePath}`);
  }
  seen.add(filePath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Template file not found: ${filePath}`);
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace <!-- @include "..." --> or <!-- @include '...' -->
  const includeRegex = /<!--\s*@include\s+["']([^"']+)["']\s*-->/g;

  content = content.replace(includeRegex, (_, relPath) => {
    const targetFile = path.resolve(rootDir, relPath);
    return compileTemplate(targetFile, new Set(seen));
  });

  return content;
}

function getCompiledHtml() {
  try {
    return compileTemplate(templatePath);
  } catch (err) {
    console.error('[build_html] Error compiling template:', err.message);
    return cachedHtml || `<h1>Error compiling template: ${err.message}</h1>`;
  }
}

// Build a standalone compiled static bundle if ever needed (e.g. for static hosting)
function buildStatic(outDir = 'dist') {
  const outPath = path.join(rootDir, outDir, 'index.html');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const compiled = getCompiledHtml();
  fs.writeFileSync(outPath, compiled, 'utf8');
  console.log(`[build_html] Compiled static HTML to: ${outPath}`);
}

if (require.main === module) {
  if (process.argv.includes('--static')) {
    buildStatic();
  } else {
    const compiled = getCompiledHtml();
    console.log(`[build_html] Verified template compilation (${compiled.length} bytes, ${(compiled.split('\n').length)} lines)`);
  }
}

module.exports = {
  compileTemplate,
  getCompiledHtml,
  buildStatic
};
