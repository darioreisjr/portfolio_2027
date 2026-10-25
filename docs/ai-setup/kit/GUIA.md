# Kit de agentes de código

Um setup de agentes que funciona igual em **Claude Code, Codex CLI, Gemini CLI e Antigravity CLI**, para levar a qualquer projeto: instruções, skills, subagentes, servidores MCP, hooks de agente e hooks do Git, com uma fonte de verdade para cada coisa.

- **Versão:** 1.0.0 (2026-10-25)
- **Mantido em:** `docs/ai-setup/kit/` do repositório do portfólio 2027. Esta pasta é a cópia mestra: melhorias nascem aqui e depois vão para os outros projetos.
- **Modelos para copiar:** [`modelos/`](modelos/). Tudo marcado com `<<...>>` é lacuna para preencher.
- **Quer só usar?** Comece pelo [COMO-USAR.md](COMO-USAR.md): onde pegar o kit, como instalar e pedidos prontos para colar no agente.

## Histórico

Cada mudança no kit ganha uma linha aqui. A versão segue a ideia do SemVer: **maior** quando um projeto que já usa o kit precisa mudar arquivos à mão para atualizar, **menor** para peça nova opcional, **remendo** para correção ou texto.

| Versão | Data       | O que mudou                                                                                                                                                                                                                                         |
| ------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0  | 2026-10-25 | Primeira versão, extraída do setup do portfólio 2027. Acrescenta Antigravity CLI, hooks de agente como fonte (`hooks.json`), extras por ferramenta (`settings.json`), hook `pre-commit`, o revisor `code-reviewer` e o guia prático `COMO-USAR.md`. |

## Sumário

