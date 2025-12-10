// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-use-before-define": "off",
       "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    files: ['**/*.vue', '**/*.ts', '**/*.js'],
    languageOptions: {
      globals: {
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
      },
    },
  },
)
