# <<NOME DO PROJETO>>: instruções para agentes

Fonte canônica de instruções para Claude Code, Codex CLI, Gemini CLI e Antigravity CLI. `CLAUDE.md` e `GEMINI.md` apenas importam este arquivo. Não duplique o conteúdo dele em outro lugar. Mantenha abaixo de 200 linhas: detalhe vai para skills e documentos.

## Visão

<<Duas a quatro frases: o que o projeto é, para quem, o que está fora do escopo. Quem trabalha nele (dev solo, time).>>

## Leia antes de qualquer tarefa

| Documento                | Para quê                        |
| ------------------------ | ------------------------------- |
| `README.md`              | O projeto para quem chega       |
| `docs/architecture/adr/` | Decisões de arquitetura aceitas |
| `docs/open-questions.md` | O que ainda não foi decidido    |
| <<outros documentos>>    | <<para quê>>                    |

Se um documento contradiz o código, pare e avise. Não escolha um dos dois em silêncio.

## Estrutura

```
<<árvore das pastas principais, uma linha de explicação por pasta>>
```

## Comandos

| Comando                                | O que faz                                    |
| -------------------------------------- | -------------------------------------------- |
| <<instalar>>                           | Instala dependências                         |
| <<rodar>>                              | Sobe o projeto em desenvolvimento            |
| <<lint / format>>                      | Lint e formatação                            |
| <<testes>>                             | Testes                                       |
| `node scripts/ai-sync.mjs` / `--check` | Gera ou confere as configurações dos agentes |

## Regras de fronteira

<<Regras numeradas que um agente nunca pode quebrar. Exemplos: "a camada X não importa da Y", "dados só entram por Z", "cor só por token". Cada regra é verificável lendo o código.>>

1. <<regra>>

## Fluxo de trabalho

Explorar, planejar, aprovação humana, implementar, revisar. Nenhuma ferramenta implementa sem plano aprovado.

1. **Explorar:** o `discovery-analyst` lê os documentos e o código e aponta lacunas.
2. **Planejar:** o `architect` entrega um plano em etapas pequenas, cada uma com o comando que prova que funcionou. Não edita código.
3. **Aprovação humana:** o autor aprova o plano. Sem aprovação explícita, pare.
4. **Implementar:** o `implementer` executa só o plano aprovado. Mudança de escopo volta ao passo 2.
5. **Revisar:** `code-reviewer`; `security-reviewer` se a mudança mexe em entrada de usuário, autenticação, workflows ou dependências<<; `a11y-perf-reviewer` e `design-system-guardian` se houver interface>>.

Pare e pergunte quando: nenhuma decisão aceita cobre o caso, há item bloqueante em `docs/open-questions.md`, ou a tarefa pede conteúdo que não existe no repositório.

<<Ferramenta principal e papel das outras. Ex.: "Claude Code é a principal; Codex e Antigravity fazem revisão e segunda opinião, com as mesmas instruções.">>

## Branches e publicação

<<Branch padrão, branch de integração (se houver), como nomear branch de tarefa (`tipo/descricao-curta`), se toda tarefa tem issue, para onde vai o pull request e o que publica o quê. Detalhes na skill `commits`.>>

## Definição de pronto

- Plano aprovado seguido, sem escopo extra.
- Lint, formatação e testes passam.
- Regras de fronteira respeitadas.
- Decisão de arquitetura nova: ADR escrito (skill `write-adr`).
- Docs atualizados quando o comportamento descrito mudou.
- `README.md` revisado antes de todo push (skill `commits`).
- Setup dos agentes mudou: `docs/ai-setup/kit/` revisado (seção "Manter o kit atualizado" do `GUIA.md`).
- Commit no padrão Conventional Commits, <<idioma>> e sem coautor (skill `commits`).

## Nunca

- Inventar conteúdo sobre pessoas, clientes, resultados ou números.
- Instalar dependência sem justificativa de uma linha no plano.
- Escrever segredo em arquivo versionado. Segredos só por variável de ambiente; nomes em `.env.example`.
- Editar à mão arquivos gerados: `.claude/skills/`, `.claude/agents/`, `.claude/settings.json`, `.codex/`, `.gemini/`, `.agents/agents/`, `.agents/hooks.json`, `.agents/mcp_config.json`, `.mcp.json` e os `CLAUDE.md` e `GEMINI.md` de subpastas.
- Pôr coautor ou assinatura de ferramenta de IA em commit (`Co-Authored-By`, "Generated with").
- Fazer push, merge de pull request ou publicação sem o autor pedir.
- Usar `--no-verify` para pular hooks do Git.

## Setup dos agentes

| O quê      | Fonte (edite aqui)               | Gerado por `scripts/ai-sync.mjs`                                                            |
| ---------- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| Instruções | `AGENTS.md`                      | `CLAUDE.md` e `GEMINI.md` de subpastas                                                      |
| Skills     | `.agents/skills/<nome>/SKILL.md` | `.claude/skills/`                                                                           |
| Subagentes | `docs/ai-setup/agents.md`        | `.claude/agents/`, `.codex/agents/`, `.gemini/agents/`, `.agents/agents/`                   |
| MCP        | `docs/ai-setup/mcp.json`         | `.mcp.json`, `.codex/config.toml`, `.gemini/settings.json`, `.agents/mcp_config.json`       |
| Hooks      | `docs/ai-setup/hooks.json`       | `.claude/settings.json`, `.codex/hooks.json`, `.gemini/settings.json`, `.agents/hooks.json` |
| Extras     | `docs/ai-setup/settings.json`    | `.claude/settings.json`, `.gemini/settings.json`                                            |

Depois de editar uma fonte, rode `node scripts/ai-sync.mjs` e abra uma sessão nova. Detalhes em `docs/ai-setup/README.md`.
