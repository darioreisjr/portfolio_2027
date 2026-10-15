# Plano: alertas do CodeQL e fluxo de segurança

- Status: **aprovado** pelo autor em 2026-10-15 e implementado
- Origem: pedido do autor sobre o painel de code scanning; issue #46

**Objetivo:** fechar os alertas abertos pela causa e montar o fluxo de segurança: o que o CI cobra, quem revisa e o que fazer com cada alerta.

## Os alertas

8 alertas `js/bad-code-sanitization`, gravidade média: os scripts escritos no HTML (tema, chegada pelas cortinas, volta da comunidade) recebiam valores por `JSON.stringify`, que não escapa `</script>`, `<!--` nem U+2028 e U+2029. Correção: `scriptValue`, em `packages/contracts`, que escapa os cinco caracteres. O texto gerado hoje é o mesmo.

## Decisões do autor

| Tema         | Decisão                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| CodeQL       | Conjunto `security-extended`                                                                                    |
| Bloqueio     | Merge recusado com alerta alto ou crítico, nas duas branches                                                    |
| Dependabot   | Correções automáticas desligadas: abririam PR contra a `production`. Os alertas continuam                       |
| Tags `v*`    | Só o GitHub Actions cria                                                                                        |
| Vercel CLI   | Continua por `pnpm dlx`: no lockfile trouxe 37 vulnerabilidades conhecidas e travaria a revisão de dependências |
| Idade mínima | 24 horas declaradas; a exceção do `vite@8.3.3` saiu                                                             |
| Contatos     | E-mail e WhatsApp continuam publicados; risco aceito                                                            |

## O agente e a skill

- `security-reviewer` (em `docs/ai-setup/agents.md`): só leitura; entra no passo de revisão do `AGENTS.md` quando a mudança mexe em HTML gerado, scripts inline, `vercel.json`, workflows ou dependências.
- Skill `seguranca`: o que o GitHub cobra, os cabeçalhos, como ler e triar alertas, como corrigir pelo fluxo de branches, os riscos aceitos e o histórico.

## A revisão de 2026-10-15

O `security-reviewer` achou 16 pontos. Corrigidos nesta entrega:

| Achado                                                                          | Gravidade | Correção                                                         |
| ------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| `VERCEL_TOKEN` no ambiente do job inteiro, onde roda o código do PR             | alta      | O token só existe no passo da prévia                             |
| Token do GitHub em `.git/config` durante o job                                  | média     | `persist-credentials: false` em todo checkout                    |
| Qualquer um com escrita cria tag `v*` publicável                                | média     | Só o GitHub Actions cria                                         |
| MCP do Playwright com `@latest`                                                 | média     | Versão fixa                                                      |
| Sem proteção contra moldura, `nosniff`, `Referrer-Policy`, `Permissions-Policy` | baixa     | `SECURITY_HEADERS` no `vercel.json`                              |
| Checagens obrigatórias sem origem fixa                                          | baixa     | `integration_id` do GitHub Actions                               |
| Idade mínima não declarada; exceção sem motivo                                  | baixa     | `minimumReleaseAge: 1440`; exceção removida                      |
| Números no script inline sem `scriptValue`                                      | baixa     | Passam por ela                                                   |
| Caminho do currículo aceitava `javascript:`                                     | baixa     | Só caminho do próprio site                                       |
| Atributos do HTML do shell sem escape                                           | baixa     | `escapeHtml` em todos                                            |
| Servidor local de prévia na rede e com caminho frouxo                           | baixa     | Só `127.0.0.1`, separador conferido, `%` malformado sem derrubar |

Viraram issue: a CSP (#47, média) e as vulnerabilidades nas dependências do Lighthouse CI (#48, baixa). Fica como risco aceito: e-mail e WhatsApp publicados.

## Verificação

- `pnpm lint`, `pnpm typecheck`, `pnpm test`; e2e com 266 testes; orçamentos sem mudança.
- Os cabeçalhos estão no `dist/vercel.json`; os alertas fecham no painel depois do merge na `production`.
- A regra nova das branches é aplicada no GitHub depois de o PR passar.
