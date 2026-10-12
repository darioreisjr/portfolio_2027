---
name: deploy-vercel
description: Instruções e regras para deploy na Vercel via GitHub Actions e Vercel CLI. Use ao configurar, auditar ou executar o deploy do portfólio.
---

# Deploy na Vercel

Guia de publicação atômica na Vercel a partir do GitHub Actions (ADRs 0007 e 0014).

## Arquitetura de deploy

O portfólio é um conjunto de 5 aplicações montadas em um diretório estático único: `dist/`.
O deploy é realizado pelo GitHub Actions após a execução de todos os testes de qualidade (lint, tipos, testes unitários, orçamentos de JavaScript, testes E2E e Lighthouse CI).

1. `pnpm build` compila os 5 apps e pacotes.
2. `pnpm assemble` reúne os arquivos em `dist/` e gera o `dist/vercel.json` dinâmico a partir de `packages/contracts/src/routes.ts`.
3. O GitHub Actions executa a Vercel CLI, em versão fixa (`VERCEL_CLI` em `.github/workflows/ci.yml`).

## Ambientes

Cada branch publica em um projeto próprio da Vercel, sempre com `--prod` (ADR 0014):

| Branch        | Endereço                        | Projeto na Vercel    | Buscadores |
| ------------- | ------------------------------- | -------------------- | ---------- |
| `development` | `https://develop.darioreis.dev` | O de desenvolvimento | Escondido  |
| `production`  | `https://2027.darioreis.dev`    | O de produção        | Visível    |

- **Pull request:** prévia no projeto de desenvolvimento, com endereço próprio. O CI comenta o link no PR.
- **Merge na `development`:** publica no ambiente de desenvolvimento.
- **Merge na `production`:** publica na produção e, com o teste de fumaça verde, cria a release.

O `dist/` é o mesmo nos dois. Quem esconde o desenvolvimento dos buscadores é o `vercel.json`: todo endereço diferente de `PRODUCTION_HOST` (`scripts/assemble.mjs`) responde `X-Robots-Tag: noindex`. Se o domínio de produção mudar, mude a constante.

## Segredos e variáveis no GitHub

Em **Settings > Secrets and variables > Actions** e em **Settings > Environments**:

| Nome                           | Onde                             | Para que serve                                  |
| ------------------------------ | -------------------------------- | ----------------------------------------------- |
| `VERCEL_TOKEN`                 | Segredo do repositório           | Token da CLI; precisa enxergar os dois projetos |
| `VERCEL_ORG_ID`                | Segredo do repositório           | Id do time ou usuário na Vercel                 |
| `VERCEL_PROJECT_ID`            | Segredo do repositório           | Projeto de desenvolvimento e das prévias        |
| `VERCEL_PROJECT_ID_PRODUCTION` | Segredo do ambiente `production` | Projeto de produção                             |
| `SITE_URL`                     | Variável de cada ambiente        | O endereço que o teste de fumaça confere        |

Os ids ficam em Projeto > Settings > General. O segredo da produção tem nome próprio de propósito: se faltar, o deploy falha em vez de publicar a produção no projeto errado.

## O que roda depois do deploy

`scripts/smoke.mjs` abre cada página do `dist/` no endereço publicado e confere que responde, que a produção não tem `noindex` e que o desenvolvimento tem. Se falhar, o job falha e a release não sai.

## Voltar a uma versão anterior

Em Actions, rode **Republicar versão** a partir da branch do ambiente (`production` ou `development`), informando a tag (`v1.2.0`). Ele monta o site daquela tag, publica e roda o teste de fumaça. Não mexe nas branches. A alternativa é o rollback pelo painel da Vercel, que só o autor faz.

## Comandos manuais (emergência)

O caminho normal é o CI. Para publicar o `dist/` pelo terminal, com os três valores da Vercel no ambiente:

```bash
pnpm build && pnpm assemble
pnpm dlx vercel@63.1.2 deploy dist --yes          # prévia
pnpm dlx vercel@63.1.2 deploy dist --prod --yes   # no projeto de VERCEL_PROJECT_ID
```

Publicar à mão pula o portão de qualidade: só a pedido do autor.

## Regras e fronteiras

- O arquivo `dist/vercel.json` é gerado automaticamente pelo `scripts/assemble.mjs`. Não edite arquivos dentro de `dist/` à mão.
- Se uma nova rota ou MFE for adicionado, registre em `packages/contracts/src/routes.ts`; o script de montagem atualizará os rewrites automaticamente.
- Nunca versione tokens da Vercel. Variáveis sensíveis devem permanecer apenas nos segredos do GitHub ou em variáveis locais não versionadas.
