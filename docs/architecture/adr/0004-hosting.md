# ADR 0004: Hospedagem e deploy

- Status: **substituído por [ADR 0007](0007-deploy-vercel.md)** em 2026-10-07
- Data: 2026-10-06

## Contexto

Cinco apps estáticos precisam aparecer como um site só, em um domínio, sem servidor. As exigências vêm do ADR 0002: diretório único, `404.html`, de preferência reescrita por caminho e cabeçalhos de cache.

## Opções

| Critério                            | GitHub Pages                        | Cloudflare Pages                                       | Netlify                             | Vercel             |
| ----------------------------------- | ----------------------------------- | ------------------------------------------------------ | ----------------------------------- | ------------------ |
| Serve o export estático do Next.js  | Sim                                 | Sim                                                    | Sim                                 | Sim                |
| Reescrita por caminho (status 200)  | **Não** (a doc não descreve regras) | Sim, arquivo `_redirects`, só destinos do próprio site | Sim, `_redirects` ou `netlify.toml` | Sim, `vercel.json` |
| Arquivo existente vence a reescrita | Não se aplica                       | **Não**: regras valem antes dos arquivos               | Sim, por padrão                     | Não verificado     |
| `404.html`                          | Um só, na raiz                      | O mais próximo subindo a árvore de diretórios          | Não verificado                      | Não verificado     |
| Limite de regras                    | Não se aplica                       | 2.000 estáticas e 100 dinâmicas                        | Não verificado                      | Não verificado     |
| Preview por pull request            | Não                                 | Sim (não verificado nesta rodada)                      | Sim (não verificado)                | Sim                |
| Preços e limites do plano gratuito  | Não verificado                      | Não verificado                                         | Não verificado                      | Não verificado     |

O Next.js em export estático ao lado do shell funciona nos quatro, porque toda rota conhecida vira um arquivo real (ADR 0002). A diferença aparece nas sub-rotas de MFE não geradas no build: sem reescrita, um link direto para elas dá 404. O GitHub Pages fica de fora por isso.

## Decisão

**Um único projeto no Cloudflare Pages**, com regras por caminho em `_redirects`. Concorda com a inclinação do autor por host único.

Motivos:

- Reescrita por caminho resolve as sub-rotas de cada MFE.
- O `404.html` mais próximo na árvore permite uma página de erro por idioma (`/en/404.html`).
- A saída é um diretório comum; trocar por Netlify ou Vercel exige só reescrever o arquivo de regras.

Cuidados específicos, tirados da doc:

- Sem `404.html` na raiz, o Cloudflare Pages trata o projeto como SPA e manda toda rota desconhecida para `/`. O export do Next.js gera `404.html`; o script de montagem verifica que ele existe.
- As regras valem antes dos arquivos. Uma regra `/tecnico/* /tecnico/index.html 200` capturaria também os arquivos dentro de `/tecnico/`. Por isso os bundles dos MFEs ficam fora dos caminhos de rota (ver abaixo).

Netlify é a alternativa equivalente e tem uma vantagem: arquivo existente vence a reescrita. Fica como plano B.

## Estrutura do diretório publicado

| Caminho                                                         | Origem                                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `/`, `/comunidade/`, `/como-foi-feito/`, `/_next/`, `/404.html` | `apps/web-next` (`out/`)                                                                           |
| `/recrutador/`, `/tecnico/`, `/clientes/` (só HTML)             | `apps/shell`                                                                                       |
| `/en/...`, `/es/...` (e `/pt-pt/...` até 2026-10-09)            | Os dois acima, por idioma, com nomes de rota traduzidos (tabela em `docs/architecture/mfe-map.md`) |
| `/_shell/`                                                      | Scripts e estilos do shell                                                                         |
| `/_mfe/vue/`, `/_mfe/angular/`, `/_mfe/react/`                  | Bundle de cada MFE                                                                                 |
| `/_ds/`                                                         | Design system e tokens                                                                             |
| `/_redirects`, `/_headers`                                      | Gerados na montagem                                                                                |

## Estratégia de deploy

- **Build por app:** cada app builda sozinho. O Turborepo reaproveita o cache dos que não mudaram; o CI builda só o que foi afetado.
- **Montagem:** um script junta as saídas em `dist/`, falha se dois apps emitirem o mesmo caminho e confere a existência de `404.html`. O `_redirects` é gerado a partir da tabela de rotas de `packages/contracts`: uma regra por área de MFE e por idioma (12 regras hoje, longe do limite de 100 dinâmicas).
- **Publicação:** um deploy atômico do `dist/` inteiro. Pull request gera preview; merge na `main` publica.
- **Cache:** arquivos com hash no nome recebem cache longo e imutável; HTML é sempre revalidado.

Custo aceito: não há deploy independente por MFE. Para um dev solo, um deploy atômico é mais simples e evita versões incompatíveis no ar. O build continua independente por app.

## Consequências

- O token de deploy fica como segredo do GitHub Actions, nunca no repositório.
- O domínio próprio é configurado no host (ver `docs/open-questions.md`).
- Preços e limites do plano gratuito precisam ser conferidos antes de criar o projeto.

## Fontes

- [Cloudflare Pages: serving pages](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Cloudflare Pages: redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Netlify: rewrites e proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/)
- [Vercel: rewrites](https://vercel.com/docs/rewrites)
- [GitHub Pages: página 404](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)
- [Next.js: static exports](https://nextjs.org/docs/app/guides/static-exports)

Não verificado: se a Cloudflare recomenda hoje Workers com static assets no lugar do Pages para projetos novos. As páginas lidas não dizem; conferir antes de criar o projeto.
