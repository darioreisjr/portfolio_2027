---
name: seguranca
description: Como tratar alertas de segurança (code scanning, alertas de dependências, segredos vazados) e como escrever código que não os gere. Use ao receber um alerta de segurança, quando o merge for recusado por uma checagem de segurança, ao mexer em entrada de usuário, HTML gerado, autenticação, workflows de CI ou dependências, ou quando o autor pedir uma revisão de segurança.
---

# Segurança

Quem revisa é o subagente `security-reviewer`, só de leitura.

## Onde está o risco neste projeto

<<Uma ou duas frases: tem backend? login? formulário? dados pessoais? Onde o projeto é exposto.>>

## O que o repositório cobra

| Ferramenta                | Onde roda    | O que faz                   |
| ------------------------- | ------------ | --------------------------- |
| <<CodeQL, Dependabot...>> | <<workflow>> | <<o que bloqueia ou avisa>> |

## Triar um alerta

Para cada alerta, responda nesta ordem e escreva a resposta na issue:

1. **É alcançável?** De onde vem o valor: constante do código, configuração, entrada de usuário, entrada de quem abre um PR. Só constante do código é risco baixo, nunca "nenhum".
2. **O que um atacante faria?** Uma frase.
3. **Qual a correção pela causa?** Prefira a que a ferramenta de análise reconhece a contornar a regra.

| Gravidade       | Prazo                                        |
| --------------- | -------------------------------------------- |
| Crítica ou alta | Agora, antes de qualquer outra entrega       |
| Média           | Na próxima rodada                            |
| Baixa           | Junto com a próxima mudança no mesmo arquivo |

**Descartar um alerta** só com motivo escrito (falso positivo, uso só em teste, risco aceito) e com o ok do autor. Nunca para destravar um merge.

## Corrigir

1. Issue, branch `fix/seguranca-<assunto>`, correção com teste que prove o caso perigoso, PR. O mesmo fluxo de qualquer tarefa (skill `commits`).
2. **Vulnerabilidade em dependência:** suba para a primeira versão que corrige, confira o lockfile e siga o fluxo acima.
3. **Segredo vazado:** revogue primeiro (no serviço que emitiu o token), depois limpe. Apagar do repositório não basta: o histórico continua lá. Avise o autor na hora.

## Escrever código que não gere alerta

- **HTML a partir de texto:** nada de `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `document.write`, `eval` ou `new Function` com conteúdo variável.
- **Consultas e comandos:** SQL só com parâmetros; comando de shell sem concatenar entrada.
- **Endereço em expressão regular:** não confira URL com regex sem âncora. Use `new URL()` e compare o `host`.
- **Link que abre outra aba:** `target="_blank"` sempre com `rel="noopener"`.
- **Workflow de CI:** entrada de quem abre o PR (nome de branch, título, `inputs`) entra por `env:`, nunca interpolada em `run:`; `permissions` mínimas por job; action fixada por SHA; segredo só no passo que precisa dele.
- **Dependência nova:** justificativa no plano; nenhum script de instalação liberado sem o autor.

## Riscos aceitos

| Risco     | Decisão (data e motivo) |
| --------- | ----------------------- |
| <<risco>> | <<decisão>>             |
