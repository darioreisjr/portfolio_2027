# ADR 0012: Raio-x do site em arquivo versionado

- Status: **aceito** pelo autor em 2026-10-09
- Data: 2026-10-09

## Contexto

A área técnica mostra um "raio-x" do próprio site: as áreas e a tecnologia de cada uma, o JavaScript de cada rota contra o teto, as notas do Lighthouse e a lista de decisões de arquitetura. São dados reais do repositório, os únicos conteúdos técnicos verdadeiros que o site tem hoje.

Dados só entram nos apps por `packages/content` (regra de fronteira 3), e o pacote é construído antes dos apps. Mas o peso de cada rota só existe no `dist/` montado, depois do build de todos, e o Lighthouse só existe depois de `pnpm lhci`, em uma pasta que não é versionada. Gerar esses números no build do pacote seria uma dependência circular.

## Opções

| Critério                   | Gerar no build do pacote | Buscar em tempo de execução | Arquivo versionado, gravado por script |
| -------------------------- | ------------------------ | --------------------------- | -------------------------------------- |
| Pesos e Lighthouse         | Impossível (circular)    | Precisaria de um serviço    | Sim, da última medição                 |
| Site estático, sem backend | Sim                      | Não                         | Sim                                    |
| Dado sempre atual          | Só tetos e ADRs          | Sim                         | Não: tem a data da medição             |

## Decisão

**O raio-x é o arquivo `packages/content/data/site.json`, versionado, gravado por `scripts/site-xray.mjs`.**

1. O script lê a tabela de rotas, os tetos de `docs/quality/budgets.json`, os cabeçalhos dos ADRs, o `dist/` montado e, se existirem, os relatórios de `.lighthouseci`. Grava as áreas, o JavaScript medido de cada rota e de cada parte, a mediana do Lighthouse por rota, as decisões e a data da medição.
2. É rodado à mão, depois de `pnpm build && pnpm assemble` e, para ter o Lighthouse, de `pnpm lhci`.
3. `node scripts/site-xray.mjs --check` confere o que não depende de medição (áreas, tetos e ADRs) e roda junto dos testes: um ADR novo ou um teto alterado sem atualizar o arquivo quebra o `pnpm test`.
4. O arquivo não tem `status` e não é "dado de exemplo": não descreve o autor, e a página o mostra sem a faixa de exemplo, com a data da medição.
5. Os títulos dos ADRs ficam em português nos três idiomas, marcados com `lang="pt-BR"`: os documentos só existem em português.

## Consequências

- Os números da página são os da última medição, não os do build que está no ar. A diferença aparece na data.
- É a primeira vez que `packages/content` guarda um dado derivado de `docs/` e do `dist/`. Quem o deriva é um script da raiz, não o pacote: `packages/` continua sem depender de `apps/`.
- O formato dos relatórios do Lighthouse CI é lido direto. Se ele mudar, o script falha na gravação, não no build.

## Fontes

- Documentação do Lighthouse CI que acompanha o pacote instalado, para o formato dos relatórios em `.lighthouseci`.

Não verificado: se o formato do relatório é estável entre versões do Lighthouse.
