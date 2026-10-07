---
name: write-adr
description: Escreve um registro de decisão de arquitetura (ADR) em docs/architecture/adr. Use quando uma tarefa exige decisão que nenhum ADR cobre, quando uma decisão aceita precisa mudar, ou quando alguém pede para registrar uma decisão técnica.
---

# Escrever um ADR

## Quando é ADR

- Escolha difícil de reverter: biblioteca central, forma de composição, hospedagem, formato de contrato.
- Mudança em regra de fronteira do `AGENTS.md`.
- Algo que um ADR aceito proíbe ou não previu.

Não é ADR: detalhe de implementação dentro de um app, ou ajuste de teto em `docs/quality/budgets.md` (registre o motivo lá).

## Arquivo

- `docs/architecture/adr/NNNN-titulo-curto.md`, com o próximo número livre.
- Nunca reescreva a decisão de um ADR aceito. Para mudar, escreva um novo e marque o antigo como `substituído por NNNN`.

## Estrutura

```markdown
# ADR NNNN: Título

- Status: proposto
- Data: AAAA-MM-DD

## Contexto
O problema e as restrições. O que já está decidido e não se reabre.

## Opções
Tabela comparando as alternativas reais pelos critérios que importam aqui.

## Decisão recomendada
A escolha, o motivo, e onde a documentação pesa contra ela.

## Consequências
O que fica mais fácil, o que fica mais difícil, o que passa a ser regra.

## Fontes
Links da documentação atual que sustentam cada afirmação.
```

## Regras

- Toda afirmação sobre uma ferramenta vem da documentação atual, com link. Nada de memória.
- O que não foi conferido aparece como "não verificado".
- Traga pelo menos duas opções reais e diga por que as rejeitadas perdem.
- Status começa em `proposto`. Só o autor muda para `aceito`.
- Se a decisão altera regra de fronteira, estrutura ou fluxo, atualize o `AGENTS.md` na mesma mudança, depois da aprovação.
- Se cria pendência, registre em `docs/open-questions.md`.

Nenhuma implementação que dependa do ADR começa antes de ele ser aceito.
