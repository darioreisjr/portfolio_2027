# apps/mfe-vue (Vue): área do recrutador

Resumo e stack, experiência em linha do tempo, formação e certificados, currículo em PDF.

## Convenções

- Expõe `<mfe-recrutador>` com `defineCustomElement`. Atributos: `locale`, `base-path`.
- Composition API com `<script setup>` e TypeScript estrito.
- `compilerOptions.isCustomElement` reconhece as tags do design system.
- Dados de `packages/content`: `@portfolio/content/recruiter` (`recruiter`, o conteúdo por idioma já pronto, ou `null`; `recruiterUi`, os textos da área) e `ui`.
- Sem conteúdo (`recruiter === null`, como em produção hoje), `RecruiterArea.ce.vue` mostra a mensagem "em construção" de `ui.construction`, com `part` e sem estilo próprio: quem a estiliza é `/_ds/areas.css` (ADR 0009).
- Com conteúdo, mostra `RecruiterPage.ce.vue` (ADR 0010, `docs/plans/recrutador-conteudo.md`): ficha rápida, resumo, stack com filtro, experiência, projetos, formação e a barra de contato. O estilo é dela, no shadow root, só com tokens; `--area-color` vem do palco. O palco (cenário, título, personagem, volta, pausa) continua do shell: a página não repete o personagem.
- `__HAS_CONTENT__` é fixada no build (`vite.config.ts`) e tira a página e a biblioteca de animação do bundle quando não há conteúdo. A página só pode ser alcançada pelas constantes de `RecruiterArea.ce.vue` que dependem dela; um `import` usado fora disso traz tudo de volta. Confira com `pnpm budgets`: em produção o MFE fica perto de 30 kB.
- Componente filho com `<style>` precisa terminar em `.ce.vue`, senão o estilo não entra no shadow root.
- Animação: `animate` de `motion/mini` e `inView` e `stagger` de `motion` (4,4 kB). A `motion-v` não cabe no teto: medida de 52 a 79 kB. A Motion só faz entradas, que têm fim. O que é contínuo fica em CSS, com `animation-play-state: var(--area-motion-state, running)`, para obedecer à pausa do documento; antes de animar por script, `moving()` confere a mesma propriedade e o movimento reduzido. O primeiro bloco nunca nasce com opacidade zero.
- Os testes trocam o conteúdo por um de teste com `vi.mock('@portfolio/content/recruiter')`; `mfe.test.ts` cobre a tela sem conteúdo e `page.test.ts` a página. A página inteira no navegador, com axe, é `pnpm test:e2e:drafts`.
- Não empacota o design system nem o Lit.
- Raiz em shadow DOM (padrão do `defineCustomElement`).
- Roda sozinho com `index.html` e `dev/main.ts`, que carregam tokens e design system no lugar do shell.
- Teto de JavaScript: ver `docs/quality/budgets.md`.

## Comandos

| Comando                           | O que faz                                |
| --------------------------------- | ---------------------------------------- |
| `pnpm --filter mfe-vue dev:solo`  | Roda isolado em `localhost:5174`         |
| `pnpm --filter mfe-vue build`     | Gera `dist/mfe.js`                       |
| `pnpm --filter mfe-vue test`      | Testes em Chromium (Vitest browser mode) |
| `pnpm --filter mfe-vue typecheck` | `vue-tsc`                                |

Skill de convenções: `vue-mfe`.
