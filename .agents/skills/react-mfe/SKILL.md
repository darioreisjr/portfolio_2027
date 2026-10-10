---
name: react-mfe
description: Convenções do microfrontend React (área do cliente, apps/mfe-react). Use ao criar, alterar ou revisar código em apps/mfe-react.
---

# MFE React: área do cliente

Contexto: `apps/mfe-react/AGENTS.md` e `docs/architecture/adr/0002-composition.md`.

## Como é exposto

React não tem API própria para virar custom element. Uma classe pequena faz a ponte:

- Estende `HTMLElement` e é registrada como `<mfe-clientes>`.
- `connectedCallback`: cria a raiz com `createRoot` e renderiza.
- `disconnectedCallback`: chama `unmount`.
- `attributeChangedCallback` para `locale` e `base-path`: renderiza de novo com as props novas.

A página de desenvolvimento isolado usa a mesma tag.

## Código

- Componentes de função e hooks. TypeScript estrito.
- Estado local com `useState` e `useReducer`. Sem biblioteca de estado global enquanto a área não precisar.
- Navegação interna da área é do React; para outra área, `<a>` com caminho da tabela de rotas.

## Estilos e design system

- Só tokens semânticos e de componente. Nenhum valor literal.
- Tags do design system direto no JSX, sem wrapper. O React atribui por propriedade quando ela existe no elemento, e eventos customizados usam o prefixo `on` com o nome exato do evento.
- Os tipos das tags vêm da declaração exportada por `packages/design-system`.
- Não importe o runtime do design system nem o Lit; o shell já carregou.

## Dados e comunicação

- Dados só de `packages/content`: `services`, `testimonials`, `projects` com a narrativa `outcome`, `contacts`, `ui`.
- Projeto sem `outcome` não aparece nesta área. Depoimento só com `consent: true`.
- Comunicação com o shell só por eventos de `packages/contracts`.

## Limites

- Teto de JavaScript da rota em `docs/quality/budgets.md`. `react-dom` é o maior custo fixo; não some bibliotecas de componentes. Elemento reutilizável vem do design system; o que é próprio da página a área desenha com estilo próprio, em um `<style>` no shadow root (ADR 0010). A biblioteca de animação `motion`, na versão mini, é a autorizada.
- Este app é React puro. Recursos do Next.js ficam em `apps/web-next`.

## Verificação

Lint, typecheck, testes do app, a área rodando isolada e dentro do shell.
