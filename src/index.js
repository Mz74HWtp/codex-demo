import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export function createApp() {
  return createServer((_request, response) => {
    response.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end('Hello DevSecOps');
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createApp();
  server.on('error', (error) => {
    console.error('HTTP server failed:', error.message);
    process.exitCode = 1;
  });
  server.listen(3000, '127.0.0.1', () => {
    console.log('Listening on http://127.0.0.1:3000');
  });
}
