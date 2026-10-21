import { defineCustomElement } from 'vue';
import RecruiterArea from '../RecruiterAreaPtBr.ce.vue';

if (!customElements.get('mfe-recrutador')) {
  customElements.define('mfe-recrutador', defineCustomElement(RecruiterArea));
}
