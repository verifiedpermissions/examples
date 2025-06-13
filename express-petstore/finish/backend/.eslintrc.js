module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }]
  },
  overrides: [
    {
      files: ['dist/**/*.d.ts'],
      rules: {
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    },
    {
      files: ['src/__tests__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};
