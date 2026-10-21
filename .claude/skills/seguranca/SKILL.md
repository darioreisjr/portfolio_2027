---
name: seguranca
description: Como tratar alertas de segurança deste repositório (code scanning do CodeQL, Dependabot e segredos) e como escrever código que não os gere. Use ao receber um link de github.com/.../security, ao ver alerta novo num pull request, quando o merge for recusado pela regra do CodeQL, ao montar script inline, ao mexer em vercel.json, workflows ou dependências, ou quando o autor pedir uma revisão de segurança.
---

# Segurança

O site é estático, sem backend, formulário nem login. O risco está no HTML gerado, no que vai ao navegador, no pipeline e nas dependências. Quem revisa é o subagente `security-reviewer`, só de leitura.

## O que o GitHub cobra

| Ferramenta                           | Onde roda                                                          | O que faz                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| CodeQL, conjunto `security-extended` | `.github/workflows/seguranca.yml`, em todo PR, push e toda segunda | Alerta em Security > Code scanning. **Alerta alto ou crítico recusa o merge** nas duas branches (`.github/rulesets/`) |
| Revisão de dependências              | Mesmo workflow, em todo PR                                         | Falha se o PR trouxer pacote com vulnerabilidade moderada ou pior                                                     |
| Alertas do Dependabot                | Contínuo                                                           | Avisa de vulnerabilidade em dependência já instalada                                                                  |
| Bloqueio de segredos no push         | Contínuo                                                           | Recusa o push que tiver um token conhecido                                                                            |

As correções automáticas do Dependabot estão **desligadas de propósito**: ele só as abre contra a branch padrão, a `production`, que só aceita PR da `development`. O alerta chega e a correção segue o fluxo normal (abaixo).

## O que o site manda ao navegador

O `vercel.json` gerado por `scripts/assemble.mjs` (`SECURITY_HEADERS`) põe em toda resposta:

| Cabeçalho                 | Valor                                                                                   | Para quê                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `X-Frame-Options`         | `DENY`                                                                                  | Ninguém põe o site numa moldura de outro (clickjacking)                                |
| `X-Content-Type-Options`  | `nosniff`                                                                               | O navegador não adivinha o tipo de um arquivo                                          |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`                                                       | Outros sites não recebem o endereço completo de onde veio o visitante                  |
| `Permissions-Policy`      | `camera=(), microphone=(), geolocation=()`                                              | A página não pede câmera, microfone nem localização                                    |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' <hashes>; style-src 'self' 'unsafe-inline'; ...` | Apenas scripts próprios e os hashes exatos compilados executam (sem `'unsafe-inline'`) |

A `Content-Security-Policy` foi entregue na issue #47 (pendência B14): `scripts/assemble.mjs` calcula os hashes SHA-256 de cada script inline gerado e monta a política automaticamente.

## Pipeline

- **Tokens:** o `VERCEL_TOKEN` só existe no passo que publica, nunca no ambiente do job que roda o código do PR. O token do GitHub não fica em `.git/config` (`persist-credentials: false` em todo checkout).
- **Checagens obrigatórias** só valem vindas do GitHub Actions (`integration_id` 15368 nas regras).
- **Tags `v*`:** ninguém apaga nem move. Criar não é bloqueado, porque em repositório de conta pessoal o GitHub não aceita o GitHub Actions como exceção da regra, e a release automática ficaria impedida. Em vez disso, `republicar.yml` só publica versão cujo commit está na `production`: uma tag feita à mão num commit solto é recusada.
- **Vercel CLI:** roda por `pnpm dlx` com versão fixa, fora do lockfile, de propósito. Em 2026-10-15 ela foi posta no lockfile e trouxe 202 pacotes com 37 vulnerabilidades conhecidas (1 crítica), quase todas nas partes que simulam o servidor da Vercel na máquina local, que o deploy não usa. No lockfile, a revisão de dependências travaria todo PR. A versão fica igual nos três lugares por `scripts/vercel-cli.test.mjs`.
- **Pacotes:** idade mínima de 24 horas declarada em `pnpm-workspace.yaml` (`minimumReleaseAge: 1440`); exceção só com o autor.

## Riscos aceitos

