import { recruiter, recruiterUi } from '@portfolio/content/recruiter/es';
import { ui } from '@portfolio/content/ui/es';
import { createRecruiterArea } from '../area.ts';

if (!customElements.get('mfe-recrutador')) {
  customElements.define(
    'mfe-recrutador',
    createRecruiterArea({
      locale: 'es',
      content: recruiter,
      text: recruiterUi,
      construction: ui.construction,
    }),
  );
}
