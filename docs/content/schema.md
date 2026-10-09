# Modelo de conteúdo

Status: rascunho para aprovação. Implementado até agora em `packages/content`: `ui/<locale>.json`, `home/<locale>.json` e `profile.json` (sem `photo` e `cv`). Modelado a partir das seções do `docs/product/brief.md`; ainda não há dados reais.

Todo o conteúdo vive em `packages/content` como JSON. Os apps só leem conteúdo por esse pacote. A ferramenta de validação e a geração de tipos são definidas no bootstrap (Fase 3).

## Convenções

| Regra       | Detalhe                                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | kebab-case, único no arquivo, estável (nunca reaproveitar)                                                                                           |
| Referências | Sempre por `id`; a validação falha se o alvo não existir                                                                                             |
| Datas       | `YYYY-MM` para períodos, `YYYY-MM-DD` para publicações; `end: null` significa "atual"                                                                |
| `status`    | `"draft"` ou `"published"`; só `published` vai para o build de produção (exceção: os exemplos da área do recrutador, enquanto o perfil for rascunho) |
| URLs        | Absolutas, com `https://`                                                                                                                            |
| Imagens     | `{ "src": "caminho", "alt": Localized }`; `alt` é obrigatório                                                                                        |

### Texto traduzível

```ts
type Locale = 'pt-BR' | 'en' | 'es';
type Localized = Record<Locale, string>;
```

Exemplo: `{ "pt-BR": "...", "en": "...", "es": "..." }`.

- Item `draft`: só `pt-BR` é obrigatório. Rascunhos ficam fora do build de produção; em desenvolvimento entram com `CONTENT_INCLUDE_DRAFTS=1`.
- Item `published`: os três idiomas são obrigatórios e não vazios. A validação bloqueia o build se faltar algum.
- Nomes próprios (empresa, instituição, tecnologia) são `string` simples, sem tradução.

### Público

```ts
type Audience = 'recruiter' | 'tech' | 'client' | 'community';
```

## Arquivos

### `profile.json` (objeto único)

| Campo             | Tipo                                                            | Obrigatório |
| ----------------- | --------------------------------------------------------------- | ----------- |
| `status`          | `"draft"` ou `"published"`                                      | sim         |
| `name`            | string                                                          | sim         |
| `role`            | Localized                                                       | sim         |
| `tagline`         | Localized (uma frase)                                           | não         |
| `summary`         | Localized                                                       | não         |
| `location`        | Localized                                                       | não         |
| `availability`    | Localized                                                       | não         |
| `workMode`        | `"remote" \| "hybrid" \| "onsite"` (ficha rápida do recrutador) | não         |
| `englishLevel`    | `"basic" \| "intermediate" \| "advanced" \| "fluent"`           | não         |
| `seniority`       | `"junior" \| "mid" \| "senior" \| "specialist"`                 | não         |
| `photo`           | Imagem                                                          | não         |
| `highlightSkills` | id de skill[]                                                   | sim         |
| `cv`              | `Partial<Record<Locale, string>>` (caminho do PDF por idioma)   | não         |

### `contacts.json` (lista)

Cada item também tem `status`, como nos demais arquivos (decidido em 2026-10-06).

| Campo        | Tipo                                                  | Obrigatório |
| ------------ | ----------------------------------------------------- | ----------- |
| `id`         | string                                                | sim         |
| `kind`       | `"email" \| "linkedin" \| "github" \| "whatsapp"`     | sim         |
| `url`        | string (`mailto:`, `https://`)                        | sim         |
| `display`    | string (texto visível, ex.: o endereço)               | sim         |
| `primaryFor` | Audience[] (áreas em que o canal aparece em destaque) | não         |

### `skills.json` (lista)

Cada item também tem `status`.

| Campo      | Tipo                                                                                    | Obrigatório |
| ---------- | --------------------------------------------------------------------------------------- | ----------- |
| `id`       | string                                                                                  | sim         |
| `name`     | string                                                                                  | sim         |
| `category` | `"frontend" \| "backend" \| "database" \| "devops" \| "testing" \| "design" \| "other"` | sim         |
| `level`    | `"learning" \| "working" \| "advanced"`                                                 | sim         |
| `since`    | ano (número)                                                                            | não         |

### `experiences.json` (lista)

