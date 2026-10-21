import { ui } from '@portfolio/content/ui';
import {
  canonicalUrl,
  hreflangAlternates,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
  openGraphLocale,
} from '@portfolio/contracts';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildCommunityPage } from '../../lib/community';
import { buildPersonJsonLd } from '../../lib/json-ld';
import { resolvePage, staticPageParams, type PageParams } from '../../lib/route';
import { AreaConstruction } from '../_components/area-construction';
import { CommunityPage } from '../_components/community-page';
import { HomeStage } from '../_components/home-stage';

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
  const canonical = canonicalUrl(match.entry.area, match.locale);
  const languages = Object.fromEntries(
    hreflangAlternates(match.entry.area).map(({ hreflang, href }) => [hreflang, href]),
  );
  const title = `${area.title} | ${text.siteName}`;
  return {
    title,
    description: area.description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description: area.description,
      url: canonical,
      siteName: text.siteName,
      locale: openGraphLocale(match.locale),
      images: [
        {
          url: OG_IMAGE_URL,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: `${text.siteName} - ${area.title}`,
        },
      ],
      type: 'website',
    },
  };
}

export default async function Page({ params }: PageProps) {
  const match = resolvePage(await params);
  if (!match) notFound();

  const { entry, locale } = match;
  if (entry.area === 'home') {
    const personLd = buildPersonJsonLd(locale);
    return (
      <>
        {personLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
          />
        )}
        <HomeStage locale={locale} />
      </>
    );
  }

  // A comunidade tem página própria quando há o que mostrar (ADR 0013).
  const community = entry.area === 'community' ? buildCommunityPage(locale) : null;
  return community ? (
    <CommunityPage model={community} />
  ) : (
    <AreaConstruction area={entry.area} locale={locale} />
  );
}
