---
name: cross-mfe-contract
description: Cria ou altera um evento compartilhado ou a tabela de rotas em packages/contracts. Use quando dois apps precisam se comunicar, quando um evento existente muda de formato, ou quando uma rota é adicionada ou renomeada.
---

# Contratos entre apps

Apps só conversam por eventos tipados de `packages/contracts`. É a única dependência que todos compartilham; mudar aqui afeta todos.

## Antes de criar um evento

- O dado é mesmo de dois apps? Estado interno de uma área não é contrato.
- Dá para resolver por atributo do custom element (`locale`, `base-path`)? Prefira atributo para configuração e evento para acontecimento.
- Já existe evento que cobre o caso?

## Regras de um evento

- É um `CustomEvent` disparado em `window`.
- Nome em kebab-case com o prefixo do projeto, no passado ou no imperativo conforme o papel: `tema-alterado`, `navegar-para`.
- `detail` é um objeto serializável, pequeno e tipado. Sem funções, sem instâncias de framework, sem elementos do DOM.
- O pacote exporta: o nome como constante, o tipo do `detail`, uma função para emitir e uma para escutar que devolve a função de cancelamento.
- `packages/contracts` não depende de framework nem de `packages/content`.

## Alterar um evento existente

| Mudança | Como fazer |
|---|---|
| Campo opcional novo no `detail` | Seguro; atualize o tipo e a doc |
| Campo obrigatório novo, renomear, remover | Quebra: atualize emissor e todos os ouvintes na mesma mudança |
| Renomear o evento | Quebra: mesma regra |

Não existe deploy independente por app (ADR 0004), então não é preciso manter duas versões no ar. É preciso que tudo mude junto.

## Tabela de rotas

- Uma única tabela: área, idioma, caminho. Ver `docs/architecture/mfe-map.md`.
- Dela saem: manifesto do shell, rotas do Next.js, troca de idioma, `hreflang`, sitemap e `_redirects`.
- Rota nova ou renomeada: altere a tabela e `docs/architecture/mfe-map.md` juntos. Nenhum app escreve caminho de outra área à mão.

## Passos

1. Procure todos os emissores e ouvintes do evento no monorepo.
2. Altere o contrato e todos os consumidores.
3. Escreva ou atualize o teste do contrato e o e2e que atravessa os apps envolvidos.
4. Rode typecheck e testes de todos os apps afetados.
5. Peça revisão ao `integration-reviewer`.
