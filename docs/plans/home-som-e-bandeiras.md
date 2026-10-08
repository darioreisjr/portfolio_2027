# Plano: som que continua ao trocar de idioma, botão que diz a verdade e bandeiras em lista

- Status: **aprovado** pelo autor em 2026-10-08 e implementado
- Origem: relato de defeito e pedido do autor, `discovery-analyst` e `architect`
- Emenda os ADRs 0006 (seletor de idioma) e 0008 (item 5, áudio na carga)

**Objetivo:** três ajustes pedidos depois de usar o site com som.

## O que o autor viu e pediu

| Tema      | Antes                                                                               | Decisão                                                                                         |
| --------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Idioma    | Trocar de idioma abre outro documento: música e efeitos paravam                     | A página nova tenta continuar sozinha, do ponto onde a música estava                            |
| Botão     | Na visita com o som lembrado, e depois de trocar de idioma, aparecia ligado sem som | Só aparece ligado com som de fato. Se o navegador bloquear, fica desligado até o primeiro gesto |
| Bandeiras | As quatro sempre à vista                                                            | Só a do idioma em uso; um clique abre as outras três em coluna, para cima                       |

## Som

| Ponto                 | Como ficou                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dois estados          | "Quer som" (escolha lembrada em `localStorage`, chave `portfolio:musica`) e "há som agora" (o que `aria-pressed` e os efeitos refletem). Antes eram a mesma coisa         |
| Botão                 | Nasce sempre desligado. Liga quando o som começa de verdade                                                                                                               |
| Visita nova lembrada  | Nada toca nem é baixado na carga. O primeiro clique ou tecla em qualquer lugar liga o som                                                                                 |
| Mesma aba             | Ao sair de uma página com o som ativo, a posição da música vai para `sessionStorage` (`portfolio:musica-tempo`). A página seguinte, com essa marca, tenta tocar sem gesto |
| Se o navegador deixar | Botão ligado, música do ponto onde estava e efeitos funcionando. É o caso do Chrome, que leva a permissão de som para a navegação seguinte                                |
| Se bloquear           | Botão desligado; o primeiro gesto liga. Esperado no Safari e talvez no Firefox                                                                                            |
| Desligar              | Apaga a escolha e a marca: a página seguinte não tenta nada                                                                                                               |
| Aba escondida         | A música pausa e volta sozinha; o botão continua ligado, porque é pausa e não desligar                                                                                    |
| Economia de dados     | Com `Save-Data`, nada é retomado sozinho; o botão funciona                                                                                                                |

Consequência aceita pelo autor: na visita com o som lembrado não há mais como desligar antes de ouvir. O botão aparece desligado, o primeiro gesto liga, e a pessoa desliga depois.

A marca vale para qualquer continuação na mesma aba: trocar de idioma, recarregar ou voltar à home vindo de outra área.

## Bandeiras

| Ponto          | Como ficou                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Marcação       | `<nav aria-label>` com `<details class="ds-language-switcher">`. O `<summary>` é a bandeira do idioma em uso; a lista tem os outros três links |
| Sem JavaScript | Funciona igual: abrir e fechar é do próprio `<details>`                                                                                        |
| Fechar         | Só clicando de novo na bandeira. Esc e clique fora não fecham: exigiriam script em todas as rotas                                              |
| Idioma em uso  | Nome acessível pelo texto alternativo da bandeira; anel de destaque como antes. Deixou de ser link e de levar `aria-current`                   |
| Aberta         | Coluna acima da bandeira, alinhada à direita, sobre um fundo arredondado. Flutua: o grupo do canto não muda de tamanho                         |
| Download       | Fechada, só a bandeira em uso é baixada; as outras três só ao abrir                                                                            |
| Celular        | A coluna aberta cobre parte do canto, inclusive do painel do personagem, enquanto estiver aberta. Aceito pelo autor                            |

## Medido

| Medida                     | Antes         | Depois        | Limite |
| -------------------------- | ------------- | ------------- | ------ |
| JavaScript de `/`          | 147,5 kB      | 147,6 kB      | 150 kB |
| Arquivos de script em `/`  | 9             | 9             |        |
| Bandeiras pedidas na carga | 4             | 1             |        |
| LCP de `/`                 | 2,61 a 2,64 s | 2,55 a 2,57 s | 2,7 s  |
| TBT de `/`                 | 37 a 39 ms    | 40 a 55 ms    | 200 ms |
| CLS de `/`                 | 0,001         | 0,001         | 0,1    |

O LCP caiu porque três bandeiras deixaram de ser pedidas na carga.

Verificação: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm budgets`, `pnpm test:e2e` (154 testes) e `pnpm lhci`. O teste da troca de idioma usa a faixa de verdade e confere, sem nenhum gesto na página nova, botão ligado e música andando a partir do ponto salvo. O ramo bloqueado é simulado fazendo o navegador de teste recusar o som até o primeiro clique.

## Em aberto

- Safari e Firefox: se retomam sozinhos ou esperam o gesto; conferir em aparelho (B12).
- Leitor de tela no `<summary>` com imagem (B11).
- Os três revisores do fluxo ainda não passaram por esta mudança.

## Fora desta tarefa

Fechar a lista de bandeiras com Esc ou clique fora; som fora da home; sincronia entre abas; detecção automática de idioma.
