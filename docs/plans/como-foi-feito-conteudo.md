# Plano: página "Como foi feito" e transição "desdobramento de blueprint"

- Status: **aprovado** pelo autor em 2026-10-21
- Origem: Issue #11, entrevista com o autor, `discovery-analyst` e `architect`
- Decisões de arquitetura: ADR 0011 (transições entre home e áreas), ADR 0012 (raio-x do site em arquivo versionado), ADR 0013 (página de conteúdo em rota do Next.js), ADR 0015 (conteúdo por idioma nos microfrontends)

**Objetivo:** a página para quem quer entender como o site foi construído e por quê, sem precisar abrir o repositório no GitHub. Explica a arquitetura de microfrontends, as 15 decisões de arquitetura (ADRs), o design system e os números reais de qualidade e orçamentos, em identidade visual própria ("Blueprint / Esquemático Técnico") e com a transição de desdobramento de blueprint.

---

## O que a pesquisa e as referências indicaram

- **Explicar arquitetura para engenheiros:** diagramas de caixas com fluxos claros de responsabilidade e regras de fronteira têm mais valor do que textos genéricos sobre stack.
- **Transparência de decisões (ADRs):** apresentar o contexto, as alternativas avaliadas e os trade-offs assumidos mostra maturidade técnica e critério profissional.
- **Métricas reais comprovadas:** números auditados de transferência de JavaScript, notas Lighthouse e tempos de LCP geram credibilidade imediata quando vinculados a um repositório auditável.
- **Referência visual (Blueprint / Esquemático Técnico):** inspiração estética em _Ghost in the Shell_ e _Fullmetal Alchemist_ (diagramas de circuitos cibernéticos, linhas de cota milimetradas, anatomia de componentes mecânicos e anotações técnicas em prancheta de engenharia). Motivos visuais puros em CSS, sem ilustrações proprietárias ou nomes de personagens.

---

## Decisões do autor (entrevista)

| Tema           | Decisão                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Identidade** | Blueprint / Esquemático Técnico (diagramas técnicos, reticulado milimetrado, linhas de cota, cantos chanfrados e anotações de prancheta) |
| **Transição**  | Desdobramento de Blueprint / Esquemático (a tela se abre ou desdobra como uma planta técnica com reticulado)                             |
| **Dados**      | **100% reais do repositório** (`site.json`): zero dado fictício, sem faixa de exemplo                                                    |
| **Blocos**     | 1. Abertura (Visão do projeto), 2. A Arquitetura, 3. As 15 Decisões (ADRs), 4. Design System & Tokens, 5. Métricas e Orçamentos Reais    |
| **Cor**        | Azul Blueprint / Esquemático Técnico nos dois temas, usando tokens do design system (`color-area-tech` / tons de ciano e azul técnico)   |
| **Animação**   | **Apenas CSS puro**, sem runtime JS, pausável pelo controle do dock e cancelada com movimento reduzido                                   |
| **Idiomas**    | pt-BR, en e es, com traduções completas de termos e explicações                                                                          |

---

## A página

| Bloco                                       | O que mostra                                                                                                                | Fonte de dados                   |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Abertura (Hero Esquemático)**             | Título da página, premissa do projeto (4 públicos, 4 frameworks, dev solo, 0 backend), carimbo técnico com versão e data    | `how-it-was-built.json` e `site` |
| **1. A Arquitetura de Microfrontends**      | Diagrama esquemático dos Custom Elements (Vue, Angular, React), shell vanilla, Next.js estático e as 11 regras de fronteira | `how-it-was-built.json`          |
| **2. As 15 Decisões de Arquitetura (ADRs)** | As 15 decisões agrupadas em 4 sistemas (Composição, Design System, Navegação e Governança), com status, títulos e motivos   | `site.json` e `how-it-was-built` |
| **3. Design System & Tokens**               | Anatomia dos Web Components em Lit, tokens CSS custom properties universais e isolamento Shadow DOM                         | `how-it-was-built.json`          |
| **4. Métricas e Orçamentos Reais**          | Pesos medidos de JavaScript por rota vs tetos, notas 100 de acessibilidade e ausência de waterfall                          | `site.json`                      |
| **Conclusão & Retorno**                     | Link direto para o repositório aberto no GitHub e botão de volta com a transição de saída para a home                       | `site.json` e `ui`               |

---

### Identidade visual: "Blueprint / Esquemático Técnico"

