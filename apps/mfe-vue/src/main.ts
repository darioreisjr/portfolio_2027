import { defineCustomElement } from 'vue';
import RecruiterArea from './RecruiterArea.ce.vue';

// Este módulo só registra o elemento; quem o insere no documento é o shell.
if (!customElements.get('mfe-recrutador')) {
  customElements.define('mfe-recrutador', defineCustomElement(RecruiterArea));
}
