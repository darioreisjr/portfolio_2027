import {
  howItWasBuilt,
  howItWasBuiltUi,
  type HowItWasBuiltContent,
  type HowItWasBuiltUi,
} from '@portfolio/content/how-it-was-built';
import { ui } from '@portfolio/content/ui';
import { pathFor, type Locale } from '@portfolio/contracts';

export interface HowItWasBuiltModel {
  content: HowItWasBuiltContent;
  text: HowItWasBuiltUi;
  title: string;
  homeHref: string;
  back: string;
  leaving: string;
}

/**
 * Tudo que a página "Como foi feito" mostra em um idioma.
 */
export function buildHowItWasBuiltPage(locale: Locale): HowItWasBuiltModel | null {
  const content = howItWasBuilt?.[locale];
  const text = howItWasBuiltUi?.[locale];
  if (!content || !text) return null;

  return {
    content,
    text,
    title: ui[locale].areas['how-it-was-built'].title,
    homeHref: pathFor('home', locale),
    back: ui[locale].construction.back,
    leaving: ui[locale].leaving,
  };
}
