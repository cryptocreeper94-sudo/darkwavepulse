import http from 'http';
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'Mastra API ready' }));
});
server.listen(4111, '127.0.0.1', () => {
  console.log('[Mastra] API server running on port 4111');
});
