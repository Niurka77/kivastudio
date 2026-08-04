import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import astroPlugin from 'eslint-plugin-astro';

/** Configuración de ESLint (flat config). Ver 14_CODING_STANDARDS.md. */
export default [
  // Ignorados (build, tooling y archivos generados)
  {
    ignores: ['dist/', '.vercel/', '.astro/', 'node_modules/', 'public/', '*.d.ts'],
  },

  // Recomendaciones JS base
  js.configs.recommended,

  // TypeScript (recommended)
  ...tseslint.configs.recommended,

  // Accesibilidad JSX/JS
  jsxA11y.flatConfigs.recommended,

  // React Hooks
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Astro (.astro archivos)
  ...astroPlugin.configs.recommended,

  // Globals por contexto
  {
    files: ['src/**/*.{ts,tsx,astro}', 'src/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  // Archivos de configuración / scripts de Node
  {
    files: ['*.config.{js,mjs,cjs,ts}', 'scripts/**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Reglas propias
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Astro frontmatter
  {
    files: ['**/*.astro'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
