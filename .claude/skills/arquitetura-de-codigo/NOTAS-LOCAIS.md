# Notas locais — arquitetura-de-codigo neste repositório

Ajustes de compatibilidade para usar a skill neste monorepo. O `SKILL.md` é o original do
repositório alura-cursos/skills-para-ia e não deve ser editado; o que muda está aqui.

## Relatório HTML

- A skill `geracao-de-tutorial` não está instalada. Use a rota (b): Tailwind + Mermaid via CDN
  para layout e grafos (call graphs, dependências), com SVG à mão para os diagramas de
  **massa** e **corte transversal**.
- O relatório vai para o diretório temporário do SO (`$TMPDIR`, `/tmp` ou `%TEMP%`), nunca para o
  repositório.

## Abrir o relatório

Detecte o SO antes de abrir:

- Linux: `xdg-open <arquivo>`
- macOS: `open <arquivo>`
- Windows: `start "" <arquivo>` (no cmd) ou `Start-Process <arquivo>` (no PowerShell); no Git
  Bash, `cmd //c start "" <arquivo>`.

Sem interface gráfica (CI, SSH, container), não tente abrir: informe só o caminho absoluto.

## Pastas e arquivos a IGNORAR na exploração

Genéricos:

- `node_modules/`, `dist/`, `build/`, `out/`, `.next/`, `coverage/`
- lockfiles: `pnpm-lock.yaml`
- arquivos gerados em geral: `*.tsbuildinfo`, `next-env.d.ts`

Específicos desta stack (pnpm + Turborepo + Next/Angular/Vite + Playwright + Vercel):

- `.turbo/` (raiz e em cada app/pacote): cache do Turborepo
- `.angular/` (`apps/mfe-angular`): cache do Angular CLI
- `apps/web-next/out/`: export estático do Next
- `api/dist/`: bundle gerado por `scripts/build-api.mjs`
- `dist/` na raiz: site montado por `scripts/assemble.mjs`
- `.vercel/`: configuração e saída local da Vercel
- `.lighthouseci/`: relatórios do Lighthouse CI
- `test-results/`, `playwright-report/`, `blob-report/`: saídas do Playwright
- `.vitest/` (ex.: `apps/mfe-react/.vitest`, `packages/design-system/.vitest`): anexos de falha
  do Vitest
- `storybook-static/`
- Espelhos gerados por `scripts/ai-sync.mjs`: `.claude/skills/`, `.claude/agents/`, `.codex/`,
  `.gemini/`, `.mcp.json`. A fonte real fica em `.agents/skills/` e `docs/ai-setup/agents.md`.
- `docs/ai-setup/kit/`: kit portátil com cópias-modelo de scripts; não é código em execução
- `.husky/`, `.github/`: automação de repositório, fora do escopo de módulos
