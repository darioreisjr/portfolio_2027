---
name: next-zone
description: Convenções do app Next.js em export estático (apps/web-next: home, comunidade e como-foi-feito). Use ao criar, alterar ou revisar código em apps/web-next, ou ao adicionar página que precisa de HTML completo para SEO.
---

# Next.js em export estático

Contexto: `apps/web-next/AGENTS.md`, `docs/architecture/adr/0002-composition.md` e `docs/architecture/adr/0004-hosting.md`.

## Configuração fixa

- App Router, `output: 'export'`, `trailingSlash: true`.
- A saída vai para a raiz do site publicado; os outros apps ocupam caminhos próprios.

## Proibido, porque não funciona em export estático

`rewrites`, `redirects`, `headers`, `proxy`, Server Actions, cookies, ISR, Draft Mode, rotas interceptadas, Route Handlers que leem a requisição, rota dinâmica sem `generateStaticParams`, `next/image` com o loader padrão.

Se a tarefa parece precisar de um deles, pare: é mudança de arquitetura e pede ADR.

## Rotas e idiomas

- Este app é dono de `/`, `/comunidade`, `/como-foi-feito` e das versões por idioma, com nomes traduzidos.
- Idioma por segmento dinâmico com `generateStaticParams`. Os caminhos vêm da tabela de rotas de `packages/contracts`.
- Nunca crie página em caminho de outro app (`/recrutador`, `/tecnico`, `/clientes` e traduções).
- Link para área de MFE usa `<a>`, nunca `<Link>`: o Next.js tentaria pré-carregar e navegar sem recarregar, o que não funciona entre apps.

## Componentes

- Server Components por padrão; rodam no build e viram HTML.
- Client Component só onde há interação ou uso de custom element com propriedade ou evento.
- APIs do navegador (`window`, `localStorage`) só dentro de efeitos, em Client Components.

## Design system

- O layout carrega tokens e o bundle do design system uma vez.
- Os componentes não renderizam no servidor. O conteúdo vai no light DOM e precisa ser legível antes do upgrade; nada acima da dobra depende de um componente para existir.
- Tags direto no JSX, com a declaração de tipos de `packages/design-system`. Sem wrapper.
- Script inline no `<head>` aplica o tema antes da primeira pintura, igual ao do shell.

## SEO

- `generateMetadata` por página e idioma: título, descrição, `canonical`, `hreflang`, Open Graph.
- Dados estruturados de pessoa na home.
- Sitemap e `robots.txt` gerados no build.

## Dados

Só de `packages/content`: `profile`, `articles`, `projects` com `openSource`, `contacts`, `ui`. Lidos no build, em Server Components.

## Limites e verificação

Teto de JavaScript em `docs/quality/budgets.md`. Verifique com lint, typecheck, testes, `next build` gerando `out/` com `404.html`, e Lighthouse nas três páginas.
