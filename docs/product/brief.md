# Brief do produto

Status: rascunho para aprovação. Origem: entrevista de 2026-10-06.

## O que é

Portfólio pessoal de um desenvolvedor full-stack. Site estático, sem backend, com todo o conteúdo em arquivos JSON. Dev solo.

A ideia central: **uma área por público, cada área em uma tecnologia diferente**. O uso de vários frameworks no mesmo produto é parte do que o site demonstra, e não só um detalhe de implementação.

## Públicos e o que cada um precisa achar em 10 segundos

| Público            | Precisa achar em 10 segundos                                                     | Ação esperada                        |
| ------------------ | -------------------------------------------------------------------------------- | ------------------------------------ |
| Recrutadores e RH  | Resumo e stack; experiência; currículo em PDF; formação e certificados           | Baixar o currículo, chamar para vaga |
| Tech leads e devs  | Projetos com decisões técnicas; skills com filtro; como o site foi feito; GitHub | Ver código e projetos                |
| Clientes freelance | Serviços; depoimentos; projetos contados pelo resultado; canal de orçamento      | Pedir orçamento                      |
| Comunidade dev     | Artigos; como o site foi feito; open source e GitHub; design system              | Ler, ver o código, seguir            |

Não há uma ação principal única: cada área tem a sua.

## Estrutura

- **Entrada (home):** tela de escolha de perfil, decidida em 2026-10-07. Quatro personagens de corpo inteiro, um por público, sob a chamada "Escolha seu caminho" e uma linha discreta com nome e cargo do autor. Ao apontar ou focar um personagem ele ganha destaque e mostra uma frase em primeira pessoa. Ao escolher, os outros saem e aparece um painel em estilo menu de RPG, com a descrição do perfil no tom daquele público e as opções "Entrar" e "Voltar", na cor da tecnologia da área. Na primeira visita, um pop-up oferece o idioma e a "imersão total" (música e animações), desmarcada por padrão. Um botão no canto liga o som, desligado por padrão: música de fundo lofi (`docs/plans/home-musica.md`) e efeitos de seleção em estilo menu de jogo (`docs/plans/home-efeitos.md`). A tela tem movimento suave, só em CSS: quem está apontado se destaca dos outros, que escurecem (`docs/plans/home-animacoes.md`). No celular é um carrossel, um personagem por vez. Detalhes em `docs/plans/home-perfis.md`, `docs/plans/home-selecao.md` e `docs/plans/home-painel-rpg.md`. O fundo é um cenário animado de sakura, de dia no tema claro e à noite no escuro (`docs/plans/home-sakura.md`).
- **Área do recrutador:** ficha rápida (localização, modelo de trabalho, disponibilidade, inglês, senioridade), resumo e stack, experiência (linha do tempo), projetos em destaque (papel, desafio, resultado), formação e certificados, currículo em PDF e contato sempre à vista. Decidido em 2026-10-09; a página está no ar com dados de exemplo e a faixa "Dados de exemplo", até o conteúdo real entrar (`docs/content/pendencias-do-autor.md`).
- **Área técnica:** projetos na visão técnica (problema, arquitetura, trade-offs, código), skills filtráveis, GitHub.
- **Área do cliente:** serviços, depoimentos, projetos na visão de resultado, canal de orçamento.
- **Área da comunidade:** artigos, open source, vitrine do design system.
- **Como foi feito** (`/como-foi-feito`): explica a arquitetura do próprio site. Aparece nas áreas técnica e da comunidade. Enquanto as áreas estão "em construção" e sem menu, nenhuma página liga para ela: só abre pelo endereço.
- **Sobre e Contato:** presentes em todo o site.

O mesmo projeto aparece em duas áreas com narrativas diferentes: técnica para o tech lead, de resultado para o cliente.

## Seções de conteúdo

Sobre, Projetos, Experiência, Skills, Formação e certificados, Serviços freelance, Depoimentos, Artigos, Currículo em PDF, Contato.

## Idiomas

| Código  | Idioma              | Papel                                 |
| ------- | ------------------- | ------------------------------------- |
| `pt-BR` | Português do Brasil | Padrão e idioma de origem do conteúdo |
| `en`    | Inglês              | Tradução                              |
| `es`    | Espanhol            | Tradução                              |

O autor escreve em pt-BR. As outras duas versões são traduzidas com apoio de IA e revisadas pelo autor antes de publicar. Nenhuma tradução vai ao ar sem revisão. O português de Portugal foi removido por decisão do autor em 2026-10-09.

## Contato

Canais publicados: e-mail, LinkedIn, GitHub e WhatsApp, como links diretos.

Formulário de contato: **adiado**. Não entra nesta versão; a decisão sobre ter ou não formulário fica para depois.

## Conteúdo disponível hoje

Nenhum material está pronto (currículo, lista de projetos, depoimentos, artigos). Consequências:

- O schema é modelado a partir das seções, e não de dados reais; pode precisar de ajuste quando o conteúdo chegar.
- O esqueleto usa dados de exemplo claramente marcados como fictícios, com `status: "draft"`. Nenhum dado sobre o autor é inventado. A área do recrutador é a única que vai ao ar com eles, com aviso na página.
- Depoimentos só entram com autorização de quem escreveu.

## Fora de escopo

- Backend, banco de dados, autenticação e painel de administração (CMS).
- Formulário de contato (adiado, ver acima).
- Comentários, newsletter e busca.
- Analytics: não discutido; ver `docs/open-questions.md`.
