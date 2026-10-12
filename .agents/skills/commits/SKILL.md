---
name: commits
description: Como escrever e criar commits e como fazer push neste repositório. Conventional Commits em português do Brasil, sem coautor; antes de todo push, revisão do README. Use sempre que for criar, reescrever ou revisar um commit, montar a mensagem de um commit, dividir um trabalho em commits ou fazer push.
---

# Commits

Padrão: [Conventional Commits](https://www.conventionalcommits.org/pt-br/), em português do Brasil. O `commitlint` recusa o que foge disso (`commitlint.config.js`).

## Formato

```
tipo(escopo): resumo

Corpo opcional.
```

- **Resumo:** em pt-BR, começa com letra minúscula, sem ponto final, até 72 caracteres. Diz o que o commit faz, no presente: "adiciona", "corrige", "remove".
- **Corpo:** opcional, separado por uma linha em branco, linhas de até 100 caracteres. Explica o porquê e o que não é óbvio no diff. Não repete a lista de arquivos.
- **Mudança que quebra:** `!` depois do tipo ou do escopo, e uma linha `BREAKING CHANGE: descrição` no corpo.

## Sem coautor

Nenhum commit leva `Co-Authored-By`, `Signed-off-by` de agente, "Generated with" nem qualquer assinatura de ferramenta de IA. O autor do commit é só quem está no `git config`. Vale para Claude Code, Codex e Gemini, mesmo que a ferramenta sugira o contrário.

## Tipos

| Tipo       | Quando                                           |
| ---------- | ------------------------------------------------ |
| `feat`     | Funcionalidade nova para quem usa o site         |
| `fix`      | Correção de defeito                              |
| `docs`     | Só documentação (`docs/`, `AGENTS.md`, skills)   |
| `style`    | Formatação, sem mudar comportamento              |
| `refactor` | Reorganização de código, sem mudar comportamento |
| `perf`     | Melhora de desempenho                            |
| `test`     | Só testes                                        |
| `build`    | Dependências, bundlers, configuração de build    |
| `ci`       | Workflows do GitHub Actions                      |
| `chore`    | Manutenção que não cabe nos outros               |

## Escopo

O app ou pacote que o commit toca, com o nome da pasta: `shell`, `mfe-vue`, `mfe-angular`, `mfe-react`, `web-next`, `content`, `tokens`, `design-system`, `contracts`, `config`. Sem escopo quando a mudança atravessa vários ou é da raiz.

## Como dividir

- Um commit por mudança lógica. Funcionalidade, correção e documentação não relacionada vão em commits separados.
- Testes e documentação da própria mudança vão no mesmo commit que ela.
- Arquivo gerado (`.claude/`, `.codex/`, `.gemini/`, `.mcp.json`) vai junto da fonte que o gerou.
- Cada commit deixa o repositório passando em `pnpm lint`, `pnpm typecheck` e `pnpm test`.

## Antes de criar o commit

1. `git status` e `git diff`: confira que só entra o que pertence à mudança. Nada de `.env` nem de segredo.
2. `pnpm format:check`, `pnpm lint` e `pnpm ai:check`. Para mudança de código, também os testes do que foi tocado.
3. Escreva a mensagem e crie o commit. Não use `--no-verify`.

## Push

Commit é local. O push só acontece quando o autor pedir. Reescrever commits já enviados (`push --force`) exige pedido explícito do autor.

### Revise o README antes de todo push

O `README.md` da raiz é a porta de entrada do repositório e diz como o projeto está hoje. Todo pedido de push inclui revisá-lo, sem o autor precisar pedir:

1. Veja o que vai subir: `git log origin/main..HEAD --oneline` e `git diff origin/main..HEAD --stat`.
2. Leia o `README.md` inteiro e compare com essas mudanças. Atualize se alguma delas mudou:
   - a situação de uma área (em construção, dados de exemplo, dados reais) ou as rotas e idiomas;
   - as tecnologias, a estrutura de pastas ou a forma de compor os apps;
   - um comando da raiz, o jeito de rodar ou as versões de Node e pnpm;
   - um teto de qualidade, o que o CI cobra ou a forma de publicar;
   - a quantidade de ADRs, os documentos citados, o endereço do site ou os contatos.
3. Se atualizou: `pnpm format:check` e um commit próprio, `docs: atualiza o README`, antes do push.
4. No relato do push, diga em uma linha o que mudou no README ou que ele já estava em dia.

O README só afirma o que existe no repositório: nada de funcionalidade planejada como se estivesse pronta, nem conteúdo sobre o autor que não esteja em `packages/content`. É escrito em pt-BR, para quem chega pelo GitHub.

### Conta do GitHub

O push deste projeto é sempre feito com a conta do GitHub `darioreisjr`, dona do repositório. A máquina do autor tem mais de uma conta no `gh`. Antes de cada push:

1. `gh auth status`: confira qual conta está ativa.
2. Se não for `darioreisjr`: `gh auth switch --user darioreisjr` e confira de novo.
3. Só então `git push`. Não faça push com outra conta, nem troque o remoto para contornar.

## Exemplos

```
feat(web-next): adiciona cenário animado de sakura na home
```

```
fix(shell): corrige foco perdido ao trocar de área

O foco ficava no link clicado, fora da área nova. Agora vai para o
conteúdo principal, como pede o orçamento de acessibilidade.
```

```
docs: registra o ADR 0005 sobre o controle de tema
```
