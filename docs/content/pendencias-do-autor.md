# O que falta do autor

Lista do que só o autor pode fornecer ou decidir. Atualizada em 2026-10-12. Quando um item chegar, ele entra em `packages/content/data/` (modelo em `docs/content/schema.md`) e sai desta lista.

## Para a área do recrutador

A página usa os seus dados reais desde 2026-10-12 (`docs/plans/recrutador-conteudo.md`). Falta:

| O quê                         | Detalhe pedido                                                                                                     | Onde entra                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Experiência DIO Campus Expert | Início e fim (mês e ano), modelo de trabalho, um resumo e de 2 a 4 destaques. Ficou de fora por falta desses dados | `experiences.json`                          |
| Foto                          | Quadrada, 512×512 ou maior, JPG, PNG ou WebP, rosto centrado, e uma frase que a descreva                           | Ponha em `packages/content/assets/profile/` |
| Currículo em PDF              | Em pt-BR e, se houver, em en e es; texto selecionável, até 1 MB                                                    | Ponha em `packages/content/assets/cv/`      |
| Link do diploma               | Endereço público da graduação, se existir                                                                          | `education.json`, `credentialUrl`           |
| Credencial de cibersegurança  | O link, quando o curso Foundations of Cybersecurity terminar, e a data de fim                                      | `education.json`                            |
| Datas das tecnologias         | O ano em que começou a usar Vitest e Playwright                                                                    | `skills.json`, `since`                      |
| Espanhol                      | Se quer mostrar o nível de espanhol (básico): a ficha hoje só tem o de inglês                                      | a definir                                   |
| Nome e cargo na home          | Se a home deve mostrar "Dario Reis · Software Engineer"; exige medir a velocidade de novo                          | `HOME_IDENTITY` em `scripts/build.mjs`      |
| Números                       | Resultados medidos (Core Web Vitals, cobertura de testes, releases) para trocar descrições por números             | `experiences.json`, `projects.json`         |

Quando a foto ou o PDF chegarem, avise: ligar o arquivo à página é uma tarefa pequena, mas ainda não foi feita.

## Para a área técnica

Hoje os estudos de caso e as tecnologias são de exemplo (`docs/plans/tecnico-conteudo.md`). O raio-x do site já é real.

| O quê               | Detalhe pedido                                                                                                | Onde entra                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Estudos de caso     | Dois ou três projetos: o problema, a arquitetura escolhida e os trade-offs (o que se ganhou e o que se pagou) | `projects.json`, `technical` |
| Código dos projetos | Link do repositório e, se houver, da demonstração                                                             | `projects.json`, `links`     |
| Tecnologias         | Já são as reais, as mesmas do recrutador; passam a aparecer aqui com o primeiro estudo de caso real           | `skills.json`                |
| GitHub              | Se a área deve mostrar atividade ou repositórios, e quais                                                     | a definir                    |

## Para a área do cliente

Hoje todos os blocos são de exemplo (`docs/plans/clientes-conteudo.md`).

| O quê                   | Detalhe pedido                                                                                            | Onde entra                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Serviços                | Três ou quatro ofertas concretas, em linguagem de quem contrata, com o que está incluído em cada uma      | `services.json`                     |
| Como funciona           | As etapas do seu trabalho, da primeira conversa ao suporte, com uma frase cada                            | `client.json`, `process`            |
| Como você orça          | Um parágrafo: do que depende o orçamento e quando o cliente recebe a proposta                             | `client.json`, `engagement.pricing` |
| Formas de contratar     | Quais você oferece (projeto fechado, por etapa, suporte mensal), com descrição e prazo típico de cada uma | `client.json`, `engagement.models`  |
| Perguntas frequentes    | Suas respostas reais sobre prazo, ajustes, propriedade do que é entregue, manutenção e pagamento          | `client.json`, `faq`                |
| Projetos pelo resultado | Para cada projeto: o cenário do cliente e o que mudou depois, sem termos técnicos                         | `projects.json`, `outcome`          |
| Depoimentos             | Texto, nome, cargo e empresa de quem escreveu, e a autorização dessa pessoa para publicar                 | `testimonials.json`                 |
| Canais de orçamento     | O número de WhatsApp e o e-mail que recebem os pedidos                                                    | `contacts.json`                     |
| Valores                 | Se um dia quiser mostrar faixas de preço; hoje a página não mostra nenhum                                 | a definir                           |

## Para a comunidade

Hoje os artigos e os canais são de exemplo (`docs/plans/comunidade-conteudo.md`). A vitrine do design system, o repositório deste site e os quatro projetos de código aberto já são reais.

| O quê                  | Detalhe pedido                                                                                                | Onde entra                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Artigos                | Para cada um: título, resumo de uma frase, data, assuntos, link, idioma em que foi escrito e tempo de leitura | `articles.json`                         |
| Onde acompanhar        | Confirmar se o GitHub e o LinkedIn reais, que já estão no recrutador, podem aparecer aqui também              | `contacts.json`, `primaryFor`           |
| O que é bem-vindo      | Se a lista atual (corrigir texto, relatar problema, sugerir, trocar ideia) é a sua, ou o que mudar            | `community/<locale>.json`, `join.items` |
| Palestras e newsletter | Se existem e devem entrar; hoje a página não tem esses blocos                                                 | a definir                               |

## Revisões

| O quê                                                                                                                                      | Onde                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Textos em inglês e espanhol escritos por IA                                                                                                | `ui`, `home`, `recruiter` (pendência B6 de `docs/open-questions.md`)            |
| Seus dados do recrutador em inglês e espanhol, traduzidos do pt-BR por IA                                                                  | `http://localhost:5173/en/recruiter/` e `/es/reclutador/`                       |
| Categoria de cada tecnologia: Next.js, TypeScript e JavaScript ficaram em front-end; Supabase e Prisma em banco de dados; Sentry em DevOps | `skills.json`                                                                   |
| Aparência das quatro páginas (recrutador, técnica, cliente e comunidade) e das transições de ida e volta                                   | `http://localhost:5173/recrutador/`, `/tecnico/`, `/clientes/` e `/comunidade/` |

## Conferências que dependem de aparelho ou pessoa

| O quê                                                                                                                    | Pendência |
| ------------------------------------------------------------------------------------------------------------------------ | --------- |
| Firefox, Safari e um celular de verdade                                                                                  | B12       |
| Leitor de tela (VoiceOver, TalkBack)                                                                                     | B11       |
| Os três revisores do fluxo (`integration-reviewer`, `a11y-perf-reviewer`, `design-system-guardian`) nas últimas entregas |           |

## Para as próximas áreas

Ainda sem conteúdo nem página: Como foi feito, que explica a arquitetura do próprio site. Ela também não tem transição de entrada.
