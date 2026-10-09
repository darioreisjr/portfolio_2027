---
name: content-schema
description: Como adicionar ou alterar dados JSON em packages/content sem quebrar os apps que os consomem. Use ao criar ou editar conteúdo (perfil, projetos, experiências, skills, formação, serviços, depoimentos, artigos, contatos, textos de interface) ou ao mudar o schema.
---

# Conteúdo em JSON

Fonte da verdade do modelo: `docs/content/schema.md`. Leia antes de mexer.

## Adicionar ou editar um item

1. Ache o arquivo certo em `packages/content`.
2. `id` em kebab-case, único e estável. Nunca reaproveite um `id` removido.
3. Referências sempre por `id` existente.
4. Texto traduzível tem as três chaves: `pt-BR`, `en`, `es`.
   - `status: "draft"`: só `pt-BR` é obrigatório.
   - `status: "published"`: as três são obrigatórias e não vazias.
5. Traduções são revisadas pelo autor antes de publicar. Se você traduziu, deixe o item em `draft` e avise.
6. Rode a validação do pacote e corrija até passar.

## Nunca

- Inventar dados sobre o autor: empresa, cargo, data, projeto, resultado, depoimento. Sem a informação, pergunte.
- Publicar depoimento sem `consent: true` confirmado pelo autor.
- Colocar conteúdo sobre o autor dentro de um app. Tudo passa por `packages/content`.
- Dado de exemplo sem `status: "draft"` e sem ser claramente fictício.

## Mudar o schema

| Mudança                                   | Risco  | O que fazer                                                |
| ----------------------------------------- | ------ | ---------------------------------------------------------- |
| Campo opcional novo                       | Seguro | Atualize o schema e `docs/content/schema.md`               |
| Campo obrigatório novo, renomear, remover | Quebra | Atualize na mesma mudança todos os apps que leem o arquivo |
| Valor novo em enumeração                  | Quebra | Procure tratamentos exaustivos nos apps e atualize         |

Passos:

1. Consulte a tabela "Quem consome o quê" em `docs/content/schema.md`.
2. Altere schema, tipos gerados, dados e consumidores juntos.
3. Atualize `docs/content/schema.md`.
4. Rode validação, typecheck e testes de todos os apps afetados.

## Textos de interface

`ui/<locale>.json` tem as mesmas chaves nos três idiomas. Chave nova entra nos três arquivos de uma vez.

Os três MFEs importam `ui` inteiro. Texto que só uma tela usa ganha arquivo próprio, como `home/<locale>.json` para a tela de escolha de perfil.
