# ADR 0016: Assistente mascote com IA (Gemini API) via Vercel Serverless Function

- Status: **aceito** pelo autor em 2026-10-24
- Data: 2026-10-24

## Contexto

O portfólio de Dario Reis é um site de entrega estática (ADR 0002 e ADR 0007), sem servidor fixo, sem autenticação e sem banco de dados. Para enriquecer a experiência de recrutadores, desenvolvedores e clientes, o autor deseja disponibilizar um assistente virtual temático em formato de mascote no canto inferior esquerdo da tela, capaz de conversar e responder perguntas em linguagem natural e humana sobre a sua trajetória profissional, competências técnicas, projetos e meios de contato.

Restrições fundamentais do projeto:

1. **Segurança de credenciais:** Chaves de API de provedores de IA (LLMs) não podem ser expostas no código JavaScript que roda no navegador do visitante sob nenhuma hipótese.
2. **Content-Security-Policy (CSP):** O site adota política estrita com `connect-src 'self'` (issue #47 / ADR 0007), que restringe conexões de rede do navegador à própria origem.
3. **Orçamentos de JavaScript:** Os limites estritos de bundle definidos em `docs/quality/budgets.md` exigem que qualquer código novo no cliente seja leve.
4. **Sem banco de dados:** Não há necessidade nem desejo de manter infraestrutura de banco de dados, login ou persistência de dados de visitantes (respeito a custos, simplicidade e LGPD).
5. **Fidelidade e escopo:** As respostas devem se basear estritamente nos dados reais do autor constantes em `packages/content`, sem alucinar fatos nem atuar como modelo de uso geral para assuntos desconexos.

## Opções

| Critério                                           | Opção 1: Vercel Serverless Function (`/api/chat`) com Google Gemini Flash                   | Opção 2: Widget externo de terceiros (ex.: Chatbase / Crisp)       | Opção 3: IA local no navegador (WebLLM / Chrome Built-in AI)             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **Proteção da chave de API**                       | **Total:** chave mantida em variável de ambiente no servidor                                | Parcial: depende de restrição de domínio da plataforma             | Nula: dispensaria chave, mas com restrições de suporte                   |
| **Compatibilidade com CSP (`connect-src 'self'`)** | **Total:** responde na mesma origem do domínio                                              | Não: exige abrir a CSP para múltiplos domínios externos            | Sim: executa no dispositivo local                                        |
| **Identidade visual e Design System**              | **Total:** Web Component próprio em Lit (`<ds-chat-assistant>`) com tokens e tema anime/RPG | Ruim: interface engessada de iframe com visual genérico de SaaS    | Total: Web Component próprio                                             |
| **Impacto no bundle e performance**                | **Mínimo:** apenas o widget visual no cliente; SDK roda no serverless                       | Médio a alto: script pesado de terceiros com trackers              | Crítico: dezenas a centenas de MB de pesos do modelo baixados no cliente |
| **Banco de dados necessário**                      | **Nenhum:** lê JSON de `packages/content` em memória; histórico na sessão                   | Não: gerenciado por terceiros, mas armazena conversas externamente | Não                                                                      |
| **Custo de operação**                              | **Zero:** coberto pela camada gratuita da Vercel (100k execuções/mês) e do Gemini Flash     | Pago após limites pequenos (geralmente \$20–\$50/mês)              | Zero, mas exige hardware potente com WebGPU                              |

## Decisão recomendada

**Opção 1: Vercel Serverless Function (`/api/chat`) com Google Gemini Flash e Web Component Lit no Design System.**

Motivos:

1. **Segurança e conformidade de rede:** A função serverless roda em `/api/chat` sob o mesmo domínio (`2027.darioreis.dev` e `develop.darioreis.dev`). A chave secreta `GEMINI_API_KEY` permanece restrita ao ambiente da Vercel, e a CSP `connect-src 'self'` não precisa ser relaxada.
2. **Contexto confiável sem banco de dados:** A função serverless carrega os dados reais de `packages/content` (perfil, experiências, projetos, formação, contatos, habilidades) e os injeta no _System Prompt_ com instruções rígidas de escopo (_guardrails_). Se o usuário fizer perguntas fora do escopo profissional do Dario, o mascote recusa com gentileza e convida ao contato direto.
3. **Experiência do usuário e responsividade:** O Google Gemini Flash (versão 2.0 ou 1.5) oferece latência extremamente baixa (geralmente abaixo de 1 segundo por turno), suportando conversação natural nos 3 idiomas suportados pelo portfólio (pt-BR, en, es).
4. **Integração limpa com o Design System:** O componente `<ds-chat-assistant>` será implementado em Lit em `packages/design-system`, utilizando os tokens de cor, tipografia e espaçamento existentes, com suporte nativo aos temas claro e escuro, acessibilidade total via teclado e leitores de tela (`aria-live`), posicionado no canto inferior esquerdo sem colidir com os controles de som, pausa e idioma situados à direita.

## Consequências

- O portfólio passa a ter um endpoint dinâmico `/api/chat` mantido como Serverless Function da Vercel, enquanto as páginas HTML continuam 100% estáticas.
- A Vercel CLI no deploy passa a publicar tanto o diretório `dist` quanto as funções serverless.
- É adicionada a variável de ambiente `GEMINI_API_KEY` nos ambientes de desenvolvimento e produção da Vercel e listada no `.env.example`.
- O histórico de conversas reside exclusivamente na sessão do navegador do visitante durante a visita, sem persistência em banco de dados.
- O componente `<ds-chat-assistant>` passa a ser disponibilizado no shell e no layout do Next.js.
- Devem ser adicionados testes E2E do Playwright validando a abertura, fechamento por teclado (`Esc`), acessibilidade (axe) e troca de tema do widget de chat.

## Fontes

- Vercel Serverless Functions: <https://vercel.com/docs/functions>
- Google Gemini API Documentation: <https://ai.google.dev/gemini-api/docs>
- Google Gen AI SDK for Node.js: <https://github.com/googleapis/genai-js>
