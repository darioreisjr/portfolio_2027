#!/usr/bin/env node
// Servidor estático mínimo para o dist/ montado. Imita o que o host faz:
// /rota/ -> rota/index.html, e 404.html para o que não existe.
//
//   node scripts/serve-dist.mjs [porta]

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.argv[2] ?? 4173);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function resolveFile(pathname) {
  const candidate = normalize(join(distDir, decodeURIComponent(pathname)));
  if (!candidate.startsWith(distDir)) return undefined;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  const index = join(candidate, 'index.html');
  return existsSync(index) ? index : undefined;
}

if (!existsSync(distDir)) {
  console.error('dist/ não existe. Rode "pnpm build && pnpm assemble" antes.');
  process.exit(1);
}

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const file = resolveFile(pathname);
  const target = file ?? join(distDir, '404.html');
  response.writeHead(file ? 200 : 404, {
    'Content-Type': contentTypes[extname(target)] ?? 'application/octet-stream',
  });
  createReadStream(target).pipe(response);
}).listen(port, () => console.log(`dist/ em http://localhost:${port}`));
