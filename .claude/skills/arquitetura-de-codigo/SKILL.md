---
name: arquitetura-de-codigo
description: Varre um codebase procurando oportunidades de aprofundamento — refatorações que transformam módulos rasos (interface quase tão complexa quanto a implementação) em profundos (interface pequena escondendo bastante) — apresenta os candidatos num relatório HTML visual com diagramas antes/depois, e então aprofunda junto com o usuário a opção que ele escolher. Use quando o usuário quiser revisar ou melhorar a arquitetura, mapear atrito arquitetural, ou perguntar coisas como "onde a arquitetura está travando?" / "que refatoração vale a pena aqui?".
---

# arquitetura-de-codigo — aprofunde módulos, não reorganize

"Melhorar a arquitetura" quase sempre degenera em refatoração por gosto: quebrar arquivos, adicionar camadas, "limpar". Isso normalmente só **move** a complexidade de lugar — ou pior, adiciona wrappers rasos. O trabalho de verdade é achar **módulos rasos** (a interface é quase tão complexa quanto a implementação — o módulo não esconde quase nada) e **aprofundá-los**: interface pequena, implementação que absorve a complexidade.

O gate contra a refatoração-por-gosto é o **teste da deleção**: só vale mexer num módulo se apagá-lo **concentraria** a complexidade (o resto do sistema fica mais simples) em vez de apenas **realocá-la**. "Concentra" é o sinal que você procura; "só move" não é.

> **Vocabulário** (profundidade e módulo profundo de Ousterhout, *A Philosophy of Software Design*; **seam** de Michael Feathers, *Working Effectively with Legacy Code*) — use com precisão: **módulo**, **interface**, **implementação**, **profundidade** (raso/profundo), **seam** (a costura onde dá pra substituir ou testar), **leak** (implementação vazando pela interface), **leverage** (uma interface, N call sites), **locality** (o que muda junto mora junto). Não troque "módulo" por "component/service", nem "seam" por "boundary" — a precisão do termo é parte do valor.

---

## Processo

### 1. Explore atrás de atrito

Use o Agent tool com `subagent_type=Explore` para caminhar pelo codebase. Não siga heurística rígida — explore e anote onde você sente **atrito**:

- Entender um único conceito exige pular entre muitos módulos minúsculos.
- Módulos **rasos** — interface quase tão complexa quanto a implementação.
- Funções puras extraídas só para testar, enquanto o bug real mora em **como elas são chamadas** (sem **locality**).
- Módulos acoplados que **vazam** pela seam.
- Partes sem teste, ou difíceis de testar pela interface atual.

Em tudo que parecer raso, aplique o **teste da deleção**: apagar isso concentraria a complexidade, ou só a moveria? Um "concentra" é candidato.

### 2. Apresente os candidatos num relatório visual

Escreva um HTML **autocontido** no diretório temp do SO (`$TMPDIR`, com fallback para `/tmp`, ou `%TEMP%` no Windows) como `architecture-review-<timestamp>.html` — **o relatório não vai para o repo**. Abra para o usuário (`xdg-open` no Linux, `open` no macOS, `start` no Windows) e diga o path absoluto.

O visual carrega o peso; a prosa é escassa. Cada candidato é um card com:

- **Arquivos** — quais módulos entram (monospace).
- **Problema** — uma frase. O que dói.
- **Solução** — uma frase. O que muda.
- **Ganhos** — bullets nos termos do vocabulário: *"locality: bugs concentram num módulo"*, *"leverage: uma interface, N call sites"*, *"a interface encolhe; a implementação absorve os wrappers"*. Nunca "mais fácil de manter" ou "código mais limpo" — esses termos não estão no vocabulário e não se justificam.
- **Diagrama antes/depois** — o centro do card. Lado a lado, mostrando a rasez e o aprofundamento.
- **Força da recomendação** — um badge: `Forte` / `Vale explorar` / `Especulativo`.

Feche com uma seção **Recomendação principal**: qual você atacaria primeiro e por quê.

**Ainda não proponha interfaces.** Depois de escrever o arquivo, pergunte: *"Qual dessas você quer explorar?"*

### 3. Aprofunde a escolhida — com o usuário, não sozinho

Escolhido o candidato, faça o mergulho **junto**:

- Quais são as constraints e dependências reais?
- Qual a forma do módulo aprofundado — o que fica **atrás** da seam?
- Quais testes sobrevivem? A interface é onde você testa: uma interface pequena = **um** lugar para testar.
- Regra do adapter: um adapter é uma seam hipotética; **dois** (ex.: HTTP em produção, in-memory no teste) justificam a seam de verdade.
- Antes de cravar a interface, **desenhe-a duas vezes** e compare — a primeira ideia raramente é a mais profunda.

Conforme as decisões solidificam, mantenha o vocabulário do domínio vivo: se um módulo aprofundado ganha o nome de um conceito novo, registre esse termo onde o projeto documenta seu domínio. E se o usuário **rejeita** um candidato por um motivo **durável** (não um "não agora"), ofereça registrar a decisão (um ADR) para que uma próxima revisão não re-sugira a mesma coisa — só quando o motivo seria realmente necessário para o próximo explorador; pule os motivos efêmeros e os óbvios.

---

## Formato do relatório (condensado)

Autocontido, editorial — não dashboard corporativo. Bastante respiro. Uma cor de acento + vermelho para vazamento + âmbar para aviso. Legenda no topo: caixa sólida = módulo, linha tracejada = seam, seta vermelha = leak, caixa grossa e escura = módulo profundo. Sem parágrafo de introdução — direto para os candidatos.

**Padrões de diagrama** (misture-os; não deixe todos iguais):

- **Massa** (para "interface larga demais") — dois retângulos por módulo: a superfície da interface × o tamanho da implementação. *Antes:* interface quase tão alta quanto a implementação (raso). *Depois:* interface baixa, implementação alta (profundo).
- **Colapso de call-graph** — *antes:* uma árvore de chamadas em caixas aninhadas. *Depois:* a mesma árvore colapsada numa caixa só, com as chamadas agora internas esmaecidas dentro dela.
- **Corte transversal** (para rasez em camadas) — faixas horizontais empilhadas: *antes,* 6 camadas finas fazendo quase nada; *depois,* 1 faixa grossa com a responsabilidade consolidada.

Mantenha os diagramas em ~320px de altura para antes/depois caberem lado a lado sem rolar. **Se um diagrama só faz sentido com um parágrafo ao lado, o diagrama está errado — redesenhe.**

> Para o HTML em si, duas rotas: (a) reaproveitar a abordagem da skill **`geracao-de-tutorial`** (SVG semântico, dark/light, acessível, autocontido) quando quiser um relatório caprichado; ou (b) Tailwind + Mermaid via CDN, que resolvem layout e grafos (call graphs, dependências, sequências) rápido. Misture SVG à mão para os visuais mais editoriais (massa, corte transversal) — não deixe tudo com cara de Mermaid.

## Tom

Português direto e conciso — mas os substantivos e verbos de arquitetura vêm do vocabulário acima, sem drift. Sem hedging, sem "vale notar que…". Se uma frase pode virar bullet, vira bullet. Se um bullet pode ser cortado, corte. Se um termo não está no vocabulário, procure um que esteja antes de inventar um novo.
