# Orçamentos de qualidade

Status: **aceito** pelo autor em 2026-10-06. Cobrado no CI pelo Lighthouse CI a partir do bootstrap.

## Core Web Vitals

Nível "bom" do web.dev, medido no percentil 75 das visitas, em celular e desktop.

| Métrica | Limite     |
| ------- | ---------- |
| LCP     | até 2,5 s  |
| INP     | até 200 ms |
| CLS     | até 0,1    |

O site não tem coleta de dados de campo (analytics está em aberto), então o CI usa medidas de laboratório como substitutas:

| Medida de laboratório (Lighthouse, perfil celular) | Limite     | Substitui                                                   |
| -------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| LCP                                                | até 2,5 s  | LCP de campo                                                |
| TBT                                                | até 200 ms | INP (o web.dev indica o TBT como substituto de laboratório) |
| CLS                                                | até 0,1    | CLS de campo                                                |
| Nota de Performance                                | 90 ou mais | Visão geral                                                 |

**Exceção da home, autorizada pelo autor em 2026-10-07:** o LCP de laboratório de `/` pode ir até 2,7 s. Motivo: a fonte da identidade visual (M PLUS Rounded 1c, um arquivo de 23 kB na home) custa cerca de 0,1 s na simulação de celular lento, e a home já estava a 0,1 s do limite. As demais rotas continuam em 2,5 s. O `lighthouserc.json` cobra os dois valores.

## JavaScript inicial por rota

Tamanho transferido (comprimido) de todo o JavaScript necessário para a rota ficar interativa. Os tetos abaixo foram estimados antes do bootstrap e mantidos depois da medição. Os números cobrados no CI ficam em `docs/quality/budgets.json`; mantenha os dois arquivos iguais. Scripts `nomodule` não contam, porque navegadores atuais não os baixam.

| Parte                             | Teto   | Justificativa                                                                                        |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Shell                             | 10 kB  | Só roteia, carrega um script e troca o idioma; não há framework. A troca de tema é do design system  |
| Design system (Lit e componentes) | 20 kB  | Uma cópia por documento, em cache entre rotas                                                        |
| MFE Vue (`/recrutador`)           | 60 kB  | A doc do Vue cita cerca de 16 kB de base para custom elements; o resto é folga para a linha do tempo |
| MFE React (`/clientes`)           | 80 kB  | `react-dom` é o maior custo fixo; a área é de cartões e listas, sem bibliotecas extras               |
| MFE Angular (`/tecnico`)          | 110 kB | Maior runtime dos três, e a área tem filtros e formulários                                           |
| Página Next.js                    | 130 kB | React mais o runtime do Next.js; páginas de leitura, poucos Client Components                        |

Total por rota:

| Rota                                  | Composição                    | Teto total |
| ------------------------------------- | ----------------------------- | ---------- |
| `/recrutador`                         | shell, design system, Vue     | 90 kB      |
| `/clientes`                           | shell, design system, React   | 110 kB     |
| `/tecnico`                            | shell, design system, Angular | 140 kB     |
| `/`, `/comunidade`, `/como-foi-feito` | Next.js, design system        | 150 kB     |

Regras:

- Nenhuma rota carrega o runtime de dois frameworks de MFE.
- Dependência nova em um MFE precisa caber no teto da rota; se não couber, é carregada sob demanda ou não entra.
- Aumentar um teto exige registrar o motivo neste arquivo.

### Linha de base medida no bootstrap (2026-10-06)

Só o "olá" de cada app, sem nenhuma feature. Medido por `pnpm budgets` (gzip) e `pnpm lhci`.

| Parte         | Medido  | Teto   |
| ------------- | ------- | ------ |
| Shell         | 0,9 kB  | 10 kB  |
| Design system | 6,6 kB  | 20 kB  |
| MFE Vue       | 29,8 kB | 60 kB  |
| MFE React     | 77,5 kB | 80 kB  |
| MFE Angular   | 37,7 kB | 110 kB |

