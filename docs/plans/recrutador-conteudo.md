# Plano: página do recrutador e transição "corte de katana"

- Status: **aprovado** pelo autor em 2026-10-09 e implementado. A aparência aguarda o olho do autor
- Origem: pedido e entrevista com o autor, pesquisa na web, `discovery-analyst` e `architect`
- Decisão de arquitetura: `docs/architecture/adr/0010-palco-com-conteudo-e-transicao-de-entrada.md`

**Objetivo:** a primeira página de conteúdo do site, para quem recruta em tecnologia, e uma transição de carregamento ao entrar nela pela home.

## O que a pesquisa indicou

- A triagem inicial é rápida, e o olhar vai para nome, cargo atual, empresa, datas e formação, depois palavras-chave. O estudo de origem (TheLadders, 2012 e 2018) é pequeno e de uma empresa de vagas; vale pela ordem das informações, não pelo número de segundos.
- O topo precisa responder "serve para a vaga?": cargo, localização e stack.
- Lista de tecnologias sem projeto que as demonstre vale pouco; projetos com papel, desafio e resultado pesam mais.
- Contato e currículo fáceis de achar.
- Animação é secundária à clareza. Por isso os títulos são diretos e a ficha abre a página sem esperar animação.

Fontes: [ATD, sobre o estudo dos 6 segundos](https://www.td.org/content/atd-blog/what-recruiters-look-at-during-the-6-seconds-they-spend-on-your-resume), [FlowingData](https://flowingdata.com/2012/04/11/how-recruiters-look-at-your-resume/), [Proxify](https://proxify.io/knowledge-base/job-descriptions/what-makes-a-developer-portfolio-stand-out-to-recruiters), [scale.jobs](https://scale.jobs/blog/portfolio-content-for-tech-jobs-what-recruiters-want). São textos de serviços de carreira, não pesquisa acadêmica.

## Decisões do autor

| Tema      | Decisão                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------- |
| Blocos    | Ficha rápida, resumo e stack, experiência, projetos em destaque, formação, currículo, contato fixo   |
| Conteúdo  | Dados de exemplo por ora, publicados com a faixa "Dados de exemplo" (decisão de 2026-10-09, à tarde) |
| Tema      | Verde, com referências visuais de jogo e de Demon Slayer; títulos e textos profissionais             |
| Animação  | Biblioteca Motion, na versão mini (ver "A biblioteca")                                               |
| Transição | Corte de katana ao clicar em "Entrar", só no recrutador, com som se o som estiver ligado             |

## A página

| Bloco                   | O que mostra                                                                              | Interação                    |
| ----------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- |
| Faixa de exemplo        | "Dados de exemplo", enquanto o perfil for rascunho                                        |                              |
| Contato                 | E-mail, LinkedIn, GitHub, WhatsApp e, havendo arquivo, o currículo                        | Acompanha a rolagem, no alto |
| Ficha                   | Nome, cargo, frase, localização, modelo de trabalho, disponibilidade, inglês, senioridade |                              |
| Resumo                  | O resumo profissional                                                                     |                              |
| Stack                   | Tecnologias com nível escrito e um medidor de três losangos                               | Filtro por categoria         |
| Experiência             | Linha do tempo: período, cargo, empresa, modelo, resumo, tecnologias                      | Destaques recolhidos         |
| Projetos em destaque    | Título, resumo, tecnologias, links                                                        | Papel, desafio ou resultado  |
| Formação e certificados | Tipo, título, instituição, período, credencial                                            |                              |

O personagem ao lado é o do shell. O retrato da ficha só aparece quando o perfil tiver `photo`, e o botão do currículo só quando tiver `cv`: não há PDF de exemplo.

### Referências visuais

Motivos, não arte da obra: nada de personagem, logotipo ou nome.

- **Xadrez verde e preto** (o padrão tradicional _ichimatsu_): faixa no alto da ficha e na lateral de cada bloco, deslizando devagar.
- **Corte de katana**: o risco afilado sob cada título, que se desenha quando o bloco entra, e a transição de entrada.
- **Ficha de jogo**: moldura da ficha rápida, medidor de nível em losangos, botões de cantos cortados.

## A biblioteca

O autor pediu a Motion para Vue (`motion-v`). Medido no bundle do microfrontend, que pesava 29,3 kB com teto de 60 kB:

| Forma de usar                                     | Microfrontend |
| ------------------------------------------------- | ------------- |
| `motion-v` com componentes animados               | 79,2 kB       |
| `motion-v` em modo enxuto (`LazyMotion`)          | 64,6 kB       |
| `motion-v` só com as funções de animar por código | 52,2 kB       |
| `motion`, sem a camada de Vue, versão mini        | 33,7 kB       |

Com os números na mão, o autor escolheu a última: o pacote `motion` 14.0.0, usando `animate` de `motion/mini` e `inView` e `stagger` de `motion`. É o mesmo motor, chamado por código dentro do componente. Não traz arrastar nem animação automática de layout.

O que é de quem:

- **Motion:** entradas dos blocos ao rolar, cascata dos itens, troca do filtro e das faces do projeto. Todas têm fim.
- **CSS:** o xadrez que desliza (contínuo, parado pela pausa do documento) e as transições de foco e ponteiro.

## Dados de exemplo

`status: "draft"`, id começando por `exemplo-`, nomes como "Empresa Exemplo" e endereços em `example.com`. O perfil continua com o nome real do autor, como já era.

A primeira decisão foi manter a área "em construção" em produção. Horas depois, com a página pronta, o autor pediu para publicá-la com os dados de exemplo. É uma exceção à regra de que rascunho não vai ao ar, e vale só para a área do recrutador:

- `packages/content/scripts/build.mjs` liga `publishRecruiterExample`. Enquanto o perfil for rascunho, o módulo da área entrega os rascunhos, com `example: true`.
- A página mostra a faixa "Dados de exemplo" no topo, nos três idiomas.
- `profile` continua `null` em produção: a home não ganha a linha de nome e cargo.
- Publicar o perfil encerra a exceção sozinho. Para voltar à tela "em construção" antes disso, basta trocar a constante para `false`.

O que falta do autor para trocar os exemplos pelos dados reais está em `docs/content/pendencias-do-autor.md`.

## A transição

| Momento            | O que acontece                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| Clique em "Entrar" | Som de lâmina (ruído filtrado, com o som ligado); duas metades verdes fecham a tela na diagonal |
| 0,2 s depois       | Aparecem "Entrando..." e uma barra curta                                                        |
| 0,45 s             | A home navega para a área                                                                       |
| Na área            | A cortina já está na tela antes da primeira pintura e se abre pela mesma diagonal, em 0,5 s     |

Não passa pela transição quem pediu movimento reduzido, quem pausou as animações, o Ctrl+clique e a navegação sem JavaScript.

## Medido (2026-10-09)

| Item                      | Antes         | Depois        | Teto   |
| ------------------------- | ------------- | ------------- | ------ |
| JavaScript de `/`         | 147,9 kB      | 148,3 kB      | 150 kB |
| Arquivos de script de `/` | 9             | 9             | 9      |
| LCP de `/`                | 2,56 a 2,63 s | 2,57 a 2,64 s | 2,7 s  |
| Microfrontend Vue         | 29,8 kB       | 43,1 kB       | 60 kB  |
| Rota `/recrutador`        | 38,8 kB       | 51,8 kB       | 90 kB  |
| LCP de `/recrutador`      | 1,51 s        | 1,81 s        | 2,5 s  |
| CLS de `/recrutador`      | 0,001         | 0,033         | 0,1    |

O maior elemento da página, no perfil de celular do Lighthouse, é a frase da ficha. Sem conteúdo (a constante de publicação em `false`), o microfrontend mede 30,2 kB e a rota 38,9 kB.

## Testes

- **Unitários do microfrontend** (`apps/mfe-vue/src/page.test.ts`), com conteúdo de teste: blocos e ordem, faixa de exemplo, ficha traduzida, currículo e retrato só com arquivo, barra de contato, filtro, faces do projeto, período por idioma, pausa por propriedade customizada, alvo de toque.
- **e2e da página** (`e2e/recruiter.spec.ts`): axe nos dois temas, palco do shell, entrada ao rolar, deslocamento de layout, pausa, movimento reduzido, teclado, fontes e celular.
- **e2e da transição** (`e2e/home-enter.spec.ts`): com teclado, movimento reduzido, pausa, Ctrl+clique, outras áreas, marca velha, volta pelo navegador e sem JavaScript.
- Os specs que conferiam a tela "em construção" deixaram de incluir o recrutador.

## Pendências

- Conteúdo real do autor, listado em `docs/content/pendencias-do-autor.md`. O PDF do currículo ainda não tem lugar de publicação definido.
- Revisão dos textos em en e es (B6).
- Firefox, Safari e celular de verdade (B12); leitor de tela (B11).
- As outras três áreas não têm a transição.
