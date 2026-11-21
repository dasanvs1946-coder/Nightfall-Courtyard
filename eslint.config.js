import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', '.playwright-cli/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
