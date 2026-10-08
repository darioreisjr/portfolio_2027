# Plano: efeitos sonoros de seleção na home

- Status: **aprovado** pelo autor em 2026-10-08 e implementado. Timbre e volume aguardam o ouvido do autor
- Origem: pedido e entrevista com o autor, `discovery-analyst` e `architect`
- Decisão de arquitetura: a mesma do ADR 0008 (comportamento de uma rota mora no app da rota)

> Mudou em 2026-10-08 (`docs/plans/home-som-e-bandeiras.md`): o botão só aparece ligado com som de fato, nasce desligado mesmo com a escolha lembrada, e a página tenta retomar o som ao trocar de idioma na mesma aba. Onde este plano diz que o botão "já vem ligado" ou que dá para desligar antes de ouvir, vale o plano novo.

> Mudou em 2026-10-08 (`docs/plans/home-animacoes.md`): o silêncio do "passar o mouse" depois de escolher passou de 250 ms para 0,9 s, e ligar o som não o provoca mais.

**Objetivo:** com o botão de som do canto ligado, a home toca notas curtas de corda dedilhada ao passar pelos personagens, escolher, entrar e voltar, no clima de menu de jogo japonês.

## Decisões do autor

| Tema         | Decisão                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------- |
| Origem       | Sons gerados pelo próprio site, no navegador, sem arquivo                                         |
| Liga-desliga | O botão da música vira o botão de "Som": ligado toca música e efeitos; desligado é silêncio total |
| Gestos       | Passar o mouse nos personagens; escolher; passar entre "Entrar" e "Voltar"; clicar em cada um     |
| Teclado      | Chegar em um personagem ou em uma opção pelo teclado soa como passar o mouse                      |
| Celular      | Só os sons de toque; nada ao deslizar o carrossel                                                 |
| Faixa falha  | O botão continua ligado e os efeitos tocam; só a música fica de fora                              |

## Os sons

Escala In (Miyako-bushi) a partir de Ré 4. As notas são semitons sobre uma constante só, `ROOT`, em `apps/web-next/lib/sfx.ts`: transpor tudo é trocar um número.

| Gesto                                                 | Notas                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| Passar por um personagem (1 a 4)                      | Lá 4 (440 Hz), Si bemol 4 (466), Ré 5 (587), Mi bemol 5 (622) |
| Passar por "Entrar" ou "Voltar"                       | Sol 5 (784 Hz)                                                |
| Escolher um personagem                                | A nota dele e a oitava acima, com 70 ms entre elas            |
| "Entrar"                                              | Ré 5, Sol 5, Ré 6, com 60 ms entre elas                       |
| Desfazer ("Voltar", Esc, clicar fora, clicar de novo) | Mi bemol 4 e Ré 4, com 80 ms entre elas                       |
| Ligar o som                                           | Lá 5 (880 Hz)                                                 |

Timbre de cada nota: onda dente de serra, que começa 20 cents acima e assenta em 50 ms (o puxão da corda); filtro passa-baixa que fecha de 6 para 1,5 vezes a frequência em 120 ms; volume que sobe em 4 ms e morre em 0,18 a 0,45 s. Volume geral em 0,15, baixo, porque os efeitos somam com a música.

## Desenho

| Ponto              | Como ficou                                                                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onde mora          | `lib/sfx.ts`, importado por `persona-list.tsx` e por `music-toggle.tsx`: sai no arquivo de script que a home já carregava                                            |
| Estado             | O botão de som é o único que liga e desliga os efeitos (`setSound`). Desligado, não há som nem contexto de áudio                                                     |
| Contexto de áudio  | Criado só dentro de um gesto (clique ou tecla) e só com o som ligado. Nunca na carga                                                                                 |
| Antes do gesto     | Na visita com o som lembrado, passar o mouse fica mudo até o primeiro clique ou tecla: é regra do navegador                                                          |
| Passar o mouse     | `pointerover` na lista, só para mouse. Mover dentro do mesmo elemento não repete; menos de 30 ms entre dois toques, o segundo é ignorado                             |
| Foco               | Soa só com foco de teclado (`:focus-visible`). O foco que o site move ao escolher e ao desfazer não soa: ali quem soa é o confirmar ou o cancelar                    |
| Depois de escolher | Por 250 ms, "passar o mouse" não soa: os personagens mudam de lugar e o navegador avisa que o ponteiro entrou em quem foi parar embaixo dele                         |
| "Entrar"           | O som toca no clique, sem atrasar a navegação. Nas três áreas do shell a página troca e o som pode ser cortado                                                       |
| Sair da home       | Na navegação do Next.js para a comunidade os efeitos param e o contexto fecha depois da última nota                                                                  |
| Rótulo             | "Som" / "Sound" / "Sonido" / "Som". O campo `music` e a chave `portfolio:musica` ficaram, para não perder a escolha de quem já tinha ligado. O ícone continua a nota |
| WCAG 1.4.2         | Atendido: nenhum efeito passa de meio segundo, nada toca sem o visitante ter ligado, e o botão desliga tudo                                                          |

## Medido

| Medida                    | Antes         | Depois        | Limite |
| ------------------------- | ------------- | ------------- | ------ |
| JavaScript de `/`         | 146,8 kB      | 147,5 kB      | 150 kB |
| Arquivos de script em `/` | 9             | 9             |        |
| LCP de `/`                | 2,62 a 2,63 s | 2,61 a 2,64 s | 2,7 s  |
| TBT de `/`                | 37 a 39 ms    | 37 a 39 ms    | 200 ms |
| CLS de `/`                | 0,001         | 0,001         | 0,1    |

Verificação: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm budgets`, `pnpm test:e2e` (148 testes) e `pnpm lhci`.

Os testes de `e2e/home-sfx.spec.ts` espionam a API de áudio do navegador e conferem quais notas cada gesto dispara, sem nenhum código de teste no site. Um teste cobra que a home continue com nove arquivos de script.

## Em aberto

- Timbre, volume e se a escala combina com a faixa só dá para julgar ouvindo. Se a In brigar com a música, a alternativa é a escala Yo.
- Os três revisores do fluxo ainda não passaram por esta mudança.
- Leitor de tela: a nota ao focar pelo teclado pode competir com a fala (B11).
- iPhone e Safari: a chave de silêncio cala os efeitos, mas não a música; conferir em aparelho (B12).

## Fora desta tarefa

Controle de volume; botões separados para música e efeitos; som nos controles do canto ou em outras páginas; som ao deslizar o carrossel; atrasar a navegação do "Entrar" para o som terminar.