| Risco                                                                                                                                                                     | Decisão                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-mail e WhatsApp do autor em texto na área do recrutador (robôs colhem para spam)                                                                                        | Mantido pelo autor em 2026-10-12 e de novo em 2026-10-15: recrutador precisa achar o contato                                                                                                                                                                                                                                                                            |
| Vulnerabilidades conhecidas nas dependências de desenvolvimento/CI do `@lhci/cli` e do ESLint Next.js (`tmp`, `uuid`, `extract-zip`, `basic-ftp`, `sprintf-js`, `braces`) | Risco aceito em 2026-10-17 (issue #48): ferramentas que rodam exclusivamente na máquina local e no pipeline de CI contra o `dist/` estático próprio, sem expor portas nem empacotar código no site publicado. Além disso, `extract-zip`, `sprintf-js` e `braces` não possuem patch publicado upstream, e `uuid` v11 é ESM-only (incompatível com `@lhci/cli` CommonJS). |

## Ler os alertas

```bash
R=repos/darioreisjr/portfolio_2027
gh api "$R/code-scanning/alerts?state=open&per_page=100" \
  -q '.[] | "#\(.number) [\(.rule.security_severity_level // .rule.severity)] \(.rule.id) \(.most_recent_instance.location.path):\(.most_recent_instance.location.start_line)"'
gh api "$R/dependabot/alerts?state=open" -q '.[] | "#\(.number) \(.security_advisory.severity) \(.dependency.package.name) \(.security_advisory.summary)"'
gh api "$R/secret-scanning/alerts?state=open" -q '.[] | "#\(.number) \(.secret_type_display_name) \(.html_url)"'
```

A regra de cada alerta do CodeQL tem página própria: `https://codeql.github.com/codeql-query-help/javascript/<regra sem o prefixo js/>/`.

## Triar

Para cada alerta, responda nesta ordem e escreva a resposta na issue:

1. **É alcançável?** De onde vem o valor: constante do código, conteúdo de `packages/content`, URL, `localStorage`, entrada de quem abre um PR. Só constante do código é risco baixo, nunca "nenhum".
2. **O que um atacante faria?** Uma frase. Se não houver resposta, o alerta ainda pode ser legítimo: o código é frágil e quebra na primeira mudança de valor.
3. **Qual a correção pela causa?** Prefira a que o CodeQL reconhece (ex.: o serializador certo) a contornar a regra.

| Gravidade       | Prazo                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| Crítica ou alta | Agora: issue com `prioridade: alta` e correção antes de qualquer outra entrega |
| Média           | Na próxima rodada                                                              |
| Baixa           | Junto com a próxima mudança no mesmo arquivo                                   |

**Descartar um alerta** (`dismiss`) só com motivo escrito (falso positivo, uso só em teste, risco aceito) e com o ok do autor. Nunca para destravar um merge.

## Corrigir

O mesmo fluxo de qualquer tarefa (skill `commits`):

1. Issue pelo formulário de defeito, com a label `tipo: segurança` e o número do alerta.
2. Branch saída da `development`: `fix/seguranca-<assunto>`.
3. Correção com teste que prove o caso perigoso (ex.: o valor com `</script>`).
4. PR contra a `development`. No PR, o CodeQL roda de novo; o alerta corrigido some da lista de abertos depois do merge na `production`.
5. Promoção quando o autor pedir. Commit `fix` gera versão de remendo.

**Vulnerabilidade em dependência** (alerta do Dependabot): atualize a versão no catálogo do `pnpm-workspace.yaml` para a primeira que corrige, rode `pnpm install`, confira o `pnpm-lock.yaml` e siga o fluxo acima. Se a versão corrigida for mais nova que a regra de idade mínima do pnpm (24 horas), peça ao autor a exceção em `minimumReleaseAgeExclude`, com o motivo; nunca libere sozinho.

**Segredo vazado:** revogue primeiro (no serviço que emitiu o token), depois limpe. Apagar do repositório não basta: o histórico continua público. Avise o autor na hora.

## Escrever código que não gere alerta

- **Script inline** (o que vai dentro de `<script>` no HTML): todo valor entra por `scriptValue` de `packages/contracts`. `JSON.stringify` sozinho não escapa `</script>`, `<!--` nem U+2028 e U+2029 (regra `js/bad-code-sanitization`).
- **HTML a partir de texto:** nada de `innerHTML`, `v-html`, `[innerHTML]`, `dangerouslySetInnerHTML` com conteúdo, `insertAdjacentHTML`, `document.write`, `eval` ou `new Function`. O único `dangerouslySetInnerHTML` aceito é o dos scripts inline montados com `scriptValue`.
- **Endereço em expressão regular:** não confira URL com regex sem âncora, nem em teste (regra `js/regex/missing-regexp-anchor`, gravidade alta). Compare o texto inteiro por igualdade, ou use `new URL()` e compare `host`.
- **Link que abre outra aba:** `target="_blank"` sempre com `rel="noopener"`.
- **Workflow:** entrada que vem de quem abre o PR (`github.head_ref`, títulos, `inputs`) entra por `env:`, nunca interpolada em `run:`; `permissions` mínimas por job; action fixada por SHA.
- **Dependência nova:** justificativa no plano; nada em `allowBuilds` sem o autor.

## Histórico

| Data       | Alerta                                                                            | Causa                                                                                         | Correção                                                                                                                                                                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-15 | 8 × `js/bad-code-sanitization` (média)                                            | Scripts inline do tema, da chegada e da volta da comunidade com valores por `JSON.stringify`  | `scriptValue` em `packages/contracts` (issue #46)                                                                                                                                                                                                                                  |
| 2026-10-15 | Revisão do `security-reviewer`: token da Vercel no job inteiro (alta) e 15 outros | Ver issue #46                                                                                 | Token só no passo de deploy, `persist-credentials: false`, cabeçalhos, republicação só de versão que está na `production`, checagens com origem fixa, caminho do currículo validado, atributos do shell escapados, servidor local só na máquina, MCP do Playwright com versão fixa |
| 2026-10-15 | 2 × `js/regex/missing-regexp-anchor` (alta), em `scripts/release.test.mjs`        | Apareceram com o conjunto ampliado do CodeQL: o teste conferia endereços com regex sem âncora | Comparação da linha inteira por igualdade                                                                                                                                                                                                                                          |
| 2026-10-21 | Ausência de Content-Security-Policy (pendência B14)                               | Scripts inline gerados no build sem política de segurança configurada                         | Hashes SHA-256 de scripts inline calculados no assemble e CSP restritiva em SECURITY_HEADERS (issue #47)                                                                                                                                                                           |
