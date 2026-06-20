const fs = require('fs');
const path = require('path');
const https = require('https');

const ACCOUNT_ID = '4af17f4ad8bc1fcafa83a1fe9cc08a16';
const PROJECT_NAME = '777111-com-ua';
const TOKEN = 'cfat_uXsTjbFBGDWWJTAvR9LfXeZZUYBeXfMuNVv8P1CI3aace6bb';

async function upload() {
  const zipPath = process.argv[2] || '/tmp/777111-deploy-v3.zip';
  const manifestPath = process.argv[3] || '/tmp/777111-manifest.json';

  const zipBuffer = fs.readFileSync(zipPath);
  const manifestStr = fs.readFileSync(manifestPath, 'utf-8').trim();

  const manifest = JSON.parse(manifestStr);
  console.log(`Files: ${Object.keys(manifest.files).length}`);
  console.log(`Zip: ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB`);

  // Use a proper multipart boundary
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2, 10);

  // Build multipart body using Buffers
  const CRLF = '\r\n';
  const parts = [];

  // Part 1: manifest as JSON string field
  parts.push(Buffer.from(
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="manifest"${CRLF}` +
    `Content-Type: application/json${CRLF}${CRLF}` +
    `${manifestStr}${CRLF}`
  ));

  // Part 2: zip file
  parts.push(Buffer.from(
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="file"; filename="deploy.zip"${CRLF}` +
    `Content-Type: application/zip${CRLF}${CRLF}`
  ));
  parts.push(zipBuffer);
  parts.push(Buffer.from(`${CRLF}--${boundary}--${CRLF}`));

  const body = Buffer.concat(parts);
  const contentLength = body.length;

  console.log(`Body: ${(contentLength / 1024 / 1024).toFixed(1)} MB`);

  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': contentLength,
    },
    timeout: 600000, // 10 min
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\nHTTP:', res.statusCode);
          console.log('Success:', result.success);
          if (result.success) {
            const r = result.result;
            console.log('Deployment ID:', r.id);
            console.log('Environment:', r.environment);
            console.log('URL:', r.url);
            console.log('Aliases:', r.aliases?.join(', ') || 'none');
            // Check if stages include file processing
            if (r.stages) {
              for (const s of r.stages) {
                console.log(`  Stage ${s.name}: ${s.status || '?'}`);
              }
            }
          } else {
            console.log('Errors:', JSON.stringify(result.errors));
          }
          resolve(result);
        } catch (e) {
          console.log('Parse error:', e.message);
          console.log('Raw:', data.slice(0, 500));
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });

    // Write body in chunks to show progress
    const CHUNK = 256 * 1024; // 256KB
    let offset = 0;

    function writeChunk() {
      if (offset >= body.length) {
        req.end();
        console.log('Upload complete, waiting for response...');
        return;
      }
      const end = Math.min(offset + CHUNK, body.length);
      const ok = req.write(body.slice(offset, end));
      offset = end;
      const pct = ((offset / body.length) * 100).toFixed(0);
      process.stdout.write(`\rUpload: ${pct}% (${(offset/1024/1024).toFixed(0)}/${(contentLength/1024/1024).toFixed(0)} MB)`);
      if (ok) {
        setImmediate(writeChunk);
      } else {
        req.once('drain', writeChunk);
      }
    }

    writeChunk();
  });
}

upload()
  .then(() => console.log('\nDone!'))
  .catch(err => console.error('\nError:', err.message));
