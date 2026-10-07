---
name: project-context
description: Carrega o contexto do portfólio antes de qualquer tarefa. Use no início de toda tarefa neste repositório, antes de planejar, implementar ou revisar, e sempre que houver dúvida sobre escopo, arquitetura ou regras de fronteira.
---

# Contexto do projeto

Leia os documentos antes de agir. Eles decidem; o código segue.

## Ordem de leitura

1. `AGENTS.md` da raiz: visão, estrutura, regras de fronteira, fluxo de trabalho.
2. `docs/open-questions.md`: se a tarefa depende de um item bloqueante, pare e avise.
3. Conforme a tarefa:

| A tarefa envolve | Leia |
|---|---|
| Público, seções, escopo | `docs/product/brief.md` |
| Dados JSON | `docs/content/schema.md` |
| Rotas, qual app faz o quê | `docs/architecture/mfe-map.md` |
| Como os apps se compõem | `docs/architecture/adr/0002-composition.md` |
| Tokens, componentes, temas | `docs/architecture/adr/0003-design-system.md` |
| Build, deploy, caminhos publicados | `docs/architecture/adr/0004-hosting.md` |
| Peso, acessibilidade, SEO | `docs/quality/budgets.md` |

4. O `AGENTS.md` do app ou pacote que será tocado.

## Depois de ler

- Diga em uma ou duas frases o que os documentos decidem sobre a tarefa.
- Se a tarefa contradiz um ADR aceito, não contorne: avise e proponha um ADR novo (skill `write-adr`).
- Se documento e código discordam, avise antes de continuar.
- Se a tarefa pede conteúdo sobre o autor que não existe em `packages/content`, pergunte. Nunca invente.

## Fluxo obrigatório

Explorar, planejar, aprovação humana, implementar, revisar. Sem plano aprovado pelo autor, não há implementação.
