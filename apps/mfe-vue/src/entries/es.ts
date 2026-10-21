import { defineCustomElement } from 'vue';
import RecruiterArea from '../RecruiterAreaEs.ce.vue';

if (!customElements.get('mfe-recrutador')) {
  customElements.define('mfe-recrutador', defineCustomElement(RecruiterArea));
}
