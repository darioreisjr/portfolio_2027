# apps/web-next (Next.js): home, comunidade, como foi feito

Páginas com HTML completo para SEO: `/`, `/comunidade`, `/como-foi-feito` e as versões por idioma.

## Convenções

- App Router com `output: 'export'` e `trailingSlash: true`.
- Proibido o que não funciona em export estático: `rewrites`, `redirects`, `headers`, `proxy`, Server Actions, cookies, ISR, rota dinâmica sem `generateStaticParams`, `next/image` com o loader padrão.
- Uma rota só, `app/[[...slug]]`, com `generateStaticParams` vindo da tabela de rotas de `packages/contracts`; `lib/route.ts` resolve área e idioma.
- A home é a tela de escolha de perfil (`app/_components/home-stage.tsx`, `app/home.css`, modelo em `lib/home.ts`). Comunidade e como-foi-feito ainda usam `area-placeholder.tsx`.
- `persona-list.tsx` é o único Client Component: primeiro toque, setas e posição do carrossel. O destaque é todo em CSS, e sem JavaScript cada personagem continua sendo um link.
- O cenário de sakura (`sakura-scene.tsx`, estilos em `home.css`, pétalas em `lib/sakura.ts`) é decorativo e não usa JavaScript: cores só pelos tokens `--color-scene-*`, números das pétalas por `style`. Detalhes em `docs/plans/home-sakura.md`.
- Todo texto da home fica sobre a névoa (`--color-scene-veil`). Texto novo na tela entra na lista `textBlocks` do teste de contraste em `e2e/home.spec.ts`.
- Arte dos personagens em `public/_home/personas/`, decorativa (`alt=""`). A tabela `figures` de `lib/home.ts` diz o arquivo, a largura e a altura de cada um. Recrutador já tem a arte final (`recruiter.webp`); os outros três são silhuetas SVG provisórias.
- Arte nova: aparar as bordas transparentes, reduzir para 720 px de altura e salvar em WebP (meta: até 60 kB), depois atualizar a entrada em `figures` e medir com `pnpm lhci`. O PNG original não entra no repositório.
- Next.js fixado em 16.3.8. O `404.html` gerado ainda sai sem `lang`.
- Server Components por padrão. Client Component só onde há interação ou uso de custom element.
- O layout carrega o design system e os tokens uma vez. Componentes do design system não renderizam no servidor: o conteúdo precisa ser legível antes do upgrade (ADR 0003).
- Links para as áreas de MFE usam `<a>`, nunca `<Link>`.
- Não usa Module Federation.
- Dados de `packages/content` usados hoje: `profile`, `home`, `ui`. Previstos: `articles`, `projects` (com `openSource`), `contacts`.
- Teto de JavaScript: ver `docs/quality/budgets.md`.

## Comandos

| Comando                            | O que faz                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm --filter web-next dev`       | Next.js em `localhost:3000`, sem o design system; para ver tudo use `pnpm dev` na raiz |
| `pnpm --filter web-next build`     | Export estático em `out/`                                                              |
| `pnpm --filter web-next test`      | Testes das rotas (Vitest)                                                              |
| `pnpm --filter web-next typecheck` | Checagem de tipos                                                                      |

Skill de convenções: `next-zone`.
