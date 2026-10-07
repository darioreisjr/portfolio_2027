# Plano: escolher o personagem na própria home

- Status: **aprovado** pelo autor em 2026-10-07 e implementado
- Origem: pedido e entrevista com o autor, `discovery-analyst` e `architect`
- Substitui parte de `docs/plans/home-perfis.md` (destaque com cartão, resumo da área, toque duplo)

**Objetivo:** a home responde a uma pergunta só, "Escolha seu caminho". Em repouso mostra os quatro personagens e mais nada. A frase de cada um aparece sobre a parte de baixo da figura. Clicar escolhe o personagem na mesma página: os outros somem e fica só ele, com a frase, a tecnologia e o "Entrar".

## Decisões do autor

| Tema                      | Decisão                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Cartão sob o personagem   | Sai. Nada aparece abaixo da figura ao passar o mouse                                                 |
| Resumo da área            | Sai da home                                                                                          |
| Frase                     | Sobre a figura, na parte de baixo. Em tela larga com mouse, só ao passar o mouse ou focar            |
| Tablet (tela larga, dedo) | Frase sempre visível, como no celular                                                                |
| Clique                    | Escolhe na mesma página: os outros somem e o escolhido fica com frase, selo de tecnologia e "Entrar" |
| Desfazer                  | Botão "Voltar", tecla Esc, clicar fora ou clicar de novo no personagem escolhido                     |
| Celular                   | Carrossel com a frase; tocar escolhe                                                                 |
| "Voltar" nos idiomas      | "Voltar", "Back", "Volver", "Voltar": propostas, entram na revisão de traduções (B6)                 |

## Desenho

| Ponto           | Como ficou                                                                                                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estrutura       | Cada `<li>` tem o personagem (`a.persona`: figura e frase na mesma célula de grid) e o painel `.persona-actions` (selo, "Entrar", "Voltar"), que nasce com `hidden`                                                     |
| Sem JavaScript  | O personagem é um link comum para a área e o painel nunca aparece                                                                                                                                                       |
| Com JavaScript  | `persona-list.tsx` dá ao personagem `role="button"` e `aria-expanded`, e trata clique, Espaço, Esc, clique fora e setas. O estado fica em atributos (`data-selected`, `hidden`); o CSS faz o resto, sem estado do React |
| Personagem      | Sempre `<a>`, mesmo na comunidade: o `<Link>` do Next.js navegaria antes de a lista tratar o clique. O "Entrar" usa `<Link>` quando a área é do próprio app                                                             |
| Foco            | Ao escolher, vai para o "Entrar", descrito pela frase e pela tecnologia. Ao desfazer, volta ao personagem                                                                                                               |
| Atalhos de link | Ctrl, Shift, Alt ou Meta com clique abrem a área como em qualquer link. Duplo clique escolhe uma vez só                                                                                                                 |
| Tela larga      | Os outros saem com `display: none`; o escolhido vai para o centro, maior (até 28rem), com o painel ao lado                                                                                                              |
| Celular         | Os outros ficam com `visibility: hidden` e a rolagem do carrossel trava; o painel já tinha o espaço reservado, então a figura não muda de lugar nem de tamanho                                                          |
| Contraste       | A frase usa só `--color-text` sobre a névoa. Teste novo em `packages/tokens` cobre a névoa sobre preto e sobre branco; o e2e mede os pixels com a arte atrás                                                            |
| Conteúdo        | Chave nova `back` em `home/<locale>.json`. `ui.areas.<area>.description` deixou de ser usada pela home                                                                                                                  |
| Movimento       | A frase surge com transição de opacidade e o escolhido entra com um esmaecer curto; os dois desligam com movimento reduzido                                                                                             |

## Medido

| Medida                   | Antes    | Depois     | Limite |
| ------------------------ | -------- | ---------- | ------ |
| JavaScript de `/`        | 145,9 kB | 146,1 kB   | 150 kB |
| Performance (Lighthouse) | 98       | 98         | 90     |
| LCP                      | 2,4 s    | 2,4 s      | 2,5 s  |
| TBT                      | 45 ms    | 45 a 58 ms | 200 ms |
| CLS                      | 0        | 0          | 0,1    |
| Acessibilidade           | 100      | 100        | 100    |

Verificação: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm budgets`, `pnpm test:e2e` (83 testes) e `pnpm lhci`.

## Em aberto

- Os três revisores do fluxo ainda não passaram por esta mudança.
- Testar com VoiceOver e TalkBack o anúncio do personagem como botão que expande e o foco no "Entrar" (B11).
- Conferir em aparelho de verdade, no Firefox e no Safari.
- O LCP continua a 0,1 s do limite (B10).