Elementos visuais exclusivos desta área, implementados exclusivamente com CSS e SVG vetorial:

1. **Reticulado Milimetrado de Fundo:**
   - Grid técnico desenhado com gradientes CSS repetitivos (`repeating-linear-gradient` e pontilhados sutis), simulando papel milimetrado de desenho técnico.
2. **Carimbos de Engenharia (Spec Stamps):**
   - Rótulos técnicos nos cantos de cada seção: `[SYS-01 // MFE-MAP]`, `[SYS-02 // ADR-CATALOG]`, `[REV-1.4.0]`, `[SPEC-2027]`.
3. **Linhas de Cota e Dimensão:**
   - Réguas laterais e linhas de cota com setas (`|← 1280px →|`) e anotações dimensionais nas bordas dos cartões de arquitetura.
4. **Moldura de Prancheta com Cantos Chanfrados:**
   - Cartões com corte angular técnico nos cantos (`clip-path: polygon(...)`) e bordas técnicas acentuadas com os tokens do sistema.
5. **Tipografia Monoespaçada do Sistema:**
   - Uso de `--font-code` em identificadores, cotas, carimbos e valores de medição, sem download de fontes externas adicionais.

---

### Movimento, só em CSS

| Onde                     | O que acontece                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| **Abertura**             | Reticulado técnico desenha linhas sutis de grade e linhas de cota estendem marcadores       |
| **Diagrama esquemático** | Nós e conexões do fluxo de dados se destacam conforme o usuário rola a página (`@supports`) |
| **Cartões de ADRs**      | Efeito de foco técnico / hover com realce nas linhas de cota e no carimbo de status         |
| **Tabela de Orçamentos** | Barras de progresso com a porcentagem consumida do orçamento de JavaScript de cada rota     |

- Todas as animações contínuas respeitam a caixa de pausa do dock (`body:has(.area-motion input:checked)`).
- Com `prefers-reduced-motion: reduce`, nada se mexe e o botão de pausa fica oculto.
- Nenhum texto ou título nasce invisível: sem dependência de JavaScript para renderização.

---

## Estrutura técnica (ADR 0013)

- `apps/web-next/app/_components/how-it-was-built-page.tsx`: Server Component Next.js, sem JavaScript no bundle do cliente.
- `apps/web-next/lib/how-it-was-built.ts`: montador do modelo da página com textos traduzidos e decisões formatadas.
- `apps/web-next/lib/how-it-was-built-leave.ts`: script inline do botão de volta com gravação de marca em `sessionStorage`.
- `apps/web-next/public/_home/how-it-was-built.css`: folha de estilo dedicada, ligada via `<link precedence="default">` (não contamina a home).
- Atualização em `apps/web-next/app/[[...slug]]/page.tsx`: renderiza `HowItWasBuiltPage` quando `entry.area === 'how-it-was-built'`.
- Atualização em `apps/web-next/app/[[...slug]]/layout.tsx`: injeta os scripts de chegada e de volta da área.

---

## Conteúdo (`@portfolio/content/how-it-was-built`)

- `packages/content/data/how-it-was-built/{pt-BR,en,es}.json`: textos de interface, descrições dos blocos, regras de fronteira e resumos contextuais das 15 ADRs em cada idioma.
- `packages/content/src/how-it-was-built.ts`: funções de montagem e tipos exportados.
- `packages/content/src/schemas.ts`: schema de validação Zod para os arquivos de conteúdo de "Como foi feito".
- `packages/content/src/load.ts`: carregamento e validação dos dados de "Como foi feito".
- `packages/content/scripts/build.mjs`: inclusão do módulo `./how-it-was-built` na compilação.
- `packages/content/package.json`: exportação do módulo `@portfolio/content/how-it-was-built`.
- Atualização do status da ADR 0015 para `"aceito"` em `packages/content/data/site.json` e em `docs/architecture/adr/0015-conteudo-por-idioma-nos-mfes.md`.

---

## Transição: Desdobramento de Blueprint (ADR 0011)

1. **Entrada na área (`.built-arrival`):**
   - Ao abrir `/como-foi-feito/` com a marca `how-it-was-built:<timestamp>`, a cortina se desdobra do centro para os quatro cantos revelando o reticulado técnico e a página.
