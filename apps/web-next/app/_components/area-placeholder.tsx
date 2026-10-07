import { ui } from '@portfolio/content/ui';
import { pathFor, routes, type AreaId, type Locale } from '@portfolio/contracts';
import type {} from '@portfolio/design-system/react';
import Link from 'next/link';

/** Página provisória das áreas do Next.js que ainda não têm conteúdo próprio. */
export function AreaPlaceholder({ area, locale }: { area: AreaId; locale: Locale }) {
  const text = ui[locale];

  return (
    <main>
      <h1>{text.areas[area].title}</h1>
      <p className="hello">
        {text.hello}
        <ds-badge>Next.js</ds-badge>
      </p>
      <nav>
        <ul>
          {routes
            .filter((route) => route.area !== area)
            .map((route) => {
              const href = pathFor(route.area, locale);
              const label = text.areas[route.area].title;
              return (
                <li key={route.area}>
                  {/* Áreas do shell são outro documento: <a>, nunca <Link> (ADR 0002). */}
                  {route.owner === 'web-next' ? (
                    <Link href={href}>{label}</Link>
                  ) : (
                    <a href={href}>{label}</a>
                  )}
                </li>
              );
            })}
        </ul>
      </nav>
    </main>
  );
}
