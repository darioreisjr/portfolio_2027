import { recruiter, recruiterUi } from '@portfolio/content/recruiter/pt-BR';
import { ui } from '@portfolio/content/ui/pt-BR';
import { createRecruiterArea } from '../area.ts';

if (!customElements.get('mfe-recrutador')) {
  customElements.define(
    'mfe-recrutador',
    createRecruiterArea({
      locale: 'pt-BR',
      content: recruiter,
      text: recruiterUi,
      construction: ui.construction,
    }),
  );
}
