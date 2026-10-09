# Plano: pop-up de imersão, três idiomas e retomada da música

- Status: **aprovado** pelo autor em 2026-10-09 e implementado. A aparência aguarda o olho do autor
- Origem: pedido e entrevista com o autor, `discovery-analyst` e `architect`
- Emenda os ADRs 0006, 0007 e 0008. Muda parte de `docs/plans/home-som-e-bandeiras.md` (quem liga o som na primeira visita)

**Objetivo:** quem chega à home pela primeira vez escolhe o idioma e diz se quer a experiência completa, com música e animações, em uma caixa no estilo de menu de jogo. O site passa a ter três idiomas.

## Decisões do autor

| Tema      | Decisão                                                                                       |
| --------- | --------------------------------------------------------------------------------------------- |
| pt-PT     | Removido. Ficam pt-BR, en e es. Os endereços `/pt-pt/...` respondem 404, sem redirecionamento |
| Push      | Sempre com a conta `darioreisjr` do GitHub (skill `commits`)                                  |
| Pop-up    | Só na primeira visita; a resposta fica guardada e ele não volta                               |
| Frase     | "Ativar imersão total", com a linha "Música e animações ligadas"; desmarcada por padrão       |
| Alcance   | A escolha das animações vale só na home. As páginas internas não mudam                        |
| Bandeiras | Trocam de idioma na hora: a página recarrega e o pop-up volta traduzido                       |
| Música    | Ao trocar de idioma, retoma do mesmo ponto (a página recarrega)                               |

## Como o pop-up funciona

| Situação                        | O que acontece                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| Primeira visita à home          | O pop-up abre sobre a tela, com o foco no "Começar". O resto da página fica fora de alcance      |
| Caixa marcada e "Começar"       | A música liga (o clique é o gesto que o navegador exige) e as animações rodam                    |
| Caixa desmarcada e "Começar"    | Som desligado e animações contínuas pausadas, como pelo botão de pausa                           |
| Esc                             | Fecha valendo a caixa como estiver. Pelo Esc o navegador pode recusar o som até o próximo gesto  |
| Clique fora                     | Não fecha                                                                                        |
| Bandeira                        | Link comum para a home no outro idioma (ADR 0006); sem resposta ainda, o pop-up reabre lá        |
| Visitas seguintes               | O pop-up não volta. A pausa lembrada é reaplicada; o som volta no primeiro gesto de quem o ligou |
| Botão de pausa do canto         | Continua valendo, e cada mudança atualiza o que fica lembrado                                    |
| Movimento reduzido no sistema   | O pop-up aparece e a dica vira "Música ligada": as animações seguem desligadas pelo sistema      |
| Sem JavaScript                  | O pop-up não aparece; a home funciona como antes                                                 |
| Navegador sem armazenamento     | O pop-up não aparece, porque não haveria como lembrar a resposta                                 |
| Som lembrado de antes do pop-up | Cliques dentro do pop-up não religam o som; recusar a imersão apaga a escolha antiga             |

## Como foi feito

- **Marcação:** um `<dialog>` nativo, renderizado no servidor por `home-stage.tsx`, fechado. Foco, Esc, camada superior e o resto da página inerte vêm do navegador.
- **Comportamento:** `apps/web-next/lib/intro.ts`, chamado por `persona-list.tsx`, que continua sendo a única entrada de Client Component. Sem arquivo de script novo.
- **Chave:** `portfolio:home-animacoes`, com `on` ou `off`. Ausente significa "ainda não respondeu". Só a home lê (ADR 0008, item 4).
- **Som:** o botão de som expõe uma função por `ref`; o pop-up a chama ao fechar.
- **Aparência:** `home.css`, só com tokens. O "Começar" reusa o botão de cantos cortados do painel do personagem. O véu é cor sólida translúcida.
- **Textos:** `intro` em `home/<locale>.json`. Os de en e es são proposta (pendência B6).

### Pausa lembrada

A pausa continua sendo uma caixa nativa lida pelo CSS. Quem a marca na visita seguinte é o script da home, depois de carregar: o cenário pode se mover por um instante antes de parar. A alternativa, um script no `<head>`, levaria uma chave só da home para o pacote de contratos e para o shell, e o ADR 0008 já tinha preterido script inline.

### Testes

Todos os specs começam com a resposta já dada (`storageState` em `playwright.config.ts`); a primeira visita é coberta por `e2e/home-intro.spec.ts`. Nenhum teste existente foi afrouxado.

## Remoção do pt-PT

A lista de idiomas vem de `packages/contracts/src/routes.ts`; rotas, textos, bandeira, o tipo `Localized`, testes e documentos acompanharam. O seletor do canto abre duas bandeiras. Os ADRs 0006 e 0007 ganharam emenda datada. Os planos antigos em `docs/plans/` são históricos e não foram reescritos.

## Retomada da música

No build de produção a retomada ao trocar de idioma já funcionava (conferido no Chrome com a política de autoplay real). O defeito aparecia só no `pnpm dev`: o React, em desenvolvimento, monta o botão duas vezes, e a limpeza da primeira montagem apagava a marca `portfolio:musica-tempo`. A limpeza agora só grava a marca; quem apaga é o desligar e a saída da página.

## Medido (2026-10-09)

| Item                      | Antes                | Depois               | Teto   |
| ------------------------- | -------------------- | -------------------- | ------ |
| JavaScript de `/`         | 147,6 kB             | 147,9 kB             | 150 kB |
| Arquivos de script de `/` | 9                    | 9                    | 9      |
| LCP de `/` (com o pop-up) | 2,58 a 2,63 s        | 2,56 a 2,63 s        | 2,7 s  |
| Elemento do LCP de `/`    | imagem do personagem | imagem do personagem |        |
| CLS de `/`                | 0                    | 0                    | 0,1    |

O Lighthouse abre a home sem armazenamento, ou seja, mede com o pop-up aberto. As bandeiras dos outros dois idiomas só são pedidas quando o pop-up abre, depois do LCP.

## Pendências

- Revisão do autor dos textos do pop-up em en e es (B6).
- Leitor de tela: anúncio do diálogo, da caixa com a dica e das bandeiras (B11).
- Firefox, Safari e celular de verdade: cor do véu por `color-mix()` no `::backdrop` e som ligado pelo "Começar" (B12).
