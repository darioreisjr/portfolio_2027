# Plano: música de fundo na home

- Status: **aprovado** pelo autor em 2026-10-08 e implementado
- Origem: pedido e entrevista com o autor, `discovery-analyst` e `architect`
- Decisão de arquitetura: `docs/architecture/adr/0008-comportamento-de-uma-rota.md`

**Objetivo:** o visitante liga uma música lofi na home por um botão no grupo fixo do canto, e a escolha fica lembrada no navegador.

## Decisões do autor

| Tema          | Decisão                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Faixa         | "Petals On The Water (full version) Japanese Fusion LoFi", de kaazoom, do Pixabay                       |
| Arquivo       | Versionado no repositório, recodificado para o site, com crédito registrado                             |
| Ajuste        | Volume mais baixo e fade na entrada e na saída, para a repetição não dar tranco                         |
| Início        | Desligada. O visitante liga pelo botão                                                                  |
| Alcance       | Só na home                                                                                              |
| Lembrar       | Sim: quem ligou encontra o botão ligado na visita seguinte, e a música começa no primeiro gesto         |
| Aba escondida | Pausa e volta sozinha                                                                                   |
| Rótulo        | "Música de fundo" ("Background music", "Música de fondo", "Música de fundo"); traduções na pendência B6 |

## Desenho

| Ponto          | Como ficou                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Botão          | `<button aria-pressed>` com o mesmo disco da pausa, à esquerda dela no grupo do canto. Nota musical em SVG; desligada, aparece riscada                           |
| Onde mora      | `music-toggle.tsx`, no app da home (ADR 0008). É montado por `persona-list.tsx` e levado por portal para `#home-music-slot`, o lugar que o layout deixa guardado |
| Sem JavaScript | O botão não existe; o lugar dele fica guardado, vazio                                                                                                            |
| Download       | O `<audio>` nasce sem `src` e com `preload="none"`. A faixa só é pedida quando vai tocar                                                                         |
| Lembrar        | `localStorage`, chave `portfolio:musica`, valor `on`; desligar apaga a chave. Sem sincronia entre abas                                                           |
| Primeiro gesto | Clique ou tecla em qualquer lugar da página, menos no próprio botão. Clicar no botão de uma visita lembrada desliga, sem baixar nada                             |
| Recusa         | Falta de gesto só adia para o próximo. Se o arquivo não puder ser tocado, o botão volta a desligado e nada é lembrado. Nunca há erro no console                  |
| Sair da home   | Outro documento encerra o áudio. Na navegação do Next.js para a comunidade o componente é desmontado e pausa                                                     |
| Economia       | Com `Save-Data` ligado no navegador, a visita lembrada não retoma sozinha                                                                                        |
| Arquivo        | `apps/web-next/public/_home/audio/petals-on-the-water.v1.mp3`: MP3 de 96 kbps, estéreo. A versão no nome substitui o hash; cache de um ano no `vercel.json`      |
| Volume         | Gravado no arquivo, porque o iPhone ignora o volume definido pelo site                                                                                           |
| Servidor local | `scripts/serve-dist.mjs` passou a responder o tipo de `.mp3` e pedidos de intervalo (`Range`)                                                                    |
| WCAG 1.4.2     | Atendido: nada toca sem escolha do visitante e sem gesto, e o botão desliga                                                                                      |

## Um arquivo de script a mais custava o LCP

A primeira versão tinha o botão como Client Component à parte, usado pelo layout. O Next.js gerou um arquivo de script só para ele (0,95 kB), e a home passou a 147,0 kB com LCP de 2,71 a 2,73 s, acima do teto de 2,7 s. Juntar os dois componentes em uma entrada só não bastou: continuou um arquivo a mais. A solução foi o botão nascer dentro de `persona-list.tsx`, que a home já carregava, e ir por portal para o grupo do canto.

## Medido

| Medida                    | Antes         | Depois        | Limite |
| ------------------------- | ------------- | ------------- | ------ |
| JavaScript de `/`         | 146,1 kB      | 146,8 kB      | 150 kB |
| Arquivos de script em `/` | 9             | 9             |        |
| LCP de `/`                | 2,62 a 2,65 s | 2,62 a 2,63 s | 2,7 s  |
| TBT de `/`                | 37 a 45 ms    | 37 a 39 ms    | 200 ms |
| CLS de `/`                | 0,001         | 0,001         | 0,1    |
| Áudio pedido na carga     | 0             | 0             | 0      |

Verificação: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm budgets`, `pnpm test:e2e` (137 testes) e `pnpm lhci`. Os testes da música usam um segundo de silêncio gerado no próprio teste; não dependem da faixa.

## A faixa

O autor baixou o MP3 do Pixabay (256 kbps, 6,0 MB). Ele foi recodificado com o ffmpeg de uma imagem Docker, em contêiner sem rede, para 96 kbps estéreo, com o volume normalizado em -20 LUFS e fade de 0,5 s na entrada e 2 s na saída: 2,25 MB, dentro do teto de 2,5 MB. O original não entrou no repositório. Origem, licença, modificações e o comando estão em `docs/assets-de-terceiros.md`.

Dois testes usam a faixa de verdade: o servidor a entrega como `audio/mpeg`, inteira e em pedaços, e ela toca e avança no navegador, com 187 s de duração. Volume e emenda do loop só dá para julgar ouvindo.

## Em aberto

- Os três revisores do fluxo ainda não passaram por esta mudança.
- Conferir no iPhone e no Safari, que têm política própria de som (B12), e com leitor de tela (B11).
- A licença do Pixabay proíbe distribuir a faixa avulsa. Ela entra modificada, como parte do site e com crédito; isso não é parecer jurídico.

## Fora desta tarefa

Música em outras páginas; controle de volume ou lista de faixas; crédito visível na tela; sincronia entre abas.
