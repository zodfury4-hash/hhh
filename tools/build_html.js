const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const templatePath = path.join(rootDir, 'partials', 'index.template.html');

let cachedHtml = null;

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

// Build root index.html and app.html for static hosting (GitHub Pages, etc.)
function buildRoot() {
  const compiled = getCompiledHtml();
  const rootIndexPath = path.join(rootDir, 'index.html');
  const rootAppPath = path.join(rootDir, 'app.html');
  fs.writeFileSync(rootIndexPath, compiled, 'utf8');
  fs.writeFileSync(rootAppPath, compiled, 'utf8');
  console.log(`[build_html] Compiled static production HTML to root index.html and app.html (${compiled.length} bytes, ${compiled.split('\n').length} lines)`);
}

if (require.main === module) {
  buildRoot();
}

module.exports = {
  compileTemplate,
  getCompiledHtml,
  buildRoot
};
