import type { Locale } from '@portfolio/contracts';
import type { HowItWasBuiltUi, Site } from './schemas.js';

export interface HowItWasBuiltContent {
  hero: HowItWasBuiltUi['hero'];
  architecture: HowItWasBuiltUi['architecture'];
  adrs: {
    tag: string;
    title: string;
    lead: string;
    categories: HowItWasBuiltUi['adrs']['categories'];
    statusLabels: HowItWasBuiltUi['adrs']['statusLabels'];
    items: {
      number: number;
      title: string;
      status: string;
      statusLabel: string;
      category: 'composition' | 'designSystem' | 'navigation' | 'governance';
      summary: string;
    }[];
  };
  designSystem: HowItWasBuiltUi['designSystem'];
  metrics: {
    tag: string;
    title: string;
    lead: string;
    tableHeaders: HowItWasBuiltUi['metrics']['tableHeaders'];
    zeroWaterfallTitle: string;
    zeroWaterfallText: string;
    measuredAtFormatted: string;
    areas: Site['areas'];
    parts: Site['parts'];
  };
  footer: HowItWasBuiltUi['footer'];
  repository: string;
}

export function buildHowItWasBuilt(
  site: Site,
  text: HowItWasBuiltUi,
  locale: Locale,
): HowItWasBuiltContent {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${site.measuredAt}T00:00:00Z`),
  );

  const adrMap = new Map(text.adrs.adrs.map((item) => [item.number, item]));

  const adrItems = site.decisions.map((decision) => {
    const extra = adrMap.get(decision.number);
    const statusLabels = text.adrs.statusLabels as Record<string, string>;
    const statusLabel = statusLabels[decision.status] ?? decision.status;
    return {
      number: decision.number,
      title: decision.title,
      status: decision.status,
      statusLabel,
      category: extra?.category ?? 'composition',
      summary: extra?.summary ?? decision.title,
    };
  });

  const heroStamps = {
    ...text.hero.stamps,
    measured: text.hero.stamps.measured.replace('{date}', site.measuredAt),
  };

  return {
    hero: {
      ...text.hero,
      stamps: heroStamps,
    },
    architecture: text.architecture,
    adrs: {
      tag: text.adrs.tag,
      title: text.adrs.title,
      lead: text.adrs.lead,
      categories: text.adrs.categories,
      statusLabels: text.adrs.statusLabels,
      items: adrItems,
    },
    designSystem: text.designSystem,
    metrics: {
      tag: text.metrics.tag,
      title: text.metrics.title,
      lead: text.metrics.lead,
      tableHeaders: text.metrics.tableHeaders,
      zeroWaterfallTitle: text.metrics.zeroWaterfallTitle,
      zeroWaterfallText: text.metrics.zeroWaterfallText,
      measuredAtFormatted: text.metrics.measuredAt.replace('{date}', date),
      areas: site.areas,
      parts: site.parts,
    },
    footer: text.footer,
    repository: site.repository,
  };
}
