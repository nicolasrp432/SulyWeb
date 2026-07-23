// Config mínima de ESLint. Pensada para detectar errores reales sin inundar de
// avisos un código que nunca se había lint-eado. En CI corre como paso
// informativo (continue-on-error), no bloquea el merge.
module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': 'warn',
    'no-undef': 'off', // globals de navegador / JSX sin parser dedicado
    'no-empty': 'off',
    'no-constant-condition': ['warn', { checkLoops: false }],
  },
  ignorePatterns: ['dist', 'node_modules', 'supabase/functions', 'src/scripts'],
};
