// @ts-check
import { defineConfig, globalIgnores } from "eslint/config";
import angular from "angular-eslint";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/**", ".angular/**", "node_modules/**"]),
  {
    files: ["**/*.ts"],
    extends: [tseslint.configs.recommended, angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": ["error", { type: "attribute", prefix: "app", style: "camelCase" }],
      "@angular-eslint/component-selector": [
        "error",
        [
          { type: "element", prefix: "app", style: "kebab-case" },
          { type: "attribute", prefix: "app", style: "camelCase" },
        ],
      ],
      // UI primitives take the host element's `class` as an input so it can be merged with tailwind-merge.
      "@angular-eslint/no-input-rename": ["error", { allowedNames: ["class"] }],
    },
  },
  {
    files: ["**/*.html"],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // <app-select> renders the labelled combobox button.
      "@angular-eslint/template/label-has-associated-control": ["error", { controlComponents: ["app-select"] }],
    },
  },
]);
