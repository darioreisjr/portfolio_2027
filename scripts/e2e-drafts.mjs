// Monta o dist/ COM os rascunhos de conteúdo e roda os testes de e2e-drafts/.
// O dist/ fica com os rascunhos: rode `pnpm build && pnpm assemble` antes de
// `test:e2e`, `budgets` ou `lhci`, que esperam o build de produção.
import { spawnSync } from 'node:child_process';

const env = { ...process.env, CONTENT_INCLUDE_DRAFTS: '1' };
const steps = [
  'pnpm build',
  'pnpm assemble',
  'pnpm exec playwright test -c playwright.drafts.config.ts',
];

for (const command of steps) {
  const { status } = spawnSync(command, { env, stdio: 'inherit', shell: true });
  if (status !== 0) process.exit(status ?? 1);
}
console.log('O dist/ está com rascunhos. Antes do e2e normal: pnpm build && pnpm assemble.');
