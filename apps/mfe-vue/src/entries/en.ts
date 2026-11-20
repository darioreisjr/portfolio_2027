import { recruiter, recruiterUi } from '@portfolio/content/recruiter/en';
import { ui } from '@portfolio/content/ui/en';
import { createRecruiterArea } from '../area.ts';

if (!customElements.get('mfe-recrutador')) {
  customElements.define(
    'mfe-recrutador',
    createRecruiterArea({
      locale: 'en',
      content: recruiter,
      text: recruiterUi,
      construction: ui.construction,
    }),
  );
}
