import js from '@eslint/js'
import ts from '@typescript-eslint/eslint-plugin'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-plugin-prettier'
import importPlugin from 'eslint-plugin-import'
import vueParser from 'vue-eslint-parser'

export default [
  {
    files: ['**/*.{vue,js,mjs,cjs,ts,jsx,tsx}'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.vuepress/**', 'tsconfig.tsbuildinfo'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Node.js Globals
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        console: 'readonly',

        // Browser Globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        alert: 'readonly',
        fetch: 'readonly',
        HTMLVideoElement: 'readonly',
        MediaStream: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        history: 'readonly',
        location: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      vue,
      prettier,
      import: importPlugin,
    },
    rules: {
      // --- JavaScript & General Rules ---
      ...js.configs.recommended.rules,

      // --- TypeScript Rules ---
      ...ts.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-interface': 'off',

      // --- Vue Specific Rules ---
      ...vue.configs['vue3-recommended'].rules,
      'vue/no-multiple-template-root': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/component-tags-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
      ],
      'vue/first-attribute-linebreak': [
        'error',
        {
          singleline: 'ignore',
          multiline: 'below',
        },
      ],
      'vue/max-attributes-per-line': [
        'warn',
        {
          singleline: 3,
          multiline: 1,
        },
      ],

      // --- Import Order Rules ---
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '*.vue',
              group: 'sibling',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
        },
      ],

      // --- Prettier Integration ---
      'prettier/prettier': [
        'warn',
        {
          singleQuote: true,
          semi: false,
          trailingComma: 'all',
          printWidth: 120,
          endOfLine: 'auto',
        },
      ],

      // --- General Best Practices ---
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },
]
