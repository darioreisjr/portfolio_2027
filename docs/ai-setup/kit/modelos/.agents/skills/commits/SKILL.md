---
name: commits
description: Como escrever e criar commits, em que branch trabalhar e como fazer push e abrir pull request neste repositório. Conventional Commits, sem coautor; branch por tarefa; antes de todo push, revisão do README e do kit de agentes. Use sempre que for criar, reescrever ou revisar um commit, montar a mensagem de um commit, dividir um trabalho em commits, criar uma branch, fazer push ou abrir um pull request.
---

# Commits

Padrão: [Conventional Commits](https://www.conventionalcommits.org/pt-br/), em <<idioma>>. O `commitlint` recusa o que foge disso (`commitlint.config.js`).

## Formato

```
tipo(escopo): resumo

Corpo opcional.
```

- **Resumo:** começa com letra minúscula, sem ponto final, até 72 caracteres. Diz o que o commit faz, no presente.
- **Corpo:** opcional, separado por uma linha em branco, linhas de até 100 caracteres. Explica o porquê e o que não é óbvio no diff.
- **Mudança que quebra:** `!` depois do tipo ou do escopo, e uma linha `BREAKING CHANGE: descrição` no corpo.

## Sem coautor

Nenhum commit leva `Co-Authored-By`, `Signed-off-by` de agente, "Generated with" nem qualquer assinatura de ferramenta de IA. O autor do commit é só quem está no `git config`. Vale para todas as ferramentas, mesmo que a ferramenta sugira o contrário.

## Tipos

| Tipo       | Quando                                           |
| ---------- | ------------------------------------------------ |
| `feat`     | Funcionalidade nova para quem usa o produto      |
| `fix`      | Correção de defeito                              |
| `docs`     | Só documentação (`docs/`, `AGENTS.md`, skills)   |
| `style`    | Formatação, sem mudar comportamento              |
| `refactor` | Reorganização de código, sem mudar comportamento |
| `perf`     | Melhora de desempenho                            |
| `test`     | Só testes                                        |
| `build`    | Dependências, configuração de build              |
| `ci`       | Workflows de CI                                  |
| `chore`    | Manutenção que não cabe nos outros               |

## Escopo

<<Lista de escopos válidos (pastas, módulos). Sem escopo quando a mudança atravessa vários.>>

## Como dividir

- Um commit por mudança lógica.
- Testes e documentação da própria mudança vão no mesmo commit que ela.
- Arquivo gerado (`.claude/`, `.codex/`, `.gemini/`, `.agents/agents/`, `.mcp.json`) vai junto da fonte que o gerou.

## Antes de criar o commit

1. `git status` e `git diff`: confira que só entra o que pertence à mudança. Nada de `.env` nem de segredo.
2. Formatação, lint e `node scripts/ai-sync.mjs --check`. Para mudança de código, também os testes do que foi tocado.
3. Escreva a mensagem e crie o commit. Não use `--no-verify`.

## Push

Commit é local. O push só acontece quando o autor pedir. Reescrever commits já enviados (`push --force`) exige pedido explícito do autor.

### Antes de todo push

1. Veja o que vai subir: `git log origin/<<branch-base>>..HEAD --oneline` e `git diff origin/<<branch-base>>..HEAD --stat`.
2. **README:** leia o `README.md` e compare com as mudanças. Atualize se mudou o que ele afirma (comandos, estrutura, tecnologias, como rodar).
3. **Kit de agentes:** se o diff tocou `AGENTS.md` (regras gerais), `.agents/skills/`, `docs/ai-setup/` ou `scripts/ai-sync.mjs` e `scripts/ai-hooks/`, siga a seção "Manter o kit atualizado" do `docs/ai-setup/kit/GUIA.md`.
4. No relato do push, diga em uma linha o que mudou no README e no kit, ou que já estavam em dia.

## Branches e pull request

<<Descreva o fluxo do projeto. Exemplo com uma branch principal:>>

1. **Comece da `<<branch-base>>` atualizada:** `git fetch origin` e `git switch -c tipo/descricao-curta origin/<<branch-base>>`.
2. **Commits na branch da tarefa.** Nunca direto na `<<branch-base>>`.
3. **Push, a pedido do autor:** `git push -u origin <branch>` e abra o PR contra a `<<branch-base>>`.
4. **Merge, só a pedido do autor.**

## Exemplos

```
feat(api): adiciona filtro por data na listagem de pedidos
```

```
fix(web): corrige foco perdido ao fechar o modal

O foco ficava no fundo da página. Agora volta ao botão que abriu o modal.
```
