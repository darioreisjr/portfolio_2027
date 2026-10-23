import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { minify } from 'terser';

execSync('ng build', { stdio: 'inherit' });
execSync('ng build -c pt-br', { stdio: 'inherit' });
execSync('ng build -c en', { stdio: 'inherit' });
execSync('ng build -c es', { stdio: 'inherit' });

for (const loc of ['pt-br', 'en', 'es']) {
  mkdirSync(`dist/browser/${loc}`, { recursive: true });
  const dest = `dist/browser/${loc}/main.js`;
  copyFileSync(`dist/${loc}/browser/main.js`, dest);
  rmSync(`dist/${loc}`, { recursive: true, force: true });

  const code = readFileSync(dest, 'utf8');
  const minified = await minify(code, {
    module: true,
    ecma: 2022,
    compress: {
      passes: 2,
      pure_getters: true,
    },
    mangle: {
      toplevel: true,
    },
    format: {
      comments: false,
    },
  });
  if (minified.code) {
    writeFileSync(dest, minified.code, 'utf8');
  }
}
