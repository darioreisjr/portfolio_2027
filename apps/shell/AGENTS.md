# apps/shell (JavaScript puro)

Casca das áreas de MFE: gera o documento HTML de cada rota e idioma, mostra cabeçalho e rodapé, carrega o script da área e insere o custom element.

## Convenções

- Sem framework e sem biblioteca de interface. TypeScript estrito, APIs do navegador.
- Manifesto `rota -> { script, tag }` montado a partir da tabela de rotas de `packages/contracts`.
- Carrega o MFE com `import()` e cria a tag. Ao sair da área, remove o elemento; nunca reinsere o mesmo.
- Carrega o design system e os tokens uma vez por documento.
- Dono de: troca de tema, troca de idioma, foco e título ao trocar de área.
- Um HTML por rota e idioma, com `<title>`, descrição, `hreflang` e `canonical` próprios.
- Script inline no `<head>` aplica o tema antes da primeira pintura.
- Teto de JavaScript: ver `docs/quality/budgets.md`.

## Comandos

Definidos no bootstrap. Skill de convenções: `vanilla-shell`.
