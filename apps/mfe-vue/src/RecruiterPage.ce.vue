<script setup lang="ts">
import type { RecruiterContent, RecruiterUi } from '@portfolio/content/recruiter';
import type { Locale } from '@portfolio/contracts';
import { inView, stagger } from 'motion';
import { animate } from 'motion/mini';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{ content: RecruiterContent; text: RecruiterUi; locale: Locale }>();

type Category = RecruiterContent['skills'][number]['category'];
type Facet = 'role' | 'challenge' | 'result';

const root = ref<HTMLElement>();
const category = ref<Category | 'all'>('all');
/** Qual texto de cada projeto está à vista: papel, desafio ou resultado. */
const facets = ref<Record<string, Facet>>({});

const categories = computed(() => [
  ...new Set(props.content.skills.map((skill) => skill.category)),
]);
const skills = computed(() =>
  props.content.skills.filter(
    (skill) => category.value === 'all' || skill.category === category.value,
  ),
);
const levels = ['learning', 'working', 'advanced'] as const;

/** Linhas da ficha rápida: só as que o perfil preencheu. */
const stats = computed(() => {
  const { content, text } = props;
  return [
    [text.sheet.location, content.location],
    [text.sheet.workMode, content.workMode && text.workModes[content.workMode]],
    [text.sheet.availability, content.availability],
    [text.sheet.english, content.englishLevel && text.englishLevels[content.englishLevel]],
    [text.sheet.seniority, content.seniority && text.seniorities[content.seniority]],
  ].filter((row): row is [string, string] => Boolean(row[1]));
});

const monthYear = computed(
  () => new Intl.DateTimeFormat(props.locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }),
);
const date = (value: string) => monthYear.value.format(new Date(`${value}-01T00:00:00Z`));
const period = (start: string | undefined, end: string | null, open: string) =>
  [start && date(start), end ? date(end) : open].filter(Boolean).join(' – ');

const facetOf = (project: RecruiterContent['projects'][number]): Facet =>
  facets.value[project.id] ?? (project.role ? 'role' : 'challenge');
const facetsOf = (project: RecruiterContent['projects'][number]): Facet[] =>
  project.role ? ['role', 'challenge', 'result'] : ['challenge', 'result'];

// --- Movimento (Motion). Só para quem não pediu menos movimento ao sistema nem
// pausou as animações: a pausa do documento chega aqui pela propriedade
// `--area-motion-state`, que atravessa o shadow DOM (ADR 0010).
const EASE = [0.22, 1, 0.36, 1] as const;
const moving = () =>
  !matchMedia('(prefers-reduced-motion: reduce)').matches &&
  getComputedStyle(root.value ?? document.body)
    .getPropertyValue('--area-motion-state')
    .trim() !== 'paused';
let stopWatching: (() => void)[] = [];

/** Entrada em cascata dos filhos de um bloco. */
function cascade(items: Element[], distance = 16): void {
  if (!items.length || !moving()) return;
  void animate(
    items,
    { opacity: [0, 1], transform: [`translateY(${distance}px)`, 'none'] },
    { duration: 0.5, delay: stagger(0.06), ease: EASE },
  );
}

async function pickCategory(next: Category | 'all'): Promise<void> {
  category.value = next;
  await nextTick();
  cascade([...(root.value?.querySelectorAll('.skill') ?? [])], 8);
}

async function pickFacet(id: string, facet: Facet, event: Event): Promise<void> {
  // Guardado antes da espera: depois dela o evento já não aponta para o botão.
  const project = (event.currentTarget as Element).closest('.project');
  facets.value = { ...facets.value, [id]: facet };
  await nextTick();
  const panel = project?.querySelector('.facet-text');
  if (panel && moving()) {
    void animate(
      panel,
      { opacity: [0, 1], transform: ['translateX(12px)', 'none'] },
      { duration: 0.35, ease: EASE },
    );
  }
}

