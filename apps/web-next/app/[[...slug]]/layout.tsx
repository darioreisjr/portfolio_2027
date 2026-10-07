import '@portfolio/tokens/tokens.css';
import '../site.css';
import { ui } from '@portfolio/content/ui';
import { defaultLocale, THEME_INIT_SCRIPT } from '@portfolio/contracts';
import type {} from '@portfolio/design-system/react';
import type { ReactNode } from 'react';
import { resolvePage, type PageParams } from '../../lib/route';

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<PageParams>;
}) {
  const locale = resolvePage(await params)?.locale ?? defaultLocale;

  return (
    // O script abaixo põe `data-theme` no <html> antes da hidratação; sem o
    // aviso suprimido o React reclamaria da diferença.
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Aplica o tema salvo antes da primeira pintura, para a página não piscar. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <header className="site-tools">
          <ds-theme-toggle label={ui[locale].themeToggle} suppressHydrationWarning />
        </header>
        {children}
        {/* Mesma URL que o shell usa: uma cópia do design system em cache para o site todo. */}
        <script type="module" async src="/_ds/ds.js" />
      </body>
    </html>
  );
}
