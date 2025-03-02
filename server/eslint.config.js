module.exports = [
  {
    files: ['**/*.ts', '**/*.js', '**/*.test.ts', '**/*.test.js'],
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/build/**',
      '**/lcov-report/**',
      '**/jest.config.ts',
      '**/ecosystem.config.js',
      '**/.vision-ai/**',
      '**/.DS_Store',
      '**/.env',
      '**/.env.example',
      '**/.gitignore',
      '**/.prettierrc',
      '**/README.md',
      '**/package-lock.json',
      '**/package.json',
      '**/requirements.txt',
      '**/vercel.json',
      'eslint.config.js'
    ],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: ['./tsconfig.eslint.json'], // ✅ Use only this config
        tsconfigRootDir: process.cwd(),
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      prettier: require('eslint-plugin-prettier'),
      import: require('eslint-plugin-import')
    },
    rules: {
      "import/order": [
        "error",
        {
          "groups": [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index"
          ],
          "pathGroups": [
            {
              "pattern": "@/**",
              "group": "internal",
              "position": "after"
            }
          ],
          "pathGroupsExcludedImportTypes": ["builtin"],
          "newlines-between": "always"
        }
      ],
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
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          "vars": "all",
          "varsIgnorePattern": "^_",
          "args": "after-used",
          "argsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ]
    },
  },
]
