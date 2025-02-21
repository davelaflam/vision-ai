const typescriptEslintPlugin = require('@typescript-eslint/eslint-plugin')
const typescriptEslintParser = require('@typescript-eslint/parser')
const eslintPluginPrettier = require('eslint-plugin-prettier')

module.exports = [
  {
    files: ['**/*.ts', '**/*.js'],
    ignores: [
      'eslint.config.js',
      '**/.DS_Store',
      '**/.env',
      '**/.env.example',
      '**/.gitignore',
      '**/.prettierrc',
      '**/README.md',
      '**/package-lock.json',
      '**/package.json',
      '**/requirements.txt',
      '**/tsconfig*.json',
      '**/vercel.json',
    ],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': [
        'warn',
        {
          endOfLine: 'auto',
          printWidth: 120,
          semi: false,
          singleQuote: true,
          trailingComma: 'all',
        },
      ],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