| Rota              | JavaScript | Teto   | Performance | LCP   | TBT   | CLS |
| ----------------- | ---------- | ------ | ----------- | ----- | ----- | --- |
| `/`               | 144,2 kB   | 150 kB | 99          | 2,1 s | 38 ms | 0   |
| `/como-foi-feito` | 144,2 kB   | 150 kB | 100         | 1,5 s | 37 ms | 0   |
| `/recrutador`     | 37,4 kB    | 90 kB  | 100         | 1,4 s | 0 ms  | 0   |
| `/tecnico`        | 45,3 kB    | 140 kB | 100         | 1,4 s | 5 ms  | 0   |
| `/clientes`       | 85,0 kB    | 110 kB | 100         | 1,1 s | 0 ms  | 0   |

Acessibilidade e SEO do Lighthouse: 100 nas cinco rotas.

Depois da tela de escolha de perfil (2026-10-07), a rota `/` mede 144,7 kB de JavaScript. O Lighthouse variou entre execuções na mesma máquina: Performance de 97 a 100, LCP de 1,6 a 2,3 s, TBT de 59 a 150 ms, CLS 0. As demais rotas não mudaram.

Com o cenário de sakura (2026-10-07), a rota `/` mantém 144,7 kB de JavaScript e mede 3,1 kB de CSS do Next.js, 5,9 kB de HTML, Performance 98 a 99, LCP de 2,3 s, TBT de 45 ms e CLS 0. O CSS não é cobrado pelo script de orçamentos; os números vieram de medição manual sobre o `dist/`.

Com o seletor de tema (2026-10-07), o design system foi de 6,6 para 7,8 kB e todas as rotas ganharam cerca de 1,2 kB: `/` 145,9 kB, `/recrutador` 38,6 kB, `/tecnico` 46,5 kB, `/clientes` 86,3 kB. Lighthouse de `/`: Performance 99, LCP de 2,2 s, TBT de 35 ms, CLS 0.

Com as quatro artes finais dos personagens (2026-10-07, AVIF de 16 a 18 kB cada), a rota `/` mede Performance 98, LCP de 2,4 s, TBT de 45 ms e CLS 0. O JavaScript não mudou.

Com a escolha do personagem na própria home (2026-10-07), a rota `/` mede 146,1 kB de JavaScript, Performance 98, LCP de 2,4 s, TBT de 45 a 58 ms e CLS 0.

Com as bandeiras de idioma, o contorno no texto e a fonte M PLUS Rounded 1c (2026-10-07), o JavaScript não mudou em nenhuma rota (nada disso usa script). Na rota `/`: Performance 97, LCP de 2,58 a 2,62 s, TBT de 39 a 51 ms e CLS 0,001. Medições de controle na mesma máquina: só com as bandeiras, sem a fonte, o LCP fica em 2,46 a 2,50 s; com a fonte nos dois pesos, 2,77 s (a home passou a baixar só o peso 700); com `font-display: optional` não muda. As áreas do shell medem LCP de 1,4 a 1,6 s e `/como-foi-feito`, 1,9 s.

Com o painel do personagem em estilo menu de RPG (2026-10-08), só HTML e CSS mudaram: a rota `/` continua em 146,1 kB de JavaScript e pedindo um só arquivo de fonte. LCP de 2,62 a 2,65 s, contra 2,59 a 2,65 s medidos antes da mudança na mesma máquina; TBT de 37 a 45 ms e CLS 0,001.

Com o botão da música de fundo (2026-10-08), as três páginas Next.js vão de 146,1 para 146,8 kB de JavaScript; as áreas do shell não mudam. LCP de `/` de 2,62 a 2,63 s, TBT de 37 a 39 ms e CLS 0,001. Uma primeira versão, com o botão em um arquivo de script próprio, media 147,0 kB e LCP de 2,71 a 2,73 s, acima do teto: o custo era do download a mais, não dos bytes. Nenhum áudio é pedido na carga; a faixa só é baixada quando a música toca.

