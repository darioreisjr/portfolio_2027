---
name: deploy-vercel
description: Instruções e regras para deploy na Vercel via GitHub Actions e Vercel CLI. Use ao configurar, auditar ou executar o deploy do portfólio.
---

# Deploy na Vercel

Guia de publicação atômica na Vercel a partir do GitHub Actions (ADR 0007).

## Arquitetura de deploy

O portfólio é um conjunto de 5 aplicações montadas em um diretório estático único: `dist/`.
O deploy é realizado pelo GitHub Actions após a execução de todos os testes de qualidade (lint, tipos, testes unitários, orçamentos de JavaScript, testes E2E e Lighthouse CI).

1. `pnpm build` compila os 5 apps e pacotes.
2. `pnpm assemble` reúne os arquivos em `dist/` e gera o `dist/vercel.json` dinâmico a partir de `packages/contracts/src/routes.ts`.
3. O GitHub Actions executa a Vercel CLI (`pnpm dlx vercel@latest`).

## Segredos no GitHub Actions

O repositório no GitHub deve possuir três segredos configurados em **Settings > Secrets and variables > Actions**:

| Segredo             | Para que serve               | Onde obter na Vercel                                                                |
| ------------------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| `VERCEL_TOKEN`      | Token de autenticação da CLI | Vercel Account Settings > Tokens                                                    |
| `VERCEL_ORG_ID`     | ID do time/usuário na Vercel | Projeto > Settings > General (ou arquivo `.vercel/project.json` após `vercel link`) |
| `VERCEL_PROJECT_ID` | ID do projeto no Vercel      | Projeto > Settings > General (ou arquivo `.vercel/project.json` após `vercel link`) |

## Ambientes e gatilhos

- **Pull Request:** Cria um _Preview Deployment_. Gera uma URL única de prévia para validação visual e testes antes do merge.
- **Push na branch `main`:** Cria um _Production Deployment_ (`--prod`). Atualiza o domínio de produção com o build oficial.

## Comandos manuais (desenvolvimento ou emergência)

Para fazer deploy manual do diretório `dist/` pré-compilado pelo terminal:

```bash
# 1. Montar a pasta de publicação
pnpm build && pnpm assemble

# 2. Vincular o projeto à Vercel (primeira vez)
pnpm dlx vercel link

# 3. Deploy de prévia
pnpm dlx vercel deploy --prebuilt

# 4. Deploy de produção
pnpm dlx vercel deploy --prebuilt --prod
```

## Regras e fronteiras

- O arquivo `dist/vercel.json` é gerado automaticamente pelo `scripts/assemble.mjs`. Não edite arquivos dentro de `dist/` à mão.
- Se uma nova rota ou MFE for adicionado, registre em `packages/contracts/src/routes.ts`; o script de montagem atualizará os rewrites automaticamente.
- Nunca versione tokens da Vercel. Variáveis sensíveis devem permanecer apenas nos segredos do GitHub ou em variáveis locais não versionadas.
