# Regras das branches

Cópia versionada das regras (rulesets) que o GitHub aplica a este repositório (ADR 0014). O que vale é o que está no GitHub; estes arquivos servem para ler, revisar e recriar.

| Arquivo            | O que protege             | Regra                                                                                                                      |
| ------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `development.json` | A branch `development`    | Só por pull request, com `verify` e `origem` verdes, branch em dia, merge por rebase, sem alerta alto ou crítico do CodeQL |
| `production.json`  | A branch `production`     | Só por pull request, com `verify` e `origem` verdes, merge com commit de merge, sem alerta alto ou crítico do CodeQL       |
| `versoes.json`     | As tags `v*` das releases | Só o GitHub Actions (a release automática) cria; ninguém apaga nem move                                                    |

Ninguém fura as regras das branches, nem o dono do repositório (`bypass_actors` vazio). Nas tags, a única exceção é o GitHub Actions (`actor_id` 15368), que cria a versão. As checagens obrigatórias só valem se vierem do GitHub Actions (`integration_id` 15368): outro sistema não destrava o merge com uma checagem de mesmo nome. Em emergência, o caminho é editar a regra, a pedido do autor.

Criar uma regra:

```bash
gh api -X POST repos/darioreisjr/portfolio_2027/rulesets --input .github/rulesets/development.json
```

Alterar: edite o arquivo e envie com `-X PUT` para `repos/darioreisjr/portfolio_2027/rulesets/<id>`. O id sai de `gh api repos/darioreisjr/portfolio_2027/rulesets`.
