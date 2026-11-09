const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const templatePath = path.join(rootDir, 'partials', 'index.template.html');
const targets = [
  path.join(rootDir, 'index.html'),
  path.join(rootDir, 'app.html')
];

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

function buildHtml() {
  const start = Date.now();
  try {
    const compiled = compileTemplate(templatePath);

    targets.forEach(target => {
      fs.writeFileSync(target, compiled, 'utf8');
    });

    const elapsed = Date.now() - start;
    console.log(`[build:html] Compiled ${path.relative(rootDir, templatePath)} -> index.html & app.html (${elapsed}ms)`);
    return true;
  } catch (err) {
    console.error('[build:html] Error compiling HTML:', err.message);
    return false;
  }
}

// Watch mode
if (process.argv.includes('--watch')) {
  buildHtml();
  const partialsDir = path.join(rootDir, 'partials');
  console.log(`[build:html] Watching ${partialsDir} for changes...`);
  fs.watch(partialsDir, { recursive: true }, (event, filename) => {
    if (filename && filename.endsWith('.html')) {
      console.log(`[build:html] Detected change in ${filename}, recompiling...`);
      buildHtml();
    }
  });
} else if (require.main === module) {
  const ok = buildHtml();
  process.exit(ok ? 0 : 1);
}

module.exports = { buildHtml };
