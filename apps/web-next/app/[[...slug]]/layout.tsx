import '@portfolio/tokens/tokens.css';
import '../site.css';
import { home } from '@portfolio/content/home';
import { ui } from '@portfolio/content/ui';
import { defaultLocale, languageAlternates, THEME_INIT_SCRIPT } from '@portfolio/contracts';
import type {} from '@portfolio/design-system/react';
import type { ReactNode } from 'react';
import { MUSIC_SLOT_ID } from '../../lib/music';
import { resolvePage, type PageParams } from '../../lib/route';

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<PageParams>;
}) {
  const page = resolvePage(await params);
  const locale = page?.locale ?? defaultLocale;
  const area = page?.entry.area;

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
        {/* Grupo fixo no canto inferior direito, depois do conteúdo na ordem do Tab. */}
        {area && (
          <footer className="ds-dock">
            {/* Lugar do botão da música de fundo, só na home (ADR 0008). O botão só
                funciona com JavaScript: quem o põe aqui é `persona-list.tsx`, e até
                lá o espaço fica guardado, vazio. */}
            {area === 'home' && <span className="home-music-slot" id={MUSIC_SLOT_ID} />}
            {/* Só a home tem animação. Caixa de seleção nativa com cara de botão:
                o CSS da home lê o estado, sem JavaScript (WCAG 2.2.2). */}
            {area === 'home' && (
              <label className="home-motion" title={home[locale].pauseMotion}>
                <input type="checkbox" aria-label={home[locale].pauseMotion} />
                <span className="home-motion-disc" aria-hidden="true">
                  <svg className="home-motion-pause" viewBox="0 0 16 16">
                    <path d="M3 2h4v12H3zM9 2h4v12H9z" />
                  </svg>
                  <svg className="home-motion-play" viewBox="0 0 16 16">
                    <path d="M4 2l10 6-10 6z" />
                  </svg>
                </span>
              </label>
            )}
            {/* Troca de idioma: links comuns para a mesma página (ADR 0006), nunca
                <Link>: cada idioma é outro documento, com o próprio `lang`. */}
            <nav className="ds-language-switcher" aria-label={ui[locale].languageSwitcher}>
              <ul>
                {languageAlternates(area, locale).map(
                  ({ locale: target, name, href, flag, current }) => (
                    <li key={target}>
                      <a
                        href={href}
                        lang={target}
                        hrefLang={target}
                        aria-label={name}
                        title={name}
                        aria-current={current ? 'page' : undefined}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sem otimizador */}
                        <img
                          src={flag}
                          alt=""
                          width={28}
                          height={28}
                          loading="lazy"
                          decoding="async"
                        />
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </nav>
          </footer>
        )}
        {/* Mesma URL que o shell usa: uma cópia do design system em cache para o site todo. */}
        <script type="module" async src="/_ds/ds.js" />
      </body>
    </html>
  );
}
