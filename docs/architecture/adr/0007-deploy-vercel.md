# ADR 0007: Hospedagem e deploy na Vercel via GitHub Actions

- Status: **aceito** pelo autor em 2026-10-07
- Data: 2026-10-07
- Substitui: [ADR 0004](0004-hosting.md)

## Contexto

O ADR 0004 definiu inicialmente a publicação do portfólio no Cloudflare Pages, mas previu que a estratégia de diretório único compilado (`dist/`) permitiria migrar para a Vercel com facilidade caso a regra de reescrita fosse adaptada.

O autor decidiu que a hospedagem do portfólio será na **Vercel**, com automação de deploy integrada ao **GitHub**. O monorepo possui 5 aplicações estáticas (Next.js em export estático, shell em JavaScript puro e três microfrontends em Vue, Angular e React) que são montadas em `dist/` pelo comando `pnpm assemble`. O deploy precisa ser atômico, contemplar ambientes de prévia (Preview em Pull Requests) e Produção (ao commitar na branch `main`), garantir reescrita de sub-rotas de MFEs e aplicar políticas de cache HTTP sem permitir que código quebrado vá ao ar.

## Opções

| Critério                            | Opção 1: GitHub Actions com Vercel CLI (`dist/` pré-montado)                  | Opção 2: Integração Git nativa da Vercel                                     |
| ----------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Gate de qualidade antes de publicar | **Total:** só publica se lint, tipos, budgets, Playwright e2e e LHCI passarem | Parcial: Vercel publica assim que o build termina, antes de rodar E2E e LHCI |
| Suporte a monorepo multi-framework  | Sim: os scripts do monorepo montam `dist/` no runner do GitHub com Node 24    | Exige configurar o container de build da Vercel para gerenciar os 5 apps     |
| Deploy atômico                      | Sim: publica o diretório `dist/` final via CLI                                | Sim                                                                          |
| Preview em Pull Request             | Sim: Vercel CLI gera URL de preview e a reporta no CI                         | Sim: comentários nativos do bot da Vercel                                    |
| Dependência de secrets              | Sim (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) no GitHub Secrets  | Não (conexão direta via Vercel GitHub App)                                   |

## Decisão

**Opção 1: Publicação atômica na Vercel via GitHub Actions com a Vercel CLI.**

Motivos:

1. **Garantia de qualidade pré-deploy:** O portfólio possui regras rigorosas de orçamentos de JavaScript (`docs/quality/budgets.md`) e testes ponta a ponta (`pnpm test:e2e`). Com o deploy executado pelo GitHub Actions após essas validações, nenhuma versão quebrada ou fora do orçamento de performance é disponibilizada na Vercel.
2. **Isolamento de complexidade:** A Vercel não precisa conhecer as particularidades de compilar Angular 22, Vue, React, Next.js e Lit simultaneamente em um monorepo. O GitHub Actions executa o pipeline oficial (`pnpm build && pnpm assemble`) e entrega a pasta pronta `dist/`.
3. **Geração dinâmica de configuração (`dist/vercel.json`):** Em vez de manter um `vercel.json` estático e manual, o script `scripts/assemble.mjs` gera o arquivo `dist/vercel.json` consumindo a tabela única de rotas de `packages/contracts`:
   - Sub-rotas dos MFEs (`/recrutador/:path*`, `/tecnico/:path*`, `/clientes/:path*` e suas rotas traduzidas em en, es e pt-PT) são reescritas com status 200 para o respectivo `index.html`.
   - Bundles e assets (`/_mfe/`, `/_ds/`, `/_shell/`, `/_next/`) ficam fora dos caminhos de rewrite e são servidos diretamente como arquivos estáticos.
   - Cabeçalhos de cache: 1 ano imutável (`public, max-age=31536000, immutable`) para arquivos com hash e fontes, e revalidação instantânea (`public, max-age=0, must-revalidate`) para páginas HTML.
4. **Ambientes claros:**
   - Em `pull_request`: deploy de Preview.
   - Em `push` na branch `main`: deploy de Produção (`--prod`).

## Consequências

- O ADR 0004 é substituído por este documento.
- O arquivo de configuração da Vercel passa a residir em `dist/vercel.json`, emitido a cada montagem.
- O repositório precisa receber 3 segredos no GitHub Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`.
- A pendência de hospedagem em `docs/open-questions.md` passa a se referir ao cadastro na Vercel.
- Foi criada a skill `.agents/skills/deploy-vercel/SKILL.md` documentando o processo e os comandos para os agentes e o desenvolvedor.

## Fontes

- [Vercel CLI Overview](https://vercel.com/docs/cli)
- [Vercel Project Configuration (vercel.json)](https://vercel.com/docs/projects/project-configuration)
- [Vercel Rewrites](https://vercel.com/docs/rewrites)
- [Vercel Headers](https://vercel.com/docs/headers)
- [How to use GitHub Actions with Vercel](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
