# ADR 0001: Microfrontends com cinco tecnologias

- Status: **aceito** (decisão do autor, requisito fixo do produto)
- Data: 2026-10-06

## Contexto

O portfólio tem quatro públicos e uma área por público. O autor decidiu que cada área usa uma tecnologia diferente (Next.js, React, Vue, Angular) sobre um shell em JavaScript puro, com design system próprio. A variedade faz parte do que o site demonstra.

Para um site estático de um dev solo, um único framework seria mais barato. Este ADR não reabre a decisão; registra o que ela custa e como o custo é contido.

## Decisão

Cinco apps em um monorepo, compostos no cliente, um por área (ver `docs/architecture/mfe-map.md`).

## Custos e mitigação

| Custo | Mitigação |
|---|---|
| Vários runtimes de framework | Só um MFE carrega por rota; orçamento de JS por rota em `docs/quality/budgets.md`, cobrado no CI |
| Quatro toolchains e ciclos de atualização | Versões fixadas em um lugar; Turborepo com cache; CI builda só o que mudou |
| Dependências duplicadas ou em versões conflitantes | MFEs não importam uns dos outros; design system carregado uma vez por documento (ADR 0003); revisão de dependências duplicadas a cada PR |
| Aparência e comportamento inconsistentes entre áreas | Tokens e Web Components únicos (ADR 0003); nenhum app define cor, espaçamento ou tipografia fora dos tokens |
| Áreas renderizadas só no cliente têm SEO e LCP piores | Conteúdo com valor de busca fica no Next.js; cada rota de MFE tem HTML próprio com título e descrição (ADR 0002) |
| Acessibilidade nas fronteiras (foco, anúncio de troca de página) | O shell cuida de foco e título ao trocar de área; teste e2e atravessando MFEs |
| Troca de documento entre páginas Next.js e páginas do shell | Cabeçalho e rodapé idênticos nos dois; recursos do design system em cache |
| Carga de manutenção para uma pessoa | Esqueleto mínimo por app; regras de fronteira escritas e verificadas por agente revisor; nada de abstração compartilhada além de `packages/` |
| Contratos entre apps podem quebrar em silêncio | Eventos tipados em `packages/contracts`; conteúdo validado em `packages/content` |

## Consequências

- O tempo de CI e de instalação é maior que o de um app único.
- Cada funcionalidade nova precisa de dono: uma área, um app.
- Lógica comum entre áreas só existe em `packages/`; duplicar um pouco de código entre MFEs é preferível a acoplar dois deles.
