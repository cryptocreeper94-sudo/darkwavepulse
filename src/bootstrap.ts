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
  }
} catch (e) {}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  
  if (url === '/healthz' || url === '/health' || url === '/') {
    if (url === '/' && cachedIndexHtml) {
      res.writeHead(200, { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      });
      res.end(cachedIndexHtml);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    }
    return;
  }
  
  if (url.startsWith('/api/')) {
    if (!mastraReady) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Starting up...' }));
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
    
    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend unavailable' }));
    });
    
    req.pipe(proxyReq);
    return;
  }
  
  const filePath = path.join(publicDir, url);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (cachedIndexHtml) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(cachedIndexHtml);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
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
      '.woff2': 'font/woff2'
    };
    
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server on port ${PORT}`);
  
  const workerPath = path.join(process.cwd(), 'dist', 'mastra-worker.js');
  
  if (fs.existsSync(workerPath)) {
    const worker = new Worker(workerPath);
    worker.on('message', (msg: { type: string }) => {
      if (msg.type === 'ready') mastraReady = true;
    });
    worker.on('error', () => { mastraReady = true; });
  } else {
    import('../.mastra/output/index.mjs').then(() => { mastraReady = true; }).catch(() => { mastraReady = true; });
  }
});
