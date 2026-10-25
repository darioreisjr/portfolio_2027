---
name: project-context
description: Carrega o contexto do projeto antes de qualquer tarefa. Use no início de toda tarefa neste repositório, antes de planejar, implementar ou revisar, e sempre que houver dúvida sobre escopo, arquitetura ou regras de fronteira.
---

# Contexto do projeto

Leia os documentos antes de agir. Eles decidem; o código segue.

## Ordem de leitura

1. `AGENTS.md` da raiz: visão, estrutura, regras de fronteira, fluxo de trabalho.
2. `docs/open-questions.md`: se a tarefa depende de um item bloqueante, pare e avise.
3. Conforme a tarefa:

| A tarefa envolve       | Leia                     |
| ---------------------- | ------------------------ |
| <<assunto>>            | <<documento>>            |
| Decisão de arquitetura | `docs/architecture/adr/` |

4. O `AGENTS.md` da pasta que será tocada, se houver.

## Depois de ler

- Diga em uma ou duas frases o que os documentos decidem sobre a tarefa.
- Se a tarefa contradiz uma decisão aceita, não contorne: avise e proponha uma nova (skill `write-adr`).
- Se documento e código discordam, avise antes de continuar.
- Se a tarefa pede conteúdo que não existe no repositório (dados de pessoas, clientes, números), pergunte. Nunca invente.

## Fluxo obrigatório

Explorar, planejar, aprovação humana, implementar, revisar. Sem plano aprovado pelo autor, não há implementação.
