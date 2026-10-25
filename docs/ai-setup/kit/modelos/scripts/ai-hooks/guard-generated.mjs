#!/usr/bin/env node
// Hook "antes de editar": recusa edição em arquivo gerado por scripts/ai-sync.mjs e diz qual
// fonte editar. Se o plano não puder ser montado (fonte quebrada), deixa passar.

import { plan } from '../ai-sync.mjs';
import { block, readEvent } from './lib.mjs';

const event = await readEvent();
if (event.files.length === 0) process.exit(0);

let generated;
try {
  generated = plan();
} catch {
  process.exit(0);
}

for (const file of event.files) {
  const entry = generated.expected.get(file);
  const managed = generated.managedDirs.some((dir) => file.startsWith(`${dir}/`));
  if (entry || managed) {
    const source = entry?.source ?? 'a fonte correspondente (veja docs/ai-setup/README.md)';
    block(
      event,
      `${file} é gerado por scripts/ai-sync.mjs e não se edita à mão. Edite ${source} e rode: node scripts/ai-sync.mjs`,
    );
  }
}
process.exit(0);
