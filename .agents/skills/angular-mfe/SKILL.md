---
name: angular-mfe
description: Convenções do microfrontend Angular (área técnica, apps/mfe-angular). Use ao criar, alterar ou revisar código em apps/mfe-angular.
---

# MFE Angular: área técnica

Contexto: `apps/mfe-angular/AGENTS.md` e `docs/architecture/adr/0002-composition.md`.

## Como é exposto

- `createCustomElement` de `@angular/elements` gera a classe; `customElements.define` registra `<mfe-tecnico>`.
- Atributos de entrada: `locale` e `base-path`, recebidos como inputs do componente raiz.
- A doc do Angular avisa de problemas ao remover e reinserir o elemento no DOM. O shell nunca reinsere; se você precisar esconder a área, não a remova e recoloque.
- A página de desenvolvimento isolado usa a mesma tag.

## Código

- Componentes standalone. Sem NgModules.
- Signals para estado; `computed` para os filtros de skills e projetos.
- TypeScript estrito e templates estritos.
- Navegação interna da área é do Angular; para outra área, `<a>` com caminho da tabela de rotas.

## Estilos e design system

- Só tokens semânticos e de componente. Nenhum valor literal.
- Tags do design system direto no template, com `CUSTOM_ELEMENTS_SCHEMA` no componente que as usa.
- Propriedade com `[prop]`, evento com `(evento)`.
- Não importe o runtime do design system nem o Lit; o shell já carregou.

## Dados e comunicação

- Dados só de `packages/content`: `projects` com a narrativa `technical`, `skills`, `contacts`, `ui`.
- Projeto sem `technical` não aparece nesta área.
- Comunicação com o shell só por eventos de `packages/contracts`.

## Limites

- É o maior runtime dos três MFEs. Confira o teto da rota em `docs/quality/budgets.md` a cada dependência nova.
- Não adicione bibliotecas de componentes do ecossistema Angular. Elemento reutilizável vem do design system; o que é próprio da página a área desenha com estilo próprio, no shadow root (ADR 0010). A biblioteca de animação `motion`, na versão mini, é a autorizada.

## Verificação

Lint, typecheck, testes do app, a área rodando isolada e dentro do shell. Filtros operáveis por teclado e com resultado anunciado a leitores de tela.
