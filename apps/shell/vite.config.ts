import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ui } from '@portfolio/content/ui';
import { findRoute, HOME_ASSETS_PATH, routesOwnedBy } from '@portfolio/contracts';
import { defineConfig, type Plugin } from 'vite';
import { renderPage } from './src/page.ts';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const NEXT_DEV = 'http://localhost:3000';

// Em desenvolvimento, o shell é a origem única (ADR 0002): serve os mesmos
// caminhos do site publicado, lendo os `dist` que os outros apps geram em watch.
const publishedDirs: Record<string, string> = {
  '/_ds/tokens.css': 'packages/tokens/dist/tokens.css',
  // Direto da fonte: editar a folha das páginas internas não espera build.
  '/_ds/areas.css': 'packages/design-system/assets/areas.css',
  '/_ds/fonts/': 'packages/tokens/dist/fonts/',
  '/_ds/': 'packages/design-system/dist/',
  '/_mfe/vue/': 'apps/mfe-vue/dist/',
  '/_mfe/react/': 'apps/mfe-react/dist/',
  '/_mfe/angular/': 'apps/mfe-angular/dist/browser/',
};

const contentTypes: Record<string, string> = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.map': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function resolvePublished(pathname: string): string | undefined {
  for (const [prefix, target] of Object.entries(publishedDirs)) {
    if (!pathname.startsWith(prefix)) continue;
    const file = normalize(join(repoRoot, target, pathname.slice(prefix.length)));
    if (file.startsWith(normalize(join(repoRoot, target))) && existsSync(file)) return file;
    return undefined;
  }
  return undefined;
}

function composedDev(): Plugin {
  return {
    name: 'portfolio-composed-dev',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;

        if (pathname === '/_shell/shell.js') {
          request.url = '/src/main.ts';
          return next();
        }

        const match = findRoute(pathname);
        if (match?.entry.owner === 'shell') {
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(renderPage(match.entry, match.locale, ui[match.locale]));
          return;
        }

        const file = resolvePublished(pathname);
        if (file && statSync(file).isFile()) {
          response.setHeader('Content-Type', contentTypes[extname(file)] ?? 'text/plain');
          response.setHeader('Cache-Control', 'no-store');
          createReadStream(file).pipe(response);
          return;
        }

        next();
      });
    },
  };
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Tudo que é do Next.js vai para o servidor de desenvolvimento dele.
const nextPaths = routesOwnedBy('web-next')
  .flatMap((route) => Object.values(route.paths))
  .map((path) => `${escapeRegex(path.replace(/\/$/, ''))}/?`);
// Inclui os arquivos estáticos da home (pasta public do Next.js).
const nextProxyPattern = `^(?:/_next/|/__nextjs|${HOME_ASSETS_PATH}|(?:${nextPaths.join('|')})$)`;

export default defineConfig({
  plugins: [composedDev()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      [nextProxyPattern]: { target: NEXT_DEV, ws: true },
    },
  },
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
      fileName: () => '_shell/shell.js',
    },
  },
});
