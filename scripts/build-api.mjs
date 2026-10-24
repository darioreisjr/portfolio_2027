#!/usr/bin/env node
// Compila a Serverless Function api/chat.ts para api/dist/chat.js
// empacotando o SDK do Gemini e a base de conhecimento de packages/content
// para execução rápida e autocontida na Vercel (ADR 0016).

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, buildSync } from 'esbuild';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const buildConfig = {
  entryPoints: [join(repoRoot, 'api/chat.ts')],
  outfile: join(repoRoot, 'api/dist/chat.js'),
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  minify: false,
  sourcemap: false,
  banner: {
    js: `// Serverless Function: /api/chat - Dario Reis Portfolio (ADR 0016)
import { createRequire as __createRequire } from 'node:module';
const require = __createRequire(import.meta.url);
`,
  },
};

export async function buildApi() {
  await build(buildConfig);
}

export function buildApiSync() {
  buildSync(buildConfig);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    buildApiSync();
    console.log('api/dist/chat.js compilado com sucesso.');
  } catch (error) {
    console.error('Falha ao compilar api/chat.ts:', error);
    process.exit(1);
  }
}
