# apps/web-next (Next.js): home, comunidade, como foi feito

Páginas com HTML completo para SEO: `/`, `/comunidade`, `/como-foi-feito` e as versões por idioma.

## Convenções

- App Router com `output: 'export'` e `trailingSlash: true`.
- Proibido o que não funciona em export estático: `rewrites`, `redirects`, `headers`, `proxy`, Server Actions, cookies, ISR, rota dinâmica sem `generateStaticParams`, `next/image` com o loader padrão.
- Uma rota só, `app/[[...slug]]`, com `generateStaticParams` vindo da tabela de rotas de `packages/contracts`; `lib/route.ts` resolve área e idioma.
- A home é a tela de escolha de perfil, sem link para "Como foi feito" (`app/_components/home-stage.tsx`, `app/home.css`, modelo em `lib/home.ts`). Comunidade e como-foi-feito usam `area-construction.tsx`, a tela "em construção" (ADR 0009, `docs/plans/areas-em-construcao.md`).
- `persona-list.tsx` é a única entrada de Client Component (ADR 0008): escolhe o personagem na própria tela (clique, Espaço, Esc, "Voltar", clique fora), setas e posição do carrossel. O estado fica em atributos do DOM (`data-selected`, `hidden`, `aria-expanded`) e o CSS faz o resto; sem JavaScript cada personagem continua sendo um link. Detalhes em `docs/plans/home-selecao.md`.
- Música de fundo, só na home: `music-toggle.tsx` é montado por `persona-list.tsx` e levado por portal para `#home-music-slot`, o lugar que o layout já deixa guardado no grupo do canto. Não o transforme em Client Component à parte: ele sairia em um arquivo de script próprio, e esse download a mais levou o LCP da home de 2,63 para 2,71 s. Detalhes em `docs/plans/home-musica.md`.
- O botão da música é o botão de "Som": liga também os efeitos de seleção, notas de corda dedilhada sintetizadas em `lib/sfx.ts` (sem arquivo). `lib/sfx.ts` só pode ser importado por `persona-list.tsx` e pelo que ele carrega, para sair no mesmo arquivo de script; o teste "a home continua carregando nove arquivos de script" de `e2e/home-sfx.spec.ts` cobra isso. O contexto de áudio só é criado dentro de um gesto e com o som ligado. Detalhes e tabela de notas em `docs/plans/home-efeitos.md`.
- O áudio nunca é pedido na primeira página de uma visita: o `<audio>` nasce sem `src`. O botão de som diz a verdade: `aria-pressed` só fica `true` com som de fato ativo; a escolha lembrada (`portfolio:musica`) é outro estado. Na continuação da mesma aba, a marca `portfolio:musica-tempo` em `sessionStorage` faz a página tentar retomar sozinha, do ponto onde a música estava; se o navegador recusar, o botão fica desligado até o primeiro gesto. A faixa fica em `public/_home/audio/`, com a versão no nome (cache de um ano), e a origem e a licença em `docs/assets-de-terceiros.md`. O original não entra no repositório. Detalhes em `docs/plans/home-som-e-bandeiras.md`.
- `area-construction.tsx` é Server Component e liga a folha das páginas internas com `<link rel="stylesheet" href="/_ds/areas.css" precedence="default">`. Nunca importe essa folha, nem outro CSS, em componente das páginas internas: a rota é uma só e o Next.js levaria o CSS para a home. O menu de áreas dele usa `<Link prefetch={false}>` para as páginas deste app e `<a>` para as do shell; com o prefetch ligado o LCP passa do teto.
- O personagem é sempre `<a>`, nunca `<Link>`: o `<Link>` navegaria antes de a lista tratar o clique. Quem abre a área é o "Entrar" do painel.
- A frase do personagem fica sobre a figura. Quem garante a leitura é o contorno da letra.
- Movimento da home (`docs/plans/home-animacoes.md`): só CSS. Com um personagem apontado ou em foco, a figura dos outros três escurece e recua. Todo movimento novo fica dentro de `prefers-reduced-motion: no-preference`, e o que é contínuo (respirar, pulso do brilho, seta) entra também na regra de pausa `body:has(.home-motion input:checked)`. A imagem do primeiro personagem é o LCP: ela e os ancestrais nunca recebem opacidade nem atraso na entrada, só deslocamento. Escurecer e pular mexem na imagem, nunca no link ou no botão, para a área de clique não se mover.
- Depois de escolher, entrar ou desfazer, `lib/sfx.ts` deixa o "passar o mouse" mudo por 0,9 s, o tempo das animações de chegada. Se elas ficarem mais longas, esse número acompanha.
- Painel do escolhido (`.persona-actions`), em estilo menu de RPG: a descrição do perfil (`personas.<area>.description` de `home/<locale>.json`) em uma caixa de fundo sólido, sem contorno de letra, e as opções "Entrar" e "Voltar". Detalhes em `docs/plans/home-painel-rpg.md`.
- Cada `<li>` leva `data-area`, e o `home.css` tira dele `--persona-color` (tokens `--color-area-*`). A cor é enfeite: está no "Entrar", nas linhas do "Voltar", na barra da descrição e no brilho atrás do escolhido. A home não mostra o nome da tecnologia.
- As opções têm cantos cortados e borda dupla desenhados por dois pseudo-elementos com `clip-path`; o elemento em si continua retangular, para o anel de foco e a área de clique ficarem inteiros. Não aplique `clip-path` no próprio botão. A seta do menu é fundo do pseudo-elemento e não entra no nome acessível.
- Todo texto da home, inclusive a descrição, é em negrito: texto em peso normal faria a home baixar o segundo arquivo de fonte (no celular o painel oculto continua no layout) e o LCP passaria do teto. O teste "a home pede um só arquivo de fonte" de `e2e/font.spec.ts` cobra isso.
- O cenário de sakura (`sakura-scene.tsx`, estilos em `home.css`, pétalas em `lib/sakura.ts`) é decorativo e não usa JavaScript: cores só pelos tokens `--color-scene-*`, números das pétalas por `style`. Detalhes em `docs/plans/home-sakura.md`.
- O texto da home fica direto sobre o cenário, com um contorno na cor do céu em volta de cada letra (`--color-scene-outline`, `--text-outline-width`). Texto novo direto sobre o cenário leva o mesmo contorno e entra nas listas `textBlocks` e `selectedBlocks` do teste de contraste em `e2e/home.spec.ts`, que mede os pixels em volta das letras.
- Arte dos personagens em `public/_home/personas/`, decorativa (`alt=""`). A tabela `personaFigures` de `packages/contracts` diz o arquivo, a largura e a altura de cada um, para a home e para o palco das páginas internas. Os quatro personagens (`recruiter`, `tech`, `client`, `community`) têm a arte final, em AVIF com WebP de reserva.
- Arte nova: aparar as bordas transparentes, reduzir para 640 px de altura e salvar em AVIF (qualidade 50, cerca de 18 kB) e em WebP de reserva; depois atualizar a entrada em `personaFigures` e medir com `pnpm lhci`. O PNG original não entra no repositório.
- A imagem do primeiro personagem é o LCP da home: carrega com prioridade alta; as outras três são sob demanda e com prioridade baixa.
- Next.js fixado em 16.3.8. O `404.html` gerado ainda sai sem `lang`.
- Server Components por padrão. Client Component só onde há interação ou uso de custom element.
- O layout carrega o design system e os tokens uma vez. Componentes do design system não renderizam no servidor: o conteúdo precisa ser legível antes do upgrade (ADR 0003).
- O layout também põe o script de tema de `packages/contracts` no `<head>` e o `<ds-theme-toggle>` em um `<header class="site-tools">`, no canto superior direito de toda página. O `<html>` leva `suppressHydrationWarning` porque o script aplica `data-theme` antes da hidratação.
- O layout termina com `<footer class="ds-dock">`, fixo no canto inferior direito: o lugar do botão de som (só na home), o botão de pausa e o seletor de idioma. A pausa da home é `.home-motion`; a das páginas internas é `.area-motion`, estilizada por `areas.css`. O seletor é um `<details class="ds-language-switcher">`: o `<summary>` é a bandeira do idioma em uso e a lista, que abre para cima, tem os outros três como links comuns de `languageAlternates`, nunca `<Link>` (ADR 0006 e a emenda dele). A pausa é uma caixa de seleção nativa com cara de botão; o `home.css` lê o estado com `body:has(...)`, sem JavaScript.
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