onMounted(() => {
  const page = root.value;
  if (!page || !moving()) return;
  // A partir daqui os blocos abaixo da primeira tela nascem ocultos e entram
  // ao aparecer. A ficha, que abre a página, entra só com deslocamento: é
  // candidata a maior elemento da tela e não pode nascer invisível.
  page.classList.add('animated');
  const [first, ...rest] = [...page.querySelectorAll<HTMLElement>('.block')];
  if (first) {
    void animate(first, { transform: ['translateY(20px)', 'none'] }, { duration: 0.6, ease: EASE });
    cascade([...first.querySelectorAll('.stat')], 8);
  }
  for (const block of rest) {
    stopWatching.push(
      inView(
        block,
        () => {
          block.classList.add('seen');
          void animate(
            block,
            { opacity: [0, 1], transform: ['translateY(28px)', 'none'] },
            { duration: 0.6, ease: EASE },
          );
          // O corte de katana do título risca da esquerda para a direita.
          const slash = block.querySelector('.slash');
          if (slash) {
            void animate(
              slash,
              { transform: ['scaleX(0)', 'scaleX(1)'] },
              { duration: 0.5, delay: 0.15, ease: EASE },
            );
          }
          cascade([...block.querySelectorAll('.cascade > *')]);
        },
        { amount: 0.15 },
      ),
    );
  }
});

onBeforeUnmount(() => {
  for (const stop of stopWatching) stop();
  stopWatching = [];
});
</script>

