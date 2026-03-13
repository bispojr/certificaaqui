module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    indent: ['error', 2],
    'no-unused-vars': ['warn'],
    'no-console': 'off',
  },
}
