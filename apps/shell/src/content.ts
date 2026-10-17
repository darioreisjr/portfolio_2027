import { client } from '@portfolio/content/client';
import { recruiter } from '@portfolio/content/recruiter';
import { tech } from '@portfolio/content/tech';
import type { AreaId, Locale } from '@portfolio/contracts';

/** O conteúdo de cada área que já tem página; `null` enquanto não há o que mostrar. */
const content: Partial<Record<AreaId, unknown>> = { recruiter, tech, client };

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );

/**
 * A área já tem conteúdo para mostrar, ou ainda é a tela "em construção"? Sabido
 * na geração do documento (ADR 0010): o palco certo já vem no HTML, sem troca de
 * layout depois que o MFE monta. Usado só pelo gerador e pelo servidor de
 * desenvolvimento; não entra no script do shell.
 */
export const areaHasContent = (area: AreaId): boolean => content[area] != null;

/**
 * Resumo estático em HTML da área com conteúdo para quem acessa sem JavaScript
 * e para indexação por buscadores (ADR 0010, issue #39). O MFE substitui este
 * conteúdo ao montar.
 */
export function areaSummary(area: AreaId, locale: Locale): string {
  if (area === 'recruiter' && recruiter) {
    const data = recruiter[locale];
    if (!data) return '';
    return `<article class="area-fallback">
        <header>
          <h2 class="area-fallback-title">${escapeHtml(data.name)}</h2>
          <p class="area-fallback-role">${escapeHtml(data.role)}</p>
          ${data.tagline ? `<p class="area-fallback-tagline">${escapeHtml(data.tagline)}</p>` : ''}
        </header>
        ${data.summary ? `<p class="area-fallback-summary">${escapeHtml(data.summary)}</p>` : ''}
      </article>`;
  }

  if (area === 'tech' && tech) {
    const data = tech[locale];
    if (!data) return '';
    const items = data.projects
      .slice(0, 3)
      .map(
        (project) =>
          `<li><strong>${escapeHtml(project.title)}</strong>: ${escapeHtml(project.summary)}</li>`,
      )
      .join('');
    return `<article class="area-fallback">
        ${items ? `<ul class="area-fallback-list">${items}</ul>` : ''}
      </article>`;
  }

  if (area === 'client' && client) {
    const data = client[locale];
    if (!data) return '';
    const items = data.services
      .slice(0, 3)
      .map(
        (service) =>
          `<li><strong>${escapeHtml(service.title)}</strong>: ${escapeHtml(service.description)}</li>`,
      )
      .join('');
    return `<article class="area-fallback">
        ${items ? `<ul class="area-fallback-list">${items}</ul>` : ''}
      </article>`;
  }

  return '';
}
