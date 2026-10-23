# Plano de Atualização do Next.js para Versão Segura (Issue #77)

## Contexto e Diagnóstico

Durante a execução de builds de produção no `apps/web-next`, o CLI do Next.js identificou uma vulnerabilidade de segurança conhecida na versão `16.4.0` e interrompeu o build com o erro `SecurityFatalError` recomendando o upgrade (conforme advisory do registro npm).

A versão estável e corrigida mais recente da linha 16 é a **`16.4.2`** (publicada em 2026-10-15, respeitando com folga a política de idade mínima de 24 horas do monorepo).

## Escopo

- Atualizar `next` de `16.4.0` para `16.4.2` no catálogo (`pnpm-workspace.yaml`).
- Atualizar `@next/eslint-plugin-next` de `16.4.0` para `16.4.2` no catálogo (`pnpm-workspace.yaml`).
- Executar `pnpm install` para consolidar o `pnpm-lock.yaml`.
- Garantir a compilação limpa sem avisos de segurança no `apps/web-next`.
- Validar conformidade de lint, tipos, testes unitários, montagem (`pnpm assemble`), orçamentos de JavaScript (`pnpm budgets`) e testes end-to-end (`pnpm test:e2e`).

**Fora de escopo:**

- Qualquer alteração arquitetural, de rotas, ou de componentes no `apps/web-next`.

---

## Etapas de Execução

### Etapa 1: Criação da branch de trabalho

- **Ação:** Criar e alternar para a branch `fix/atualizar-nextjs-seguro` a partir da `development` atualizada.
- **Comando de prova:** `git branch --show-current`

### Etapa 2: Atualização do catálogo no monorepo

- **Ação:** Modificar `pnpm-workspace.yaml` atualizando `next: 16.4.2` e `@next/eslint-plugin-next: 16.4.2`.
- **Comando de prova:** `git diff pnpm-workspace.yaml`

### Etapa 3: Instalação e atualização do lockfile

- **Ação:** Executar `pnpm install`.
- **Comando de prova:** `git status` (verificando `pnpm-workspace.yaml` e `pnpm-lock.yaml`)

### Etapa 4: Validação do build e export estático do web-next

- **Ação:** Executar o build do Next.js.
- **Comando de prova:** `pnpm --filter web-next build` (deve compilar sem `SecurityFatalError` e gerar a pasta `out/` com os HTMLs estáticos).

### Etapa 5: Validação completa da suíte do monorepo

- **Ação:** Executar lint, checagem de tipos, testes e validação e2e completa.
- **Comando de prova:**
  1. `pnpm format:check && pnpm lint`
  2. `pnpm typecheck`
  3. `pnpm test`
  4. `pnpm build && pnpm assemble && pnpm budgets`
  5. `pnpm test:e2e`

### Etapa 6: Revisão de segurança e documentação

- **Ação:** Conferir com o subagente/skill `seguranca` se não há novas pendências ou impactos nos scripts e cabeçalhos de segurança, e revisar `README.md`.
- **Comando de prova:** `git status`

### Etapa 7: Commit no padrão Conventional Commits

- **Ação:** Criar commit convencional em português sem coautor:
  ```bash
  git add pnpm-workspace.yaml pnpm-lock.yaml docs/plans/atualizar-nextjs-seguro.md
  git commit -m "fix(web-next): atualiza nextjs para versao segura 16.4.2"
  ```
- **Comando de prova:** `git log -1 --stat`

### Etapa 8: Envio da branch e abertura do PR

- **Ação:** Subir a branch para o repositório remoto e abrir o Pull Request contra `development` citando `Closes #77`.
- **Comando de prova:** `gh pr view`

---

## Critérios de Aceite

- [ ] Build do `web-next` roda com sucesso sem `SecurityFatalError`.
- [ ] Todas as 11 rotas estáticas geradas com sucesso em `apps/web-next/out/`.
- [ ] Todos os testes unitários e 297 testes E2E aprovados.
- [ ] Orçamentos de JavaScript respeitados.
- [ ] PR aberto com CI verde contra a branch `development`.