<template>
  <div ref="root" class="page">
    <p v-if="content.example" class="example">
      <strong>{{ text.example.title }}</strong> {{ text.example.text }}
    </p>

    <!-- Contato sempre à mão: acompanha a rolagem no topo do conteúdo. -->
    <nav class="contact-bar" :aria-label="text.contact.title">
      <ul>
        <li v-for="contact in content.contacts" :key="contact.id">
          <a :href="contact.url" :title="contact.display">{{ text.contact.kinds[contact.kind] }}</a>
        </li>
        <li v-if="content.cv" class="cv">
          <a :href="content.cv" download>{{ text.cv.download }}</a>
        </li>
      </ul>
    </nav>

    <!-- Ficha rápida, em moldura de ficha de personagem. -->
    <section class="block sheet" aria-labelledby="sheet-name">
      <span class="checker" aria-hidden="true" />
      <div class="sheet-head">
        <img
          v-if="content.photo"
          class="portrait"
          :src="content.photo.src"
          :alt="content.photo.alt"
          width="96"
          height="96"
        />
        <div>
          <p class="eyebrow">{{ text.sheet.title }}</p>
          <h2 id="sheet-name">{{ content.name }}</h2>
          <p class="role">{{ content.role }}</p>
          <p v-if="content.tagline" class="tagline">{{ content.tagline }}</p>
        </div>
      </div>
      <dl class="stats">
        <div v-for="[label, value] in stats" :key="label" class="stat">
          <dt>{{ label }}</dt>
          <dd>{{ value }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="content.summary" class="block" aria-labelledby="summary-title">
      <h2 id="summary-title">{{ text.summary.title }}</h2>
      <span class="slash" aria-hidden="true" />
      <p class="lead">{{ content.summary }}</p>
    </section>

    <section v-if="content.skills.length" class="block" aria-labelledby="stack-title">
      <h2 id="stack-title">{{ text.stack.title }}</h2>
      <span class="slash" aria-hidden="true" />
      <div class="filters" role="group" :aria-label="text.stack.filter">
        <button type="button" :aria-pressed="category === 'all'" @click="pickCategory('all')">
          {{ text.stack.all }}
        </button>
        <button
          v-for="option in categories"
          :key="option"
          type="button"
          :aria-pressed="category === option"
          @click="pickCategory(option)"
        >
          {{ text.stack.categories[option] }}
        </button>
      </div>
      <ul class="skills cascade">
        <li v-for="skill in skills" :key="skill.id" class="skill">
          <span class="skill-name">{{ skill.name }}</span>
          <span class="skill-level">{{ text.stack.levels[skill.level] }}</span>
          <!-- Medidor decorativo: o nível já está escrito ao lado. -->
          <span class="pips" aria-hidden="true">
            <i
              v-for="(level, index) in levels"
              :key="level"
              :class="{ on: index <= levels.indexOf(skill.level) }"
            />
          </span>
        </li>
      </ul>
    </section>

    <section v-if="content.experiences.length" class="block" aria-labelledby="experience-title">
      <h2 id="experience-title">{{ text.experience.title }}</h2>
      <span class="slash" aria-hidden="true" />
      <ol class="timeline cascade">
        <li v-for="job in content.experiences" :key="job.id" class="job">
          <p class="when">{{ period(job.start, job.end, text.experience.present) }}</p>
          <h3>{{ job.role }}</h3>
          <p class="where">
            <a v-if="job.companyUrl" :href="job.companyUrl" rel="noopener">{{ job.company }}</a>
            <template v-else>{{ job.company }}</template>
            <template v-if="job.mode"> · {{ text.workModes[job.mode] }}</template>
            <template v-if="job.location"> · {{ job.location }}</template>
          </p>
          <p>{{ job.summary }}</p>
          <details v-if="job.highlights.length">
            <summary>{{ text.experience.highlights }}</summary>
            <ul>
              <li v-for="highlight in job.highlights" :key="highlight">{{ highlight }}</li>
            </ul>
          </details>
          <ul v-if="job.skills.length" class="tags">
            <li v-for="name in job.skills" :key="name">{{ name }}</li>
          </ul>
        </li>
      </ol>
    </section>

    <section v-if="content.projects.length" class="block" aria-labelledby="projects-title">
      <h2 id="projects-title">{{ text.projects.title }}</h2>
      <span class="slash" aria-hidden="true" />
      <div class="projects cascade">
        <article v-for="project in content.projects" :key="project.id" class="project">
          <h3>{{ project.title }}</h3>
          <p>{{ project.summary }}</p>
          <div class="filters" role="group" :aria-label="project.title">
            <button
              v-for="facet in facetsOf(project)"
              :key="facet"
              type="button"
              :aria-pressed="facetOf(project) === facet"
              @click="pickFacet(project.id, facet, $event)"
            >
              {{ text.projects[facet] }}
            </button>
          </div>
          <p class="facet-text" aria-live="polite">{{ project[facetOf(project)] }}</p>
          <ul v-if="project.skills.length" class="tags">
            <li v-for="name in project.skills" :key="name">{{ name }}</li>
          </ul>
          <p v-if="project.repo || project.demo" class="links">
            <a v-if="project.repo" :href="project.repo" rel="noopener">{{ text.projects.repo }}</a>
            <a v-if="project.demo" :href="project.demo" rel="noopener">{{ text.projects.demo }}</a>
          </p>
        </article>
      </div>
    </section>

    <section v-if="content.education.length" class="block" aria-labelledby="education-title">
      <h2 id="education-title">{{ text.education.title }}</h2>
      <span class="slash" aria-hidden="true" />
      <ul class="education cascade">
        <li v-for="item in content.education" :key="item.id">
          <p class="eyebrow">{{ text.education.kinds[item.kind] }}</p>
          <h3>{{ item.title }}</h3>
          <p class="where">
            {{ item.institution }} · {{ period(item.start, item.end, text.education.ongoing) }}
          </p>
          <a v-if="item.credentialUrl" :href="item.credentialUrl" rel="noopener">
            {{ text.education.credential }}
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<!-- Estilo próprio do MFE, no shadow root (ADR 0010). Só tokens: eles chegam aqui
     por herança, e `--area-color` vem do palco. Os motivos (xadrez, corte de
     katana, traço de respiração) são desenhados com gradientes e `clip-path`. -->
<style>
:host {
  display: block;
}

.page {
  --green: var(--area-color, var(--color-area-recruiter));
  --ink: var(--color-pattern-ink);
  --cut: var(--space-inline-sm);
  /* Xadrez verde e preto (ichimatsu). */
  --checker: conic-gradient(var(--green) 25%, var(--ink) 0 50%, var(--green) 0 75%, var(--ink) 0);
  /* Largura da faixa de xadrez: dois quadrados. */
  --strip: var(--space-block-md);

  display: grid;
  gap: var(--space-block-lg);
  color: var(--color-text);
  font-size: var(--text-size-md);
  line-height: var(--text-line-height);
}

h2,
h3,
p,
ul,
ol,
dl,
dd {
  margin: 0;
  padding: 0;
}

ul,
ol {
  list-style: none;
}

h2 {
  font-size: var(--text-size-lg);
  font-weight: var(--text-weight-strong);
}

h3 {
  font-size: var(--text-size-md);
  font-weight: var(--text-weight-strong);
}

a {
  color: var(--green);
  font-weight: var(--text-weight-strong);
}

a:focus-visible,
button:focus-visible,
summary:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset);
}

/* Faixa de aviso enquanto o perfil é rascunho. */
.example {
  padding: var(--space-block-sm) var(--space-inline-md);
  border: var(--border-width-control) dashed var(--green);
  background: var(--color-surface);
  font-size: var(--text-size-sm);
}

