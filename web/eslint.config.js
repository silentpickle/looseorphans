// House rules: complexity under 15, nesting no deeper than 2, every number a named constant (0, 1, -1 may stay bare).
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "eslint.config.js"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ["src/**/*.ts", "tests/**/*.ts", "scripts/**/*.ts", "vite.config.ts"],
    rules: {
      complexity: ["error", 15],
      "max-depth": ["error", 2],
      "max-params": ["warn", 5],
      "no-magic-numbers": "off",
      "@typescript-eslint/no-magic-numbers": [
        "error",
        { ignore: [0, 1, -1], ignoreEnums: true, ignoreReadonlyClassProperties: true, ignoreTypeIndexes: true },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    files: ["tests/**/*.ts"],
    rules: { "@typescript-eslint/no-magic-numbers": "off" },
  },
);