| Campo          | Tipo                               | Obrigatório |
| -------------- | ---------------------------------- | ----------- |
| `id`, `status` |                                    | sim         |
| `company`      | string                             | sim         |
| `companyUrl`   | string                             | não         |
| `role`         | Localized                          | sim         |
| `start`, `end` | `YYYY-MM`, `end` pode ser `null`   | sim         |
| `location`     | Localized                          | não         |
| `mode`         | `"remote" \| "hybrid" \| "onsite"` | não         |
| `summary`      | Localized                          | sim         |
| `highlights`   | Localized[]                        | não         |
| `skills`       | id de skill[]                      | sim         |

### `education.json` (lista)

| Campo           | Tipo                                      | Obrigatório |
| --------------- | ----------------------------------------- | ----------- |
| `id`, `status`  |                                           | sim         |
| `kind`          | `"degree" \| "course" \| "certification"` | sim         |
| `title`         | Localized                                 | sim         |
| `institution`   | string                                    | sim         |
| `start`, `end`  | `YYYY-MM`; `end: null` é "em andamento"   | `end` sim   |
| `credentialUrl` | string                                    | não         |

### `projects.json` (lista)

Um projeto tem três narrativas: `technical` (área técnica), `outcome` (área do cliente) e `recruiter` (área do recrutador: o desafio e o que saiu dele, ao lado de `role`). Cada uma é opcional; o projeto aparece em uma área só se tiver a narrativa correspondente.

| Campo                      | Tipo                                            | Obrigatório           |
| -------------------------- | ----------------------------------------------- | --------------------- |
| `id`, `status`             |                                                 | sim                   |
| `slug`                     | string (usado na URL)                           | sim                   |
| `title`                    | Localized                                       | sim                   |
| `summary`                  | Localized                                       | sim                   |
| `start`, `end`             | `YYYY-MM`                                       | `start` sim           |
| `role`                     | Localized                                       | não                   |
| `skills`                   | id de skill[]                                   | sim                   |
| `links.repo`, `links.demo` | string                                          | não                   |
| `openSource`               | boolean (lista o projeto na área da comunidade) | sim                   |
| `cover`                    | Imagem                                          | não                   |
| `gallery`                  | Imagem[]                                        | não                   |
| `technical.problem`        | Localized                                       | se houver `technical` |
| `technical.architecture`   | Localized                                       | se houver `technical` |
| `technical.tradeoffs`      | Localized[]                                     | não                   |
| `outcome.context`          | Localized                                       | se houver `outcome`   |
| `outcome.result`           | Localized                                       | se houver `outcome`   |
| `recruiter.challenge`      | Localized                                       | se houver `recruiter` |
| `recruiter.result`         | Localized                                       | se houver `recruiter` |
| `featured`                 | boolean                                         | não                   |

### `services.json` (lista)

| Campo             | Tipo            | Obrigatório |
| ----------------- | --------------- | ----------- |
| `id`, `status`    |                 | sim         |
| `title`           | Localized       | sim         |
| `description`     | Localized       | sim         |
| `deliverables`    | Localized[]     | não         |
| `relatedProjects` | id de projeto[] | não         |

### `testimonials.json` (lista)

| Campo            | Tipo                                              | Obrigatório |
| ---------------- | ------------------------------------------------- | ----------- |
| `id`, `status`   |                                                   | sim         |
| `author`         | string                                            | sim         |
| `authorRole`     | Localized                                         | sim         |
| `company`        | string                                            | não         |
| `relation`       | `"client" \| "colleague" \| "manager"`            | sim         |
| `quote`          | Localized                                         | sim         |
| `originalLocale` | Locale (idioma em que foi escrito)                | sim         |
| `consent`        | `true` (a validação rejeita qualquer outro valor) | sim         |
| `sourceUrl`      | string (ex.: recomendação no LinkedIn)            | não         |
| `relatedProject` | id de projeto                                     | não         |

### `articles.json` (lista)

| Campo          | Tipo                                 | Obrigatório |
| -------------- | ------------------------------------ | ----------- |
| `id`, `status` |                                      | sim         |
| `title`        | Localized                            | sim         |
| `summary`      | Localized                            | sim         |
| `publishedAt`  | `YYYY-MM-DD`                         | sim         |
| `tags`         | string[]                             | não         |
| `url`          | string (onde o texto está publicado) | sim         |
| `locale`       | Locale (idioma do texto original)    | sim         |

O corpo do artigo dentro do site não está modelado; ver `docs/open-questions.md`.

### `home/<locale>.json` (um por idioma)

Textos da tela de escolha de perfil. Sem `status`, como `ui`. Ficam fora de `ui` porque os MFEs importam `ui` inteiro e não precisam destes textos.

