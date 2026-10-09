// Gera um index.html por área de MFE e por idioma, a partir da tabela de rotas.
// Roda depois do `vite build`, direto no Node (que executa TypeScript sem compilar).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ui } from '@portfolio/content/ui';
import { locales, routesOwnedBy } from '@portfolio/contracts';
import { areaHasContent } from '../src/content.ts';
import { renderPage } from '../src/page.ts';

const outDir = fileURLToPath(new URL('../dist', import.meta.url));
let count = 0;

for (const entry of routesOwnedBy('shell')) {
  for (const locale of locales) {
    const dir = join(outDir, entry.paths[locale]);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'index.html'),
      renderPage(entry, locale, ui[locale], { content: areaHasContent(entry.area) }),
    );
    count += 1;
  }
}

console.log(`Shell: ${count} documentos gerados.`);
