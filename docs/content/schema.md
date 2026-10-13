# Modelo de conteúdo

Status: implementado em `packages/content`. Modelado a partir das seções do `docs/product/brief.md`. Dados reais do autor: a área do recrutador e os projetos de código aberto (desde 2026-10-12). O resto é dado de exemplo.

Todo o conteúdo vive em `packages/content` como JSON. Os apps só leem conteúdo por esse pacote. A ferramenta de validação e a geração de tipos são definidas no bootstrap (Fase 3).

## Convenções

| Regra       | Detalhe                                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | kebab-case, único no arquivo, estável (nunca reaproveitar)                                                                                                                          |
| Referências | Sempre por `id`; a validação falha se o alvo não existir                                                                                                                            |
| Datas       | `YYYY-MM` para períodos, `YYYY-MM-DD` para publicações; `end: null` significa "atual"                                                                                               |
| `status`    | `"draft"` ou `"published"`; só `published` vai para o build de produção (exceção: os dados de exemplo das áreas técnica, do cliente e da comunidade, enquanto não tiverem os reais) |
| URLs        | Absolutas, com `https://`                                                                                                                                                           |
| Imagens     | `{ "src": "caminho", "alt": Localized }`; `alt` é obrigatório                                                                                                                       |

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

| Campo                      | Tipo                                            | Obrigatório                |
| -------------------------- | ----------------------------------------------- | -------------------------- |
| `id`, `status`             |                                                 | sim                        |
| `slug`                     | string (usado na URL)                           | sim                        |
| `title`                    | Localized                                       | sim                        |
| `summary`                  | Localized                                       | sim                        |
| `start`, `end`             | `YYYY-MM`                                       | `start` sim                |
| `role`                     | Localized                                       | não                        |
| `skills`                   | id de skill[]                                   | sim                        |
| `links.repo`, `links.demo` | string (`repo` é o repositório principal)       | não                        |
| `links.repos`              | `{ label: Localized; url }[]`, dois ou mais     | não                        |
| `openSource`               | boolean (lista o projeto na área da comunidade) | sim                        |
| `openSourceStatus`         | `"active" \| "maintained" \| "archived"`        | se `openSource` for `true` |
| `cover`                    | Imagem                                          | não                        |
| `gallery`                  | Imagem[]                                        | não                        |
| `technical.problem`        | Localized                                       | se houver `technical`      |
| `technical.architecture`   | Localized                                       | se houver `technical`      |
| `technical.tradeoffs`      | Localized[]                                     | não                        |
| `outcome.context`          | Localized                                       | se houver `outcome`        |
| `outcome.result`           | Localized                                       | se houver `outcome`        |
| `recruiter.challenge`      | Localized                                       | se houver `recruiter`      |
| `recruiter.result`         | Localized                                       | se houver `recruiter`      |
| `featured`                 | boolean                                         | não                        |

### `services.json` (lista)

| Campo             | Tipo            | Obrigatório |
| ----------------- | --------------- | ----------- |
| `id`, `status`    |                 | sim         |
| `title`           | Localized       | sim         |
| `description`     | Localized       | sim         |
| `deliverables`    | Localized[]     | não         |
| `relatedProjects` | id de projeto[] | não         |

### `testimonials.json` (lista)

| Campo            | Tipo                                                                                | Obrigatório |
| ---------------- | ----------------------------------------------------------------------------------- | ----------- |
| `id`, `status`   |                                                                                     | sim         |
| `author`         | string                                                                              | sim         |
| `authorRole`     | Localized                                                                           | sim         |
| `company`        | string                                                                              | não         |
| `relation`       | `"client" \| "colleague" \| "manager"`                                              | sim         |
| `quote`          | Localized                                                                           | sim         |
| `originalLocale` | Locale (idioma em que foi escrito)                                                  | não         |
| `consent`        | boolean; `true` é obrigatório em depoimento publicado (os de exemplo levam `false`) | sim         |
| `sourceUrl`      | string (ex.: recomendação no LinkedIn)                                              | não         |
| `relatedProject` | id de projeto                                                                       | não         |

### `articles.json` (lista)

| Campo            | Tipo                                         | Obrigatório |
| ---------------- | -------------------------------------------- | ----------- |
| `id`, `status`   |                                              | sim         |
| `title`          | Localized                                    | sim         |
| `summary`        | Localized                                    | sim         |
| `publishedAt`    | `YYYY-MM-DD`                                 | sim         |
| `tags`           | string[]                                     | não         |
| `url`            | string (onde o texto está publicado)         | sim         |
| `locale`         | Locale (idioma do texto original)            | sim         |
| `readingMinutes` | número inteiro: tempo de leitura, em minutos | sim         |

O corpo do artigo dentro do site não está modelado; ver `docs/open-questions.md`.

### `community/<locale>.json` (um por idioma)

Textos de interface da página da comunidade: abertura, títulos e rótulos dos blocos, o medidor de tempo de leitura (`power`, com `{count}`), as situações dos projetos, a descrição do repositório deste site, os textos da vitrine do design system e a lista do que é bem-vindo (`join.items`). Sem `status`.

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

