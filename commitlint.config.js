// Conventional Commits em pt-BR, sem coautor. Ver a skill `commits`.

/** Linhas de assinatura que ferramentas de IA costumam acrescentar. */
const SIGNATURE = /^(co-authored-by:|generated with|🤖)/im;

export default {
  extends: ['@commitlint/config-conventional'],
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
