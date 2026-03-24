// ESLint v9 flat config for RallyORM (ESM project)
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // Ignore patterns (replaces .eslintignore)
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.test-dist/**',
      'coverage/**',
      '**/*.d.ts',
      '**/*.min.js'
    ]
  },

  // Base recommended rules
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Project settings and custom rules
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.es2021,
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 
        args: 'after-used', 
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }],
      'no-constant-condition': ['warn', { checkLoops: false }],
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'multi-line'],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-case-declarations': 'off',
      'prefer-const': 'warn'
    }
  },

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.es2021,
        ...globals.node,
        ...globals.mocha
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        args: 'after-used',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }],
      'no-unused-vars': 'off',
      'no-constant-condition': ['warn', { checkLoops: false }],
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'multi-line'],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-case-declarations': 'off',
      'prefer-const': 'warn'
    }
  },

  // Examples and tests are more permissive
  {
    files: ['examples/**/*.{js,ts}', 'test/**/*.{js,ts}'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        args: 'none',
        varsIgnorePattern: '^(error|result|_)',
        argsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-empty': 'off', // Allow empty blocks in tests
      'no-constant-binary-expression': 'off'
    }
  }
];
