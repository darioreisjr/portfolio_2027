// Conventional Commits em pt-BR, sem coautor. Ver a skill `commits`.

/** Linhas de assinatura que ferramentas de IA costumam acrescentar. */
const SIGNATURE = /^(co-authored-by:|generated with|🤖)/im;

export default {
  extends: ['@commitlint/config-conventional'],
  // Os commits do Dependabot são escritos por ele, em inglês e com linhas longas
  // no corpo. Seguem o formato (`build(deps): ...`), e o resto não é cobrado.
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
