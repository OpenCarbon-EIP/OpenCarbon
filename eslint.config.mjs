// Config ESLint racine (flat config) partagée par le mobile et les packages.
// Le backend a sa propre config et n'est pas concerné.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.expo/**",
      "**/.turbo/**",
      "**/expo-env.d.ts",
      "apps/backend/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { import: importPlugin },
    rules: {
      // Interdit les imports relatifs qui traversent une frontière de package
      // (ex: apps/mobile qui remonterait dans packages/*). On passe par @opencarbon/*.
      "import/no-relative-packages": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  prettier,
);
