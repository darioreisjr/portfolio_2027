# packages/contracts

Tabela de rotas (área, idioma, caminho) e eventos tipados entre apps. É a única dependência que todos os apps compartilham.

## Convenções

- Sem dependência de framework, de `packages/content` ou de APIs que só existem no navegador fora das funções de evento. Texto de script exportado como string, como `THEME_INIT_SCRIPT`, é permitido: o pacote não o executa.
- `src/theme.ts` tem as constantes do tema (atributo, chave de armazenamento), o script inline e o evento `portfolio:tema-alterado`.
- `src/routes.ts` espelha a tabela de `docs/architecture/mfe-map.md`. Mude os dois juntos.
- `src/languages.ts` tem os nomes dos idiomas (cada um no próprio idioma), o caminho das bandeiras e `languageAlternates(area, idioma)`, de onde o shell e o Next.js tiram os links da troca de idioma (ADR 0006).
- `src/personas.ts` tem os perfis com personagem (`personaAreas`) e a tabela `personaFigures`, com arquivo, largura e altura de cada arte. A home e o palco das páginas internas leem daqui (ADR 0009); os arquivos continuam em `apps/web-next/public/_home/personas/`.
- Evento novo exporta: nome como constante, tipo do `detail`, função de emitir e função de escutar que devolve o cancelamento.
- Imports relativos levam a extensão `.js` (o pacote é compilado para Node).
- Mudança que quebra consumidor exige atualizar todos os apps na mesma mudança. Skill: `cross-mfe-contract`.

## Comandos

| Comando                                        | O que faz           |
| ---------------------------------------------- | ------------------- |
| `pnpm --filter @portfolio/contracts build`     | Compila para `dist` |
| `pnpm --filter @portfolio/contracts test`      | Testes (Vitest)     |
| `pnpm --filter @portfolio/contracts typecheck` | Checagem de tipos   |
