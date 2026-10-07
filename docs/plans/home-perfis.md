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

Cada personagem tem uma entrada na tabela `figures` de `apps/web-next/lib/home.ts`, com arquivo, largura e altura. A arte chega em PNG grande; ela é aparada nas bordas transparentes, reduzida para 720 px de altura e salva em WebP em `apps/web-next/public/_home/personas/`. Depois, atualiza-se a entrada e mede-se de novo com `pnpm lhci`.

A primeira arte final entrou em 2026-10-07: o recrutador ("Estou contratando", feito em Vue). O PNG de 1 MB (1086 por 1448) virou um WebP de 49 kB (287 por 720). A segunda, do técnico ("Quero ver o código", feito em Angular), entrou no mesmo dia.

Com duas imagens em WebP o LCP da home passou do limite (2,54 s de 2,5 s). As duas passaram a ser servidas em AVIF, com 24 kB cada, e o WebP ficou de reserva para navegadores sem AVIF; o LCP voltou para 2,3 s. Só a primeira imagem carrega com prioridade.

## Medido

O JavaScript é estável entre execuções; os números do Lighthouse variaram bastante em três execuções na mesma máquina, então valem como faixa.

| Medida                   | Antes    | Depois      | Limite   |
| ------------------------ | -------- | ----------- | -------- |
| JavaScript de `/`        | 144,2 kB | 144,7 kB    | 150 kB   |
| Performance (Lighthouse) | 99       | 97 a 100    | 90       |
| LCP                      | 2,1 s    | 1,6 a 2,3 s | 2,5 s    |
| TBT                      | 38 ms    | 59 a 150 ms | 200 ms   |
| CLS                      | 0        | 0           | 0,1      |
| Acessibilidade e SEO     | 100      | 100         | 100 e 95 |

## Revisão

Os três revisores do fluxo não acharam bloqueio. Aplicado depois da revisão: recuo do carrossel como propriedade local, token sem uso removido, pontinhos com mais contraste, link "Como foi feito" respeitando o dono da rota, caminho dos arquivos da home como constante em `packages/contracts`, destaque único (foco e toque não deixam dois personagens destacados), só dedo conta como toque, e o foco acompanha o primeiro toque.

Em aberto, por depender de decisão do autor ou de teste em aparelho:

- Manter a frase de cada personagem sempre visível em tela larga, em vez de só no destaque. Ajuda quem usa tablet e controle por voz, e reduz a dependência das silhuetas, que têm pouco contraste entre si.
- Conferir em iPad com VoiceOver e em Android com TalkBack se o primeiro toque de um leitor de tela abre a área ou só destaca.
- Nome acessível de cada link: hoje junta frase, resumo e selo.

## Fora desta tarefa

Arte final, botão de tema, troca de idioma (as homes dos outros idiomas seguem sem link a partir de `/`), cabeçalho e rodapé reais, `hreflang`, título da página com o nome do autor, componente de botão no design system.

## Pendências que ficaram

- O autor revisa as traduções da home e do cargo. Enquanto o perfil for `draft`, a linha com nome e cargo só aparece em desenvolvimento (`pnpm dev`).
- `budgets.md` cita 130 kB para a parte "Página Next.js", sem cobrança em `budgets.json`; o medido é perto de 138 kB. Falta decidir entre corrigir a linha, removê-la ou cobrar.
- Medir LCP e TBT de novo quando a arte final chegar.
