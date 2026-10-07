# apps/web-next (Next.js): home, comunidade, como foi feito

Páginas com HTML completo para SEO: `/`, `/comunidade`, `/como-foi-feito` e as versões por idioma.

## Convenções

- App Router com `output: 'export'` e `trailingSlash: true`.
- Proibido o que não funciona em export estático: `rewrites`, `redirects`, `headers`, `proxy`, Server Actions, cookies, ISR, rota dinâmica sem `generateStaticParams`, `next/image` com o loader padrão.
- Uma rota só, `app/[[...slug]]`, com `generateStaticParams` vindo da tabela de rotas de `packages/contracts`; `lib/route.ts` resolve área e idioma.
- A home é a tela de escolha de perfil (`app/_components/home-stage.tsx`, `app/home.css`, modelo em `lib/home.ts`). Comunidade e como-foi-feito ainda usam `area-placeholder.tsx`.
- `persona-list.tsx` é o único Client Component: escolhe o personagem na própria tela (clique, Espaço, Esc, "Voltar", clique fora), setas e posição do carrossel. O estado fica em atributos do DOM (`data-selected`, `hidden`, `aria-expanded`) e o CSS faz o resto; sem JavaScript cada personagem continua sendo um link. Detalhes em `docs/plans/home-selecao.md`.
- O personagem é sempre `<a>`, nunca `<Link>`: o `<Link>` navegaria antes de a lista tratar o clique. Quem abre a área é o "Entrar" do painel.
- A frase do personagem fica sobre a figura e usa só `--color-text`: é o único tom que passa em AA sobre a névoa com qualquer cor da arte atrás.
- O cenário de sakura (`sakura-scene.tsx`, estilos em `home.css`, pétalas em `lib/sakura.ts`) é decorativo e não usa JavaScript: cores só pelos tokens `--color-scene-*`, números das pétalas por `style`. Detalhes em `docs/plans/home-sakura.md`.
- Todo texto da home fica sobre a névoa (`--color-scene-veil`). Texto novo na tela entra nas listas `textBlocks` e `selectedBlocks` do teste de contraste em `e2e/home.spec.ts`.
- Arte dos personagens em `public/_home/personas/`, decorativa (`alt=""`). A tabela `figures` de `lib/home.ts` diz o arquivo, a largura e a altura de cada um. Os quatro personagens (`recruiter`, `tech`, `client`, `community`) têm a arte final, em AVIF com WebP de reserva.
- Arte nova: aparar as bordas transparentes, reduzir para 640 px de altura e salvar em AVIF (qualidade 50, cerca de 18 kB) e em WebP de reserva; depois atualizar a entrada em `figures` e medir com `pnpm lhci`. O PNG original não entra no repositório.
- A imagem do primeiro personagem é o LCP da home: carrega com prioridade alta; as outras três são sob demanda e com prioridade baixa.
- Next.js fixado em 16.3.8. O `404.html` gerado ainda sai sem `lang`.
- Server Components por padrão. Client Component só onde há interação ou uso de custom element.
- O layout carrega o design system e os tokens uma vez. Componentes do design system não renderizam no servidor: o conteúdo precisa ser legível antes do upgrade (ADR 0003).
- O layout também põe o script de tema de `packages/contracts` no `<head>` e o `<ds-theme-toggle>` em um `<header class="site-tools">`, no canto superior direito de toda página. O `<html>` leva `suppressHydrationWarning` porque o script aplica `data-theme` antes da hidratação.
- Na home, as cores do cenário passam por propriedades `--home-*` registradas com `@property`, para o céu interpolar na troca de tema.
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
