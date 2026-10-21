import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import { extractHtmlScripts, partSize, runBudgetChecks } from './check-budgets.mjs';

function createFixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'budgets-'));
  for (const [file, content] of Object.entries(files)) {
    const fullPath = join(root, file);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
  }
  return root;
}

test('extractHtmlScripts extrai scripts ignorando nomodule', () => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="/_next/static/chunks/main.js" async=""></script>
        <script src="/_next/static/chunks/poly.js" nomodule=""></script>
        <script src="/_next/static/chunks/poly2.js" noModule></script>
        <script type="module" src="/_ds/ds.js"></script>
      </head>
      <body></body>
    </html>
  `;
  const all = extractHtmlScripts(html);
  assert.deepEqual(all, ['/_next/static/chunks/main.js', '/_ds/ds.js']);

  const nextOnly = extractHtmlScripts(html, '/_next/');
  assert.deepEqual(nextOnly, ['/_next/static/chunks/main.js']);
});

test('partSize mede a parte web-next a partir do HTML sem design system nem nomodule', () => {
  const chunkContent = 'console.log("next chunk");'.repeat(50);
  const dsContent = 'console.log("ds chunk");'.repeat(50);
  const nomoduleContent = 'console.log("nomodule chunk");'.repeat(100);

  const fixture = createFixture({
    'index.html': `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="/_next/static/chunks/app.js"></script>
          <script src="/_next/static/chunks/legacy.js" nomodule></script>
          <script src="/_ds/ds.js"></script>
        </head>
      </html>
    `,
    '_next/static/chunks/app.js': chunkContent,
    '_next/static/chunks/legacy.js': nomoduleContent,
    '_ds/ds.js': dsContent,
  });

  const expectedGzipKb = gzipSync(Buffer.from(chunkContent)).length / 1000;
  const measured = partSize(fixture, 'web-next', { dir: '_next', maxKb: 140 });

  assert.equal(measured.toFixed(3), expectedGzipKb.toFixed(3));
});

test('partSize mede diretórios normais somando todos os .js', () => {
  const file1 = 'const a = 1;';
  const file2 = 'const b = 2;';
  const fixture = createFixture({
    '_shell/shell.js': file1,
    '_shell/vendor.js': file2,
  });

  const expectedGzipKb =
    (gzipSync(Buffer.from(file1)).length + gzipSync(Buffer.from(file2)).length) / 1000;
  const measured = partSize(fixture, 'shell', { dir: '_shell', maxKb: 10 });

  assert.equal(measured.toFixed(3), expectedGzipKb.toFixed(3));
});

test('runBudgetChecks reprova quando parte estoura o teto', () => {
  const largeContent = randomBytes(5000);
  const fixture = createFixture({
    'index.html': '<script src="/_next/static/app.js"></script>',
    '_next/static/app.js': largeContent,
    '_shell/shell.js': 'x',
  });

  const budgets = {
    parts: {
      'web-next': { dir: '_next', maxKb: 1 },
      shell: { dir: '_shell', maxKb: 10 },
    },
    routes: {},
  };

  const { failures, rows } = runBudgetChecks(fixture, budgets);
  assert.equal(failures.length, 1);
  assert.match(failures[0], /parte web-next: .* passa do teto de 1 kB/);
  assert.equal(rows.find((r) => r.medido === 'parte web-next')?.ok, false);
  assert.equal(rows.find((r) => r.medido === 'parte shell')?.ok, true);
});
