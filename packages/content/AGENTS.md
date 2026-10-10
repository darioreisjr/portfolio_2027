# packages/content

Todo o conteúdo do site em JSON (`data/`), validado com Zod e entregue aos apps como módulos tipados.

## Convenções

- Modelo em `docs/content/schema.md`; schemas em `src/schemas.ts`. Mude os dois juntos.
- Os apps importam só por subcaminho: `@portfolio/content/ui`, `@portfolio/content/home`, `@portfolio/content/profile`, `@portfolio/content/recruiter`, `@portfolio/content/tech`, `@portfolio/content/client`, `@portfolio/content/community`. Nunca leem `data/` direto.
- O build falha se um JSON for inválido. Item `published` precisa dos três idiomas (pt-BR, en, es).
- O build de produção exclui `draft`. O `pnpm dev` da raiz já roda com `CONTENT_INCLUDE_DRAFTS=1`.
- Dado de exemplo é `draft` e claramente fictício. Nunca invente conteúdo sobre o autor.
- Zod fica só neste pacote; não entra no bundle de nenhum app.
- Texto que só um app usa não entra em `ui`: os MFEs importam `ui` inteiro, e cada chave nova pesa nos três.
- `ui.construction` (título, frase e rótulo do botão de volta da tela "em construção") e `ui.pauseMotion` ficam em `ui` porque o shell, os três MFEs e o Next.js usam.
- A área técnica importa só `@portfolio/content/tech`: `tech` (estudos de caso e tecnologias por idioma, ou `null`), `techUi` (textos de `tech/<locale>.json`, com os comandos do terminal) e `site`.
- `data/site.json` é o raio-x do próprio site (ADR 0012): dado real do repositório, sem `status`, que não é de exemplo. Não edite à mão: rode `node scripts/site-xray.mjs` depois de `pnpm build && pnpm assemble && pnpm lhci`. O `pnpm test` roda `--check`, que acusa ADR novo ou teto alterado sem regravar.
- A página da comunidade importa `@portfolio/content/community`: `community` (artigos, projetos de código aberto e canais por idioma, ou `null` sem artigo nem projeto) e `communityUi` (textos de `community/<locale>.json`, com a lista do que é bem-vindo). `example` vem por bloco.
- Projeto com `openSource: true` precisa de `openSourceStatus`. O endereço real do repositório deste site fica em `site.json` (`repository`), lido do `package.json` da raiz pelo raio-x.
- A área do cliente importa só `@portfolio/content/client`: `client` (serviços, etapas, casos, depoimentos, formas de contratar, perguntas e canais de orçamento, por idioma, ou `null` sem serviço para mostrar) e `clientUi` (textos de `client/<locale>.json`). `example` vem por bloco.
- `client.json` guarda como o autor trabalha com clientes (etapas, forma de orçar, formas de contratar, perguntas). É dado, com `status`, porque são compromissos dele; não leva valores.
- Depoimento: `consent` é obrigatório `true` só em item publicado. Os de exemplo levam `false`, e somem assim que houver serviço publicado.
- A área do recrutador importa só `@portfolio/content/recruiter`: `recruiter` (um objeto por idioma, já filtrado e traduzido, ou `null` sem perfil visível) e `recruiterUi` (textos de `recruiter/<locale>.json`). Campo novo da página entra em `src/recruiter.ts`; o MFE não recebe ids soltos nem os outros idiomas.
- Dado de exemplo: `status: "draft"`, id começando por `exemplo-`, nomes "... Exemplo" e URLs em `example.com`. O teste cobra. Exceção autorizada pelo autor em 2026-10-09: `scripts/build.mjs` liga `publishExample` para o recrutador, a área técnica, a do cliente e a comunidade: enquanto o perfil for rascunho, o recrutador vai ao ar com esses dados, e a área técnica vai enquanto não houver estudo de caso publicado, marcados por `example: true` (a página mostra a faixa "Dados de exemplo"). `profile` continua `null` em produção, então a home não muda. Publicar o perfil encerra a exceção sozinho: rascunho volta a ficar de fora.
- Hoje existem `ui/<locale>.json`, `home/<locale>.json`, `recruiter/<locale>.json`, `tech/<locale>.json`, `site.json`, `profile.json`, `contacts.json`, `skills.json`, `experiences.json`, `education.json` e `projects.json`, `services.json`, `testimonials.json`, `client.json`, `client/<locale>.json`, `articles.json` e `community/<locale>.json`.

## Comandos

| Comando                                  | O que faz                         |
| ---------------------------------------- | --------------------------------- |
| `pnpm --filter @portfolio/content build` | Valida os JSON e gera `dist/data` |
| `pnpm --filter @portfolio/content test`  | Testes da validação (Vitest)      |

Skill: `content-schema`.