/* Barra de contato: gruda no alto e acompanha a rolagem. */
.contact-bar {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
  padding: var(--space-block-xs) var(--space-inline-md);
  border-block-end: var(--border-width-marker) solid var(--green);
  background: var(--color-surface);
}

.contact-bar ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--space-inline-md);
  align-items: center;
}

.contact-bar a {
  display: grid;
  place-items: center;
  min-block-size: var(--size-control);
}

.contact-bar .cv {
  margin-inline-start: auto;
}

.contact-bar .cv a {
  padding-inline: var(--space-inline-md);
  background: var(--green);
  color: var(--color-on-area);
  text-decoration: none;
}

/* Bloco: caixa de fundo sólido com a barra na cor da área; é contra esse fundo
   que o texto é lido, não contra o cenário. */
.block {
  display: grid;
  gap: var(--space-block-sm);
  position: relative;
  padding: var(--space-block-lg) var(--space-inline-md);
  padding-inline-start: calc(var(--space-inline-md) + var(--strip));
  background: var(--color-surface);
}

/* Faixa de xadrez na lateral de cada bloco, como a barra de um tecido. Desliza
   devagar e para com a pausa do documento. */
.block::before {
  position: absolute;
  inset: 0 auto 0 0;
  inline-size: var(--strip);
  background: var(--checker) 0 0 / var(--strip) var(--strip);
  content: '';
  animation: weave-down var(--motion-duration-drift) linear infinite;
  animation-play-state: var(--area-motion-state, running);
}

/* Com movimento, os blocos abaixo da primeira tela nascem ocultos e entram ao
   aparecer (o script marca `.animated` e, depois, `.seen`). */
.animated .block:not(:first-of-type, .seen) {
  opacity: 0;
}

/* Corte de katana sob o título: um risco fino em diagonal. */
.slash {
  display: block;
  inline-size: min(100%, 16rem);
  block-size: var(--space-block-sm);
  background:
    linear-gradient(90deg, var(--green), transparent) 0 0 / 100% 55% no-repeat,
    linear-gradient(90deg, transparent 20%, var(--green) 60%, transparent) 0 100% / 70% 15%
      no-repeat;
  transform-origin: left;
  /* A lâmina afina até a ponta. */
  clip-path: polygon(0 0, 100% 45%, 100% 55%, 0 100%);
  rotate: -2deg;
}

.eyebrow {
  color: var(--green);
  font-size: var(--text-size-sm);
  font-weight: var(--text-weight-strong);
  text-transform: uppercase;
}

.lead {
  max-inline-size: 60ch;
}

/* Ficha de personagem: faixa de xadrez no alto e canto cortado. */
.sheet {
  padding-block-start: calc(var(--space-block-lg) + var(--strip));
  border: var(--border-width-control) solid var(--green);
  border-inline-start: 0;
}

.checker {
  position: absolute;
  inset: 0 0 auto;
  block-size: var(--strip);
  background: var(--checker) 0 0 / var(--strip) var(--strip);
  /* O xadrez desliza devagar, como tecido; para com a pausa do documento. */
  animation: weave var(--motion-duration-drift) linear infinite;
  animation-play-state: var(--area-motion-state, running);
}

.sheet-head {
  display: flex;
  gap: var(--space-inline-md);
  align-items: center;
}

.portrait {
  border: var(--border-width-control) solid var(--green);
  object-fit: cover;
}

.sheet h2 {
  font-size: var(--text-size-title);
}

.role {
  color: var(--green);
  font-weight: var(--text-weight-strong);
}

.tagline {
  color: var(--color-text-muted);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: var(--space-block-sm) var(--space-inline-md);
}

.stat {
  padding: var(--space-block-xs) var(--space-inline-sm);
  border-block-end: var(--border-width-control) solid var(--color-border);
}

.stat dt {
  color: var(--color-text-muted);
  font-size: var(--text-size-sm);
}

.stat dd {
  font-weight: var(--text-weight-strong);
}

/* Botões de escolha (filtro da stack e faces do projeto): cantos cortados. */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-inline-sm);
}

.filters button {
  min-block-size: var(--size-control);
  padding: var(--space-block-xs) var(--space-inline-md);
  border: var(--border-width-control) solid var(--green);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-weight: var(--text-weight-strong);
  cursor: pointer;
  clip-path: polygon(
    var(--cut) 0,
    100% 0,
    100% calc(100% - var(--cut)),
    calc(100% - var(--cut)) 100%,
    0 100%,
    0 var(--cut)
  );
  transition:
    background-color var(--motion-duration-md) var(--motion-ease-out),
    color var(--motion-duration-md) var(--motion-ease-out);
}

