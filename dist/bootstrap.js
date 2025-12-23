import http from 'http';
const PORT = Number(process.env.PORT || 5000);
const server = http.createServer((req, res) => {
    if (req.url === '/healthz' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"status":"ok"}');
        return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<!DOCTYPE html><html><head><title>Pulse</title><meta http-equiv="refresh" content="2"></head><body style="background:#0f0f0f;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui"><h1 style="color:#00D4FF">Loading Pulse...</h1></body></html>');
});
server.listen(PORT, '0.0.0.0', () => {
    console.log('Server ready on port ' + PORT);
    setTimeout(() => {
        try {
            const fs = require('fs');
            const path = require('path');
            const { spawn } = require('child_process');
            const publicDir = path.join(process.cwd(), 'public');
            const indexPath = path.join(publicDir, 'index.html');
            if (fs.existsSync(indexPath)) {
                const html = fs.readFileSync(indexPath, 'utf8');
                server.removeAllListeners('request');
                server.on('request', (req, res) => {
                    if (req.url === '/healthz' || req.url === '/health') {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end('{"status":"ok"}');
                        return;
                    }
                    if (req.url?.startsWith('/api/')) {
                        const proxyReq = http.request({
                            hostname: '127.0.0.1',
                            port: 4111,
                            path: req.url,
                            method: req.method,
                            headers: req.headers
                        }, (proxyRes) => {
                            res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
                            proxyRes.pipe(res);
                        });
                        proxyReq.on('error', () => {
                            res.writeHead(503);
                            res.end('{"error":"starting"}');
                        });
                        req.pipe(proxyReq);
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(html);
                });
            }
            const mastraPath = path.join(process.cwd(), '.mastra', 'output', 'index.mjs');
            if (fs.existsSync(mastraPath)) {
                spawn('node', [mastraPath], {
                    env: { ...process.env, PORT: '4111' },
                    stdio: 'inherit'
                });
            }
        }
        catch (e) {
            console.error('Background init error:', e);
        }
    }, 500);
});
