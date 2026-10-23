# Plano: otimização e redução do bundle de JavaScript sem alteração de UI ou funcionalidade

- Status: **aprovado** pelo autor em 2026-10-23
- Origem: Análise de desempenho solicitada pelo autor
- Decisões de arquitetura: ADR 0002 (composição), ADR 0009 (palco), ADR 0013 (Next.js estático), ADR 0015 (conteúdo por idioma)

**Objetivo:** Reduzir o JavaScript transferido em todo o site estático preservando 100% das funcionalidades, interações, animações, acessibilidade e aparência visual.

---

## 1. Diagnóstico e Linha de Base Atual

Valores medidos atualmente por `pnpm budgets` sobre o `dist/`:

| Parte / Rota                | Medido Hoje (gzip) | Teto Atual | Situação               |
| :-------------------------- | :----------------: | :--------: | :--------------------- |
| **`parte shell`**           |       1.4 kB       |   10 kB    | Folga de 8.6 kB        |
| **`parte design-system`**   |       8.0 kB       |   20 kB    | Folga de 12.0 kB       |
| **`parte mfe-vue`**         |      45.2 kB       |   60 kB    | Folga de 14.8 kB       |
| **`parte mfe-react`**       |      94.3 kB       |   105 kB   | Folga de 10.7 kB       |
| **`parte mfe-angular`**     |      63.1 kB       |   110 kB   | Folga de 46.9 kB       |
| **`parte web-next`**        |      139.0 kB      |   140 kB   | Folga de apenas 1.0 kB |
| **`rota /`**                |      147.0 kB      |   150 kB   | Folga de 3.0 kB        |
| **`rota /comunidade/`**     |      147.0 kB      |   150 kB   | Folga de 3.0 kB        |
| **`rota /como-foi-feito/`** |      147.0 kB      |   150 kB   | Folga de 3.0 kB        |
| **`rota /recrutador/`**     |      54.5 kB       |   90 kB    | Folga de 35.5 kB       |
| **`rota /clientes/`**       |      103.7 kB      |   135 kB   | Folga de 31.3 kB       |
| **`rota /tecnico/`**        |      72.5 kB       |   140 kB   | Folga de 67.5 kB       |

---

## 2. Oportunidades Identificadas

1. **`mfe-react` — dados residuais multi-idioma no chunk compartilhado:**
   Em `apps/mfe-react/src/App.tsx`, o componente declara valores padrão de fallback importando `@portfolio/content/client` e `@portfolio/content/ui`. Isso inclui os 3 idiomas simultaneamente no chunk comum `mfe-clientes`, adicionando ~23.6 kB brutos e ~6.2 kB gzip de dados desnecessários aos visitantes que acessam via `src/entries/{pt-br,en,es}.ts`.
2. **Minificação multipass com Terser em pacotes Vite:**
   O Vite minifica com `esbuild` por padrão. Configurando Terser multipass (`passes: 2, pure_getters: true, mangle: { toplevel: true }`), as economias medidas no código real são:
   - `mfe-react`: economia de ~10 kB gzip (~94 kB brutos).
   - `mfe-vue`: economia de ~4.8 kB gzip (~35 kB brutos).
   - `design-system`: economia de ~0.8 kB gzip.
   - `shell`: economia de ~0.2 kB gzip.
3. **`mfe-angular` — etapa de otimização no build:**
   O `@angular/build:application` compila com esbuild. Aplicando Terser (`--module --compress passes=2`) aos bundles finais em `scripts/build.mjs`, o bundle por idioma cai de 63.1 kB para 59.9 kB gzip (economia de ~3.2 kB gzip).
4. **`web-next` — isolamento do chunk de cliente da Home nas páginas internas:**
   Como `/comunidade/` e `/como-foi-feito/` compartilham o catch-all `[[...slug]]/page.tsx` com a Home, a importação direta de `HomeStage` força a inclusão do chunk interativo da Home (3.5 kB gzip) nessas páginas. Com carregamento isolado do `HomeStage`, as páginas internas deixam de carregar esse JavaScript.

---

## 3. Economia Projetada

| Parte / Rota                    | Medido Hoje |   Projetado   | Economia Estimada   |
| :------------------------------ | :---------: | :-----------: | :------------------ |
| **`parte mfe-react`**           |   94.3 kB   | **~76.0 kB**  | **−18.3 kB (−19%)** |
| **`parte mfe-vue`**             |   45.2 kB   | **~40.4 kB**  | **−4.8 kB (−11%)**  |
| **`parte mfe-angular`**         |   63.1 kB   | **~59.9 kB**  | **−3.2 kB (−5%)**   |
| **`parte design-system`**       |   8.0 kB    |  **~7.2 kB**  | **−0.8 kB (−10%)**  |
| **`parte shell`**               |   1.4 kB    |  **~1.2 kB**  | **−0.2 kB (−14%)**  |
| **`rota /clientes/` (total)**   |  103.7 kB   | **~84.4 kB**  | **−19.3 kB**        |
| **`rota /recrutador/` (total)** |   54.5 kB   | **~48.8 kB**  | **−5.7 kB**         |
| **`rota /tecnico/` (total)**    |   72.5 kB   | **~68.3 kB**  | **−4.2 kB**         |
| **`rota /comunidade/`**         |  147.0 kB   | **~143.4 kB** | **−3.6 kB**         |
| **`rota /como-foi-feito/`**     |  147.0 kB   | **~143.4 kB** | **−3.6 kB**         |

