# Validação do setup dos agentes

Feita em 2026-10-06, na máquina do autor (Windows 11). Só comandos não interativos foram rodados; o que depende de abrir a ferramenta e aprovar algo está marcado como **não verificado**, com o passo que falta.

## Resumo

| Item                          | Claude Code 2.1.177                      | Codex CLI 0.160.1                       | Gemini CLI 0.63.0                            |
| ----------------------------- | ---------------------------------------- | --------------------------------------- | -------------------------------------------- |
| Instruções carregadas         | Não verificado                           | Não verificado                          | Não verificado                               |
| Skills do projeto             | **Verificado**: as 11 aparecem na sessão | Não verificado                          | **Não carregam**: pasta não confiável        |
| Subagentes do projeto         | **Verificado**: os 6 aparecem na sessão  | Não verificado                          | **Não carregam**: pasta não confiável        |
| Servidores MCP do projeto     | Detectados, aguardando aprovação         | **Não carregam**: projeto não confiável | Detectados, desativados: pasta não confiável |
| Arquivos gerados em sincronia | **Verificado** (`pnpm ai:check`)         | **Verificado** (`pnpm ai:check`)        | **Verificado** (`pnpm ai:check`)             |

Nenhuma das três ferramentas foi marcada como confiável por mim: confiar em uma pasta libera execução de configuração do repositório, e essa decisão é do autor.

## Claude Code

### Skills e subagentes

Verificado dentro da sessão do Claude Code (extensão do VS Code) que fez o bootstrap. Depois de criados os arquivos, a sessão passou a listar:

- Skills: `angular-mfe`, `content-schema`, `cross-mfe-contract`, `new-ds-component`, `next-zone`, `pr-checklist`, `project-context`, `react-mfe`, `vanilla-shell`, `vue-mfe`, `write-adr`.
- Subagentes, com as ferramentas restritas: `a11y-perf-reviewer`, `design-system-guardian`, `discovery-analyst` e `integration-reviewer` (Read, Grep, Glob); `architect` (mais WebFetch e WebSearch); `implementer` (mais Edit, Write, Bash).

Os subagentes só apareceram em uma mensagem posterior à criação dos arquivos; na primeira tentativa de uso a sessão ainda não os conhecia.

### MCP

```
$ claude mcp list
context7: https://mcp.context7.com/mcp (HTTP) - ⏸ Pending approval (run `claude` to approve)
playwright: npx @playwright/mcp@latest - ⏸ Pending approval (run `claude` to approve)
github: https://api.githubcopilot.com/mcp/ (HTTP) - ⏸ Pending approval (run `claude` to approve)

[Contains warnings] Project config (shared via .mcp.json)
Location: E:\Testes\novo-portfolio-2027\.mcp.json
 ├ [Warning] [context7] mcpServers.context7: Missing environment variables: CONTEXT7_API_KEY
```

Os três servidores do `.mcp.json` foram lidos. Falta aprovar e falta a variável `CONTEXT7_API_KEY` no ambiente do terminal (ela está só no `.env`).

### Não verificado

- Instruções carregadas (`/context`): a sessão começou antes de existirem `CLAUDE.md` e `AGENTS.md`.
- Conexão real dos três servidores MCP.

Para concluir: definir as variáveis no ambiente, abrir uma sessão nova, aprovar os servidores e rodar `/context`, `/skills`, `/agents` e `/mcp`.

## Codex CLI

```
$ codex login status
Logged in using ChatGPT

$ codex mcp list
No MCP servers configured yet. Try `codex mcp add my-tool -- my-command`.
```

O Codex não leu `.codex/config.toml`. A documentação diz que a configuração de projeto só carrega em projeto confiável, e este ainda não foi marcado.

### Não verificado

- Instruções (`AGENTS.md`), skills (`.agents/skills/`) e agentes (`.codex/agents/`).
- Se a versão 0.160.1 aceita todos os campos gerados em `.codex/agents/*.toml` e `.codex/config.toml`.

Para concluir: abrir `codex` na raiz, aceitar confiar no projeto e rodar `/skills`, `/agent`, `/mcp` e `codex --ask-for-approval never "Summarize the current instructions."`.

## Gemini CLI

```
$ gemini mcp list
Warning: MCP servers are configured but disabled because this folder is untrusted.
User-level servers are also suppressed in untrusted folders to prevent accidental side-effects.

Configured MCP servers:

○ context7: https://mcp.context7.com/mcp (http) - Disabled
○ playwright: npx @playwright/mcp@latest (stdio) - Disabled
○ github: https://api.githubcopilot.com/mcp/ (http) - Disabled

$ gemini skills list --all
Skipping project agents due to untrusted folder. To enable, ensure that the project root is trusted.
Discovered Agent Skills:
find-skills [Enabled]            (do usuário, em ~/.agents/skills)
antigravity-support [Enabled] [Built-in]
skill-creator [Enabled] [Built-in]
```

O Gemini leu `.gemini/settings.json` (os três servidores aparecem), mas desativou servidores, skills e agentes do projeto porque a pasta não é confiável. Nenhuma das 11 skills do projeto foi listada.

### Não verificado

- Login no Gemini CLI.
- Instruções (`/memory show`), skills e agentes do projeto depois de confiar na pasta.
- Se `Authorization: Bearer $VAR` em `headers` é expandido (ver seção 9 de `capability-matrix.md`).
- Se nomes de agente com hífen são aceitos.

Para concluir: abrir `gemini` na raiz, fazer login, confiar na pasta e rodar `/memory show`, `/skills list`, `/agents` e `/mcp`.

## Sincronização

```
$ pnpm ai:check
Em sincronia: 52 arquivos.
```

Testado também o caso negativo: com um arquivo gerado alterado à mão e um arquivo sem fonte, o `--check` saiu com código 1 e apontou os dois.
