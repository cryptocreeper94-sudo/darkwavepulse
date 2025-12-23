const http = require('http');
const PORT = process.env.PORT || 3000;
const html = '<!DOCTYPE html><html><head><title>Pulse</title><meta http-equiv="refresh" content="2"></head><body style="background:#0f0f0f;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h1 style="color:#00D4FF">Loading Pulse...</h1></body></html>';

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': req.url === '/' ? 'text/html' : 'application/json'});
  res.end(req.url === '/' ? html : '{"status":"ok"}');
}).listen(PORT, '0.0.0.0', () => {
  console.log('Ready:' + PORT);
  setTimeout(() => {
    try {
      const fs = require('fs');
      if (fs.existsSync('.mastra/output/index.mjs')) {
        require('child_process').spawn('node', ['.mastra/output/index.mjs'], {env:{...process.env,PORT:'4111'},stdio:'inherit'});
      }
    } catch(e){}
  }, 100);
});
