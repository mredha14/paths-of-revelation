import { createServer } from 'node:http';
import next from 'next';

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOST || '0.0.0.0';
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

createServer((request, response) => {
  handle(request, response).catch((error) => {
    console.error(error);
    if (!response.headersSent) response.statusCode = 500;
    response.end('Internal Server Error');
  });
}).listen(port, hostname, () => {
  console.log(`Paths of Revelation listening on http://${hostname}:${port}`);
});
