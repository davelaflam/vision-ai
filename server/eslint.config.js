import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin'
import typescriptEslintParser from '@typescript-eslint/parser'
import eslintPluginPrettier from 'eslint-plugin-prettier'

export default [
  {
    files: ['**/*.ts', '**/*.js'], // Match TypeScript and JavaScript files
    ignores: [
      'eslint.config.js', // ✅ Ignore ESLint's own config file
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
        project: './tsconfig.json', // Path to tsconfig.json
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