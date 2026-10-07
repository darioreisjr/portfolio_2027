import '@portfolio/tokens/tokens.css';
import '../site.css';
import { defaultLocale } from '@portfolio/contracts';
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
    <html lang={locale}>
      <body>
        {children}
        {/* Mesma URL que o shell usa: uma cópia do design system em cache para o site todo. */}
        <script type="module" async src="/_ds/ds.js" />
      </body>
    </html>
  );
}
