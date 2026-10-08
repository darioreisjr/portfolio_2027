# apps/shell (JavaScript puro)

Casca das áreas de MFE: gera o documento HTML de cada rota e idioma, mostra o palco da área, o seletor de tema e o grupo do canto, carrega o script da área e insere o custom element.

## Convenções

- Sem framework e sem biblioteca de interface: escrito em TypeScript estrito, entregue como JavaScript puro, só com APIs do navegador.
- `src/page.ts` gera o HTML; o build e o servidor de desenvolvimento usam a mesma função.
- Manifesto `rota -> { script, tag }` montado a partir da tabela de rotas de `packages/contracts`.
- Carrega o MFE com `import()` e cria a tag. Ao sair da área, remove o elemento; nunca reinsere o mesmo.
- Carrega o design system e os tokens uma vez por documento.
- O documento leva o script de tema de `packages/contracts` no `<head>`, antes das folhas de estilo, e o `<ds-theme-toggle>` no `<header class="shell-header">`, que só tem ele e fica no canto de cima, sobre o palco. A troca de tema é do design system (ADR 0005); o shell não tem código de tema.
- Dono de: foco e título ao trocar de área.
- Um HTML por rota e idioma, com `<title>`, descrição, `hreflang` e `canonical` próprios.
- Troca de idioma: o documento termina com `<footer class="ds-dock">`, com um `<details class="ds-language-switcher">`. O `<summary>` é a bandeira do idioma em uso; a lista, que abre para cima, tem os outros três como links comuns para a mesma área, vindos de `languageAlternates` de `packages/contracts`. O shell não tem código de troca (ADR 0006 e a emenda dele). O `main` reserva o espaço do grupo com `--ds-dock-reserve`.
- Cada área é um palco (ADR 0009): o `main.area-stage` leva `data-area`, o cenário decorativo, o `h1.area-title`, o personagem da área (`personaFigure` de `packages/contracts`, no HTML inicial), o `.area-outlet`, onde o MFE é montado, e o botão de volta para a home. A aparência vem de `/_ds/areas.css`, ligada por `<link>`; o `shell.css` só cuida do cabeçalho e da altura. O botão de pausa do cenário (`label.area-motion`) fica no grupo do canto, antes da bandeira. Detalhes em `docs/plans/areas-em-construcao.md`.
- As áreas não têm menu (decisão do autor em 2026-10-08): não há marca nem links para as outras áreas. Troca-se de área pelo botão de volta à escolha de perfil.
- Ainda não implementado: foco e título ao trocar de área, `hreflang` e `canonical`.
- Teto de JavaScript: ver `docs/quality/budgets.md`.

## Comandos

| Comando                         | O que faz                                                            |
| ------------------------------- | -------------------------------------------------------------------- |
| `pnpm dev` (na raiz)            | Este app é a origem do desenvolvimento composto, em `localhost:5173` |
| `pnpm --filter shell build`     | Gera `dist/_shell/` e um `index.html` por área e idioma              |
| `pnpm --filter shell test`      | Testes do documento gerado (Vitest)                                  |
| `pnpm --filter shell typecheck` | Checagem de tipos                                                    |

Skill de convenções: `vanilla-shell`.
