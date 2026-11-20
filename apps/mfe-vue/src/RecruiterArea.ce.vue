<script setup lang="ts">
import type { RecruiterContent, RecruiterUi } from '@portfolio/content/recruiter';
import type { Ui } from '@portfolio/content/schemas';
import { emitMfeReady, type Locale } from '@portfolio/contracts';
import { onMounted } from 'vue';
import RecruiterPage from './RecruiterPage.ce.vue';

// Os dados chegam já resolvidos para um idioma, por `createRecruiterArea` (area.ts).
const props = defineProps<{
  locale: Locale;
  content: RecruiterContent | null;
  text: RecruiterUi;
  construction: Ui['construction'];
}>();

// `__HAS_CONTENT__` é fixado no build (vite.config.ts): sem conteúdo publicado, a
// página inteira e a biblioteca de animação saem do bundle de produção.
const Page = __HAS_CONTENT__ ? RecruiterPage : undefined;

onMounted(() => emitMfeReady({ area: 'recruiter', locale: props.locale }));
</script>

<template>
  <component :is="Page" v-if="Page && content" :content="content" :text="text" :locale="locale" />
  <!-- Sem conteúdo, a tela "em construção". Sem estilo próprio: a aparência vem
       de /_ds/areas.css, pelos `part` (ADR 0009). -->
  <section v-else part="message">
    <h2 part="title">
      {{ construction.title }}
    </h2>
    <p part="text">
      {{ construction.text }}
    </p>
    <div part="bar" aria-hidden="true"><span part="bar-fill" /></div>
  </section>
</template>
