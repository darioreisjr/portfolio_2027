---
name: pr-checklist
description: Lista de verificação antes de abrir ou aprovar um pull request neste monorepo. Use ao terminar uma implementação, ao preparar um commit ou PR, ou ao revisar a mudança de outra pessoa ou de outro agente.
---

# Checklist de pull request

Percorra tudo. Marque como "não se aplica" só com motivo.

## Escopo

- [ ] Existe plano aprovado pelo autor, e a mudança faz só o que ele descreve.
- [ ] Nenhuma dependência fora do plano. Cada uma tem justificativa de uma linha.
- [ ] Nenhum arquivo gerado editado à mão.

## Verificações automáticas

- [ ] Lint, typecheck e testes passam nos apps e pacotes afetados.
- [ ] `node scripts/ai-sync.mjs --check` passa.
- [ ] Validação de `packages/content` passa.
- [ ] E2E que atravessa os MFEs passa, se a mudança toca shell, contratos ou rotas.

## Fronteiras

- [ ] Nenhum import entre apps.
- [ ] Dados só de `packages/content`.
- [ ] Comunicação entre apps só por eventos de `packages/contracts`.
- [ ] Caminhos de rota só da tabela de rotas.
- [ ] Design system e Lit não empacotados em MFE.
- [ ] Contrato ou schema alterado: todos os consumidores atualizados juntos.

## Interface

- [ ] Só tokens semânticos ou de componente; nenhum valor literal.
- [ ] Funciona nos temas claro e escuro.
- [ ] Operável por teclado, com foco visível.
- [ ] Textos novos nos três idiomas, em `ui/<locale>.json` ou, se só uma tela usa, no arquivo dela (como `home/<locale>.json`).
- [ ] Conteúdo legível antes do upgrade dos componentes.

## Qualidade

- [ ] JavaScript da rota dentro do teto de `docs/quality/budgets.md`; aumento de teto registrado lá.
- [ ] Rota nova tem título, descrição, `hreflang` e entrada no sitemap.
- [ ] Nenhum script de terceiros sem registro.

## Conteúdo e segredos

- [ ] Nenhum dado inventado sobre o autor. Exemplos em `draft`.
- [ ] Nenhum segredo no diff. Variável nova está em `.env.example`.

## Documentação

- [ ] Docs atualizados onde o comportamento descrito mudou.
- [ ] Decisão de arquitetura nova tem ADR.
- [ ] Pendência nova está em `docs/open-questions.md`.

## Commit e PR

- [ ] Conventional Commits em pt-BR: `tipo(escopo): resumo`, com o app ou pacote como escopo, sem coautor (skill `commits`).
- [ ] A descrição diz o que mudou, por quê, como foi verificado e o que não foi verificado.
- [ ] Revisão pedida a `integration-reviewer`, a `a11y-perf-reviewer` e, com interface, a `design-system-guardian`.
