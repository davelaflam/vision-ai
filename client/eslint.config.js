import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginPrettier from 'eslint-plugin-prettier'

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'prettier/prettier': [
        'warn',
        {
          endOfLine: 'auto',
          printWidth: 120,
          semi: false,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {},
    ignores: ['dist/*'],
  },
]
