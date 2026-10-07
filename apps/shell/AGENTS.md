# apps/shell (JavaScript puro)

Casca das áreas de MFE: gera o documento HTML de cada rota e idioma, mostra cabeçalho e rodapé, carrega o script da área e insere o custom element.

## Convenções

- Sem framework e sem biblioteca de interface: escrito em TypeScript estrito, entregue como JavaScript puro, só com APIs do navegador.
- `src/page.ts` gera o HTML; o build e o servidor de desenvolvimento usam a mesma função.
- Manifesto `rota -> { script, tag }` montado a partir da tabela de rotas de `packages/contracts`.
- Carrega o MFE com `import()` e cria a tag. Ao sair da área, remove o elemento; nunca reinsere o mesmo.
- Carrega o design system e os tokens uma vez por documento.
- O documento leva o script de tema de `packages/contracts` no `<head>`, antes das folhas de estilo, e o `<ds-theme-toggle>` no fim do cabeçalho. A troca de tema é do design system (ADR 0005); o shell não tem código de tema.
- Dono de: troca de idioma, foco e título ao trocar de área.
- Um HTML por rota e idioma, com `<title>`, descrição, `hreflang` e `canonical` próprios.
- Ainda não implementado: troca de idioma, foco e título ao trocar de área, `hreflang` e `canonical`.
- Teto de JavaScript: ver `docs/quality/budgets.md`.

## Comandos

| Comando                         | O que faz                                                            |
| ------------------------------- | -------------------------------------------------------------------- |
| `pnpm dev` (na raiz)            | Este app é a origem do desenvolvimento composto, em `localhost:5173` |
| `pnpm --filter shell build`     | Gera `dist/_shell/` e um `index.html` por área e idioma              |
| `pnpm --filter shell test`      | Testes do documento gerado (Vitest)                                  |
| `pnpm --filter shell typecheck` | Checagem de tipos                                                    |

Skill de convenções: `vanilla-shell`.
