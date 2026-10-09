---
name: vanilla-shell
description: Convenções do shell em JavaScript puro (apps/shell), que hospeda os microfrontends Vue, Angular e React. Use ao criar, alterar ou revisar código em apps/shell, ou ao mexer em carga de MFE, cabeçalho, rodapé, troca de tema ou de idioma.
---

# Shell em JavaScript puro

Contexto: `apps/shell/AGENTS.md` e `docs/architecture/adr/0002-composition.md`.

## O que o shell faz

- Gera um HTML por rota de MFE e por idioma.
- Mostra cabeçalho e rodapé com componentes do design system.
- Carrega o script do MFE da rota e insere o custom element.
- Cuida de idioma, foco e título. O tema é do design system (ADR 0005): o shell só põe o script e o botão no documento.

O que não faz: lógica de área, leitura de conteúdo além dos textos de interface, renderização das páginas Next.js.

## Regras

- Sem framework e sem biblioteca de interface: escrito em TypeScript estrito, entregue como JavaScript puro, só com APIs do navegador.
- O manifesto `rota -> { script, tag }` é derivado da tabela de rotas de `packages/contracts`. Nenhum caminho escrito à mão.
- Carga do MFE com `import()` do bundle em `/_mfe/<nome>/`. Só o MFE da rota atual é carregado.
- Depois do `import()`, cria a tag com os atributos `locale` e `base-path`.
- Ao sair da área, remove o elemento. Para voltar, cria outro; nunca reinsere o mesmo (limitação do Angular).
- Carrega tokens e design system uma vez por documento, antes do MFE.
- Falha de carga: mostra mensagem acessível com link para a home. Nunca deixa a tela vazia.

## HTML de cada rota

- `<html lang>` do idioma da rota.
- `<title>`, descrição, `canonical` e `hreflang` para as três versões.
- `THEME_INIT_SCRIPT` de `packages/contracts` inline no `<head>`, antes das folhas de estilo: aplica o tema salvo antes da primeira pintura.
- `<ds-theme-toggle>` no fim do cabeçalho, com o rótulo de `ui.themeToggle`.
- Link de pular para o conteúdo, e um `<main>` onde a tag do MFE entra.

## Tema e idioma

- Tema: o `<ds-theme-toggle>` aplica `data-theme` no `<html>`, guarda a escolha e emite o evento de `packages/contracts`. Sem escolha salva, vale `prefers-color-scheme`. O shell não tem código de tema.
- Idioma: a troca navega para a mesma área no outro idioma, pelo caminho da tabela de rotas.

## Acessibilidade na fronteira

- Ao entrar em uma área, o foco vai para o `<main>` e o título do documento reflete a área.
- Links para páginas Next.js são `<a>` comuns.

## Limites

Teto do shell em `docs/quality/budgets.md`. É o menor do site; cada kB conta em todas as rotas de MFE.

## Verificação

Lint, typecheck, testes do app e o e2e que atravessa as três áreas e volta para uma página Next.js.
