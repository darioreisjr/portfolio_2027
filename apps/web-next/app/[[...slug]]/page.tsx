import { ui } from '@portfolio/content/ui';
import { pathFor, routes } from '@portfolio/contracts';
import type {} from '@portfolio/design-system/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolvePage, staticPageParams, type PageParams } from '../../lib/route';

interface PageProps {
  params: Promise<PageParams>;
}

// Só existem as páginas da tabela de rotas; o resto é 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return staticPageParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const match = resolvePage(await params);
  if (!match) return {};
  const text = ui[match.locale];
  const area = text.areas[match.entry.area];
  return { title: `${area.title} | ${text.siteName}`, description: area.description };
}

export default async function Page({ params }: PageProps) {
  const match = resolvePage(await params);
  if (!match) notFound();

  const { entry, locale } = match;
  const text = ui[locale];

  return (
    <main>
      <h1>{text.areas[entry.area].title}</h1>
      <p className="hello">
        {text.hello}
        <ds-badge>Next.js</ds-badge>
      </p>
      <nav>
        <ul>
          {routes
            .filter((route) => route.area !== entry.area)
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