2. **Volta para a home (`.built-departure`):**
   - Ao clicar no botão de volta, a cortina fecha se dobrando em quadrantes com o grid azul/ciano e o aviso acessível traduzido ("Voltando..." / "Returning..." / "Volviendo...").
   - Grava `how-it-was-built:<now>` em `sessionStorage` e redireciona após 450 ms (`TRANSITION_DELAY_MS`).
3. **Chegada na home (`.home-arrival`):**
   - A home lê `data-arrival="how-it-was-built"` e abre a cortina com o desdobramento esquemático correspondente em `home.css`.
4. **Registro em contratos:**
   - Adiciona `'how-it-was-built'` em `AREA_TRANSITIONS` em `packages/contracts/src/arrival.ts`.

---

## Etapas de implementação

### Etapa 1: Conteúdo, Schemas e Atualização de ADR

- Criar `packages/content/data/how-it-was-built/{pt-BR,en,es}.json`.
- Atualizar `packages/content/src/schemas.ts` com o schema de "Como foi feito".
- Criar `packages/content/src/how-it-was-built.ts`.
- Atualizar `packages/content/src/load.ts` e `scripts/build.mjs`.
- Atualizar `packages/content/package.json` com os exports.
- Ajustar status de ADR 0015 para "aceito" em `site.json` e no arquivo da ADR.
- Adicionar testes de unidade em `packages/content/src/content.test.ts`.
- **Comando de validação:**
  ```bash
  pnpm --filter @portfolio/content test && pnpm --filter @portfolio/content build
  ```

### Etapa 2: Contratos e Registro da Transição

- Adicionar `'how-it-was-built'` em `AREA_TRANSITIONS` em `packages/contracts/src/arrival.ts`.
- Atualizar testes em `packages/contracts/src/arrival.test.ts` e `contracts.test.ts`.
- **Comando de validação:**
  ```bash
  pnpm --filter @portfolio/contracts test && pnpm --filter @portfolio/contracts build
  ```

### Etapa 3: Componente e Folha de Estilo no Next.js

- Criar `apps/web-next/lib/how-it-was-built.ts` e `apps/web-next/lib/how-it-was-built-leave.ts`.
- Criar `apps/web-next/app/_components/how-it-was-built-page.tsx`.
- Criar `apps/web-next/public/_home/how-it-was-built.css`.
- Integrar a página em `apps/web-next/app/[[...slug]]/page.tsx` e `layout.tsx`.
- Adicionar testes de unidade em `apps/web-next/lib/how-it-was-built.test.ts`.
- **Comando de validação:**
  ```bash
  pnpm --filter web-next test && pnpm --filter web-next build
  ```

### Etapa 4: Cortinas da Transição na Home

- Atualizar `apps/web-next/app/home.css` com as regras de chegada para `html[data-arrival="how-it-was-built"] .home-arrival`.
- **Comando de validação:**
  ```bash
  pnpm --filter web-next build
  ```

### Etapa 5: Testes E2E, Orçamentos e Qualidade

- Criar `e2e/how-it-was-built.spec.ts` cobrindo:
  - Carregamento da página nos 3 idiomas (`pt-BR`, `en`, `es`).
  - Auditoria de acessibilidade sem violações (axe-core em temas claro e escuro).
  - Presença dos dados reais (ADRs, repositório, ausência de faixa de exemplo).
  - Operação completa por teclado e foco visível.
  - Pausa de animações e respeito a `prefers-reduced-motion`.
- Atualizar `e2e/transitions.spec.ts` e `e2e/areas.spec.ts` para cobrir a transição de "Como foi feito".
- Executar suíte completa de verificação do repositório.
- **Comando de validação:**
  ```bash
  pnpm build && pnpm assemble && pnpm test:e2e && pnpm budgets && pnpm lhci
  ```

---

## Orçamentos e métricas esperadas

| Métrica                        | Medido atual | Meta com a página | Teto orçado |
| ------------------------------ | ------------ | ----------------- | ----------- |
| JavaScript transferido Next.js | 147 kB       | $\le 147$ kB      | 150 kB      |
| Arquivos de script de Next.js  | 8            | 8 (Server Comp.)  | 10          |
| LCP de `/como-foi-feito/`      | 2,40 s       | $\le 2,50$ s      | 2,50 s      |
| CLS de `/como-foi-feito/`      | 0,001        | $\le 0,05$        | 0,10        |
| Acessibilidade Lighthouse      | 100          | 100               | 100         |
