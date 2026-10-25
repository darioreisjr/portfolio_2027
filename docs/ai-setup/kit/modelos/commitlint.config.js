// Conventional Commits, sem coautor nem assinatura de ferramenta de IA. Ver a skill `commits`.
// Dependências: @commitlint/cli e @commitlint/config-conventional (e "type": "module" no
// package.json, ou renomeie para commitlint.config.mjs).

/** Linhas de assinatura que ferramentas de IA costumam acrescentar. */
const SIGNATURE = /^(co-authored-by:|generated with|🤖)/im;

export default {
  extends: ['@commitlint/config-conventional'],
  // Commits de robôs de dependência seguem o formato, mas não o resto das regras.
  ignores: [(message) => /^Signed-off-by: dependabot\[bot\]/m.test(message)],
  plugins: [
    {
      rules: {
        'sem-coautor': ({ raw }) => [
          !SIGNATURE.test(raw),
          'o commit não leva coautor nem assinatura de ferramenta (skill `commits`)',
        ],
      },
    },
  ],
  rules: {
    'sem-coautor': [2, 'always'],
  },
};
