<script setup lang="ts">
import { ui } from '@portfolio/content/ui';
import { defaultLocale, emitMfeReady, locales, type Locale } from '@portfolio/contracts';
import { computed, onMounted } from 'vue';

const props = defineProps<{ locale?: string; basePath?: string }>();

const locale = computed<Locale>(
  () => locales.find((candidate) => candidate === props.locale) ?? defaultLocale,
);
const text = computed(() => ui[locale.value]);

onMounted(() => emitMfeReady({ area: 'recruiter', locale: locale.value }));
</script>

<template>
  <section>
    <p class="hello">
      {{ text.hello }}
      <ds-badge>Vue</ds-badge>
    </p>
  </section>
</template>

<style>
.hello {
  display: flex;
  align-items: center;
  gap: var(--space-inline-sm);
  margin: 0;
  color: var(--color-text);
  font-size: var(--text-size-md);
}
</style>
