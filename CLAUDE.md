@AGENTS.md

# Específico do Claude Code

- Skills ficam em `.claude/skills/` e subagentes em `.claude/agents/`. Os dois diretórios são gerados; edite as fontes indicadas no `AGENTS.md`.
- Servidores MCP vêm de `.mcp.json`. As variáveis de `.env.example` precisam estar definidas no ambiente do terminal antes de abrir a sessão.
- Para planejar, use o modo de plano e o subagente `architect`; para explorar, o `discovery-analyst`.
- Confira o que foi carregado com `/context`, `/skills`, `/agents` e `/mcp`.
