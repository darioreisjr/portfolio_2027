# Mapa de microfrontends

Status: **aprovado** pelo autor em 2026-10-06. Base: áreas do `docs/product/brief.md`.

## Quem renderiza o quê

| Rota (pt-BR) | Área | App | Framework | Por quê |
| ----------------------- | -------------- | ------------------ | --------------- |
| `/` | Home | `apps/web-next` | Next.js | Primeira impressão de todos os públicos; precisa de HTML pronto para SEO e LCP |
| `/comunidade` | Comunidade | `apps/web-next` | Next.js | Artigos e open source são o conteúdo com mais valor de busca; é conteúdo de leitura, sem interação pesada |
| `/como-foi-feito` | Como foi feito | `apps/web-next` | Next.js | Página de texto e diagramas, indexável |
| `/recrutador` | Recrutador | `apps/mfe-vue` | Vue | Linha do tempo de experiência e formação: lista reativa com transições, bom caso para Vue |
| `/tecnico` | Técnica | `apps/mfe-angular` | Angular | Skills com filtro e projetos filtráveis por tecnologia: é a seção de filtro complexo |
| `/clientes` | Cliente | `apps/mfe-react` | React | Serviços, depoimentos e projetos por resultado: composição de cartões e listas |
| (todas as rotas de MFE) | Casca | `apps/shell` | JavaScript puro | Documento HTML, cabeçalho, rodapé, carga do script da área |

Isso mantém a proposta inicial (Next.js para entrada e SEO, React para projetos, Vue para linha do tempo, Angular para filtro, JavaScript puro para o shell) e encaixa cada framework em um público: Vue para recrutadores, Angular para tech leads, React para clientes, Next.js para a comunidade.

A tecnologia de cada área também está no campo `framework` da tabela de rotas de `packages/contracts`, Mude os dois juntos. A home não mostra mais o nome da tecnologia: cada personagem usa a cor dela (`docs/plans/home-painel-rpg.md`).

## Idiomas nas rotas

Decidido pelo autor em 2026-10-06: **rotas traduzidas**. pt-BR, o padrão, fica sem prefixo, o que preserva a rota pedida `/como-foi-feito`. Os demais idiomas ganham prefixo e nomes próprios.

| Área           | pt-BR             | en                     | es                 |
| -------------- | ----------------- | ---------------------- | ------------------ |
| Home           | `/`               | `/en`                  | `/es`              |
| Recrutador     | `/recrutador`     | `/en/recruiter`        | `/es/reclutador`   |
| Técnica        | `/tecnico`        | `/en/tech`             | `/es/tecnico`      |
| Cliente        | `/clientes`       | `/en/clients`          | `/es/clientes`     |
| Comunidade     | `/comunidade`     | `/en/community`        | `/es/comunidad`    |
| Como foi feito | `/como-foi-feito` | `/en/how-it-was-built` | `/es/como-se-hizo` |

O português de Portugal existiu até 2026-10-09 e foi removido por decisão do autor; os endereços `/pt-pt/...` respondem 404.

Os nomes em inglês e espanhol são proposta e podem ser trocados sem efeito na arquitetura.

Consequências das rotas traduzidas:

- Existe uma única tabela de rotas (área, idioma, caminho) em `packages/contracts`. Shell, Next.js, MFEs, troca de idioma, `hreflang`, sitemap e regras do host leem dela. Nenhum app escreve um caminho de outra área à mão.
- A troca de idioma leva à mesma área no outro idioma, consultando a tabela. São links comuns, escritos pelo dono de cada documento a partir de `languageAlternates` (ADR 0006); nenhum app é dono da troca.
- As tags dos MFEs (`<mfe-recrutador>` etc.) e os caminhos de bundles não são traduzidos.
- O slug de cada projeto é único, igual em todos os idiomas.

## Dois tipos de documento

| Tipo            | Rotas                                                       | Quem gera o HTML                                                                          |
| --------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Página Next.js  | `/`, `/comunidade`, `/como-foi-feito` e versões por idioma  | `next build` com export estático                                                          |
| Página do shell | `/recrutador`, `/tecnico`, `/clientes` e versões por idioma | Build do shell: um HTML por rota e idioma, com `<title>`, descrição e `hreflang` próprios |

Navegar entre os dois tipos recarrega o documento (link `<a>` comum). Navegar dentro de uma área é do próprio framework. O seletor de tema e o grupo do canto são os mesmos nos dois tipos, então a troca não é visível como mudança de layout. As páginas internas não têm menu: troca-se de área pela tela de escolha de perfil.

## Contrato de cada MFE

- Expõe um custom element: `<mfe-recrutador>`, `<mfe-tecnico>`, `<mfe-clientes>`.
- Recebe por atributo: `locale` e `base-path`.
- Fala com o shell só por eventos tipados de `packages/contracts`.
- Lê dados só por `packages/content`.
- Roda sozinho em desenvolvimento, com uma página HTML mínima própria.
- É montado dentro do palco que o shell desenha (`.area-outlet`) e marca com `part` o que a folha das páginas internas estiliza (ADR 0009).

## Projetos em duas áreas

O mesmo projeto aparece em `/tecnico` (Angular, narrativa técnica) e em `/clientes` (React, narrativa de resultado). Não há código compartilhado entre os dois: cada MFE lê `projects.json` e renderiza a narrativa que lhe cabe.
