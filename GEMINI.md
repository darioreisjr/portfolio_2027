@./AGENTS.md

# Específico do Gemini CLI

- Papel aqui: revisão e segunda opinião. A implementação principal é feita no Claude Code.
- Skills são lidas de `.agents/skills/`. Subagentes ficam em `.gemini/agents/` (gerado).
- Servidores MCP vêm de `.gemini/settings.json` (gerado). O Gemini carrega o arquivo `.env` da raiz sozinho.
- Não configure `context.fileName` com `AGENTS.md`: este arquivo já o importa, e as duas coisas juntas duplicariam as instruções.
- Confira o que foi carregado com `/memory show`, `/skills list`, `/agents` e `/mcp`.
