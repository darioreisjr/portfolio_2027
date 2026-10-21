import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';

execSync('ng build', { stdio: 'inherit' });
execSync('ng build -c pt-br', { stdio: 'inherit' });
execSync('ng build -c en', { stdio: 'inherit' });
execSync('ng build -c es', { stdio: 'inherit' });

for (const loc of ['pt-br', 'en', 'es']) {
  mkdirSync(`dist/browser/${loc}`, { recursive: true });
  copyFileSync(`dist/${loc}/browser/main.js`, `dist/browser/${loc}/main.js`);
  rmSync(`dist/${loc}`, { recursive: true, force: true });
}
