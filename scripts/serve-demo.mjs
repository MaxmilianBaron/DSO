import { createReadStream, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.argv[2] || 4174);
const publicRoot = new Set(['index.html', 'styles.css', 'app.js', 'sw.js', 'manifest.webmanifest']);
const mimeTypes = { '.css':'text/css', '.html':'text/html', '.js':'text/javascript', '.png':'image/png', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json', '.webp':'image/webp', '.ttf':'font/ttf', '.txt':'text/plain; charset=utf-8' };
createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname); }
  catch { response.writeHead(400).end('Invalid URL'); return; }
  const segments = pathname.split('/');
  if (segments.some(part => part.startsWith('.') || part.includes(String.fromCharCode(92)) || part.includes(':') || part.includes(String.fromCharCode(0)))) {
    response.writeHead(403).end('Forbidden'); return;
  }
  let relative = pathname.slice(1);
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  if (!publicRoot.has(relative) && !relative.startsWith('app/') && !relative.startsWith('assets/')) {
    response.writeHead(404).end('Not found'); return;
  }
  const file = resolve(root, relative);
  if (!file.startsWith(resolve(root) + sep)) { response.writeHead(403).end('Forbidden'); return; }
  try {
    if (!statSync(file).isFile() || !mimeTypes[extname(file)]) throw new Error('Not a public file');
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(file)], 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
    if (request.method === 'HEAD') { response.end(); return; }
    createReadStream(file).on('error', () => response.destroy()).pipe(response);
  } catch { response.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`DSO preview: http://127.0.0.1:${port}/`));
