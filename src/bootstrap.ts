import http from 'http';
import path from 'path';
import fs from 'fs';
import { Worker } from 'worker_threads';

const PORT = Number(process.env.PORT ?? 5000);
const MASTRA_PORT = 4111;

let mastraReady = false;
let cachedIndexHtml: Buffer | null = null;

const publicDir = path.join(process.cwd(), 'public');
const indexPath = path.join(publicDir, 'index.html');

try {
  if (fs.existsSync(indexPath)) {
    cachedIndexHtml = fs.readFileSync(indexPath);
    console.log('Cached index.html on boot');
  }
} catch (e) {
  console.log('Could not cache index.html');
}

function startMastraWorker(): void {
  const workerPath = path.join(process.cwd(), 'dist', 'mastra-worker.js');
  
  if (!fs.existsSync(workerPath)) {
    console.log('Worker not found, falling back to direct import');
    startMastraDirect();
    return;
  }
  
  console.log('Starting Mastra in worker thread...');
  const worker = new Worker(workerPath);
  
  worker.on('message', (msg: { type: string }) => {
    if (msg.type === 'ready') {
      mastraReady = true;
      console.log('Mastra backend is ready (from worker)');
    }
  });
  
  worker.on('error', (err) => {
    console.error('Worker error:', err);
    mastraReady = true;
  });
  
  worker.on('exit', (code) => {
    if (code !== 0) {
      console.log(`Worker exited with code ${code}`);
    }
  });
}

async function startMastraDirect(): Promise<void> {
  process.env.PORT = String(MASTRA_PORT);
  try {
    await import('../.mastra/output/index.mjs');
    mastraReady = true;
    console.log('Mastra started directly');
  } catch (err) {
    console.error('Failed to start Mastra:', err);
    mastraReady = true;
  }
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  
  if (url === '/healthz' || url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  
  if (url === '/') {
    if (cachedIndexHtml) {
      res.writeHead(200, { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(cachedIndexHtml);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  
  if (url.startsWith('/api/')) {
    if (!mastraReady) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server starting up, please wait...' }));
      return;
    }
    
    const options = {
      hostname: '127.0.0.1',
      port: MASTRA_PORT,
      path: url,
      method: req.method,
      headers: req.headers
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend unavailable' }));
    });
    
    req.pipe(proxyReq);
    return;
  }
  
  let filePath = path.join(publicDir, url);
  
  if (!path.extname(filePath)) {
    if (cachedIndexHtml) {
      res.writeHead(200, { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(cachedIndexHtml);
      return;
    }
    filePath = path.join(publicDir, 'index.html');
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (cachedIndexHtml) {
        res.writeHead(200, { 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(cachedIndexHtml);
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf'
    };
    
    res.writeHead(200, { 
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=31536000'
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bootstrap server running on port ${PORT}`);
  setImmediate(startMastraWorker);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close();
  process.exit(0);
});
