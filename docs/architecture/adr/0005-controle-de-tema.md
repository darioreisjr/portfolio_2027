# ADR 0005: Controle de tema no design system

- Status: **aceito** pelo autor em 2026-10-07
- Data: 2026-10-07

## Contexto

O site ganha um seletor de tema claro/escuro em todos os documentos: páginas Next.js e páginas do shell. Duas regras já aceitas não acomodam isso:

- O ADR 0003 diz que todo componente funciona como melhoria progressiva e que nada acima da dobra depende de um componente para existir. Um botão de tema só faz algo com JavaScript: sem script não há o que alternar.
- O `AGENTS.md` do shell dizia que o shell é o dono da troca de tema. Mas as páginas Next.js também precisam do botão, e um app não importa código de outro.

O que não se reabre: tema por `data-theme` no `<html>`, sistema como padrão, escolha em `localStorage`, script inline antes da primeira pintura e evento tipado (ADR 0003).

## Opções

| Critério               | Botão em cada app                          | Botão no design system, visível sem script         | Botão no design system, oculto até carregar |
| ---------------------- | ------------------------------------------ | -------------------------------------------------- | ------------------------------------------- |
| Código                 | Duas implementações, no shell e no Next.js | Uma                                                | Uma                                         |
| Sem JavaScript         | Depende de cada app                        | Botão aparece e não faz nada                       | Botão não aparece; vale o tema do sistema   |
| Regra do ADR 0003      | Não se aplica                              | Respeitada na letra, com um controle morto na tela | Precisa de exceção registrada               |
| Deslocamento de layout | Depende de cada app                        | Nenhum                                             | Nenhum, com o espaço reservado              |

## Decisão

**O controle de tema é um componente do design system, `<ds-theme-toggle>`, oculto até o upgrade, com o espaço reservado.**

1. Exceção ao ADR 0003: um controle que só funciona com JavaScript pode ficar invisível até o custom element ser definido, desde que reserve o próprio espaço (regra `:not(:defined)` nos tokens) e não seja o maior elemento da dobra. Conteúdo continua sob a regra original: texto e imagem nunca dependem de componente para aparecer.
2. O dono da troca de tema passa do shell para o design system. O componente lê o tema em vigor, aplica `data-theme`, grava a escolha e emite o evento. Shell e Next.js só colocam a tag e o script inline no documento.
3. As constantes do tema (atributo, chave de armazenamento, nome do evento) e o texto do script inline ficam em `packages/contracts`. O pacote exporta o script como texto; não executa API de navegador.

Sem JavaScript, o site segue o tema do sistema, que o CSS dos tokens já resolve sozinho.

## Consequências

- `packages/design-system` passa a depender de `packages/contracts`.
- Todo documento novo precisa do script inline no `<head>` e do `<ds-theme-toggle>`; os dois vêm de pacotes, então não há cópia entre apps.
- Uma futura política de segurança de conteúdo (cabeçalhos do host, ADR 0004) terá de liberar o script inline por hash.
- O rótulo acessível entra por atributo: o design system continua sem ler `packages/content`.

## Fontes

- [Next.js: evitar piscar antes da hidratação](https://nextjs.org/docs/app/guides/preventing-flash-before-hydration), conferido na documentação que acompanha o Next.js 16.3.8 instalado.
- [MDN: `:defined`](https://developer.mozilla.org/docs/Web/CSS/:defined)

Não verificado: comportamento em navegadores sem suporte a custom elements; nesses o botão nunca aparece e o tema do sistema continua valendo.
