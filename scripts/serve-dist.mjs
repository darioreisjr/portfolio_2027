#!/usr/bin/env node
// Servidor estático mínimo para o dist/ montado. Imita o que o host faz:
// /rota/ -> rota/index.html, e 404.html para o que não existe.
//
//   node scripts/serve-dist.mjs [porta]

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
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
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
};

function resolveFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // Endereço com `%` malformado: não existe, em vez de derrubar o servidor.
    return undefined;
  }
  const candidate = normalize(join(distDir, decoded));
  // Com o separador: uma pasta irmã chamada `dist-algo` não passa.
  if (candidate !== distDir && !candidate.startsWith(distDir + sep)) return undefined;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  const index = join(candidate, 'index.html');
  return existsSync(index) ? index : undefined;
}

if (!existsSync(distDir)) {
  console.error('dist/ não existe. Rode "pnpm build && pnpm assemble" antes.');
  process.exit(1);
}

// Aplica os cabeçalhos de segurança globais definidos em vercel.json (issue #47)
let vercelHeaders = [];
const vercelJsonPath = join(distDir, 'vercel.json');
if (existsSync(vercelJsonPath)) {
  try {
    const config = JSON.parse(readFileSync(vercelJsonPath, 'utf8'));
    if (Array.isArray(config.headers)) {
      const globalRule = config.headers.find((rule) => rule.source === '/(.*)' && !rule.missing);
      if (globalRule?.headers) {
        vercelHeaders = globalRule.headers;
      }
    }
  } catch {
    // segue sem cabeçalhos adicionais caso o arquivo não seja legível
  }
}

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');

  // Serverless Function local para /api/chat (ADR 0016)
  if (pathname === '/api/chat') {
    const apiFile = join(distDir, 'api', 'chat.js');
    if (existsSync(apiFile)) {
      import(`file://${apiFile}?t=${statSync(apiFile).mtimeMs}`)
        .then(({ default: handler }) => handler(request, response))
        .catch((err) => {
          response.writeHead(500, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: err.message }));
        });
      return;
    }
  }

  const file = resolveFile(pathname);
  const target = file ?? join(distDir, '404.html');
  const type = contentTypes[extname(target)] ?? 'application/octet-stream';

  for (const { key, value } of vercelHeaders) {
    response.setHeader(key, value);
  }

  // Navegadores pedem mídia em pedaços (o Safari exige): atende um intervalo só.
  const range = file && /^bytes=(\d*)-(\d*)$/.exec(request.headers.range ?? '');
  if (range && (range[1] || range[2])) {
    const { size } = statSync(target);
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      response.writeHead(416, { 'Content-Range': `bytes */${size}` });
      response.end();
      return;
    }
    response.writeHead(206, {
      'Content-Type': type,
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': end - start + 1,
    });
    createReadStream(target, { start, end }).pipe(response);
    return;
  }

  response.writeHead(file ? 200 : 404, { 'Content-Type': type, 'Accept-Ranges': 'bytes' });
  createReadStream(target).pipe(response);
  // Só nesta máquina: ninguém da rede local lê o que está sendo servido.
}).listen(port, '127.0.0.1', () => console.log(`dist/ em http://localhost:${port}`));
