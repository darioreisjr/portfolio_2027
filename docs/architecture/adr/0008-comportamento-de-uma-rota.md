# ADR 0008: Comportamento de uma rota só mora no app dono da rota

- Status: **aceito** pelo autor em 2026-10-08
- Data: 2026-10-08

## Contexto

A home ganha música de fundo, ligada por um botão no grupo fixo do canto. O botão tem comportamento (tocar, pausar, lembrar a escolha) e só existe na home.

O ADR 0006, no item 3, diz que "tudo que tem comportamento continua sendo Web Component" do design system (ADR 0003). Lido ao pé da letra, isso manda o botão para `packages/design-system`, cujo bundle é carregado nas seis rotas: todas pagariam o JavaScript de algo que só uma usa, e a rota `/` está a 3,9 kB do teto.

A regra também já não descrevia o código: `persona-list.tsx`, que escolhe o personagem na home, é comportamento em um Client Component do Next.js desde `docs/plans/home-selecao.md`.

O que não se reabre: Web Components como contrato entre apps (ADR 0002), design system em Lit carregado uma vez por documento (ADR 0003) e o padrão do controle que só funciona com JavaScript (ADR 0005).

## Opções

| Critério                  | Web Component no design system | Client Component no app da rota | Script inline no documento        |
| ------------------------- | ------------------------------ | ------------------------------- | --------------------------------- |
| JavaScript nas seis rotas | Cresce em todas                | Cresce só nas páginas Next.js   | Não entra na conta do orçamento   |
| Estimativa                | 0,9 a 1,3 kB                   | 0,6 a 1,0 kB                    | Cerca de 0,5 kB no HTML           |
| Orçamento                 | Cobrado                        | Cobrado                         | Peso escondido da cobrança        |
| Política de segurança     | Sem efeito                     | Sem efeito                      | Mais um script para liberar (B14) |
| Reuso em outra área       | Pronto                         | Exige promover ao design system | Exige reescrever                  |

## Decisão

**Comportamento usado por uma única rota mora no app dono da rota, na tecnologia dele.**

1. Comportamento usado em mais de um documento ou em mais de um app continua sendo Web Component do design system (ADRs 0003 e 0005). É o caso do seletor de tema.
2. Comportamento de uma rota só fica no app dessa rota. Na home é o Client Component `persona-list.tsx`, que também monta o botão da música (`music-toggle.tsx`). Um segundo uso em outro app promove o comportamento ao design system.
3. Controle que só funciona com JavaScript segue o ADR 0005 também dentro do app: fica invisível até funcionar e reserva o próprio espaço, para não haver controle morto nem deslocamento de layout.
4. Estado guardado no navegador por um app só usa chave com o prefixo `portfolio:` e é definido no próprio app enquanto só ele o ler. Se outro app precisar, a chave vai para `packages/contracts`.
5. Mídia pesada, como áudio, nunca é pedida na carga da página: só depois de um gesto do visitante. Exceção (emenda de 2026-10-08, `docs/plans/home-som-e-bandeiras.md`): na continuação da mesma aba de quem estava com o som ligado (trocar de idioma, recarregar, voltar à home), a página tenta retomar sozinha; a primeira página de uma visita nunca pede áudio.

Este ADR esclarece o item 3 do ADR 0006 sem revogá-lo: ali a frase separa "marcação mais CSS" de "componente"; aqui se define onde mora o componente quando só uma rota o usa.

## Consequências

- A regra de fronteira 5 não muda: elemento reutilizável continua vindo do design system, e um app não recria o que já existe lá.
- O app da rota passa a ter mais de um Client Component; cada um novo pesa nas páginas Next.js e é cobrado por `pnpm budgets`.
- A aparência de um controle local usa os mesmos tokens dos componentes parecidos do design system, para não destoar.
- Promover um comportamento ao design system é mudança de contrato entre apps e segue a skill `new-ds-component`.

## Fontes

- [Next.js: Server e Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components), conferido na documentação que acompanha o Next.js 16.3.8 instalado.
- [MDN: guia de autoplay de mídia](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)

Não verificado: o peso real de cada opção; os números da tabela são estimativas, e a medição fica em `docs/plans/home-musica.md`.