### `client.json` (objeto único)

Como o autor trabalha com clientes. Tem `status`, como o `profile.json`, porque são compromissos dele. Não leva valores.

| Campo                | Tipo                                                                                              | Obrigatório |
| -------------------- | ------------------------------------------------------------------------------------------------- | ----------- |
| `status`             | `"draft"` ou `"published"`                                                                        | sim         |
| `process`            | lista de etapas, na ordem: `id`, `title` e `description` (Localized)                              | sim         |
| `engagement.pricing` | Localized: como o orçamento é feito, em um parágrafo                                              | sim         |
| `engagement.models`  | lista: `id` (`"fixed" \| "staged" \| "retainer"`), `title`, `description`, `timeline` (Localized) | sim         |
| `faq`                | lista: `id`, `question`, `answer` (Localized)                                                     | sim         |

### `client/<locale>.json` (um por idioma)

Textos de interface da área do cliente: a abertura, os cabeçalhos de notificação das janelas (`tags`), os títulos e rótulos das seções, os textos dos botões de orçamento por canal (`quote`), a chamada final e a faixa de exemplo. Sem `status`.

### `recruiter/<locale>.json` (um por idioma)

Textos de interface da área do recrutador: títulos das seções, o aviso dos links que abrem outra aba (`newTab`), rótulos das enumerações da ficha rápida (`workModes`, `englishLevels`, `seniorities`), das categorias e níveis da stack, dos tipos de formação e de contato, e a faixa "Dados de exemplo" (`example`). Sem `status`, como `ui` e `home`. Ficam fora de `ui` porque só o MFE do recrutador os usa.

### `tech/<locale>.json` (um por idioma)

Textos de interface da área técnica: abertura, títulos e rótulos das seções, cabeçalhos do raio-x, a faixa de exemplo e o terminal. Os comandos do terminal têm id fixo (`projects`, `stack`, `xray`, `adr`, `help`, `clear`); `name` é o que se digita, traduzido, e `description` aparece em `ajuda`. Nas respostas, `{count}` e `{command}` são trocados pelo valor.

### `site.json` (objeto único)

Raio-x do próprio site (ADR 0012). Dado real do repositório, sem `status`: não é de exemplo nem sobre o autor. Gravado por `scripts/site-xray.mjs`; não se edita à mão.

| Campo        | Tipo                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `measuredAt` | `YYYY-MM-DD`, a data da última medição                                                                                            |
| `repository` | endereço do repositório deste site, lido do `package.json` da raiz                                                                |
| `areas`      | por rota: `area`, `framework`, `owner`, `path`, `maxKb`, `jsKb` e, se o Lighthouse rodou, `performance`, `accessibility`, `lcpMs` |
| `parts`      | por parte (shell, design system, cada MFE): `name`, `maxKb`, `jsKb`                                                               |
| `decisions`  | por ADR: `number`, `title` (em português), `status`                                                                               |

### `ui/<locale>.json` (um por idioma)

Sem `status`: é texto de interface, não conteúdo sobre o autor.

Inclui `themeToggle`, o nome acessível do seletor de tema, `languageSwitcher`, o do grupo de bandeiras que troca o idioma, `pauseMotion`, o do botão que pausa a animação (home e páginas internas), `leaving`, o aviso da cortina ao voltar de uma área para a home, e `construction`, com `title`, `text` e `back`: o título, a frase e o rótulo do botão de volta da tela "em construção". Os nomes dos idiomas não ficam aqui: cada um aparece no próprio idioma e vem de `packages/contracts`.

Textos de interface (rótulos de navegação, botões, títulos de seção), separados do conteúdo sobre o autor. Chaves idênticas nos três arquivos; a validação falha se alguma faltar.

## O módulo da área do recrutador

Os apps não montam a página a partir dos arquivos soltos. O pacote entrega `@portfolio/content/recruiter`, com dois exports:

- `recruiter`: `Record<Locale, RecruiterContent> | null`. Um objeto por idioma, só com o conjunto que vale (o real ou o de exemplo), as skills resolvidas pelo nome, os textos no idioma e a ordem pronta (o que está em curso primeiro). É `null` quando não há perfil visível, e é assim que a área sabe que deve mostrar a tela "em construção".
- `recruiterUi`: os textos de `recruiter/<locale>.json`.

`RecruiterContent.example` é `true` enquanto o perfil for rascunho: a página mostra a faixa "Dados de exemplo". Hoje o perfil é publicado e a área mostra os dados reais do autor.

Cada projeto chega com `start`, `end` (`null` quando está em andamento) e, se tiver mais de um repositório, `repos`, com o rótulo de cada parte no idioma. `recruiter/<locale>.json` tem `projects.ongoing` para fechar o período sem data de fim.

## Dado real e dado de exemplo

São dois conjuntos, separados pelo id:

- **Exemplo:** id começando por `exemplo-`, sempre `status: "draft"`, nomes como "Empresa Exemplo" e endereços em `example.com`. Um teste do pacote cobra isso.
- **Real:** todo o resto. Entra em produção quando `published`; em desenvolvimento, também em rascunho.

Cada bloco de cada área usa um conjunto ou o outro, nunca os dois, em desenvolvimento e em produção. As listas que acompanham um bloco seguem o conjunto dele:

| Área       | Quem decide                     | Com os dados de hoje                            |
| ---------- | ------------------------------- | ----------------------------------------------- |
| Recrutador | `profile.status`                | Perfil publicado: só o conjunto real            |
| Técnica    | Existe estudo de caso real?     | Não: projetos e skills de exemplo, com a faixa  |
| Cliente    | Serviços, casos, cada um por si | Exemplo; os canais seguem os serviços           |
| Comunidade | Cada bloco por si               | Código aberto real; artigos e canais de exemplo |

A exceção de exemplo (`publishExample` em `packages/content/scripts/build.mjs`) põe no ar, com a faixa, os blocos que ainda não têm dado real. Vale para a área técnica, a do cliente e a comunidade. A do recrutador saiu dela em 2026-10-12.

A home recebe o perfil pelo módulo `profile` e mostra nome e cargo. Em produção isso depende de `HOME_IDENTITY`, no mesmo script, ligado em 2026-10-13; com `false`, o módulo volta a ser `null` e a linha some.

Um contato real só entra em outra área se `primaryFor` a citar. Hoje os quatro contatos reais têm `primaryFor: ["recruiter"]`.

Regras conferidas na carga, antes de filtrar os rascunhos: ids únicos por arquivo; dado de exemplo nunca é publicado; item real não referencia skill ou projeto de exemplo, nem o contrário; toda skill referenciada existe; item publicado não referencia skill em rascunho; item publicado tem os três idiomas em todo texto traduzível, em qualquer profundidade.

## O módulo da comunidade

`@portfolio/content/community` tem dois exports: `community` (`Record<Locale, CommunityContent> | null`) e `communityUi`.

`CommunityContent` traz `articles` (mais recente primeiro), `projects` (os projetos com `openSource: true`, com a situação) e `channels` (os contatos com `primaryFor: ["community"]`), e `example`, que diz por bloco se os dados são rascunho. É `null` sem artigo nem projeto para mostrar. A mesma exceção de exemplo vale aqui (`publishExample.community`).

O endereço real do repositório deste site não vem daqui: está em `site.json` (`repository`).

## O módulo da área do cliente

`@portfolio/content/client` tem dois exports: `client` (`Record<Locale, ClientContent> | null`) e `clientUi`.

`ClientContent` traz `services`, `process`, `cases` (os projetos com a narrativa `outcome`), `testimonials`, `engagement`, `faq` e `contacts` (os canais com `primaryFor: ["client"]`, o WhatsApp primeiro), e `example`, que diz por bloco se os dados são rascunho: `services`, `cases`, `testimonials` e `terms` (etapas, formas de contratar e perguntas, que vêm de `client.json`).

Regras: cada bloco usa os itens publicados se houver algum; sem nenhum, os rascunhos, em desenvolvimento ou pela exceção de exemplo (`publishExample.client`). A área é `null` sem serviço para mostrar. Depoimento de exemplo só aparece enquanto os serviços também forem de exemplo.

## O módulo da área técnica

`@portfolio/content/tech` tem três exports: `tech` (`Record<Locale, TechContent> | null`, com os estudos de caso, isto é, os projetos com a narrativa `technical`, e as tecnologias), `techUi` e `site`.

`TechContent.example` é `true` quando os projetos e as tecnologias são rascunho: a página põe a faixa "Dados de exemplo" no bloco deles. O raio-x nunca leva faixa. A mesma exceção do recrutador vale aqui (`publishExample.tech`): enquanto não houver estudo de caso publicado, a área vai ao ar com os exemplos; com um publicado, só o que é publicado entra.

## Quem consome o quê

| Área       | Arquivos                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Home       | `profile`, `home`, `ui` (`contacts` quando houver uso)                                                                           |
| Recrutador | `recruiter` (montado de `profile`, `experiences`, `education`, `skills`, `projects` com narrativa `recruiter`, `contacts`), `ui` |
| Técnica    | `tech` (montado de `projects` com narrativa `technical` e `skills`), `site`, `ui`                                                |
| Cliente    | `client` (montado de `services`, `testimonials`, `client.json`, `projects` com narrativa `outcome` e `contacts`), `ui`           |
| Comunidade | `community` (montado de `articles`, `projects` com `openSource: true` e `contacts`), `site` (`repository`), `ui`                 |

## Como mudar o schema sem quebrar consumidores

- Adicionar campo opcional: seguro.
- Adicionar campo obrigatório, renomear ou remover: quebra consumidores. Exige atualizar todos os apps que leem o arquivo na mesma mudança.
- Valores novos em enumerações (`category`, `kind`): tratar como quebra, porque os apps podem ter tratamento exaustivo.