.filters button[aria-pressed='true'] {
  background: var(--green);
  color: var(--color-on-area);
}

/* O recorte esconderia o anel de foco: no foco o botão volta a ser retângulo. */
.filters button:focus-visible {
  clip-path: none;
}

.skills {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: var(--space-inline-sm);
}

.skill {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0 var(--space-inline-sm);
  align-items: center;
  padding: var(--space-block-sm) var(--space-inline-sm);
  border: var(--border-width-control) solid var(--color-border);
  transition:
    border-color var(--motion-duration-md) var(--motion-ease-out),
    translate var(--motion-duration-md) var(--motion-ease-out);
}

.skill:hover {
  border-color: var(--green);
  translate: 0 calc(var(--space-block-xs) * -1);
}

.skill-name {
  font-weight: var(--text-weight-strong);
}

.skill-level {
  grid-column: 1;
  color: var(--color-text-muted);
  font-size: var(--text-size-sm);
}

/* Medidor de nível: três losangos, como marcadores de uma ficha de jogo. */
.pips {
  display: flex;
  grid-row: 1 / span 2;
  grid-column: 2;
  gap: var(--space-block-xs);
}

.pips i {
  inline-size: var(--space-inline-sm);
  block-size: var(--space-inline-sm);
  border: var(--border-width-control) solid var(--green);
  rotate: 45deg;
}

.pips i.on {
  background: var(--green);
}

/* Linha do tempo: o fio na cor da área e um losango em cada passagem. */
.timeline {
  display: grid;
  gap: var(--space-block-lg);
  padding-inline-start: var(--space-inline-lg);
  border-inline-start: var(--border-width-marker) solid var(--green);
}

.job {
  display: grid;
  gap: var(--space-block-xs);
  position: relative;
}

.job::before {
  position: absolute;
  inset-block-start: var(--space-block-xs);
  inset-inline-start: calc(var(--space-inline-lg) * -1 - var(--space-inline-sm) * 0.5 - 1px);
  inline-size: var(--space-inline-sm);
  block-size: var(--space-inline-sm);
  background: var(--green);
  content: '';
  rotate: 45deg;
}

.when,
.where {
  color: var(--color-text-muted);
  font-size: var(--text-size-sm);
}

.when {
  color: var(--green);
  font-weight: var(--text-weight-strong);
}

summary {
  inline-size: fit-content;
  min-block-size: var(--size-control);
  align-content: center;
  color: var(--green);
  font-weight: var(--text-weight-strong);
  cursor: pointer;
}

details ul {
  display: grid;
  gap: var(--space-block-xs);
  padding-inline-start: var(--space-inline-md);
  list-style: square;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-block-xs) var(--space-inline-sm);
}

.tags li {
  padding: 0 var(--space-inline-sm);
  border: var(--border-width-control) solid var(--color-border);
  font-size: var(--text-size-sm);
}

.projects {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: var(--space-inline-md);
}

.project {
  display: grid;
  gap: var(--space-block-sm);
  align-content: start;
  padding: var(--space-block-md) var(--space-inline-md);
  border: var(--border-width-control) solid var(--color-border);
  transition:
    border-color var(--motion-duration-md) var(--motion-ease-out),
    translate var(--motion-duration-md) var(--motion-ease-out);
}

.project:hover {
  border-color: var(--green);
  translate: 0 calc(var(--space-block-xs) * -1);
}

.facet-text {
  min-block-size: 3lh;
}

.links {
  display: flex;
  gap: var(--space-inline-md);
}

.links a,
.education a {
  display: inline-grid;
  min-block-size: var(--size-control);
  align-content: center;
}

.education {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-inline-md);
}

.education li {
  display: grid;
  gap: var(--space-block-xs);
  align-content: start;
  padding: var(--space-block-sm) var(--space-inline-md);
  border-block-start: var(--border-width-marker) solid var(--green);
  background: var(--color-surface-muted);
}

@keyframes weave {
  to {
    background-position: calc(var(--strip) * 2) 0;
  }
}

@keyframes weave-down {
  to {
    background-position: 0 calc(var(--strip) * 2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .checker,
  .block::before {
    animation: none;
  }

  .skill,
  .project,
  .filters button {
    transition: none;
  }
}
</style>
