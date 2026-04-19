import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    files: ['**/*.rules'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
      }
    }
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
