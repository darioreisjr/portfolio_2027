# ADR 0003: Design system

- Status: **aceito** pelo autor em 2026-10-06
- Data: 2026-10-06

## Contexto

Cinco apps em quatro frameworks precisam da mesma aparência. Já decidido: tokens em propriedades CSS customizadas e componentes como Web Components, sem depender de framework. Falta escolher a biblioteca e definir consumo e temas.

## Lit ou Stencil

| Critério | Lit 3 | Stencil 4 |
|---|---|---|
| Natureza | Biblioteca pequena sobre as APIs padrão | Compilador que gera custom elements |
| Build | Qualquer bundler; TypeScript comum | Compilador próprio, com configuração e versão de TypeScript próprias |
| Saídas | Módulos ES | `dist` (com carregamento sob demanda), `dist-custom-elements`, `www` |
| Wrappers por framework | `@lit/react` opcional; os demais usam a tag direto | Gera wrappers para React, Vue e Angular (não verificado nesta rodada) |
| Renderização no servidor | `@lit-labs/ssr`, experimental; integração com Next.js só para o Pages Router | Tem saída de hidratação (não verificado nesta rodada) |
| Peso no toolchain do monorepo | Baixo | Alto: mais um compilador ao lado de Vite, Angular CLI e Next.js |

## Decisão recomendada

**Lit 3.** Concorda com a inclinação do autor.

Motivo: o monorepo já tem quatro toolchains; Lit não acrescenta um quinto. O ponto forte do Stencil, gerar wrappers, pesa pouco aqui porque React 19, Vue e Angular consomem custom elements diretamente.

**Onde a doc pesa contra o Lit:** a renderização no servidor do Lit é experimental e não cobre o App Router. No Next.js os componentes do design system só ganham aparência depois que o JavaScript carrega. Isso ameaça LCP e CLS nas páginas Next.js. Mitigação, que passa a ser regra do design system:

- Todo componente funciona como melhoria progressiva: o conteúdo vai no light DOM (slots) e é legível antes do upgrade.
- CSS global dos tokens inclui regras `:not(:defined)` que reservam espaço e aplicam tipografia.
- Nada que esteja acima da dobra depende de um componente para existir.

Se essa mitigação se mostrar insuficiente nas medições do bootstrap, este ADR é reaberto.

## Tokens

- Pacote `packages/tokens`, três camadas: primitivos (`--color-blue-500`), semânticos (`--color-surface`, `--color-text`) e de componente (`--button-bg`).
- Apps e componentes usam só semânticos e de componente. Primitivos nunca aparecem fora de `packages/tokens`.
- Saída: um arquivo CSS e um módulo de tipos com os nomes dos tokens.

## Temas (claro e escuro)

- Tema definido por `data-theme="light"` ou `"dark"` no `<html>`; os tokens semânticos mudam de valor sob esse seletor.
- Sem escolha salva, vale `prefers-color-scheme`.
- A escolha fica em `localStorage`. Um script inline no `<head>` de todo documento aplica o atributo antes da primeira pintura, para não piscar.
- A propriedade `color-scheme` acompanha o tema, para controles nativos e barras de rolagem.
- Propriedades customizadas atravessam o shadow DOM, então componentes e MFEs mudam de tema sem código próprio.
- A troca de tema é um evento tipado de `packages/contracts`.

## Carga do design system

O registro de custom elements é global por documento, e registrar a mesma tag duas vezes lança erro. Por isso:

- `packages/design-system` gera um bundle único, carregado **uma vez por documento** pelo dono do documento (o shell ou o layout do Next.js).
- Os MFEs não empacotam o design system nem o Lit. Usam só as tags e os tipos.
- Resultado: uma cópia do Lit por página, em cache entre todas as rotas.

## Como cada framework consome

| Framework | Como usa a tag | Configuração |
|---|---|---|
| JavaScript puro (shell) | HTML direto | Nenhuma |
| React 19 | JSX direto; React atribui propriedade quando ela existe no elemento e aceita eventos customizados com prefixo `on` | Declaração de tipos das tags para o JSX |
| Next.js | Como no React, dentro de Client Components; o bundle é carregado pelo layout | Mesma declaração de tipos |
| Vue | Template direto; `.prop` força atribuição por propriedade | `compilerOptions.isCustomElement` no plugin do Vite |
| Angular | Template direto | `CUSTOM_ELEMENTS_SCHEMA` no componente (não verificado nesta rodada) |

Divergência entre docs: a doc do Lit ainda recomenda o wrapper `@lit/react`, dizendo que o React não atribui propriedades; a doc atual do React descreve suporte direto. A recomendação é não usar wrapper e confirmar com um teste no bootstrap.

## Consequências

- Componentes são escritos uma vez e documentados no Storybook.
- Cada componente novo exige: tokens, story, teste e verificação de acessibilidade.
- Componentes não renderizam no servidor; a regra de melhoria progressiva acima é obrigatória.

## Fontes

- [Lit: SSR](https://lit.dev/docs/ssr/overview/)
- [Lit: React](https://lit.dev/docs/frameworks/react/)
- [Stencil: introdução](https://stenciljs.com/docs/introduction)
- [Stencil: output targets](https://stenciljs.com/docs/output-targets)
- [React: custom HTML elements](https://react.dev/reference/react-dom/components#custom-html-elements)
- [Vue e Web Components](https://vuejs.org/guide/extras/web-components)
