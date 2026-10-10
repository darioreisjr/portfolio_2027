import { client } from '@portfolio/content/client';
import { recruiter } from '@portfolio/content/recruiter';
import { tech } from '@portfolio/content/tech';
import type { AreaId } from '@portfolio/contracts';

/** O conteúdo de cada área que já tem página; `null` enquanto não há o que mostrar. */
const content: Partial<Record<AreaId, unknown>> = { recruiter, tech, client };

/**
 * A área já tem conteúdo para mostrar, ou ainda é a tela "em construção"? Sabido
 * na geração do documento (ADR 0010): o palco certo já vem no HTML, sem troca de
 * layout depois que o MFE monta. Usado só pelo gerador e pelo servidor de
 * desenvolvimento; não entra no script do shell.
 */
export const areaHasContent = (area: AreaId): boolean => content[area] != null;
