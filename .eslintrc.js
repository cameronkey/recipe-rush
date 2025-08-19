module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: [
    'node',
  ],
  rules: {
    // Error handling
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',

    // Node.js specific
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-import': 'off',
    'node/no-unpublished-require': 'off',

    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Best practices
    'eqeqeq': 'error',
    'curly': 'error',
    'no-multiple-empty-lines': ['error', { max: 2 }],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['server.js'],
      env: {
        node: true,
        browser: false,
      },
    },
    {
      files: ['script.js', 'catalog.js', 'contact.js', 'js/**/*.js'],
      env: {
        browser: true,
        node: false,
      },
      globals: {
        Stripe: 'readonly',
        emailjs: 'readonly',
      },
    },
  ],
};
