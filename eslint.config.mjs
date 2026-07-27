import js from '@eslint/js';
export default [{ ignores: ['dist/**', 'scripts/spike.mjs'] }, js.configs.recommended, { languageOptions: { ecmaVersion: 2022, sourceType: 'module' } }];