Com os efeitos sonoros de seleção (2026-10-08), as três páginas Next.js vão de 146,8 para 147,5 kB de JavaScript, ainda em nove arquivos de script. LCP de `/` de 2,61 a 2,64 s, TBT de 37 a 39 ms e CLS 0,001.

Com o seletor de idioma em lista e a retomada do som (2026-10-08), as páginas Next.js medem 147,6 kB de JavaScript, em nove arquivos. Só a bandeira do idioma em uso é pedida na carga, em vez das quatro, e o LCP de `/` cai para 2,55 a 2,57 s; TBT de 40 a 55 ms e CLS 0,001.

As estimativas erraram para os dois lados. O Angular sem zone.js ficou em um terço do teto. O React e o Next.js já nascem perto do teto, com folga de cerca de 3 kB e, depois da tela de escolha de perfil, 5 kB; a primeira feature dessas áreas vai exigir carga sob demanda ou a decisão registrada de subir o teto.

## Outros recursos

| Recurso              | Limite                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS inicial por rota | 20 kB comprimido                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Fontes               | No máximo 2 arquivos, com `font-display: swap`. Sem pré-carga enquanto o LCP da home for a imagem do personagem: a pré-carga disputaria banda com ela (decisão do autor em 2026-10-07)                                                                                                                                                                                                                                                |
| Áudio                | Um arquivo de música, de até 2,5 MB, nunca pedido na primeira página de uma visita: só depois de o visitante ligar o som ou no primeiro gesto de quem já tinha ligado. Exceção: na continuação da mesma aba de quem estava ouvindo (trocar de idioma, recarregar, voltar à home), a página tenta retomar sozinha. Os efeitos de seleção são sintetizados no navegador, sem arquivo, e não criam contexto de áudio com o som desligado |
| Imagem do LCP        | Dimensões declaradas, formato moderno, sem carregamento tardio                                                                                                                                                                                                                                                                                                                                                                        |
| Demais imagens       | `loading="lazy"` e dimensões declaradas                                                                                                                                                                                                                                                                                                                                                                                               |
| Scripts de terceiros | Nenhum sem registro neste arquivo                                                                                                                                                                                                                                                                                                                                                                                                     |

## Acessibilidade (WCAG 2.2 nível AA)

Automático, no CI:

- Nota de Acessibilidade do Lighthouse: 100.
- Verificação automática de acessibilidade nos testes dos componentes do design system e nos e2e.

Manual, a cada componente novo e a cada área nova (ferramentas automáticas pegam só parte dos problemas):

- Tudo operável por teclado, com foco visível e ordem lógica.
- Contraste de 4,5:1 para texto e 3:1 para texto grande e elementos de interface, nos dois temas.
- `lang` correto no `<html>` para cada um dos quatro idiomas.
- Ao trocar de área, o foco vai para o conteúdo principal e o título da página muda.
- `prefers-reduced-motion` respeitado.
- Imagens com `alt`; ícones decorativos escondidos de leitores de tela.
- Uma passada com leitor de tela por área antes de publicar.

## SEO

Cobrado no CI desde o bootstrap: a nota do Lighthouse e `<title>` e descrição por rota. Os demais itens abaixo valem a partir da tarefa de SEO.

- Nota de SEO do Lighthouse: 95 ou mais.
- Toda rota, em todo idioma, tem `<title>` e descrição próprios.
- `hreflang` entre as quatro versões de cada página, e `canonical`.
- `sitemap.xml` com todas as rotas e idiomas; `robots.txt`.
- Dados estruturados de pessoa (`Person`) na home.
- Imagem e texto de compartilhamento (Open Graph) por página.
- Conteúdo com valor de busca fica em páginas Next.js, que têm HTML completo.

## Fontes

- [web.dev: Web Vitals](https://web.dev/articles/vitals)
- [Vue e Web Components](https://vuejs.org/guide/extras/web-components)

Não verificado: os limites de TBT (200 ms) e das notas do Lighthouse são propostas deste documento, sem fonte conferida nesta rodada.
