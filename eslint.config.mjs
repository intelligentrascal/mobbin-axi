import js from '@eslint/js';
export default [{ ignores: ['dist/**', 'scripts/**'] }, js.configs.recommended, { languageOptions: { ecmaVersion: 2022, sourceType: 'module' } }];
