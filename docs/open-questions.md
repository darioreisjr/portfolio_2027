# Questões em aberto e suposições não confirmadas

Atualizado em 2026-10-06. **Bloqueante** = precisa de resposta antes do bootstrap.

## Decisões pendentes do autor

| #   | Questão                                                                             | Suposição em uso                                                                          | Bloqueante?                       |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------- |
| 1   | Aprovação dos ADRs 0002, 0003 e 0004 e do `budgets.md`                              | **Resolvido:** aceitos em 2026-10-06                                                      | Não                               |
| 2   | Nomes das rotas das áreas                                                           | **Resolvido:** rotas traduzidas, tabela em `mfe-map.md`. Os nomes em en e es são proposta | Não                               |
| 3   | Idioma na URL                                                                       | **Resolvido:** pt-BR sem prefixo; `/en`, `/es`, `/pt-pt` com prefixo                      | Não                               |
| 4   | Artigos têm corpo dentro do site ou só link externo?                                | Só lista em JSON com link externo                                                         | Não                               |
| 5   | Formulário de contato                                                               | Adiado; só links diretos                                                                  | Não                               |
| 6   | Analytics                                                                           | Nenhum; sem dados de campo para Core Web Vitals                                           | Não                               |
| 7   | Domínio próprio                                                                     | Não definido; usar o domínio do host até decidir                                          | Não                               |
| 8   | Conta no Cloudflare e conferência do plano gratuito                                 | Não conferido                                                                             | Não (só antes do primeiro deploy) |
| 9   | Vitrine pública do design system: Storybook publicado ou página própria no Next.js? | Não decidido                                                                              | Não                               |
| 10  | Um currículo em PDF por idioma ou um só?                                            | Um por idioma, opcional                                                                   | Não                               |

## Suposições de conteúdo

- Não há conteúdo real. O esqueleto usa dados de exemplo marcados como fictícios, com `status: "draft"`.
- As categorias de skill e os níveis (`learning`, `working`, `advanced`) são proposta; podem mudar quando houver dados.
- Depoimentos exigem autorização de quem escreveu (`consent: true`).
- O idioma de quem visita não é detectado automaticamente; a troca é manual, pelo cabeçalho.

## Ambiente

| Item                                | Situação em 2026-10-06                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Node                                | 24.21.0, baixado pelo pnpm para este projeto. O Node do sistema é 22.21.1 e não atende ao Angular 22 |
| pnpm                                | 12.9.1                                                                                               |
| Git                                 | `main` publicada em github.com/darioreisjr/portfolio_2027 (público)                                  |
| Claude Code CLI                     | 2.1.177                                                                                              |
| Codex CLI                           | 0.160.1                                                                                              |
| Gemini CLI                          | 0.63.0                                                                                               |
| Chave do Context7 e token do GitHub | No `.env`; precisam também estar no ambiente do terminal para Claude Code e Codex                    |

## Pendências deixadas pelo bootstrap

| #   | Pendência                                                                                                                                                                                                       | Bloqueia o quê        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| B1  | **Resolvido em 2026-10-07:** repositório em github.com/darioreisjr/portfolio_2027 e primeiro CI verde na `main`. Os passos que só rodam em pull request (commitlint e `--affected`) ainda não foram exercitados | Primeiro pull request |
| B2  | **Resolvido em 2026-10-07:** o e2e passou no CI em Linux, incluindo a navegação entre páginas Next.js                                                                                                           | Nada                  |
| B3  | Next.js fixado em 16.3.8 porque a 16.4.0 tinha menos de 24 horas; reavaliar a atualização                                                                                                                       | Nada                  |
| B4  | O `404.html` do Next.js sai sem atributo `lang`                                                                                                                                                                 | Tarefa de SEO         |
| B5  | MFE React com 77,5 kB de 80 kB e páginas Next.js com 144,2 kB de 150 kB: folga pequena para features                                                                                                            | Features dessas áreas |
| B6  | Os textos de interface em en, es e pt-PT foram escritos por IA e não foram revisados pelo autor                                                                                                                 | Publicação            |
| B7  | Fora do bootstrap: tema, troca de idioma, cabeçalho e rodapé reais, `hreflang`, sitemap, `_redirects`, `_headers`, deploy                                                                                       | Publicação            |

## Não verificado na documentação

- Situação oficial do Module Federation para Next.js (a página primária retornou 404).
- Saídas de hidratação e wrappers de framework do Stencil.
- `CUSTOM_ELEMENTS_SCHEMA` na doc atual do Angular.
- Se a Cloudflare recomenda Workers com static assets em vez de Pages para projetos novos.
- Preços e limites dos planos gratuitos dos quatro hosts.
- Os itens da seção 8 de `docs/ai-setup/capability-matrix.md`.
