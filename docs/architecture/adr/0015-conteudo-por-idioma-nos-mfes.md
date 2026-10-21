# ADR 0015: Conteúdo por idioma nos microfrontends

- Status: **aceito** pelo autor em 2026-10-21
- Data: 2026-10-21

## Contexto

Os microfrontends das três áreas do site (`apps/mfe-vue` para recrutador, `apps/mfe-angular` para técnico e `apps/mfe-react` para clientes) são montados pelo shell JavaScript (`apps/shell`) com base na rota acessada.

Originalmente, cada microfrontend compilava um único arquivo de saída (`mfe.js`) contendo o bundle do framework acompanhado de todo o conteúdo em todos os três idiomas suportados (`pt-BR`, `en`, `es`). Como observado em `docs/quality/budgets.md`:

> _"O MFE Vue cresce com o conteúdo dos três idiomas dentro do JavaScript; o mesmo vai acontecer com os dados reais das áreas técnica e do cliente."_

Isso trazia problemas relevantes:

1. **Desperdício de bytes na rede:** uma visita em `/recrutador/` baixava desnecessariamente os textos traduzidos em inglês e espanhol, consumindo largura de banda e aumentando o tempo de transferência.
2. **Pressão sobre os tetos de orçamento:** os tetos de JavaScript de cada MFE (`60 kB` para Vue, `105 kB` para React, `110 kB` para Angular) e das rotas (`90 kB` para recrutador, `135 kB` para clientes, `140 kB` para técnico) tinham margem reduzida para adição de novos recursos e conteúdo real.
3. **Restrições de performance:** todo o site estático deve manter LCP $\le$ 2,5 s sem waterfalls de rede nem telas brancas.

## Opções

| Critério                          | Opção 1: Entradas parametrizadas por idioma (`[locale]/mfe.js`)        | Opção 2: `import()` dinâmico de chunks de idioma      | Opção 3: `fetch()` em runtime de arquivos `.json`           |
| --------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| **Waterfalls de rede**            | **Zero:** o shell requisita diretamente o bundle já especializado      | Pelo menos 1 requisição extra após o parse do MFE     | Pelo menos 1 requisição extra de rede para o `.json`        |
| **Risco de flash/tela branca**    | **Inexistente:** custom element monta com dados síncronos já presentes | Médio: exige estado de loading enquanto o chunk baixa | Alto: exige loading spinner / skeleton e tratamento de erro |
| **Tamanho do JS inicial**         | **Mínimo:** contém apenas o idioma ativo da rota                       | Pequeno overhead do carregador dinâmico               | Mínimo para o MFE, mas adiciona payload do JSON             |
| **Compatibilidade com SEO e SSG** | **Perfeita:** renderização direta e determinística                     | Exige cuidado com hidratação assíncrona               | Exige sincronização assíncrona com custom element           |
| **Complexidade de build**         | Simples: 3 entradas no bundler (Vite / Angular esbuild)                | Média: configuração de code-splitting                 | Baixa no MFE, mas requer pipeline de cópia de assets JSON   |

## Decisão recomendada

Adotar a **Opção 1**: Entradas compiladas por idioma (`apps/mfe-*/dist/<locale>/mfe.js`).

1. **Submódulos em `packages/content`:**
   O pacote de conteúdo exporta submódulos dedicados por idioma para cada domínio:
   - `@portfolio/content/recruiter/{pt-BR,en,es}`
   - `@portfolio/content/tech/{pt-BR,en,es}`
   - `@portfolio/content/client/{pt-BR,en,es}`
   - `@portfolio/content/ui/{pt-BR,en,es}`

2. **Resolução de script no Shell:**
   A tabela de rotas em `packages/contracts/src/routes.ts` expõe `mfeScript(mfe, locale)`, retornando o caminho canônico `/_mfe/<mfe>/<locale>/mfe.js`.
   O `apps/shell/src/mount.ts` identifica o idioma ativo da rota e carrega exclusivamente o script do idioma necessário.

3. **Compilação nos MFEs:**
   - `apps/mfe-vue`: Vite com três entradas (`pt-br`, `en`, `es`) mapeando para `RecruiterArea{PtBr,En,Es}.ce.vue`.
   - `apps/mfe-react`: Vite com três entradas que injetam os dados de cliente específicos daquele idioma.
   - `apps/mfe-angular`: script de build chamando `ng build` para cada configuração de locale com substituição de módulo/injeção de token `TECH_CONTENT`.

4. **Auditoria precisa de orçamentos:**
   `scripts/check-budgets.mjs` analisa o grafo de dependências ECMAScript (`collectModuleDependencies`) para medir com precisão a carga transferida de cada idioma (e.g. `pt-br/mfe.js` + chunks comuns), comparando com o teto definido.

## Consequências

### O que fica mais fácil

- O payload de JavaScript entregue ao usuário em cada rota de microfrontend cai sensivelmente:
  - `mfe-vue` caiu de ~51 kB para 45,2 kB gzip (teto: 60 kB).
  - `mfe-react` caiu para 94,3 kB gzip (teto: 105 kB).
  - `mfe-angular` caiu para 63,1 kB gzip (teto: 110 kB).
  - Todas as rotas ganharam folga expressiva contra seus limites orçamentários.
- Eliminação definitiva de qualquer waterfall de rede após o download do microfrontend: o custom element inicializa imediatamente com seus dados locais.
- Sem risco de telas brancas, layout shift inesperado ou atrasos de LCP causados por requisições adicionais de dados.

### O que passa a ser regra

- Cada MFE deve manter suas entradas por idioma sincronizadas com os idiomas suportados pelo sistema (`pt-BR`, `en`, `es`).
- Qualquer consumo de dados de domínio nos MFEs deve importar o submódulo do idioma correspondente, nunca o módulo agregado com todos os idiomas.

## Fontes

- `docs/quality/budgets.md`: orçamentos e limites de transferência por rota.
- `docs/architecture/adr/0002-composition.md`: composição no navegador via Custom Elements.
- `packages/contracts/src/routes.ts`: definição de rotas e scripts por idioma.
