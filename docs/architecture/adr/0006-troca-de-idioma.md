# ADR 0006: Troca de idioma por links, sem dono em tempo de execução

- Status: **aceito** pelo autor em 2026-10-07
- Data: 2026-10-07

## Contexto

O site ganha um seletor de idioma com bandeiras, no canto inferior direito de todos os documentos: páginas Next.js e páginas do shell. Três pontos dos documentos aceitos não acomodam isso:

- O `AGENTS.md` do shell e o `mfe-map.md` diziam que o shell é o dono da troca de idioma. As páginas Next.js também precisam do seletor, e um app não importa código de outro. É o mesmo conflito que o ADR 0005 resolveu para o tema.
- A exceção do ADR 0005 (controle oculto até o upgrade) vale para o que só funciona com JavaScript. Trocar de idioma é seguir um link: funciona sem script e cai na regra geral do ADR 0003.
- A regra de fronteira 5 manda elementos reutilizáveis virem do design system, que até aqui só tinha Web Components. Um custom element para quatro links seria só um `<slot>`: JavaScript em toda rota, sem comportamento a hospedar.

O que não se reabre: rotas traduzidas com prefixo de idioma, tabela de rotas em `packages/contracts` (ADR 0002) e um diretório estático único (ADR 0004).

## Opções

| Critério             | Seletor no shell, copiado no Next.js | Custom element no design system         | Links do dono do documento + CSS compartilhado |
| -------------------- | ------------------------------------ | --------------------------------------- | ---------------------------------------------- |
| Sem JavaScript       | Depende de cada app                  | Funciona só se o conteúdo for light DOM | Funciona                                       |
| JavaScript por rota  | Nenhum                               | Cresce em todas as rotas                | Nenhum                                         |
| Aparência única      | Duas folhas de estilo                | Uma                                     | Uma, no CSS que todo documento já carrega      |
| Caminhos dos idiomas | Cada app calcula                     | O componente ou o hospedeiro            | Uma função em `packages/contracts`             |
| Regra de fronteira 5 | Quebrada                             | Respeitada                              | Precisa de registro (este ADR)                 |

## Decisão

**A troca de idioma são quatro links comuns, gerados pelo dono de cada documento a partir de `packages/contracts`, com aparência definida uma vez no CSS compartilhado.**

1. Ninguém é dono da troca em tempo de execução. O shell (para as áreas dele) e o layout do Next.js (para as páginas dele) chamam `languageAlternates(area, idioma)` e escrevem os links. O shell deixa de ser "dono da troca de idioma".
2. Os links são `<a>`, nunca o roteador de um framework: cada idioma é outro documento, com o próprio `lang`.
3. Elemento de interface sem comportamento pode ser marcação mais CSS compartilhado, sem custom element. As classes (`ds-dock`, `ds-language-switcher`) e os tokens de componente ficam no CSS gerado por `packages/tokens`, que todo documento já carrega; a marcação de referência fica em uma story do design system. Tudo que tem comportamento continua sendo Web Component (ADR 0003).
4. O seletor segue o ADR 0003: visível e funcional antes de qualquer script.
5. Recursos estáticos compartilhados entre documentos moram em `/_ds/`: as bandeiras em `/_ds/flags/` (de `packages/design-system`) e as fontes em `/_ds/fonts/` (de `packages/tokens`). As cores de cada bandeira ficam no arquivo da bandeira, não em CSS de app.
6. Os nomes dos idiomas, cada um no próprio idioma, ficam em `packages/contracts`: são iguais em todas as interfaces e não são texto traduzível.

## Consequências

- A marcação do seletor existe em dois lugares (shell e layout do Next.js). O teste e2e de idioma cobra que as duas produzam os mesmos links.
- `packages/contracts` ganha `languageAlternates`, `localeNames` e `LOCALE_FLAGS_PATH`.
- A troca leva à raiz da área no outro idioma. Sub-rotas de MFE, quando existirem, precisam de regra própria.
- `hreflang` e `canonical` no `<head>` continuam fora (pendência B7): dependem do domínio.
- A página `404.html` do Next.js não passa pelo layout das rotas e fica sem o seletor (pendências B4 e B14).
- Arquivos em `/_ds/flags/` e `/_ds/fonts/` não têm hash no nome; a regra de cache deles entra com o `_headers` (B7).
- Bandeira representa país, não idioma. Cada link leva o nome do idioma como nome acessível e como dica (`title`).

## Emenda de 2026-10-08

Registrada em `docs/plans/home-som-e-bandeiras.md`. O seletor passa a mostrar só a bandeira do idioma em uso, em um `<summary>`; os outros três idiomas são links comuns dentro do `<details>`, que abre para cima. Continua sem JavaScript e sem dono em tempo de execução. Sem script, a lista só fecha por outro clique na bandeira: não há Esc nem clique fora. O idioma em uso deixa de ser link e de levar `aria-current`. Onde este ADR diz "quatro links", leia-se "três links e o idioma em uso".

## Emenda de 2026-10-09

O português de Portugal foi removido por decisão do autor. Ficam três idiomas (pt-BR, en, es): onde este ADR diz "quatro links" e "os outros três", leia três e dois. A decisão não muda.

No mesmo dia a home ganhou um terceiro lugar com os links de idioma: o pop-up de primeira visita (`docs/plans/home-imersao.md`). São os mesmos links comuns de `languageAlternates`; o idioma em uso aparece marcado e não é link. As bandeiras dos outros idiomas só são pedidas quando o pop-up abre.

## Fontes

- [WCAG 2.2, técnica H58: atributo `lang` para mudança de idioma](https://www.w3.org/WAI/WCAG22/Techniques/html/H58)
- [MDN: atributo `hreflang` de `<a>`](https://developer.mozilla.org/docs/Web/HTML/Element/a#hreflang)

Não verificado: leitura dos nomes de idioma por VoiceOver e TalkBack com o atributo `lang` em cada link.
