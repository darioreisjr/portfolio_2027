# Orçamentos de qualidade

Status: **aceito** pelo autor em 2026-10-06. Cobrado no CI pelo Lighthouse CI a partir do bootstrap.

## Core Web Vitals

Nível "bom" do web.dev, medido no percentil 75 das visitas, em celular e desktop.

| Métrica | Limite |
|---|---|
| LCP | até 2,5 s |
| INP | até 200 ms |
| CLS | até 0,1 |

O site não tem coleta de dados de campo (analytics está em aberto), então o CI usa medidas de laboratório como substitutas:

| Medida de laboratório (Lighthouse, perfil celular) | Limite | Substitui |
|---|---|---|
| LCP | até 2,5 s | LCP de campo |
| TBT | até 200 ms | INP (o web.dev indica o TBT como substituto de laboratório) |
| CLS | até 0,1 | CLS de campo |
| Nota de Performance | 90 ou mais | Visão geral |

## JavaScript inicial por rota

Tamanho transferido (comprimido) de todo o JavaScript necessário para a rota ficar interativa. Os valores abaixo são **tetos de partida, estimados**; os tamanhos de runtime não foram medidos. No bootstrap, mede-se o "olá" de cada app e o teto passa a ser a linha de base medida mais uma folga para funcionalidades.

| Parte | Teto | Justificativa |
|---|---|---|
| Shell | 10 kB | Só roteia, carrega um script e troca tema e idioma; não há framework |
| Design system (Lit e componentes) | 20 kB | Uma cópia por documento, em cache entre rotas |
| MFE Vue (`/recrutador`) | 60 kB | A doc do Vue cita cerca de 16 kB de base para custom elements; o resto é folga para a linha do tempo |
| MFE React (`/clientes`) | 80 kB | `react-dom` é o maior custo fixo; a área é de cartões e listas, sem bibliotecas extras |
| MFE Angular (`/tecnico`) | 110 kB | Maior runtime dos três, e a área tem filtros e formulários |
| Página Next.js | 130 kB | React mais o runtime do Next.js; páginas de leitura, poucos Client Components |

Total por rota:

| Rota | Composição | Teto total |
|---|---|---|
| `/recrutador` | shell, design system, Vue | 90 kB |
| `/clientes` | shell, design system, React | 110 kB |
| `/tecnico` | shell, design system, Angular | 140 kB |
| `/`, `/comunidade`, `/como-foi-feito` | Next.js, design system | 150 kB |

Regras:

- Nenhuma rota carrega o runtime de dois frameworks de MFE.
- Dependência nova em um MFE precisa caber no teto da rota; se não couber, é carregada sob demanda ou não entra.
- Aumentar um teto exige registrar o motivo neste arquivo.

## Outros recursos

| Recurso | Limite |
|---|---|
| CSS inicial por rota | 20 kB comprimido |
| Fontes | No máximo 2 arquivos, com `font-display: swap` e pré-carga da principal |
| Imagem do LCP | Dimensões declaradas, formato moderno, sem carregamento tardio |
| Demais imagens | `loading="lazy"` e dimensões declaradas |
| Scripts de terceiros | Nenhum sem registro neste arquivo |

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
