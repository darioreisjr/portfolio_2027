---
name: pr-checklist
description: Lista de verificação antes de abrir ou aprovar um pull request. Use ao terminar uma implementação, ao preparar um commit ou PR, ou ao revisar a mudança de outra pessoa ou de outro agente.
---

# Checklist de pull request

Percorra tudo. Marque como "não se aplica" só com motivo.

## Escopo

- [ ] Existe plano aprovado pelo autor, e a mudança faz só o que ele descreve.
- [ ] Nenhuma dependência fora do plano. Cada uma tem justificativa de uma linha.
- [ ] Nenhum arquivo gerado editado à mão.

## Verificações automáticas

- [ ] Lint, formatação e testes passam: <<comandos>>.
- [ ] `node scripts/ai-sync.mjs --check` passa.

## Regras do projeto

- [ ] Cada regra de fronteira do `AGENTS.md` respeitada.
- [ ] Contrato ou formato de dados alterado: todos os consumidores atualizados juntos.
- [ ] <<regras específicas do projeto>>

## Interface (se houver)

- [ ] Operável por teclado, com foco visível.
- [ ] Contraste AA em todos os temas.
- [ ] Textos em todos os idiomas do projeto.

## Conteúdo e segredos

- [ ] Nenhum dado inventado sobre pessoas, clientes ou números.
- [ ] Nenhum segredo no diff. Variável nova está em `.env.example`.

## Documentação

- [ ] Docs atualizados onde o comportamento descrito mudou.
- [ ] Decisão de arquitetura nova tem ADR.
- [ ] Pendência nova está em `docs/open-questions.md`.
- [ ] `README.md` revisado.
- [ ] Mudou skill, subagente, MCP, hook ou o `ai-sync.mjs`: `docs/ai-setup/kit/` revisado e histórico do `GUIA.md` atualizado.

## Commit e PR

- [ ] Branch de tarefa com nome `tipo/descricao`, saída da branch certa.
- [ ] O PR cita a issue que resolve, se o projeto usa issues.
- [ ] Conventional Commits, sem coautor (skill `commits`).
- [ ] A descrição diz o que mudou, por quê, como foi verificado e o que não foi verificado.
- [ ] Revisão pedida aos subagentes revisores indicados no `AGENTS.md`.
