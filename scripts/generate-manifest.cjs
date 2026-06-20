const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Use out/ directory as root
const outDir = path.join(__dirname, '..', 'out');

function walk(dir) {
  const files = {};
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      Object.assign(files, walk(fullPath));
    } else if (item.isFile() && item.name !== '.DS_Store') {
      const relPath = path.relative(outDir, fullPath);
      const content = fs.readFileSync(fullPath);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      files[relPath] = hash;
    }
  }
  return files;
}

const manifest = { files: walk(outDir) };
fs.writeFileSync('/tmp/777111-manifest.json', JSON.stringify(manifest));
console.log('Manifest written: ' + Object.keys(manifest.files).length + ' files');
// Show first few keys
const keys = Object.keys(manifest.files);
console.log('First 5:', keys.slice(0, 5));
console.log('Index.html files:', keys.filter(k => k.endsWith('/index.html')).length);
