const fs = require('fs');
const path = require('path');
const https = require('https');

const ACCOUNT_ID = '4af17f4ad8bc1fcafa83a1fe9cc08a16';
const PROJECT_NAME = '777111-com-ua';
const TOKEN = 'cfat_uXsTjbFBGDWWJTAvR9LfXeZZUYBeXfMuNVv8P1CI3aace6bb';

async function uploadDeployment() {
  // Read the zip file
  const zipBuffer = fs.readFileSync('/tmp/777111-deploy.zip');
  
  // Read the manifest
  const manifestStr = fs.readFileSync('/tmp/777111-manifest.json', 'utf-8');
  const manifest = JSON.parse(manifestStr);
  
  console.log(`Manifest: ${Object.keys(manifest.files).length} files`);
  console.log(`Zip size: ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB`);

  // Build multipart body manually
  // Boundary
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
  
  // Build parts
  const parts = [];
  
  // Manifest part
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="manifest"\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${manifestStr}\r\n`
  ));
  
  // File part
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="deploy.zip"\r\n` +
    `Content-Type: application/zip\r\n\r\n`
  ));
  parts.push(zipBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  
  const body = Buffer.concat(parts);
  
  console.log(`Body size: ${(body.length / 1024 / 1024).toFixed(1)} MB`);

  // Make the request
  return new Promise((resolve, reject) => {
    const url = new URL(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments`
    );
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
      timeout: 300000, // 5 min
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('\nResponse status:', res.statusCode);
          console.log('Success:', result.success);
          if (result.success) {
            console.log('Deployment ID:', result.result?.id);
            console.log('URL:', result.result?.url || `https://${PROJECT_NAME}.pages.dev`);
            console.log('Aliases:', result.result?.aliases?.join(', '));
          } else {
            console.log('Errors:', JSON.stringify(result.errors, null, 2));
          }
          resolve(result);
        } catch (e) {
          console.log('Raw response:', data.slice(0, 500));
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    
    // Track progress
    let uploaded = 0;
    req.on('drain', () => {});
    
    // Write in chunks to show progress
    const chunkSize = 1024 * 1024; // 1MB chunks
    let offset = 0;
    function writeChunk() {
      if (offset >= body.length) {
        req.end();
        console.log('Upload completed, waiting for response...');
        return;
      }
      const end = Math.min(offset + chunkSize, body.length);
      const chunk = body.slice(offset, end);
      const ok = req.write(chunk);
      if (!ok) {
        req.once('drain', () => {
          offset = end;
          const pct = ((offset / body.length) * 100).toFixed(0);
          process.stdout.write(`\rUploading... ${pct}% (${(offset/1024/1024).toFixed(0)}/${(body.length/1024/1024).toFixed(0)} MB)`);
          writeChunk();
        });
      } else {
        offset = end;
        const pct = ((offset / body.length) * 100).toFixed(0);
        process.stdout.write(`\rUploading... ${pct}% (${(offset/1024/1024).toFixed(0)}/${(body.length/1024/1024).toFixed(0)} MB)`);
        setImmediate(writeChunk);
      }
    }
    writeChunk();
  });
}

uploadDeployment()
  .then(() => console.log('\nDone!'))
  .catch(err => console.error('\nFailed:', err.message));
