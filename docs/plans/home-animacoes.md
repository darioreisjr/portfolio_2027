# Plano: animações da home e destaque do personagem apontado

- Status: **aprovado** pelo autor em 2026-10-08 e implementado. Ritmo e intensidade aguardam o olho do autor
- Origem: pedido e entrevista com o autor, `discovery-analyst` e `architect`
- Muda parte de `docs/plans/home-selecao.md` (repouso sem escurecer) e de `docs/plans/home-painel-rpg.md` (brilho sem animação contínua)

**Objetivo:** dar à tela de escolha de perfil um ar de jogo: quem está apontado se destaca dos outros, e os momentos do fluxo têm movimento suave. Tudo em CSS, sem biblioteca e sem JavaScript novo.

## Decisões do autor

| Tema     | Decisão                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------- |
| Apontar  | Os outros três personagens ficam escuros e levemente menores                                         |
| Técnica  | CSS, sem biblioteca. A biblioteca Motion pesaria de 15 a 35 kB em uma home que está a 2,4 kB do teto |
| Momentos | Entrada da tela; escolha do personagem; escolhido parado; botões e cliques                           |
| Ritmo    | Suave e cinematográfico: de 0,5 a 0,7 s                                                              |

## O que se move

| Momento            | Como ficou                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apontar            | A figura dos outros três escurece (`brightness(0.45)`) e encolhe para 94%, em 0,5 s. Vale com mouse em tela larga e com foco de teclado. No toque não se aplica |
| Entrada            | O título desce e aparece em 0,7 s. Em tela larga, os quatro personagens sobem 2rem até o lugar, cada um 90 ms depois do anterior                                |
| Escolha            | Um clarão na cor da área atrás da figura; o escolhido desliza para o centro, vindo do lado onde estava; a descrição entra e, em seguida, "Entrar" e "Voltar"    |
| Desfazer           | Os quatro reentram com a animação de entrada                                                                                                                    |
| Parado             | O escolhido respira (escala de 1 a 1,015, em tela larga), o brilho pulsa entre 45% e 60%, e a seta do menu balança na opção em foco ou sob o ponteiro           |
| Cliques            | "Entrar" e "Voltar" afundam ao clicar; o "Entrar" inverte as cores num clarão que se desfaz em 0,5 s                                                            |
| Controles do canto | A bandeira, o disco do som e o da pausa dão um pequeno pulo sob o mouse                                                                                         |

## Onde o resultado difere do pedido

- **"Os outros saem para os lados".** Só com CSS não fica robusto: os três continuariam ocupando lugar enquanto o escolhido já mudou de layout, a página rolaria de lado e ele saltaria duas vezes. Os três somem no corte, sob o clarão, e o que se vê é o escolhido deslizando. A saída literal pede `document.startViewTransition`, que é JavaScript, e fica para uma tarefa própria.
- **"Clarão antes de trocar de página".** O clarão acontece no clique, mas a página não espera ele terminar. Um fade entre páginas existe em CSS (`@view-transition`), só que mudaria todas as navegações do site e não tem suporte confirmado no Firefox; o autor preferiu deixar de fora.
- **Celular.** Os personagens não têm animação de entrada nem respiram lá. A entrada fica de fora para não tocar na imagem do LCP, que é medido no perfil de celular; o respirar, porque no carrossel a figura não muda de tamanho ao ser escolhida. O clarão, o painel em sequência e o pulso do brilho valem no celular.

## Regras que o CSS segue

| Regra              | Como                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LCP                | A imagem do primeiro personagem e os ancestrais dela nunca ficam transparentes: a entrada é só deslocamento, e o primeiro entra sem atraso             |
| Movimento reduzido | Todo movimento novo fica dentro de `prefers-reduced-motion: no-preference`. Escurecer e recuar continuam valendo, na hora, porque são estado           |
| Pausa (WCAG 2.2.2) | "Pausar animação" para também o respirar, o pulso do brilho e a seta. O clarão da escolha, que é curto, termina                                        |
| Área de clique     | Escurecer e pular mexem na imagem, não no link nem no botão. A seta é fundo do miolo do botão                                                          |
| Tokens             | `motion-duration-lg` (0,5 s), `motion-duration-xl` (0,7 s) e `motion-ease-in-out`. O passo de 90 ms e os deslocamentos são medidas locais da tela      |
| Som                | Depois de escolher, entrar ou desfazer, passar o mouse fica mudo por 0,9 s (era 0,25 s): é o tempo em que os personagens ainda se movem sob o ponteiro |

## Medido

| Medida                    | Antes         | Depois        | Limite |
| ------------------------- | ------------- | ------------- | ------ |
| JavaScript de `/`         | 147,6 kB      | 147,6 kB      | 150 kB |
| Arquivos de script em `/` | 9             | 9             |        |
| CSS de `/` (comprimido)   | não medido    | 7,0 kB        | 20 kB  |
| LCP de `/`                | 2,55 a 2,57 s | 2,55 a 2,62 s | 2,7 s  |
| TBT de `/`                | 40 a 55 ms    | 38 a 68 ms    | 200 ms |
| CLS de `/`                | 0,001         | 0,000         | 0,1    |

Verificação: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm budgets`, `pnpm test:e2e` (164 testes) e `pnpm lhci`.

Nos testes, `e2e/support/motion.ts` espera as animações que têm fim antes de medir posição ou cor. Os testes de layout puro rodam com movimento reduzido.

## Em aberto

- Ritmo e intensidade só dá para julgar vendo: escurecimento, tamanho do recuo, duração da entrada.
- Safari e Firefox: `:has()` aninhado, `background-position` animado na seta e o clarão em `:active` no toque (B12).
- O clarão do "Entrar" não aparece com Enter no teclado: `:active` não dispara em link. O som de confirmação cobre.
- Os três revisores do fluxo ainda não passaram por esta mudança.

## Fora desta tarefa

View Transitions, no mesmo documento ou entre páginas; saída literal dos outros para os lados; entrada dos personagens no carrossel; animações nas outras páginas; biblioteca de animação.

## Emenda de 2026-10-09

O "Entrar" da área do recrutador passou a esperar 0,45 s antes de navegar, com a cortina da transição "corte de katana" (ADR 0010, `docs/plans/recrutador-conteudo.md`). Vale só para essa área e só para quem não pediu menos movimento; para os outros casos continua valendo que a página não espera.
