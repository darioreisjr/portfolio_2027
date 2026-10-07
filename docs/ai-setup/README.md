# Agentes de código neste repositório

Três ferramentas leem as mesmas instruções: Claude Code (principal), Codex CLI e Gemini CLI (revisão e segunda opinião). Há uma fonte de verdade para cada coisa; o resto é gerado.

## Fontes e gerados

| O quê      | Edite aqui                                | Gerado por `pnpm ai:sync`                                             |
| ---------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Instruções | `AGENTS.md` (raiz, cada app, cada pacote) | `CLAUDE.md` e `GEMINI.md` ao lado de cada `AGENTS.md` de app e pacote |
| Skills     | `.agents/skills/<nome>/SKILL.md`          | `.claude/skills/`                                                     |
| Subagentes | `docs/ai-setup/agents.md`                 | `.claude/agents/`, `.codex/agents/`, `.gemini/agents/`                |
| MCP        | `docs/ai-setup/mcp.json`                  | `.mcp.json`, `.codex/config.toml`, `.gemini/settings.json`            |

`CLAUDE.md` e `GEMINI.md` da raiz são escritos à mão: importam `AGENTS.md` e acrescentam só o que é específico da ferramenta.

Depois de editar qualquer fonte: `pnpm ai:sync`. O CI roda `pnpm ai:check` e falha se algo estiver fora de sincronia. Nunca edite um arquivo gerado.

Por que cada coisa é assim está em `capability-matrix.md`. O que foi de fato verificado está em `validation.md`.

## Antes do primeiro uso

1. Copie `.env.example` para `.env` e preencha a chave do Context7 e o token do GitHub.
2. Claude Code e Codex não leem o `.env`: defina as mesmas variáveis no ambiente do seu usuário e reabra o terminal. No PowerShell, na raiz do projeto:

   ```powershell
   Get-Content .env | Where-Object { $_ -match '^([A-Z0-9_]+)=(.+)$' } | ForEach-Object { [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'User') }
   ```

3. Abra cada ferramenta na raiz e aceite confiar no projeto. Sem isso, Codex e Gemini ignoram a configuração do repositório.

O token do GitHub é fine-grained, restrito a este repositório, com Contents, Issues e Pull requests em leitura e escrita e Actions em leitura.

## Como usar cada ferramenta

| Tarefa                    | Claude Code                     | Codex CLI                                                              | Gemini CLI                  |
| ------------------------- | ------------------------------- | ---------------------------------------------------------------------- | --------------------------- |
| Abrir                     | `claude` na raiz, ou a extensão | `codex` na raiz                                                        | `gemini` na raiz            |
| Ver instruções carregadas | `/context`                      | `codex --ask-for-approval never "Summarize the current instructions."` | `/memory show`              |
| Listar skills             | `/skills`                       | `/skills`                                                              | `/skills list`              |
| Usar uma skill            | `/nome-da-skill`                | `$nome-da-skill`                                                       | Automático, com confirmação |
| Listar subagentes         | `/agents`                       | `/agent`                                                               | `/agents`                   |
| Chamar um subagente       | Peça pelo nome                  | Peça pelo nome                                                         | `@nome tarefa`              |
| Listar MCP                | `/mcp`, `claude mcp list`       | `/mcp`, `codex mcp list`                                               | `/mcp`, `gemini mcp list`   |

Agentes criados durante uma sessão só aparecem depois; abra uma sessão nova após rodar `pnpm ai:sync`.

## Fluxo de trabalho

Explorar, planejar, aprovação humana, implementar, revisar. Está descrito no `AGENTS.md` da raiz e vale para as três ferramentas.

1. `discovery-analyst` lê `docs/` e o código e aponta lacunas.
2. `architect` entrega o plano, com comando de verificação por etapa.
3. O autor aprova. Sem aprovação, nada é implementado.
4. `implementer` executa o plano aprovado.
5. `integration-reviewer`, `a11y-perf-reviewer` e, com interface, `design-system-guardian` revisam.

Planos aprovados ficam em `docs/plans/`.

## Adicionar uma skill

1. Crie `.agents/skills/<nome>/SKILL.md`. O `name` do frontmatter é igual ao nome da pasta.
2. Use só `name` e `description` no frontmatter; são os campos que as três ferramentas entendem. A descrição diz o que a skill faz e quando usar.
3. `pnpm ai:sync`.
4. Se a skill é de convenções de um app, cite-a no `AGENTS.md` desse app.

## Adicionar um subagente

1. Em `docs/ai-setup/agents.md`, crie uma seção `## nome-do-agente` com um bloco `json` contendo `description` e `profile`, seguido do prompt.
2. Escolha o perfil de menor permissão que serve: `read-only`, `read-web` ou `write`. Perfil novo entra na seção "Perfis de permissão", com as ferramentas de cada CLI.
3. `pnpm ai:sync` e abra uma sessão nova.

No Codex não há lista de ferramentas por agente: o perfil vira só `sandbox_mode`.

## Adicionar um servidor MCP

1. Confirme que ele cabe na regra do projeto: documentação de bibliotecas, navegador e GitHub. Nada de banco de dados.
2. Acrescente em `docs/ai-setup/mcp.json`, com `transport` (`http` ou `stdio`). Segredo só por variável de ambiente: use `bearerEnv` com o nome da variável.
3. Acrescente a variável em `.env.example`, sem valor.
4. `pnpm ai:sync` e aprove o servidor em cada ferramenta.

## Manter a paridade

- Mudou algo em uma ferramenta só? Então está no lugar errado. Volte para a fonte.
- Recurso que só uma ferramenta tem vai no `CLAUDE.md` ou no `GEMINI.md` da raiz, nunca no `AGENTS.md`.
- Ao atualizar uma das CLIs, releia a página correspondente da documentação e atualize `capability-matrix.md` e `validation.md`.
