# apps/mfe-react (React): área do cliente

Para quem procura alguém para fazer um projeto: serviços, como funciona, projetos pelo resultado, depoimentos, investimento e prazos, perguntas frequentes e o pedido de orçamento.

## Convenções

- Expõe `<mfe-clientes>` por uma classe `HTMLElement` que chama `createRoot` em `connectedCallback` e `unmount` em `disconnectedCallback`. Atributos: `locale`, `base-path`.
- Componentes de função e TypeScript estrito.
- Tags do design system direto no JSX, com declaração de tipos; sem wrapper.
- Dados de `packages/content`: `@portfolio/content/client` (`client`, o conteúdo por idioma já pronto, ou `null`; `clientUi`, os textos da área) e `ui`.
- Sem conteúdo (`client === null`), `App.tsx` mostra a mensagem "em construção" de `ui.construction`, com `part` e sem estilo: quem a estiliza é `/_ds/areas.css` (ADR 0009). Nenhum MFE mostra mais essa tela em produção: o teste "sem conteúdo" de `mfe.test.tsx` é a única cobertura desse contrato, não o remova.
- Com conteúdo, mostra `client/ClientPage.tsx` (ADR 0010, `docs/plans/clientes-conteudo.md`). O CSS é `client/client-page.css`, importado com `?inline` e posto em um `<style>` dentro do shadow root. O palco (cenário, título, personagem, volta, pausa) continua do shell.
- Identidade própria, a "janela do Sistema": painel de borda luminosa com marcas de canto, cabeçalho de notificação entre colchetes, grade de pontos, portal e etapas como níveis. Não reaproveite o visual de outra área. Só tokens; `--area-color` vem do palco. Texto sempre na cor de texto do tema; o azul fica em borda, rótulo e botão.
- A página fala com quem não é técnico: resultado e processo, sem nome de tecnologia, sem valores e sem número inventado.
- Sem estado do React para animação: `client/motion.ts` é ligado por um efeito e escreve direto no DOM (Motion mini para as entradas, variáveis CSS para a inclinação, rAF para a contagem); o efeito devolve a limpeza. As perguntas são `<details>`. O que é contínuo fica em CSS com `animation-play-state: var(--area-motion-state, running)`; `moving()` confere a pausa e o movimento reduzido antes de animar por script. A abertura nunca nasce oculta.
- Os botões de orçamento são links diretos para os canais de `client.contacts`, repetidos em três pontos; âncora não atravessa o shadow DOM.
- Peso: o React sozinho ocupa 77,7 kB. O teto da parte subiu para 105 kB e o da rota para 135 kB em 2026-10-10; a página mede 91,6 kB. Confira com `pnpm budgets` a cada mudança.
- Não empacota o design system nem o Lit.
- Raiz em shadow DOM (`attachShadow` na classe do elemento).
- Roda sozinho com `index.html` e `dev/main.ts`, que carregam tokens e design system no lugar do shell.
- Teto de JavaScript: ver `docs/quality/budgets.md`.

## Comandos

| Comando                             | O que faz                                |
| ----------------------------------- | ---------------------------------------- |
| `pnpm --filter mfe-react dev:solo`  | Roda isolado em `localhost:5175`         |
| `pnpm --filter mfe-react build`     | Gera `dist/mfe.js`                       |
| `pnpm --filter mfe-react test`      | Testes em Chromium (Vitest browser mode) |
| `pnpm --filter mfe-react typecheck` | Checagem de tipos                        |

Skill de convenções: `react-mfe`.
