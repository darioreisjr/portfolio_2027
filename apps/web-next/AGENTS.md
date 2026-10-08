# apps/web-next (Next.js): home, comunidade, como foi feito

Páginas com HTML completo para SEO: `/`, `/comunidade`, `/como-foi-feito` e as versões por idioma.

## Convenções

- App Router com `output: 'export'` e `trailingSlash: true`.
- Proibido o que não funciona em export estático: `rewrites`, `redirects`, `headers`, `proxy`, Server Actions, cookies, ISR, rota dinâmica sem `generateStaticParams`, `next/image` com o loader padrão.
- Uma rota só, `app/[[...slug]]`, com `generateStaticParams` vindo da tabela de rotas de `packages/contracts`; `lib/route.ts` resolve área e idioma.
- A home é a tela de escolha de perfil, sem link para "Como foi feito" (`app/_components/home-stage.tsx`, `app/home.css`, modelo em `lib/home.ts`). Comunidade e como-foi-feito ainda usam `area-placeholder.tsx`.
- `persona-list.tsx` é o único Client Component: escolhe o personagem na própria tela (clique, Espaço, Esc, "Voltar", clique fora), setas e posição do carrossel. O estado fica em atributos do DOM (`data-selected`, `hidden`, `aria-expanded`) e o CSS faz o resto; sem JavaScript cada personagem continua sendo um link. Detalhes em `docs/plans/home-selecao.md`.
- O personagem é sempre `<a>`, nunca `<Link>`: o `<Link>` navegaria antes de a lista tratar o clique. Quem abre a área é o "Entrar" do painel.
- A frase do personagem fica sobre a figura. Quem garante a leitura é o contorno da letra.
- Painel do escolhido (`.persona-actions`), em estilo menu de RPG: a descrição do perfil (`personas.<area>.description` de `home/<locale>.json`) em uma caixa de fundo sólido, sem contorno de letra, e as opções "Entrar" e "Voltar". Detalhes em `docs/plans/home-painel-rpg.md`.
- Cada `<li>` leva `data-area`, e o `home.css` tira dele `--persona-color` (tokens `--color-area-*`). A cor é enfeite: está no "Entrar", nas linhas do "Voltar", na barra da descrição e no brilho atrás do escolhido. A home não mostra o nome da tecnologia.
- As opções têm cantos cortados e borda dupla desenhados por dois pseudo-elementos com `clip-path`; o elemento em si continua retangular, para o anel de foco e a área de clique ficarem inteiros. Não aplique `clip-path` no próprio botão. A seta do menu é fundo do pseudo-elemento e não entra no nome acessível.
- Todo texto da home, inclusive a descrição, é em negrito: texto em peso normal faria a home baixar o segundo arquivo de fonte (no celular o painel oculto continua no layout) e o LCP passaria do teto. O teste "a home pede um só arquivo de fonte" de `e2e/font.spec.ts` cobra isso.
- O cenário de sakura (`sakura-scene.tsx`, estilos em `home.css`, pétalas em `lib/sakura.ts`) é decorativo e não usa JavaScript: cores só pelos tokens `--color-scene-*`, números das pétalas por `style`. Detalhes em `docs/plans/home-sakura.md`.
- O texto da home fica direto sobre o cenário, com um contorno na cor do céu em volta de cada letra (`--color-scene-outline`, `--text-outline-width`). Texto novo direto sobre o cenário leva o mesmo contorno e entra nas listas `textBlocks` e `selectedBlocks` do teste de contraste em `e2e/home.spec.ts`, que mede os pixels em volta das letras.
- Arte dos personagens em `public/_home/personas/`, decorativa (`alt=""`). A tabela `figures` de `lib/home.ts` diz o arquivo, a largura e a altura de cada um. Os quatro personagens (`recruiter`, `tech`, `client`, `community`) têm a arte final, em AVIF com WebP de reserva.
- Arte nova: aparar as bordas transparentes, reduzir para 640 px de altura e salvar em AVIF (qualidade 50, cerca de 18 kB) e em WebP de reserva; depois atualizar a entrada em `figures` e medir com `pnpm lhci`. O PNG original não entra no repositório.
- A imagem do primeiro personagem é o LCP da home: carrega com prioridade alta; as outras três são sob demanda e com prioridade baixa.
- Next.js fixado em 16.3.8. O `404.html` gerado ainda sai sem `lang`.
- Server Components por padrão. Client Component só onde há interação ou uso de custom element.
- O layout carrega o design system e os tokens uma vez. Componentes do design system não renderizam no servidor: o conteúdo precisa ser legível antes do upgrade (ADR 0003).
- O layout também põe o script de tema de `packages/contracts` no `<head>` e o `<ds-theme-toggle>` em um `<header class="site-tools">`, no canto superior direito de toda página. O `<html>` leva `suppressHydrationWarning` porque o script aplica `data-theme` antes da hidratação.
- O layout termina com `<footer class="ds-dock">`, fixo no canto inferior direito: as bandeiras de idioma (links comuns de `languageAlternates`, nunca `<Link>`; ADR 0006) e, só na home, o botão de pausa da animação. A pausa é uma caixa de seleção nativa com cara de botão; o `home.css` lê o estado com `body:has(...)`, sem JavaScript.
- A home declara `font-weight` forte na raiz e o `site-tools` é flex: assim nenhuma linha sem texto faz o navegador baixar o peso 400 da fonte, e a home baixa só o 700.
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
