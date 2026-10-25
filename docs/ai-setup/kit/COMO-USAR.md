# Como usar o kit de agentes

Guia prático, com comandos e pedidos prontos para colar no agente. O porquê de cada peça e os detalhes ficam no [GUIA.md](GUIA.md).

## 1. Pegue o kit

**Da sua máquina,** se este repositório já está clonado: o kit fica em `docs/ai-setup/kit/`.

**Do GitHub,** sem clonar o repositório inteiro (Git Bash, numa pasta temporária):

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/darioreisjr/portfolio_2027.git kit-agentes
cd kit-agentes
git sparse-checkout set docs/ai-setup/kit
```

Use a branch `production` (o padrão). Antes de uma mudança do kit chegar à produção, ela só existe na `development`: acrescente `--branch development` ao `git clone`.

Daqui em diante, `<KIT>` é o caminho da pasta `docs/ai-setup/kit` que você pegou.

## 2. Instale num projeto

### Com o agente (recomendado)

Abra o Claude Code (ou Codex, ou Antigravity) na raiz do projeto e cole:

```
Quero instalar o kit de agentes que está em <KIT>.
Leia o GUIA.md inteiro. Depois me entreviste com o questionário da seção 2,
em perguntas de múltipla escolha com uma opção recomendada. Com as respostas,
siga a seção 3: copie os modelos, preencha todas as lacunas <<...>>, apague o
que não se aplica, rode node scripts/ai-sync.mjs e --check, e me mostre o
resultado antes de fazer o commit.
```

O agente faz as perguntas (ferramentas, idioma, branches, se tem interface, formatador…) e monta tudo.

### À mão

```bash
cp -rn <KIT>/modelos/. .
grep -rn "<<" AGENTS.md CLAUDE.md GEMINI.md .agents docs/ai-setup scripts   # lacunas a preencher
node scripts/ai-sync.mjs
node scripts/ai-sync.mjs --check
```

Depois siga os passos 6 a 13 da seção 3 do [GUIA.md](GUIA.md#3-instalação-passo-a-passo): Husky e commitlint, CI, ignorar os gerados no formatador, segredos, confiança e validação.

### O que só você pode fazer

Em qualquer dos dois jeitos, sobra para você o que fica fora do repositório:

1. **Segredos.** Crie o `.env` a partir do `.env.example`, preencha e ponha as variáveis no ambiente do usuário (o comando do PowerShell está no passo 10 do guia). Reabra o terminal.
2. **Confiança.** Abra cada ferramenta (`claude`, `codex`, `gemini`, `agy`) na raiz do projeto, aceite confiar na pasta e aprove os servidores MCP e os hooks quando pedirem.
3. **Teste do hook.** Numa sessão nova, peça: _"edite o .mcp.json e acrescente um espaço"_. O agente precisa ser recusado com a mensagem "é gerado por scripts/ai-sync.mjs". Se foi, os hooks funcionam.
4. **Teste do commit.** Tente `git commit -m "teste"`. O `commitlint` precisa recusar (falta o tipo, como `docs:`).

## 3. Use no dia a dia

| Quero                                     | Faço                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| Fazer uma tarefa                          | Peço normalmente. O agente explora, planeja e espera minha aprovação antes de implementar. |
| Mudar uma regra para todos os agentes     | Edito o `AGENTS.md`.                                                                       |
| Acrescentar skill, subagente, MCP ou hook | Edito só a fonte (tabela abaixo), rodo `node scripts/ai-sync.mjs` e abro uma sessão nova.  |
| Ver o que cada ferramenta carregou        | `/skills`, `/agents`, `/hooks` e `/mcp` em cada uma.                                       |
| Segunda opinião                           | Abro outra ferramenta na mesma pasta: ela lê as mesmas instruções.                         |

| O quê      | Fonte                            |
| ---------- | -------------------------------- |
| Instruções | `AGENTS.md`                      |
| Skills     | `.agents/skills/<nome>/SKILL.md` |
| Subagentes | `docs/ai-setup/agents.md`        |
| MCP        | `docs/ai-setup/mcp.json`         |
| Hooks      | `docs/ai-setup/hooks.json`       |
| Extras     | `docs/ai-setup/settings.json`    |

## 4. Pedidos prontos

Cole no agente e troque o que está entre `<` e `>`.

**Tarefa com o fluxo completo:**

```
Tarefa: <descrição>. Siga o fluxo do AGENTS.md: discovery-analyst, depois um
plano do architect para eu aprovar. Não implemente antes da minha aprovação.
```

**Revisão depois de implementar:**

```
Revise a mudança atual com o code-reviewer e, se mexeu em entrada de usuário,
workflows ou dependências, com o security-reviewer. Separe o que bloqueia do
que é melhoria.
```

**Nova skill:**

```
Crie a skill <nome> em .agents/skills/<nome>/SKILL.md para <o que ela ensina>.
A description diz o que faz e quando usar. Rode node scripts/ai-sync.mjs e
cite a skill no AGENTS.md se for convenção de uma pasta.
```

**Novo subagente:**

```
Crie o subagente <nome> em docs/ai-setup/agents.md para <papel>, com o perfil
de menor permissão que serve. Rode node scripts/ai-sync.mjs.
```

**Novo servidor MCP:**

```
Acrescente o servidor MCP <nome> (<url ou comando>) em docs/ai-setup/mcp.json.
Se precisar de token, use bearerEnv e ponha o nome da variável no .env.example,
sem valor. Confira a versão exata na documentação. Rode node scripts/ai-sync.mjs.
```

**Atualizar um projeto que já usa o kit:**

```
Este projeto usa o kit de agentes na versão que está em docs/ai-setup/README.md.
A versão atual está em <KIT>. Leia o histórico do GUIA.md e siga a seção 8:
mostre o que mudou entre as duas versões, compare cada arquivo com o do projeto
antes de copiar, preserve as personalizações e me mostre o diff antes do commit.
```

**Levar uma melhoria de volta para a cópia mestra:**

```
Neste projeto melhorei <o quê>. Abra <KIT>, siga a seção 7 do GUIA.md: leve
para modelos/ só a forma genérica, teste numa pasta temporária, suba a versão
e escreva a linha no histórico.
```

## 5. Quando algo não funciona

Veja a tabela de [problemas comuns](GUIA.md#9-problemas-comuns). Os três mais frequentes:

- **Skill ou subagente não aparece:** abra uma sessão nova; nas outras ferramentas, confira se confiou na pasta.
- **MCP sem autenticação:** a variável está só no `.env`. Ponha no ambiente do usuário e reabra o terminal.
- **`--check` acusa diferença logo depois de gerar:** o formatador está mexendo nos arquivos gerados. Ignore-os no formatador.
