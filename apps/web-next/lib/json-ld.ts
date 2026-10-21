import { contacts, profile } from '@portfolio/content/profile';
import { canonicalUrl, type Locale } from '@portfolio/contracts';

export interface PersonJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  jobTitle: string;
  url: string;
  sameAs: string[];
  description?: string;
}

export function buildPersonJsonLd(locale: Locale): PersonJsonLd | null {
  if (!profile) return null;

  const sameAs = contacts
    .filter((contact) => contact.kind === 'linkedin' || contact.kind === 'github')
    .map((contact) => contact.url);

  const jobTitle = profile.role[locale] ?? profile.role['pt-BR'];
  const description = profile.summary?.[locale] ?? profile.tagline?.[locale];

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle,
    url: canonicalUrl('home', locale),
    sameAs,
    ...(description ? { description } : {}),
  };
}
