# O que falta do autor

Lista do que só o autor pode fornecer ou decidir. Atualizada em 2026-10-09. Quando um item chegar, ele entra em `packages/content/data/` (modelo em `docs/content/schema.md`) e sai desta lista.

## Para a área do recrutador

Hoje a página usa dados de exemplo, todos fictícios (`docs/plans/recrutador-conteudo.md`). Para trocá-los pelos reais:

| O quê                   | Detalhe pedido                                                                                                                        | Onde entra                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Frase de apresentação   | Uma linha: o que você faz e para quem                                                                                                 | `profile.json`, `tagline`                                      |
| Resumo profissional     | Um parágrafo: tempo de atuação, tipo de produto, tecnologias principais, o que procura                                                | `profile.json`, `summary`                                      |
| Localização             | Cidade e país                                                                                                                         | `profile.json`, `location`                                     |
| Modelo de trabalho      | Remoto, híbrido ou presencial                                                                                                         | `profile.json`, `workMode`                                     |
| Disponibilidade         | Texto curto: imediata, a combinar, só freelas etc.                                                                                    | `profile.json`, `availability`                                 |
| Nível de inglês         | Básico, intermediário, avançado ou fluente                                                                                            | `profile.json`, `englishLevel`                                 |
| Senioridade             | Júnior, pleno, sênior ou especialista                                                                                                 | `profile.json`, `seniority`                                    |
| Tecnologias             | Nome, categoria (front-end, back-end, banco, DevOps, testes, design, outra) e nível de cada uma                                       | `skills.json`                                                  |
| Tecnologias em destaque | As três a cinco que abrem a lista                                                                                                     | `profile.json`, `highlightSkills`                              |
| Experiências            | Empresa, site (opcional), cargo, início e fim (mês e ano), cidade, modelo, resumo, dois a quatro destaques com resultado, tecnologias | `experiences.json`                                             |
| Projetos em destaque    | Dois ou três: título, resumo de uma frase, seu papel, o desafio, o resultado, tecnologias, links de código e de demonstração          | `projects.json`                                                |
| Formação e certificados | Tipo (graduação, curso, certificação), título, instituição, início e fim, link da credencial (opcional)                               | `education.json`                                               |
| Contatos                | E-mail, LinkedIn, GitHub e WhatsApp: endereço e texto visível                                                                         | `contacts.json`                                                |
| Currículo em PDF        | O arquivo, em pt-BR e, se houver, em en e es                                                                                          | `profile.json`, `cv`; falta definir onde o arquivo é publicado |
| Foto (opcional)         | Quadrada, 400×400 ou maior, com um texto alternativo                                                                                  | `profile.json`, `photo`                                        |

## Para a área técnica

Hoje os estudos de caso e as tecnologias são de exemplo (`docs/plans/tecnico-conteudo.md`). O raio-x do site já é real.

| O quê               | Detalhe pedido                                                                                                | Onde entra                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Estudos de caso     | Dois ou três projetos: o problema, a arquitetura escolhida e os trade-offs (o que se ganhou e o que se pagou) | `projects.json`, `technical` |
| Código dos projetos | Link do repositório e, se houver, da demonstração                                                             | `projects.json`, `links`     |
| Tecnologias         | As mesmas da área do recrutador: nome, categoria e nível                                                      | `skills.json`                |
| GitHub              | Se a área deve mostrar atividade ou repositórios, e quais                                                     | a definir                    |

## Revisões

| O quê                                                                         | Onde                                                                 |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Textos em inglês e espanhol escritos por IA                                   | `ui`, `home`, `recruiter` (pendência B6 de `docs/open-questions.md`) |
| Cargo no perfil, nos três idiomas                                             | `profile.json`, `role`                                               |
| Aparência das páginas do recrutador e técnica e das transições de ida e volta | `http://localhost:5173/recrutador/` e `/tecnico/`                    |

## Conferências que dependem de aparelho ou pessoa

| O quê                                                                                                                    | Pendência |
| ------------------------------------------------------------------------------------------------------------------------ | --------- |
| Firefox, Safari e um celular de verdade                                                                                  | B12       |
| Leitor de tela (VoiceOver, TalkBack)                                                                                     | B11       |
| Os três revisores do fluxo (`integration-reviewer`, `a11y-perf-reviewer`, `design-system-guardian`) nas últimas entregas |           |

## Para as próximas áreas

Ainda sem conteúdo nem página: Clientes (serviços, depoimentos com autorização de quem escreveu, canal de orçamento) e Comunidade (artigos, código aberto). Elas também não têm transição de entrada.