1. [Como funciona](#1-como-funciona)
2. [Questionário: decida antes de instalar](#2-questionário-decida-antes-de-instalar)
3. [Instalação passo a passo](#3-instalação-passo-a-passo)
4. [As peças](#4-as-peças)
5. [Acrescentar coisas novas](#5-acrescentar-coisas-novas)
6. [Compatibilidade entre as ferramentas](#6-compatibilidade-entre-as-ferramentas)
7. [Manter o kit atualizado](#7-manter-o-kit-atualizado)
8. [Atualizar um projeto que já usa o kit](#8-atualizar-um-projeto-que-já-usa-o-kit)
9. [Problemas comuns](#9-problemas-comuns)
10. [Ideias para versões futuras](#10-ideias-para-versões-futuras)

## 1. Como funciona

Cada ferramenta de IA espera os arquivos num lugar e num formato diferentes. Em vez de manter quatro cópias, o kit mantém **uma fonte** de cada coisa e um script, `scripts/ai-sync.mjs`, gera o resto. Ninguém edita o que é gerado: um hook de agente recusa a edição e o `pre-commit` recusa o commit fora de sincronia.

```
  FONTES (você edita)                    GERADOS (ninguém edita)
  ─────────────────────                  ──────────────────────────────────────────────
  AGENTS.md ───────────────────────────► lido direto por Codex e Antigravity
    └ importado por CLAUDE.md e GEMINI.md  (+ CLAUDE.md/GEMINI.md em subpastas)
  .agents/skills/<nome>/SKILL.md ──────► .claude/skills/   (os outros leem a fonte)
  docs/ai-setup/agents.md ─────────────► .claude/agents/  .codex/agents/
                                         .gemini/agents/  .agents/agents/
  docs/ai-setup/mcp.json ──────────────► .mcp.json  .codex/config.toml
                                         .gemini/settings.json  .agents/mcp_config.json
  docs/ai-setup/hooks.json ────────────► .claude/settings.json  .codex/hooks.json
                                         .gemini/settings.json  .agents/hooks.json
  docs/ai-setup/settings.json ─────────► extras em .claude/settings.json e .gemini/settings.json
```

Por cima disso, o kit traz um **fluxo de trabalho**: explorar, planejar, aprovação humana, implementar, revisar. Cada etapa tem um subagente com o mínimo de permissão que precisa.

| Etapa       | Subagente                                                                                            | Pode                          |
| ----------- | ---------------------------------------------------------------------------------------------------- | ----------------------------- |
| Explorar    | `discovery-analyst`                                                                                  | Só ler                        |
| Planejar    | `architect`                                                                                          | Ler e pesquisar na web        |
| Aprovar     | Você                                                                                                 |                               |
| Implementar | `implementer`                                                                                        | Ler, escrever, rodar comandos |
| Revisar     | `code-reviewer`, `security-reviewer`; com interface, `a11y-perf-reviewer` e `design-system-guardian` | Só ler                        |

## 2. Questionário: decida antes de instalar

Responda antes de copiar qualquer arquivo. Dá para pedir ao agente: _"Leia o GUIA.md do kit e me entreviste com estas perguntas, com uma opção recomendada em cada uma."_ As respostas viram o conteúdo das lacunas `<<...>>`.

### Ferramentas e idioma

1. **Quais ferramentas vão usar o projeto?** Claude Code, Codex, Gemini, Antigravity. Vira `CONFIG.targets` no `ai-sync.mjs`. Recomendado: só as que você abre de verdade; cada uma a mais é mais uma coisa para validar.
2. **Qual é a principal e qual o papel das outras?** Ex.: Claude implementa; Codex e Antigravity revisam e dão segunda opinião.
3. **Em que idioma ficam instruções, skills e commits?** O kit está em pt-BR.

### Projeto

4. **O que é o projeto, para quem, e o que está fora do escopo?** Seção "Visão" do `AGENTS.md`.
5. **É monorepo?** Se sim, quais pastas terão `AGENTS.md` próprio? Vira `CONFIG.nestedAgentsDirs`.
6. **Quais documentos o agente precisa ler antes de qualquer tarefa?** Seção "Leia antes" do `AGENTS.md` e tabela da skill `project-context`.
7. **Quais são as regras de fronteira?** Regras que nunca podem ser quebradas e que dá para verificar lendo o código.
8. **Quais comandos instalam, rodam, testam, fazem lint e formatam?**
9. **Tem interface?** Se não, apague `a11y-perf-reviewer`, `design-system-guardian`, o servidor `playwright` e a seção "Interface" do `pr-checklist`.

### Fluxo

10. **Usa o fluxo com aprovação humana?** Recomendado: sim. Em projeto pequeno, dá para pular o `discovery-analyst` e pedir o plano direto.
11. **Usa ADRs?** Se não, apague a skill `write-adr` e as menções a ADR.
12. **Usa issues?** Toda tarefa tem uma? O PR cita `Closes #n`?

### Git e publicação

13. **Quais branches existem e quais são protegidas?** Uma principal, ou principal + integração (ex.: `production` e `development`)?
14. **Para onde vai o PR e quem faz merge?** Recomendado: push, merge e publicação só a pedido do autor.
15. **Qual o idioma e os escopos dos commits?** O tipo do commit decide a versão (se houver release automática)?

### Ferramentas externas e automação

16. **Quais servidores MCP?** O kit traz Context7 (documentação), GitHub e Playwright (navegador). Regra: só o necessário, segredo só por variável de ambiente.
17. **Qual o formatador do projeto?** Vira o `FORMATTER` do hook `format-edited.mjs`. Sem formatador, apague o hook `formatar-editados` do `hooks.json`.
18. **Quais hooks do Git?** O kit traz `pre-commit` (sincronia) e `commit-msg` (commitlint). Exigem Node e Husky (ou outro gerenciador de hooks).
19. **O CI vai rodar `node scripts/ai-sync.mjs --check`?** Recomendado: sim.

### Segurança

20. **Onde está o risco do projeto?** Backend, login, formulário, dados pessoais, nada disso? Vira o começo da skill `seguranca`.
21. **Quais arquivos o agente nunca pode ler?** Vira `permissions.deny` no `settings.json` (o kit já nega `.env`).

## 3. Instalação passo a passo

Pré-requisitos: Git e Node 20 ou mais novo. O resto é opcional.

1. **Copie os modelos.** Todo o conteúdo de `modelos/`, inclusive as pastas que começam com ponto (`.agents`, `.husky`), para a raiz do projeto novo. Não sobrescreva arquivos que já existam sem comparar.

   ```bash
   cp -rn caminho/do/kit/modelos/. .
   ```

2. **Preencha as lacunas.** Procure por `<<` e troque cada uma pelas respostas do questionário. Apague o que não se aplica (subagentes de interface, `write-adr`, servidores MCP). Ao fim, nenhuma lacuna pode sobrar:

   ```bash
   grep -rn "<<" AGENTS.md CLAUDE.md GEMINI.md .agents docs/ai-setup scripts
   ```

3. **Ajuste o topo do `scripts/ai-sync.mjs`:** `targets` e `nestedAgentsDirs`. Desligou o Claude ou o Gemini? Apague `CLAUDE.md` ou `GEMINI.md` da raiz.

4. **Ajuste o `FORMATTER`** em `scripts/ai-hooks/format-edited.mjs`.

5. **Gere e confira:**

   ```bash
   node scripts/ai-sync.mjs
   node scripts/ai-sync.mjs --check
   ```

6. **Hooks do Git** (com npm; troque por pnpm ou yarn se for o caso):

   ```bash
   npm install -D husky @commitlint/cli @commitlint/config-conventional
   npx husky init        # cria .husky/ e o script "prepare"
   ```

   O `husky init` escreve um `.husky/pre-commit` próprio: troque o conteúdo pelo do kit. Com pnpm, troque `npx --no --` por `pnpm exec` no `commit-msg`. Projeto sem `"type": "module"` no `package.json`: renomeie `commitlint.config.js` para `.mjs`.

7. **Atalhos no `package.json`** (opcional): `"ai:sync": "node scripts/ai-sync.mjs"` e `"ai:check": "node scripts/ai-sync.mjs --check"`.

8. **CI:** um passo que rode `node scripts/ai-sync.mjs --check` em todo pull request.

9. **Ignore os gerados no formatador** (no `.prettierignore` ou equivalente): `.claude/skills/`, `.claude/agents/`, `.codex/`, `.gemini/`, `.agents/agents/`, `.mcp.json`. Senão o formatador muda o arquivo e o `--check` acusa diferença.

10. **Segredos.** Copie `.env.example` para `.env`, preencha, e confira que `.env` está no `.gitignore`. Claude Code e Codex não leem o `.env`: as variáveis precisam estar no ambiente do terminal. No Windows (PowerShell, na raiz do projeto):

    ```powershell
    Get-Content .env | Where-Object { $_ -match '^([A-Z0-9_]+)=(.+)$' } | ForEach-Object { [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'User') }
    ```

    No macOS e no Linux, `export NOME=valor` no `~/.zshrc` ou `~/.bashrc`. Reabra o terminal depois.

11. **Confie no projeto em cada ferramenta.** Abra cada uma na raiz e aceite. Sem isso, Codex, Gemini e Antigravity ignoram a configuração do repositório. Aprove os servidores MCP e os hooks quando pedirem (o Codex pede de novo sempre que um hook muda).

12. **Valide.** Numa sessão nova de cada ferramenta, confira que aparecem as instruções, as skills, os subagentes, os hooks e os servidores MCP (comandos na tabela do `docs/ai-setup/README.md`). Teste o hook pedindo ao agente para editar `.mcp.json`: ele deve ser recusado. Anote o que funcionou e o que não funcionou: se algo do kit estiver errado, corrija na cópia mestra (seção 7).

13. **Commit:** `chore: adiciona setup de agentes de código (kit 1.0.0)`, com fontes e gerados juntos.

## 4. As peças

### Instruções (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`)

- `AGENTS.md` é o único lugar com as regras do projeto. Menos de 200 linhas (o script cobra); o detalhe vai para skills e documentos.
- `CLAUDE.md` e `GEMINI.md` da raiz importam o `AGENTS.md` (`@AGENTS.md` e `@./AGENTS.md`) e só acrescentam o que é exclusivo da ferramenta.
- Em monorepo, cada pasta pode ter seu `AGENTS.md`; o script cria ao lado os adaptadores `CLAUDE.md` e `GEMINI.md`, porque com `CLAUDE.md` na raiz o Claude Code ignora `AGENTS.md` aninhado.
- Seções do modelo: Visão, Leia antes, Estrutura, Comandos, Regras de fronteira, Fluxo de trabalho, Branches, Definição de pronto, Nunca, Setup dos agentes.

### Skills (`.agents/skills/<nome>/SKILL.md`)

Instruções que o agente carrega só quando a tarefa pede. Frontmatter só com `name` (igual ao nome da pasta) e `description` (o que faz **e quando usar**; é por ela que a ferramenta decide carregar).

| Skill do kit      | Para quê                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| `project-context` | Ler os documentos certos antes de qualquer tarefa                         |
| `commits`         | Conventional Commits sem coautor, branches, push e revisões antes do push |
| `pr-checklist`    | Lista antes de abrir ou aprovar um PR                                     |
| `write-adr`       | Registrar decisões de arquitetura                                         |
| `seguranca`       | Triar alertas e escrever código que não os gere                           |

Skills de convenção por tecnologia (ex.: `react-app`, `api-node`) são criadas por projeto e citadas no `AGENTS.md` da pasta correspondente.

### Subagentes (`docs/ai-setup/agents.md`)

Um arquivo com todos. Cada seção `## nome` tem um bloco `json` com `description` e `profile`, seguido do prompt. Os perfis de permissão ficam no topo, com a lista de ferramentas de cada CLI:

| Perfil      | Pode                           | Codex             |
| ----------- | ------------------------------ | ----------------- |
| `read-only` | Ler e buscar                   | `read-only`       |
| `read-web`  | Ler, buscar e pesquisar na web | `read-only`       |
| `write`     | Ler, editar, rodar comandos    | `workspace-write` |

O Codex não tem lista de ferramentas por agente, só o `sandbox_mode`.

### Servidores MCP (`docs/ai-setup/mcp.json`)

Cada servidor tem `purpose`, `transport` (`http` ou `stdio`) e, se precisar de token, `bearerEnv` com o **nome** da variável de ambiente. O script escreve a referência à variável no formato de cada ferramenta; o valor nunca entra no repositório.

O Antigravity não documenta expansão de variável no `mcp_config.json`. Por isso, servidor com segredo fica fora do arquivo do projeto e o script avisa: configure esses no arquivo global, `~/.gemini/config/mcp_config.json`.

Fixe a versão exata de servidor `stdio` (`@playwright/mcp@0.0.83`, nunca `@latest`).

### Hooks de agente (`docs/ai-setup/hooks.json`)

Comandos que a ferramenta roda sozinha antes ou depois de editar um arquivo. Cada hook do kit é um script Node em `scripts/ai-hooks/`, e `lib.mjs` traduz a entrada das quatro ferramentas para o mesmo formato:

| Hook                | Quando           | O que faz                                               |
| ------------------- | ---------------- | ------------------------------------------------------- |
| `bloquear-gerados`  | Antes de editar  | Recusa edição em arquivo gerado e diz qual fonte editar |
| `formatar-editados` | Depois de editar | Roda o formatador no arquivo alterado; nunca bloqueia   |

Campos: `purpose`, `when` (`before-edit` ou `after-edit`), `script` e `timeoutSeconds`.

### Extras por ferramenta (`docs/ai-setup/settings.json`)

O que só uma ferramenta entende e vai no `settings.json` dela: `claude` (ex.: `permissions.deny` para nunca ler `.env`) e `gemini`. O script mescla com MCP e hooks.

### Hooks do Git (`.husky/`)

- `pre-commit`: `node scripts/ai-sync.mjs --check`. Nada fora de sincronia entra no histórico.
- `commit-msg`: `commitlint`, com a regra `sem-coautor`, que recusa `Co-Authored-By`, "Generated with" e 🤖.

## 5. Acrescentar coisas novas

Regra geral: **mudou algo em uma ferramenta só? Está no lugar errado.** Volte à fonte, rode `node scripts/ai-sync.mjs` e abra uma sessão nova (agentes e skills criados durante a sessão só aparecem depois).

| Quero acrescentar            | Onde                                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Regra para todos os agentes  | `AGENTS.md` (se for longa, uma skill citada no `AGENTS.md`)                                                                               |
| Regra só para uma ferramenta | `CLAUDE.md` ou `GEMINI.md` da raiz, ou `settings.json`                                                                                    |
| Skill                        | `.agents/skills/<nome>/SKILL.md`, `name` igual à pasta                                                                                    |
| Subagente                    | Seção `## nome` em `docs/ai-setup/agents.md`, com o perfil de menor permissão que serve                                                   |
| Perfil de permissão novo     | Bloco de perfis em `agents.md`, com a lista das quatro ferramentas                                                                        |
| Servidor MCP                 | `docs/ai-setup/mcp.json`; variável nova em `.env.example`, sem valor                                                                      |
| Hook antes/depois de editar  | Script em `scripts/ai-hooks/` usando `readEvent` e `block` de `lib.mjs`; entrada em `hooks.json`                                          |
| Hook em outro evento         | Acrescente o evento em `HOOK_EVENTS` e o filtro em `EDIT_TOOLS` no `ai-sync.mjs`, conferindo na documentação de cada ferramenta (seção 6) |
| Ferramenta nova (quinta CLI) | Um bloco novo em `plan()`, uma chave em `MANAGED_DIRS`, `EDIT_TOOLS` e `HOOK_EVENTS`, uma lista nos perfis, e uma coluna na seção 6       |

Mudou algo que serve para qualquer projeto? Leve para a cópia mestra (seção 7).

## 6. Compatibilidade entre as ferramentas

Conferido na documentação oficial em 2026-10-25. **Não verificado** quer dizer que a documentação não confirma e falta testar numa sessão real.

| Recurso                 | Claude Code                               | Codex CLI                                   | Gemini CLI                                | Antigravity CLI                                        |
| ----------------------- | ----------------------------------------- | ------------------------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| Instruções              | `CLAUDE.md` (importa `AGENTS.md`)         | `AGENTS.md`, nativo, inclusive aninhado     | `GEMINI.md` (importa `AGENTS.md`)         | `AGENTS.md` e `GEMINI.md`, nativos                     |
| Skills                  | `.claude/skills/` (cópia gerada)          | `.agents/skills/`                           | `.agents/skills/`                         | `.agents/skills/`                                      |
| Subagentes              | `.claude/agents/*.md`                     | `.codex/agents/*.toml`                      | `.gemini/agents/*.md`                     | `.agents/agents/*.md`                                  |
| Restringir ferramentas  | `tools`                                   | só `sandbox_mode`                           | `tools`                                   | `tools` (nomes não verificados)                        |
| MCP do projeto          | `.mcp.json`                               | `.codex/config.toml`                        | `.gemini/settings.json`                   | `.agents/mcp_config.json`                              |
| Segredo no MCP          | `${VAR}`                                  | `bearer_token_env_var`                      | `$VAR`                                    | Não documentado: use o arquivo global                  |
| Hooks                   | `.claude/settings.json`                   | `.codex/hooks.json`                         | `.gemini/settings.json`                   | `.agents/hooks.json`                                   |
| Eventos de edição       | `PreToolUse` / `PostToolUse`              | `PreToolUse` / `PostToolUse`                | `BeforeTool` / `AfterTool`                | `PreToolUse` / `PostToolUse`                           |
| Ferramentas de edição   | `Edit`, `Write`, `NotebookEdit`           | `apply_patch` (casa também `Edit`, `Write`) | `write_file`, `replace`                   | `write_to_file`, `replace_file_content`, … (verificar) |
| Como o hook bloqueia    | Sai com código 2; motivo na saída de erro | Sai com código 2; motivo na saída de erro   | Sai com código 2; motivo na saída de erro | JSON `{"decision":"deny","reason":…}` na saída padrão  |
| Raiz do projeto no hook | `$CLAUDE_PROJECT_DIR`                     | `git rev-parse --show-toplevel`             | `$GEMINI_PROJECT_DIR`                     | Não documentada; o kit usa caminho relativo            |
| Exige confiar na pasta  | Aprova MCP e hooks                        | Sim (tudo de `.codex/`); hooks em `/hooks`  | Sim                                       | Sim                                                    |

Pontos de atenção:

- **Gemini CLI foi substituído pelo Antigravity CLI** em 18/06/2026 para contas individuais. Mantenha `gemini` em `targets` só se ainda usa (conta paga ou empresarial).
- **Antigravity lê `GEMINI.md` e `AGENTS.md`.** Com as duas ferramentas ligadas, o `GEMINI.md` importa o `AGENTS.md` e o conteúdo pode aparecer duas vezes no Antigravity (não verificado). Usando só o Antigravity, desligue `gemini` e apague o `GEMINI.md`.
- **Nomes de ferramenta do Antigravity** divergem entre a documentação do SDK (`create_file`, `edit_file`, `search_directory`) e a de hooks (`write_to_file`, `replace_file_content`). O kit usa os do SDK nos perfis e os dois nos hooks. Confira no `/agents` e no `/hooks` da primeira sessão; nome errado pode travar o subagente.
- **Codex no Windows:** o comando do hook usa `$(git rev-parse --show-toplevel)`; não verificado no PowerShell.
- **Gemini remove do ambiente dos servidores MCP** variáveis com nome sensível (TOKEN, KEY), salvo se declaradas no bloco `env` do servidor.

Documentação: [Claude Code](https://code.claude.com/docs/en/hooks) · [Codex](https://learn.chatgpt.com/docs/hooks) · [Gemini](https://geminicli.com/docs/hooks/reference) · [Antigravity: migração do Gemini](https://antigravity.google/docs/cli/gcli-migration/), [subagentes](https://antigravity.google/docs/subagents/), [hooks](https://antigravity.google/docs/hooks/), [MCP](https://antigravity.google/docs/mcp/), [skills](https://antigravity.google/docs/skills/), [ferramentas](https://antigravity.google/docs/sdk/tools/).

## 7. Manter o kit atualizado

A cópia mestra é esta pasta. Ela fica em dia por três mecanismos:

1. **Regra no `AGENTS.md`** (definição de pronto): mudou o setup de agentes, revise o kit.
2. **Passo na skill `commits`** (antes de todo push) e item no `pr-checklist`.
3. **Este histórico**, com versão, para saber o que levar a cada projeto.

### Quando revisar

Antes de todo push cujo diff tocou:

- `.agents/skills/` (skill genérica nova ou melhorada);
- `docs/ai-setup/` (subagentes, perfis, MCP, hooks, extras);
- `scripts/ai-sync.mjs` ou `scripts/ai-hooks/`;
- regras gerais do `AGENTS.md` (fluxo, "Nunca", definição de pronto);
- ou quando uma CLI mudou de versão e algo deixou de funcionar.

### Como revisar

1. Pergunte: **isto serve para qualquer projeto?** Se é específico deste repositório (nome de app, rota, domínio, pasta), não vai para o kit. Se é a forma genérica de algo específico, leve a forma genérica.
2. Atualize o arquivo correspondente em `modelos/` e, se mudou o que o guia descreve, este `GUIA.md`.
3. Teste numa pasta temporária: copie `modelos/`, rode `node scripts/ai-sync.mjs` e `--check`; se mexeu em hook, mande uma entrada de exemplo pela entrada padrão (`echo '{...}' | node scripts/ai-hooks/<hook>.mjs`).
4. Suba a versão e escreva a linha no histórico.
5. Mudou algo na tabela da seção 6? Atualize a data e os links.

### O que fica fora do kit

Nomes, rotas, domínios, tecnologias e decisões deste repositório; skills de convenção de um framework específico; conteúdo sobre pessoas.

## 8. Atualizar um projeto que já usa o kit

1. Veja no `docs/ai-setup/README.md` do projeto qual versão do kit ele usa.
2. Leia o histórico (acima) da versão dele até a atual.
3. Para cada linha: copie o arquivo de `modelos/` que mudou, **comparando antes** (o projeto pode ter personalizado). Scripts (`ai-sync.mjs`, `ai-hooks/`) normalmente se copiam inteiros, preservando o bloco `CONFIG` e o `FORMATTER`; skills e `agents.md` se mesclam à mão.
4. `node scripts/ai-sync.mjs`, `--check`, sessão nova em cada ferramenta.
5. Atualize a versão no `docs/ai-setup/README.md` do projeto e faça o commit: `chore: atualiza o kit de agentes para a versão X.Y.Z`.

Achou algo melhor no projeto? Traga de volta para a cópia mestra.

## 9. Problemas comuns

| Sintoma                                   | Causa provável e saída                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill ou subagente não aparece            | Sessão aberta antes do `ai-sync`: abra uma nova. Codex, Gemini e Antigravity: pasta não marcada como confiável.                                |
| Servidor MCP com erro de autenticação     | Variável fora do ambiente do terminal (só no `.env`). Defina e reabra o terminal.                                                              |
| `--check` acusa diferença logo após gerar | Formatador mexendo nos gerados: ignore-os no formatador (passo 9 da instalação). Ou final de linha: `.gitattributes` com `* text=auto eol=lf`. |
| Hook não roda                             | Hooks não aprovados (`/hooks`). No Codex, hook alterado precisa de nova aprovação.                                                             |
| Hook bloqueia tudo                        | Rode o hook à mão com a entrada de exemplo e veja a saída. Para desligar, tire a entrada do `hooks.json` e sincronize.                         |
| Commit recusado com "sem-coautor"         | A ferramenta pôs `Co-Authored-By`. Tire a linha; nunca use `--no-verify`.                                                                      |
| Subagente do Antigravity trava            | Nome de ferramenta errado no perfil. Confira os nomes em `/agents` e corrija o perfil em `agents.md`.                                          |

## 10. Ideias para versões futuras

- **Skill `setup-agentes`:** o agente instala o kit num projeto novo ou atualiza um antigo, fazendo o questionário da seção 2.
- **Checagem automática** no `--check`: avisar quando uma fonte do setup mudou e o kit não.
- **Hook de início de sessão** que carrega o contexto do projeto (`SessionStart` existe nas quatro ferramentas).
- **Hook que bloqueia comandos perigosos** (`git push --force`, `rm -rf`) antes de rodar.
- **Repositório próprio para o kit**, se ele passar a ser usado em muitos projetos.
