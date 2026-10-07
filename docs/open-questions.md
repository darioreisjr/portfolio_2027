# Questões em aberto e suposições não confirmadas

Atualizado em 2026-10-06. **Bloqueante** = precisa de resposta antes do bootstrap.

## Decisões pendentes do autor

| # | Questão | Suposição em uso | Bloqueante? |
|---|---|---|---|
| 1 | Aprovação dos ADRs 0002, 0003 e 0004 e do `budgets.md` | **Resolvido:** aceitos em 2026-10-06 | Não |
| 2 | Nomes das rotas das áreas | **Resolvido:** rotas traduzidas, tabela em `mfe-map.md`. Os nomes em en e es são proposta | Não |
| 3 | Idioma na URL | **Resolvido:** pt-BR sem prefixo; `/en`, `/es`, `/pt-pt` com prefixo | Não |
| 4 | Artigos têm corpo dentro do site ou só link externo? | Só lista em JSON com link externo | Não |
| 5 | Formulário de contato | Adiado; só links diretos | Não |
| 6 | Analytics | Nenhum; sem dados de campo para Core Web Vitals | Não |
| 7 | Domínio próprio | Não definido; usar o domínio do host até decidir | Não |
| 8 | Conta no Cloudflare e conferência do plano gratuito | Não conferido | Não (só antes do primeiro deploy) |
| 9 | Vitrine pública do design system: Storybook publicado ou página própria no Next.js? | Não decidido | Não |
| 10 | Um currículo em PDF por idioma ou um só? | Um por idioma, opcional | Não |

## Suposições de conteúdo

- Não há conteúdo real. O esqueleto usa dados de exemplo marcados como fictícios, com `status: "draft"`.
- As categorias de skill e os níveis (`learning`, `working`, `advanced`) são proposta; podem mudar quando houver dados.
- Depoimentos exigem autorização de quem escreveu (`consent: true`).
- O idioma de quem visita não é detectado automaticamente; a troca é manual, pelo cabeçalho.

## Ambiente (necessário para o bootstrap)

| Item | Situação |
|---|---|
| Claude Code CLI | 2.1.177; funciona com o adaptador `CLAUDE.md` |
| Codex CLI | 0.45.0; não verificado se suporta skills e custom agents |
| Gemini CLI | Não instalado |
| pnpm | O comando falha; precisa ser consertado |
| Git | O diretório ainda não é um repositório |
| Chave do Context7 e token do GitHub | Não criados; sem eles dois dos três servidores MCP não conectam (ver `.env.example`) |

## Não verificado na documentação

- Situação oficial do Module Federation para Next.js (a página primária retornou 404).
- Saídas de hidratação e wrappers de framework do Stencil.
- `CUSTOM_ELEMENTS_SCHEMA` na doc atual do Angular.
- Se a Cloudflare recomenda Workers com static assets em vez de Pages para projetos novos.
- Preços e limites dos planos gratuitos dos quatro hosts.
- Tamanhos reais dos runtimes; os tetos de JavaScript são estimativas.
- Os itens da seção 8 de `docs/ai-setup/capability-matrix.md`.
