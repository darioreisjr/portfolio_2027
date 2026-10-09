# apps/mfe-angular (Angular): área técnica

Para quem é técnico: estudos de caso, skills com filtro, raio-x do próprio site e um terminal de atalhos.

## Convenções

- Expõe `<mfe-tecnico>` com `createCustomElement` de `@angular/elements`. Atributos: `locale`, `base-path`.
- Componentes standalone, signals e TypeScript estrito.
- `CUSTOM_ELEMENTS_SCHEMA` nos componentes que usam tags do design system.
- Dados de `packages/content`: `@portfolio/content/tech` (`tech`, os estudos de caso e as tecnologias por idioma, ou `null`; `techUi`, os textos da área; `site`, o raio-x real do repositório) e `ui`.
- Sem conteúdo (`tech === null`), `tech-area.component.ts` mostra a mensagem "em construção" de `ui.construction`, com `part` e sem estilo: quem a estiliza é `/_ds/areas.css` (ADR 0009).
- Com conteúdo, mostra a página (ADR 0010, `docs/plans/tecnico-conteudo.md`). `tech-area.component.ts` é a raiz, em shadow DOM, e guarda TODO o CSS da área (`tech-page.css`, por `styleUrl`). `tech-page.component.ts` é a página, com `ViewEncapsulation.None` e sem estilo: o CSS da raiz vive no shadow root e a alcança. Componente novo segue o mesmo padrão; estilo em componente filho não é garantido dentro do shadow root.
- Identidade própria, o "mangá técnico": quadro de borda grossa com sombra chapada, selos, meio-tom, falha de sinal, terminal em negativo e fonte `--font-code` em código e dados. Não reaproveite o visual de outra área. Só tokens; `--area-color` vem do palco. O palco (cenário, título, personagem, volta, pausa) continua do shell.
- Animação: `reveal.ts` usa `animate` de `motion/mini` e `inView` e `stagger` de `motion`. Só entradas, que têm fim. O que é contínuo (falha de sinal, varredura) fica em CSS com `animation-play-state: var(--area-motion-state, running)`. O estado inicial oculto é posto por script, e as guardas (`IntersectionObserver`, movimento reduzido, pausa) deixam o conteúdo visível quando não há animação. A abertura e o terminal nunca nascem ocultos.
- Terminal: os comandos têm id fixo e nome traduzido em `techUi`. Todo comando é também um botão, e todo o conteúdo está na página como seção comum: o terminal é só atalho. "Ir para a seção" rola e foca o título (`tabindex="-1"`), porque âncora não alcança o shadow DOM. Sem `@angular/forms`: campo nativo e signals. O campo é limpo direto no elemento no envio.
- Os testes rodam em jsdom, sem `IntersectionObserver`: a entrada animada não acontece e tudo fica visível. A página inteira no navegador, com axe, é `e2e/tech.spec.ts`.
- Não empacota o design system nem o Lit.
- Sem zone.js: estado em signals. Raiz em shadow DOM (`ViewEncapsulation.ShadowDom`).
- `outputHashing: none`: o shell carrega sempre `main.js`.
- Roda sozinho pela configuração `solo` do `angular.json` (`dev/index.html` e `dev/main.ts`).
- É o maior runtime dos três MFEs: confira o teto em `docs/quality/budgets.md` a cada dependência nova.

## Comandos

| Comando                               | O que faz                                      |
| ------------------------------------- | ---------------------------------------------- |
| `pnpm --filter mfe-angular dev:solo`  | Roda isolado em `localhost:4200`               |
| `pnpm --filter mfe-angular build`     | Gera `dist/browser/main.js`                    |
| `pnpm --filter mfe-angular test`      | Testes com Vitest e jsdom, pelo CLI do Angular |
| `pnpm --filter mfe-angular typecheck` | `ngc`, com templates estritos                  |

Skill de convenções: `angular-mfe`.