| Campo                                                                              | Tipo                                                                                                                                         | Obrigatório |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `title`                                                                            | string (a chamada)                                                                                                                           | sim         |
| `enter`                                                                            | string (rótulo do link que abre a área)                                                                                                      | sim         |
| `back`                                                                             | string (rótulo do botão que desfaz a escolha)                                                                                                | sim         |
| `music`                                                                            | string (nome acessível do botão de som: música de fundo e efeitos)                                                                           | sim         |
| `intro.title`, `intro.immersion`, `intro.hint`, `intro.hintReduced`, `intro.start` | strings do pop-up de primeira visita: título, rótulo da caixa de imersão, o que ela liga, o mesmo para quem pediu menos movimento, e o botão | sim         |
| `personas.<perfil>.phrase`                                                         | string, para `recruiter`, `tech`, `client` e `community`                                                                                     | sim         |
| `personas.<perfil>.description`                                                    | string: o que a área traz e para quem, no tom daquele público                                                                                | sim         |

### `recruiter/<locale>.json` (um por idioma)

Textos de interface da área do recrutador: títulos das seções, rótulos das enumerações da ficha rápida (`workModes`, `englishLevels`, `seniorities`), das categorias e níveis da stack, dos tipos de formação e de contato, e a faixa "Dados de exemplo" (`example`). Sem `status`, como `ui` e `home`. Ficam fora de `ui` porque só o MFE do recrutador os usa.

### `ui/<locale>.json` (um por idioma)

Sem `status`: é texto de interface, não conteúdo sobre o autor.

Inclui `themeToggle`, o nome acessível do seletor de tema, `languageSwitcher`, o do grupo de bandeiras que troca o idioma, `pauseMotion`, o do botão que pausa a animação (home e páginas internas), e `construction`, com `title`, `text` e `back`: o título, a frase e o rótulo do botão de volta da tela "em construção". Os nomes dos idiomas não ficam aqui: cada um aparece no próprio idioma e vem de `packages/contracts`.

Textos de interface (rótulos de navegação, botões, títulos de seção), separados do conteúdo sobre o autor. Chaves idênticas nos três arquivos; a validação falha se alguma faltar.

## O módulo da área do recrutador

Os apps não montam a página a partir dos arquivos soltos. O pacote entrega `@portfolio/content/recruiter`, com dois exports:

- `recruiter`: `Record<Locale, RecruiterContent> | null`. Um objeto por idioma, já com os rascunhos filtrados, as skills resolvidas pelo nome, os textos no idioma e a ordem pronta (o que está em curso primeiro). É `null` quando não há perfil visível, e é assim que a área sabe que deve mostrar a tela "em construção".
- `recruiterUi`: os textos de `recruiter/<locale>.json`.

`RecruiterContent.example` é `true` enquanto o perfil for rascunho: a página mostra a faixa "Dados de exemplo".

Os dados de exemplo do repositório têm `status: "draft"`, id começando por `exemplo-`, nomes como "Empresa Exemplo" e endereços em `example.com`. Um teste do pacote cobra isso.

Exceção autorizada pelo autor em 2026-10-09 (`docs/plans/recrutador-conteudo.md`): enquanto o perfil for rascunho, o build de produção entrega a área do recrutador com os dados de exemplo, por `publishRecruiterExample` em `packages/content/scripts/build.mjs`. `example` fica `true` e a página mostra a faixa. `profile` continua `null` em produção. Quando o perfil for publicado, a exceção deixa de valer e só itens publicados entram.

Regras conferidas na carga, antes de filtrar os rascunhos: ids únicos por arquivo; toda skill referenciada existe; item publicado não referencia skill em rascunho; item publicado tem os três idiomas em todo texto traduzível, em qualquer profundidade.

## Quem consome o quê

| Área       | Arquivos                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Home       | `profile`, `home`, `ui` (`contacts` quando houver uso)                                                                           |
| Recrutador | `recruiter` (montado de `profile`, `experiences`, `education`, `skills`, `projects` com narrativa `recruiter`, `contacts`), `ui` |
| Técnica    | `projects` (narrativa `technical`), `skills`, `contacts`, `ui`                                                                   |
| Cliente    | `services`, `testimonials`, `projects` (narrativa `outcome`), `contacts`, `ui`                                                   |
| Comunidade | `articles`, `projects` (com `openSource: true`), `ui`                                                                            |

## Como mudar o schema sem quebrar consumidores

- Adicionar campo opcional: seguro.
- Adicionar campo obrigatório, renomear ou remover: quebra consumidores. Exige atualizar todos os apps que leem o arquivo na mesma mudança.
- Valores novos em enumerações (`category`, `kind`): tratar como quebra, porque os apps podem ter tratamento exaustivo.
