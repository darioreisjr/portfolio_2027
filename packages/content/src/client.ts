import type { Locale } from '@portfolio/contracts';
import type { ClientTerms, Contact, Localized, Project, Service, Testimonial } from './schemas.js';

/**
 * Tudo que a área do cliente mostra em um idioma, já filtrado e traduzido. A
 * página fala com quem procura alguém para fazer um projeto: nada aqui leva
 * nome de tecnologia.
 */
export interface ClientContent {
  /** Que blocos são rascunho: cada um mostra a faixa "Dados de exemplo". */
  example: { services: boolean; cases: boolean; testimonials: boolean; terms: boolean };
  services: { id: string; title: string; description: string; deliverables: string[] }[];
  /** Etapas do trabalho, na ordem. */
  process: { id: string; title: string; description: string }[];
  /** Projetos contados pelo resultado: só os que têm a narrativa `outcome`. */
  cases: { id: string; title: string; summary: string; context: string; result: string }[];
  testimonials: { id: string; author: string; role: string; company?: string; quote: string }[];
  /** Como é orçado e as formas de contratar. Sem valores. */
  engagement: {
    pricing: string;
    models: {
      id: ClientTerms['engagement']['models'][number]['id'];
      title: string;
      description: string;
      timeline: string;
    }[];
  };
  faq: { id: string; question: string; answer: string }[];
  /** Canais para pedir orçamento. */
  contacts: { id: string; kind: Contact['kind']; url: string; display: string }[];
}

export interface ClientSources {
  services: Service[];
  projects: Project[];
  testimonials: Testimonial[];
  terms: ClientTerms;
  contacts: Contact[];
  example: ClientContent['example'];
}

/** Remove chaves sem valor, para o JSON gerado não levar `undefined`. */
const compact = <Value extends object>(value: Value): Value =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Value;

export function buildClient(sources: ClientSources, locale: Locale): ClientContent {
  const { services, projects, testimonials, terms, contacts, example } = sources;
  // Rascunho pode ter só pt-BR; publicado tem os três, e a validação garante.
  const t = (value: Localized): string => value[locale] || value['pt-BR'];

  return {
    example,
    services: services.map((service) => ({
      id: service.id,
      title: t(service.title),
      description: t(service.description),
      deliverables: (service.deliverables ?? []).map(t),
    })),
    process: terms.process.map((step) => ({
      id: step.id,
      title: t(step.title),
      description: t(step.description),
    })),
    // Mais recente primeiro.
    cases: [...projects]
      .sort((a, b) => b.start.localeCompare(a.start))
      .flatMap((project) =>
        project.outcome
          ? {
              id: project.id,
              title: t(project.title),
              summary: t(project.summary),
              context: t(project.outcome.context),
              result: t(project.outcome.result),
            }
          : [],
      ),
    testimonials: testimonials.map((testimonial) =>
      compact({
        id: testimonial.id,
        author: testimonial.author,
        role: t(testimonial.authorRole),
        company: testimonial.company,
        quote: t(testimonial.quote),
      }),
    ),
    engagement: {
      pricing: t(terms.engagement.pricing),
      models: terms.engagement.models.map((model) => ({
        id: model.id,
        title: t(model.title),
        description: t(model.description),
        timeline: t(model.timeline),
      })),
    },
    faq: terms.faq.map((item) => ({
      id: item.id,
      question: t(item.question),
      answer: t(item.answer),
    })),
    // Os canais marcados para o cliente; sem marca nenhuma, todos.
    contacts: (contacts.some((contact) => contact.primaryFor?.includes('client'))
      ? contacts.filter((contact) => contact.primaryFor?.includes('client'))
      : contacts
    )
      // O canal mais direto para quem quer contratar vem primeiro.
      .toSorted((a, b) => Number(b.kind === 'whatsapp') - Number(a.kind === 'whatsapp'))
      .map(({ id, kind, url, display }) => ({ id, kind, url, display })),
  };
}
