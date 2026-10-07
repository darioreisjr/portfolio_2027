# Plano: home como tela de escolha de perfil

- Status: **aprovado** pelo autor em 2026-10-07 e implementado
- Origem: entrevista com o autor, `discovery-analyst` e `architect`

**Objetivo:** `/`, `/en/`, `/es/` e `/pt-pt/` são um palco com quatro personagens que levam às áreas do recrutador, técnica, do cliente e da comunidade.

## Decisões do autor

| Tema                 | Decisão                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| Personagens          | Avatares de corpo inteiro. Silhuetas provisórias agora; arte final e estilo depois, fornecidos pelo autor |
| Layout em tela larga | Palco: ninguém em destaque até apontar ou focar; o destacado cresce e os outros recuam                    |
| Layout no celular    | Carrossel, um personagem por vez, com a legenda sempre visível                                            |
| Texto de cada perfil | Frase em primeira pessoa, uma linha de resumo da área e selo com a tecnologia                             |
| Frases               | "Estou contratando", "Quero ver o código", "Tenho um projeto", "Vim aprender e trocar ideias"             |
| Chamada              | "Escolha seu caminho"                                                                                     |
| Apresentação         | Linha discreta acima: "Dario Reis, desenvolvedor full-stack"                                              |
| Toque e teclado      | Em tela larga, o primeiro toque destaca e o segundo abre; Tab e setas destacam, Enter abre                |
| Retorno              | A tela aparece sempre na home; nada é lembrado                                                            |
| Movimento            | Transição suave em CSS, desligada com movimento reduzido                                                  |
| "Como foi feito"     | Link discreto abaixo do palco                                                                             |
| Traduções            | Ficam como proposta; o autor revisa depois                                                                |

## Desenho

| Ponto          | Como ficou                                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estrutura      | Cada personagem é um link inteiro. Áreas do shell usam `<a>`; a comunidade usa `<Link>`                                                                           |
| Destaque       | Só CSS: `:hover` (onde há ponteiro), `:focus-visible` e `[data-active]`; os outros recuam com `:has()`                                                            |
| JavaScript     | Um Client Component, `persona-list.tsx`: primeiro toque em tela larga, setas do teclado e a posição do carrossel. Sem JavaScript, cada personagem é um link comum |
| Acessibilidade | Frase, resumo e selo ficam sempre no DOM; antes do destaque somem só da vista                                                                                     |
| Silhuetas      | Quatro SVG em `apps/web-next/public/_home/personas/`, decorativos (`alt=""`)                                                                                      |
| Textos         | `packages/content/data/home/<locale>.json`, módulo `@portfolio/content/home`. Fora de `ui` para não pesar nos MFEs                                                |
| Resumo da área | `ui.areas.<area>.description`, que já existia                                                                                                                     |
| Tecnologia     | Campo novo `framework` na tabela de rotas de `packages/contracts`                                                                                                 |
| Nome e cargo   | `profile.json`, ainda `draft`. `tagline` e `summary` passaram a ser opcionais                                                                                     |
| Tokens novos   | Anel de foco, duração e curva de movimento, espaços maiores, um tamanho de texto                                                                                  |

## Como a arte final entra

Troque os quatro arquivos em `apps/web-next/public/_home/personas/` mantendo os nomes (`recruiter`, `tech`, `client`, `community`), o formato SVG e a proporção 120 por 320. Nenhum código muda. Se a arte vier em PNG ou WebP, a extensão muda em um lugar, `apps/web-next/lib/home.ts`, e o peso precisa ser medido de novo com `pnpm lhci`.

## Medido

| Medida                   | Antes    | Depois   | Limite   |
| ------------------------ | -------- | -------- | -------- |
| JavaScript de `/`        | 144,2 kB | 144,6 kB | 150 kB   |
| Performance (Lighthouse) | 99       | 98       | 90       |
| LCP                      | 2,1 s    | 2,2 s    | 2,5 s    |
| TBT                      | 38 ms    | 102 ms   | 200 ms   |
| CLS                      | 0        | 0        | 0,1      |
| Acessibilidade e SEO     | 100      | 100      | 100 e 95 |

## Fora desta tarefa

Arte final, botão de tema, troca de idioma (as homes dos outros idiomas seguem sem link a partir de `/`), cabeçalho e rodapé reais, `hreflang`, título da página com o nome do autor, componente de botão no design system.

## Pendências que ficaram

- O autor revisa as traduções da home e do cargo. Enquanto o perfil for `draft`, a linha com nome e cargo só aparece em desenvolvimento (`pnpm dev`).
- `budgets.md` cita 130 kB para a parte "Página Next.js", sem cobrança em `budgets.json`; o medido é perto de 138 kB. Falta decidir entre corrigir a linha, removê-la ou cobrar.
- O LCP e o TBT de `/` ficaram mais perto do limite. Medir de novo quando a arte final chegar.
