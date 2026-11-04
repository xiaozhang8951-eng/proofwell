// Local preview only. Cloudflare Pages serves out/ directly without this server.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('out');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

try {
  await stat(resolve(root, 'index.html'));
} catch {
  console.error('Static export missing. Run npm run build before npm start.');
  process.exit(1);
}

async function findFile(pathname) {
  const relative = pathname.replace(/^\/+|\/+$/g, '');
  for (const candidate of [relative, `${relative}.html`, relative ? `${relative}/index.html` : 'index.html']) {
    const file = resolve(root, candidate);
    if (!file.startsWith(root + sep)) continue;
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {
      // Try the next clean-URL variant.
    }
  }
  return null;
}

createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = await findFile(pathname);
    const body = await readFile(file || resolve(root, '404.html'));
    response.writeHead(file ? 200 : 404, {
      'Content-Type': contentTypes[extname(file || '404.html')] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
  }
}).listen(port, host, () => {
  console.log(`Static export preview: http://${host}:${port} (out/ only; no Next.js server)`);
});
