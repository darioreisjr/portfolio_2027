<script setup lang="ts">
import { ui } from '@portfolio/content/ui';
import { defaultLocale, emitMfeReady, locales, type Locale } from '@portfolio/contracts';
import { computed, onMounted } from 'vue';

const props = defineProps<{ locale?: string; basePath?: string }>();

const locale = computed<Locale>(
  () => locales.find((candidate) => candidate === props.locale) ?? defaultLocale,
);
const text = computed(() => ui[locale.value].construction);

onMounted(() => emitMfeReady({ area: 'recruiter', locale: locale.value }));
</script>

<!-- Sem estilo próprio: a aparência vem de /_ds/areas.css, pelos `part` (ADR 0009). -->
<template>
  <section part="message">
    <h2 part="title">
      {{ text.title }}
    </h2>
    <p part="text">
      {{ text.text }}
    </p>
    <!-- eslint-disable-next-line vue/max-attributes-per-line -- o Prettier junta os dois -->
    <div part="bar" aria-hidden="true">
      <span part="bar-fill" />
    </div>
  </section>
</template>
