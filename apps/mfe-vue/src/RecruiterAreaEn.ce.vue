<script setup lang="ts">
import { recruiter, recruiterUi } from '@portfolio/content/recruiter/en';
import { ui } from '@portfolio/content/ui/en';
import { emitMfeReady } from '@portfolio/contracts';
import { onMounted } from 'vue';
import RecruiterPage from './RecruiterPage.ce.vue';

defineProps<{ locale?: string; basePath?: string }>();

const text = ui.construction;
const Page = __HAS_CONTENT__ ? RecruiterPage : undefined;
const content = recruiter;
const pageText = recruiterUi;

onMounted(() => emitMfeReady({ area: 'recruiter', locale: 'en' }));
</script>

<template>
  <component
    :is="Page"
    v-if="Page && content && pageText"
    :content="content"
    :text="pageText"
    locale="en"
  />
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