---

## 4. Etapas de Execução

### Etapa 1: Eliminação de dados multilíngues redundantes no MFE React

- Arquivo `apps/mfe-react/src/App.tsx`: tornar `locale`, `content`, `text` e `construction` obrigatórios em `AppProps`, removendo os imports de `@portfolio/content/client` e `@portfolio/content/ui`.
- Arquivo `apps/mfe-react/src/main.ts`: fornecer os dados de fallback para desenvolvimento solo e testes unitários.
- **Comando de validação:**
  ```bash
  pnpm --filter mfe-react test && pnpm --filter mfe-react build
  ```

### Etapa 2: Terser nos microfrontends e bibliotecas Vite

- Adicionar `terser` no catálogo do workspace (`pnpm-workspace.yaml`).
- Configurar `build: { minify: 'terser', terserOptions: { compress: { passes: 2, pure_getters: true }, mangle: { toplevel: true } } }` em:
  - `apps/mfe-react/vite.config.ts`
  - `apps/mfe-vue/vite.config.ts`
  - `packages/design-system/vite.lib.config.ts`
  - `apps/shell/vite.config.ts`
- **Comando de validação:**
  ```bash
  pnpm --filter mfe-react build && pnpm --filter mfe-vue build && pnpm --filter @portfolio/design-system build && pnpm --filter shell build
  ```

### Etapa 3: Compressão Terser no build do MFE Angular

- Em `apps/mfe-angular/scripts/build.mjs`, adicionar o passo de minificação Terser com `--module` nos arquivos gerados em `dist/browser/${loc}/main.js`.
- **Comando de validação:**
  ```bash
  pnpm --filter mfe-angular build && pnpm --filter mfe-angular test
  ```

### Etapa 4: Isolamento de chunk no Next.js

- Em `apps/web-next/app/[[...slug]]/page.tsx`, carregar `HomeStage` de forma desacoplada para que `/comunidade/` e `/como-foi-feito/` não incluam o bundle de scripts da Home.
- **Comando de validação:**
  ```bash
  pnpm --filter web-next build && pnpm --filter web-next test
  ```

### Etapa 5: Validação completa de qualidade e orçamentos

- Montar o site:
  ```bash
  pnpm build && pnpm assemble
  ```
- Cobrar orçamentos e conferir a redução:
  ```bash
  pnpm budgets
  ```
- Garantir conformidade total de tipos, lint e testes unitários:
  ```bash
  pnpm lint && pnpm typecheck && pnpm test
  ```
- Garantir conformidade de acessibilidade e interações em navegadores reais:
  ```bash
  pnpm test:e2e
  ```
- Garantir Lighthouse CI 100/100:
  ```bash
  pnpm lhci
  ```
- Atualizar o raio-x versionado do site:
  ```bash
  node scripts/site-xray.mjs && node scripts/site-xray.mjs --check
  ```

---

## 5. Resultados Finais Medidos

Valores aferidos em 2026-10-23 após implementação completa:

| Parte / Rota                | Medido Antes | Medido Depois | Teto   | Economia Real           |
| :-------------------------- | :----------: | :-----------: | :----: | :---------------------- |
| **`parte shell`**           |    1.4 kB    |  **1.1 kB**   | 10 kB  | **−0.3 kB (−21%)**      |
| **`parte design-system`**   |    8.0 kB    |  **7.3 kB**   | 20 kB  | **−0.7 kB (−9%)**       |
| **`parte mfe-vue`**         |   45.2 kB    |  **34.8 kB**  | 60 kB  | **−10.4 kB (−23%)**     |
| **`parte mfe-react`**       |   94.3 kB    |  **76.6 kB**  | 105 kB | **−17.7 kB (−19%)**     |
| **`parte mfe-angular`**     |   63.1 kB    |  **59.9 kB**  | 110 kB | **−3.2 kB (−5%)**       |
| **`rota /`**                |   147.0 kB   |  **146.3 kB** | 150 kB | **−0.7 kB**             |
| **`rota /comunidade/`**     |   147.0 kB   |  **146.3 kB** | 150 kB | **−0.7 kB**             |
| **`rota /como-foi-feito/`** |   147.0 kB   |  **146.3 kB** | 150 kB | **−0.7 kB**             |
| **`rota /recrutador/`**     |   54.5 kB    |  **48.8 kB**  | 90 kB  | **−5.7 kB**             |
| **`rota /clientes/`**       |   103.7 kB   |  **84.4 kB**  | 135 kB | **−19.3 kB (−18.6%)**   |
| **`rota /tecnico/`**        |   72.5 kB    |  **68.3 kB**  | 140 kB | **−4.2 kB**             |

- **Testes unitários e contratos:** 100% aprovados.
- **Testes de ponta a ponta (Playwright + axe):** 297/297 testes aprovados em 3 minutos.
- **Lighthouse CI:** 18 execuções em 6 rotas, 100% de conformidade com os orçamentos de desempenho, acessibilidade, boas práticas e SEO.
- **Funcionalidades e interações:** 100% preservadas rigorosamente intactas.
