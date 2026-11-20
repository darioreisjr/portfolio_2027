import type { RecruiterContent, RecruiterUi } from '@portfolio/content/recruiter';
import type { Ui } from '@portfolio/content/schemas';
import type { Locale } from '@portfolio/contracts';
import { defineCustomElement } from 'vue';
import RecruiterArea from './RecruiterArea.ce.vue';

/** Tudo o que a área precisa, já resolvido para um idioma (ADR 0015). */
export interface RecruiterAreaData {
  locale: Locale;
  /** Conteúdo da área; `null`: a tela "em construção". */
  content: RecruiterContent | null;
  text: RecruiterUi;
  construction: Ui['construction'];
}

/**
 * Cria o custom element da área de recrutador com os dados de um idioma.
 * Quem chama decide a tag e registra: as entradas por idioma, o dev e os testes.
 */
export function createRecruiterArea(area: RecruiterAreaData): CustomElementConstructor {
  const Base = defineCustomElement(RecruiterArea);
  return class extends Base {
    constructor() {
      super({ ...area });
    }
  };
}
