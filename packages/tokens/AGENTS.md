# packages/tokens

Tokens de design em propriedades CSS customizadas, em três camadas (ADR 0003).

## Convenções

- Fonte: `src/tokens.mjs`. O arquivo `dist/tokens.css` é gerado; não edite.
- Primitivos só aparecem aqui. Apps e componentes usam semânticos e de componente.
- Token semântico de cor tem valor nos temas claro e escuro; o teste cobra isso.
- `color-area-<área>` é a cor da tecnologia que serve cada área, em um tom por tema, e `color-on-area` é o texto sobre ela. O teste cobra 4,5:1 para o texto sobre a cor, 4,5:1 da cor sobre a superfície (ela é cor de título na tela "em construção") e 3:1 contra o céu da home. Cor nova de área entra nessa lista do teste.
- `color-pattern-ink` é a tinta escura dos padrões, como o xadrez da área do recrutador, ao lado da cor da área.
- Token de componente aponta só para semânticos.
- Componente novo do design system ganha aqui a regra `:not(:defined)` que reserva o espaço dele antes do upgrade (em `scripts/build.mjs`).
- Elemento sem comportamento, como o grupo `ds-dock` e o seletor de idioma, tem a aparência definida aqui, em `scripts/build.mjs`, sem custom element (ADR 0006).
- A fonte do site (M PLUS Rounded 1c, só o alfabeto latino, pesos 400 e 700) vem de `@fontsource/m-plus-rounded-1c`. O build copia os dois `.woff2` para `dist/fonts/`, publicados em `/_ds/fonts/`, e gera o `@font-face` e a face de reserva com `size-adjust`. Sem pré-carga (ver `docs/quality/budgets.md`).
- Movimento: `motion-duration-md` (0,2 s) é o dos controles; `motion-duration-lg` (0,5 s), `motion-duration-xl` (0,7 s) e `motion-ease-in-out` são os de cena. O pulo `ds-hop`, dos controles do grupo do canto, é definido em `scripts/build.mjs` e vale em todo documento.
- Sem dependência de framework.

## Comandos

| Comando                                 | O que faz                                 |
| --------------------------------------- | ----------------------------------------- |
| `pnpm --filter @portfolio/tokens build` | Gera `dist/tokens.css` e os nomes tipados |
| `pnpm --filter @portfolio/tokens test`  | Testes das camadas e dos temas (Vitest)   |
