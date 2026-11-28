const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_ZIP = path.join(ROOT_DIR, 'hea-link-source.zip');

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'test-artifacts',
  'dist',
  '.vercel',
  '.idea',
  '.vscode',
  'archive',
  'backup',
  'scratch',
]);

function shouldExclude(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  for (const seg of segments) {
    if (EXCLUDED_DIRS.has(seg)) return true;
    if (seg.startsWith('.env') && seg !== '.env.example') return true;
  }
  const basename = path.basename(relPath);
  if (basename.endsWith('.zip')) return true;
  if (basename.startsWith('.env') && basename !== '.env.example') return true;
  return false;
}

function collectFiles(dir, baseDir = dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (shouldExclude(relPath)) continue;

    if (entry.isDirectory()) {
      results = results.concat(collectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

function createZip(files, outputPath) {
  const localHeaders = [];
  const centralHeaders = [];
  let currentOffset = 0;

  for (const { fullPath, relPath } of files) {
    const rawData = fs.readFileSync(fullPath);
    const stat = fs.statSync(fullPath);
    const deflated = zlib.deflateRawSync(rawData, { level: 6 });
    const crc = zlib.crc32(rawData);

    // Format MS-DOS time and date
    const date = new Date(stat.mtime);
    const dosTime =
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2);
    const dosDate =
      ((date.getFullYear() - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate();

    const nameBuf = Buffer.from(relPath, 'utf8');

    // Local file header (30 bytes + nameBuf.length)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature
    localHeader.writeUInt16LE(20, 4); // Min version (2.0)
    localHeader.writeUInt16LE(0, 6); // General purpose bit flag
    localHeader.writeUInt16LE(8, 8); // Compression method (8 = deflate)
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(deflated.length, 18); // Compressed size
    localHeader.writeUInt32LE(rawData.length, 22); // Uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // Extra field length

    localHeaders.push(localHeader, nameBuf, deflated);

    // Central directory header (46 bytes + nameBuf.length)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central header signature
    centralHeader.writeUInt16LE(20, 4); // Version made by
    centralHeader.writeUInt16LE(20, 6); // Version needed to extract
    centralHeader.writeUInt16LE(0, 8); // Flags
    centralHeader.writeUInt16LE(8, 10); // Compression method
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(deflated.length, 20);
    centralHeader.writeUInt32LE(rawData.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // Extra field length
    centralHeader.writeUInt16LE(0, 32); // File comment length
    centralHeader.writeUInt16LE(0, 34); // Disk number start
    centralHeader.writeUInt16LE(0, 36); // Internal file attributes
    centralHeader.writeUInt32LE(0, 38); // External file attributes
    centralHeader.writeUInt32LE(currentOffset, 42); // Offset of local header

    centralHeaders.push(centralHeader, nameBuf);

    currentOffset += localHeader.length + nameBuf.length + deflated.length;
  }

  const centralDirOffset = currentOffset;
  const centralDirBuffer = Buffer.concat(centralHeaders);
  const centralDirSize = centralDirBuffer.length;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // Disk number
  eocd.writeUInt16LE(0, 6); // Disk with central dir
  eocd.writeUInt16LE(files.length, 8); // Number of entries on this disk
  eocd.writeUInt16LE(files.length, 10); // Total entries
  eocd.writeUInt32LE(centralDirSize, 12); // Central dir size
  eocd.writeUInt32LE(centralDirOffset, 16); // Central dir offset
  eocd.writeUInt16LE(0, 20); // Comment length

  const fullZip = Buffer.concat([...localHeaders, centralDirBuffer, eocd]);
  fs.writeFileSync(outputPath, fullZip);
  return { fileCount: files.length, byteSize: fullZip.length };
}

function pack() {
  console.log('📦 Packing clean source archive (excluding secrets, node_modules, dist)...');
  const files = collectFiles(ROOT_DIR);
  const result = createZip(files, OUTPUT_ZIP);
  const sizeMb = (result.byteSize / (1024 * 1024)).toFixed(2);
  console.log(
    `✅ Successfully packed ${result.fileCount} source files into hea-link-source.zip (${sizeMb} MB)`
  );
}

if (require.main === module) {
  pack();
}

module.exports = { pack, collectFiles, shouldExclude };
