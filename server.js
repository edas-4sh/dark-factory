// server.js
// Simple HTTP server that responds with 'Hello World' on port 4000

const http = require('http');

const PORT = 4000;

const requestListener = (req, res) => {
  // Only handle GET requests for the root path
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World');
  } else {
    // Respond with 404 for any other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
};

const server = http.createServer(requestListener);

server.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`Server is listening on port ${PORT}`);
});
