module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-throw-literal': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  },
  overrides: [
    {
      files: ['*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    },
    {
      files: ['src/context/*.tsx', 'src/utils/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-throw-literal': 'off'
      }
    }
  ]
};
