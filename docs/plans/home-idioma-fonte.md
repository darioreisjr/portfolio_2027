# Plano: bandeiras de idioma, fonte arredondada, contorno na letra e pausa em ícone

- Status: **aprovado** pelo autor em 2026-10-07 e implementado
- Origem: pedido e entrevista com o autor, `discovery-analyst` e `architect`
- Decisão de arquitetura: `docs/architecture/adr/0006-troca-de-idioma.md`

**Objetivo:** cinco mudanças pedidas pelo autor, sem JavaScript novo e com a troca de idioma funcionando sem script em todos os documentos.

## Decisões do autor

| Tema                | Decisão                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| "Como foi feito"    | Sai só o link da home. A página continua, alcançável pelo cabeçalho das áreas e pela comunidade     |
| Sombra nas palavras | Sai a névoa (fundo e brilho). No lugar, contorno fino na letra, na cor do céu                       |
| Pausar animação     | Deixa de ser texto com caixa de seleção; vira um botão de ícone junto das bandeiras                 |
| Idioma              | Bandeiras no canto inferior direito de todas as páginas: Brasil, Estados Unidos, Espanha e Portugal |
| Fonte               | Arredondada de origem japonesa em todo o site, só com letras do alfabeto latino (nada de japonês)   |
| Pré-carga da fonte  | Nenhuma, enquanto o LCP da home for a imagem do personagem                                          |

O autor não escolheu entre as duas famílias sugeridas; entrou a recomendada, M PLUS Rounded 1c. Trocar por Zen Maru Gothic é uma linha no catálogo e uma no token.

## Desenho

| Ponto        | Como fica                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Idioma       | Quatro `<a>` gerados por `languageAlternates` de `packages/contracts`, dentro de `<footer class="ds-dock">` fixo no canto. Sem JavaScript                                      |
| Bandeiras    | SVG simplificados em `packages/design-system/assets/flags/`, publicados em `/_ds/flags/`. Decorativas (`alt=""`); o nome acessível é o nome do idioma no próprio idioma        |
| Idioma atual | `aria-current="page"` e um anel na cor de destaque                                                                                                                             |
| Pausa        | Caixa de seleção nativa com aparência de botão de ícone, no `ds-dock`, só na home. O CSS lê o estado com `body:has(...)`; some com movimento reduzido                          |
| Contorno     | `text-shadow` em oito direções na largura de `--text-outline-width`, na cor `--color-scene-outline`. Saem `color-scene-veil` e os primitivos `color-mist-*`                    |
| Contraste    | Nos tokens: texto × contorno ≥ 4,5 nos dois temas. No e2e: os pixels em volta de cada letra                                                                                    |
| Fonte        | `@fontsource/m-plus-rounded-1c`, subconjunto `latin`, pesos 400 e 700, copiados por `packages/tokens` para `/_ds/fonts/`. `@font-face` no CSS dos tokens, `font-display: swap` |
| Peso forte   | `font-weight-strong` passa de 600 para 700: a família não tem 600                                                                                                              |

## Etapas

Cada etapa é um commit e deixa `pnpm lint`, `pnpm typecheck` e `pnpm test` passando.

| Etapa | O quê                                                                   | Prova                                                   |
| ----- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| 0     | ADR 0006 e este plano                                                   | `pnpm format:check`                                     |
| 1     | Remover "Como foi feito" da home                                        | `pnpm test:e2e`                                         |
| 2 e 3 | Tokens do contorno; contorno no lugar da névoa; teste de contraste novo | `pnpm --filter @portfolio/tokens test`, `pnpm test:e2e` |
| 4     | `languageAlternates`, `localeNames`, `LOCALE_FLAGS_PATH`                | `pnpm --filter @portfolio/contracts test`               |
| 5     | Bandeiras e CSS do `ds-dock`                                            | `dist/_ds/flags/` com quatro arquivos                   |
| 6     | Chave `ui.languageSwitcher`                                             | `pnpm --filter @portfolio/content test`, `pnpm budgets` |
| 7     | Bandeiras no shell e no Next.js; pausa em ícone                         | `pnpm budgets`, `pnpm test:e2e`, `pnpm lhci`            |
| 8     | Fonte                                                                   | `pnpm test:e2e`, `pnpm lhci` (LCP ≤ 2,5 s, CLS 0)       |
| 9     | Documentação                                                            | `pnpm ai:check`, `pnpm format:check`                    |

## Medido

| Medida             | Antes    | Depois        | Limite            |
| ------------------ | -------- | ------------- | ----------------- |
| JavaScript de `/`  | 146,1 kB | 146,1 kB      | 150 kB            |
| MFE React          | 77,5 kB  | 77,5 kB       | 80 kB             |
| Performance de `/` | 98       | 97            | 90                |
| LCP de `/`         | 2,4 s    | 2,58 a 2,62 s | 2,7 s (era 2,5 s) |
| TBT de `/`         | 45 ms    | 39 a 51 ms    | 200 ms            |
| CLS de `/`         | 0        | 0,001         | 0,1               |
| Acessibilidade     | 100      | 100           | 100               |

O LCP da home passou do limite com a fonte, que era o critério de parada. O autor escolheu aceitar 2,7 s só nessa rota. O que foi tentado antes: a home baixava os dois pesos da fonte sem ter texto no peso 400 (uma linha vazia do cabeçalho pedia a fonte só para medir a altura); corrigido, o LCP caiu de 2,77 s para 2,58 s. `font-display: optional` não mudou a medição.

O contorno passou no critério com 2 px. A fonte de reserva usa `size-adjust: 103%`, medido contra a Arial com as frases do site.

Verificação: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm budgets`, `pnpm test:e2e` (108 testes) e `pnpm lhci`.

## Em aberto

- Os três revisores do fluxo ainda não passaram por esta mudança.
- Conferir em aparelho de verdade, no Firefox e no Safari (B12), e com leitor de tela (B11).
- A marcação do seletor de idioma está repetida no shell e no layout do Next.js, como o ADR 0006 prevê.

## Dependência nova

- `@fontsource/m-plus-rounded-1c`, devDependency de `packages/tokens`: entrega os `.woff2` latinos com a licença OFL, sem binário versionado no git.

## Critérios de parada

- JavaScript de `/` acima de 148 kB, ou MFE React acima de 78 kB: parar e voltar ao autor.
- LCP de `/` acima de 2,5 s depois da fonte: parar e voltar ao autor.
- Contorno sem contraste com 2 px: subir para 3 px; se ainda falhar, parar.
- A home deixar de caber na janela por causa da fonte: parar e voltar ao autor.

## Fora desta tarefa

`hreflang`, `canonical` e sitemap (B7); `404.html` com idioma, tema e fonte (B4, B14); troca de idioma em sub-rotas de MFE; lembrar a pausa entre visitas; detectar o idioma do visitante; mover o seletor de tema; cabeçalho e rodapé reais.
