# ADR 0011: Transições entre a home e as áreas

- Status: **aceito** pelo autor em 2026-10-09
- Data: 2026-10-09

## Contexto

O ADR 0010 criou a transição de entrada na área do recrutador: a home fecha uma cortina, grava uma marca em `sessionStorage` e o documento da área abre a cortina. O autor pediu mais duas coisas.

- A volta: o botão "Voltar à escolha de perfil" também passa por uma cortina, e a home abre dela.
- Uma segunda área com transição, a técnica, com aparência própria, diferente da do recrutador.

O que o ADR 0010 não cobria: a marca não dizia de que área era; a cortina tinha a cor e a forma do recrutador fixas; o shell não tinha comportamento no botão de volta; e a home não tinha como abrir uma cortina antes da primeira pintura, porque o script dela só roda depois da hidratação.

Limites: a home está a menos de 2 kB do teto de JavaScript, em nove arquivos de script, e a imagem do primeiro personagem é o LCP dela.

## Opções

Para a home abrir a cortina da volta:

| Critério                        | Esperar a hidratação        | Script inline no `<head>` da home |
| ------------------------------- | --------------------------- | --------------------------------- |
| A home aparece antes da cortina | Sim, por um instante        | Não                               |
| Arquivo de script novo          | Não                         | Não                               |
| Peso no orçamento de JavaScript | Um pouco, no script da home | Nenhum (fica no HTML)             |
| CSP futura (pendência B14)      | Sem efeito                  | Mais um trecho a liberar          |

Para a aparência por área:

| Critério             | Um mecanismo por área | Um mecanismo, aparência por atributo |
| -------------------- | --------------------- | ------------------------------------ |
| Código por área nova | Script e CSS          | Só CSS                               |
| Marca e script       | Um por área           | Um, que leva a área                  |

## Decisão

**Um mecanismo só, nos dois sentidos, com a área na marca; a aparência de cada área é CSS escolhido por atributo.**

1. **Marca.** `portfolio:entrada` guarda `"<área>:<hora>"`. O sentido não é gravado: no documento da área a marca é uma entrada; na home, uma volta. Vale por 5 s.
2. **Áreas com transição.** A lista `AREA_TRANSITIONS`, em `packages/contracts`, é a única fonte. Hoje: recrutador e técnica. O atraso antes de navegar (`TRANSITION_DELAY_MS`, 0,45 s) também fica lá, porque a home e o shell o usam.
3. **Script de chegada.** `arrivalInitScript(áreas aceitas)` gera o script inline. O shell aceita só a área do próprio documento; a home aceita todas as da lista. Ele liga `data-arrival="<área>"` no `<html>` antes da primeira pintura.
4. **Home.** O script entra na mesma tag inline do tema, só no documento da home. É a exceção ao que o ADR 0008 preferiu (comportamento no script do app): aqui o que precisa acontecer antes da pintura não pode esperar a hidratação. A cortina é um elemento decorativo, oculto sem o atributo, fora da regra de pausa da home: ela tem fim e não pode parar fechada.
5. **Volta.** O ouvinte do botão de volta mora em `apps/shell/src/main.ts`. Grava a marca, mostra a cortina que fecha, com o aviso `ui.leaving`, e navega depois do atraso.
6. **Aparência.** Cada área tem a própria cortina, em CSS, escolhida por `data-arrival` e `data-area`: corte em diagonal no recrutador; faixas alternadas que correm para lados opostos, aos trancos, na técnica. As regras ficam repetidas em `home.css` e `shell.css`: os dois apps não dividem folha de estilo.
7. **Quem não passa por ela.** Movimento reduzido, animações pausadas, clique com tecla modificadora e navegação sem JavaScript: o link navega na hora.
8. **Som.** Só na entrada, na home, dentro do gesto: o corte de lâmina no recrutador e as notas de confirmação nas outras. A volta não tem som, porque as páginas das áreas não têm áudio.

## Consequências

- Substitui o item 5 do ADR 0010 (marca sem área, script único, cortina fixa).
- Área nova com transição: entra em `AREA_TRANSITIONS` e ganha as regras de CSS da cortina nos dois arquivos. Sem as regras, a cortina não tem fundo.
- O documento da home ganha um trecho de script inline. As outras páginas Next.js não.
- Os testes olham a cortina que fecha por um observador na própria página: ela dura menos de meio segundo e some com a navegação.
- `mask` com gradiente e animação em `steps()` só foram conferidos no Chromium (pendência B12).

## Fontes

- [MDN: `sessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [MDN: `mask`](https://developer.mozilla.org/en-US/docs/Web/CSS/mask)

Não verificado: o comportamento da marca em navegadores que restauram `sessionStorage` ao reabrir uma aba fechada.
