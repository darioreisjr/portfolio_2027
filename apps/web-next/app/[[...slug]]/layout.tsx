import '@portfolio/tokens/tokens.css';
import '../site.css';
import { ui } from '@portfolio/content/ui';
import {
  AREA_TRANSITIONS,
  arrivalInitScript,
  defaultLocale,
  languageAlternates,
  THEME_INIT_SCRIPT,
} from '@portfolio/contracts';
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
  const alternates = area ? languageAlternates(area, locale) : [];
  const currentLanguage = alternates.find((alternate) => alternate.current);
  const otherLanguages = alternates.filter((alternate) => !alternate.current);

  return (
    // O script abaixo põe `data-theme` no <html> antes da hidratação; sem o
    // aviso suprimido o React reclamaria da diferença.
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Aplica o tema salvo antes da primeira pintura, para a página não piscar.
            Na home, o mesmo script lê a marca de quem volta de uma área, para a
            cortina da volta já estar na tela (ADR 0011). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              area === 'home'
                ? `${THEME_INIT_SCRIPT};${arrivalInitScript(AREA_TRANSITIONS)}`
                : THEME_INIT_SCRIPT,
          }}
        />
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
              <label className="home-motion" title={ui[locale].pauseMotion}>
                <input type="checkbox" aria-label={ui[locale].pauseMotion} />
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
            {/* Nas páginas internas a mesma pausa, com a aparência da folha delas
                (ADR 0009): o cenário da área também se move sem parar. */}
            {area !== 'home' && (
              <label className="area-motion" title={ui[locale].pauseMotion}>
                <input type="checkbox" aria-label={ui[locale].pauseMotion} />
                <span className="area-motion-disc" aria-hidden="true">
                  <svg className="area-motion-pause" viewBox="0 0 16 16">
                    <path d="M3 2h4v12H3zM9 2h4v12H9z" />
                  </svg>
                  <svg className="area-motion-play" viewBox="0 0 16 16">
                    <path d="M4 2l10 6-10 6z" />
                  </svg>
                </span>
              </label>
            )}
            {/* Troca de idioma (ADR 0006): a bandeira do idioma em uso abre os
                outros, que são links comuns para a mesma página, nunca <Link>: cada
                idioma é outro documento, com o próprio `lang`. Sem script. */}
            <nav aria-label={ui[locale].languageSwitcher}>
              <details className="ds-language-switcher">
                <summary title={currentLanguage?.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sem otimizador */}
                  <img
                    src={currentLanguage?.flag}
                    alt={currentLanguage?.name ?? ''}
                    width={28}
                    height={28}
                    loading="lazy"
                    decoding="async"
                  />
                </summary>
                <ul>
                  {otherLanguages.map(({ locale: target, name, href, flag }) => (
                    <li key={target}>
                      <a href={href} lang={target} hrefLang={target} aria-label={name} title={name}>
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
                  ))}
                </ul>
              </details>
            </nav>
          </footer>
        )}
        {/* Mesma URL que o shell usa: uma cópia do design system em cache para o site todo. */}
        <script type="module" async src="/_ds/ds.js" />
      </body>
    </html>
  );
}
