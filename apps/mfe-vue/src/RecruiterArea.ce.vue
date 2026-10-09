<script setup lang="ts">
import { recruiter, recruiterUi } from '@portfolio/content/recruiter';
import { ui } from '@portfolio/content/ui';
import { defaultLocale, emitMfeReady, locales, type Locale } from '@portfolio/contracts';
import { computed, onMounted } from 'vue';
import RecruiterPage from './RecruiterPage.ce.vue';

const props = defineProps<{ locale?: string; basePath?: string }>();

const locale = computed<Locale>(
  () => locales.find((candidate) => candidate === props.locale) ?? defaultLocale,
);
const text = computed(() => ui[locale.value].construction);
// `__HAS_CONTENT__` é fixado no build (vite.config.ts): sem conteúdo publicado, a
// página inteira e a biblioteca de animação saem do bundle de produção.
// O modelo só alcança a página por estas três constantes: com a marca em `false`
// o empacotador vê que nada usa `RecruiterPage` nem os textos e os descarta.
const Page = __HAS_CONTENT__ ? RecruiterPage : undefined;
const content = computed(() => (__HAS_CONTENT__ ? recruiter?.[locale.value] : undefined));
const pageText = computed(() => (__HAS_CONTENT__ ? recruiterUi[locale.value] : undefined));

onMounted(() => emitMfeReady({ area: 'recruiter', locale: locale.value }));
</script>

<template>
  <component
    :is="Page"
    v-if="Page && content && pageText"
    :content="content"
    :text="pageText"
    :locale="locale"
  />
  <!-- Sem conteúdo, a tela "em construção". Sem estilo próprio: a aparência vem
       de /_ds/areas.css, pelos `part` (ADR 0009). -->
  <section v-else part="message">
    <h2 part="title">
      {{ text.title }}
    </h2>
    <p part="text">
      {{ text.text }}
    </p>
    <div part="bar" aria-hidden="true"><span part="bar-fill" /></div>
  </section>
</template>
