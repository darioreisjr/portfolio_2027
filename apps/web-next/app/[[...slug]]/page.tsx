import { ui } from '@portfolio/content/ui';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildCommunityPage } from '../../lib/community';
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
  return { title: `${area.title} | ${text.siteName}`, description: area.description };
}

export default async function Page({ params }: PageProps) {
  const match = resolvePage(await params);
  if (!match) notFound();

  const { entry, locale } = match;
  if (entry.area === 'home') return <HomeStage locale={locale} />;

  // A comunidade tem página própria quando há o que mostrar (ADR 0013).
  const community = entry.area === 'community' ? buildCommunityPage(locale) : null;
  return community ? (
    <CommunityPage model={community} />
  ) : (
    <AreaConstruction area={entry.area} locale={locale} />
  );
}
