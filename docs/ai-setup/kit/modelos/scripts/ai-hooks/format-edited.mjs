#!/usr/bin/env node
// Hook "depois de editar": roda o formatador do projeto nos arquivos que o agente alterou.
// Nunca bloqueia: se o formatador falhar, só avisa.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readEvent, root } from './lib.mjs';

// <<PREENCHER>> O comando do formatador do projeto; o caminho do arquivo entra no fim.
// Exemplos: ['npx', '--no-install', 'prettier', '--write', '--ignore-unknown'],
//           ['ruff', 'format'], ['gofmt', '-w'].
const FORMATTER = ['npx', '--no-install', 'prettier', '--write', '--ignore-unknown'];

const event = await readEvent();
const files = event.files.filter((file) => !file.startsWith('..') && existsSync(join(root, file)));
if (files.length === 0) process.exit(0);

const [command, ...args] = FORMATTER;
const result = spawnSync(command, [...args, ...files], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
if (result.status !== 0) {
  process.stderr.write(
    `Formatador falhou em ${files.join(', ')}: ${result.stderr || result.error}\n`,
  );
}
process.exit(0);
