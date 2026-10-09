import { recruiter } from '@portfolio/content/recruiter';
import type { AreaId } from '@portfolio/contracts';

/**
 * A área já tem conteúdo para mostrar, ou ainda é a tela "em construção"? Sabido
 * na geração do documento (ADR 0010): o palco certo já vem no HTML, sem troca de
 * layout depois que o MFE monta. Usado só pelo gerador e pelo servidor de
 * desenvolvimento; não entra no script do shell.
 */
export const areaHasContent = (area: AreaId): boolean => area === 'recruiter' && recruiter !== null;
