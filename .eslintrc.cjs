module.exports = {
  root: true,
  ignorePatterns: ["dist/", "node_modules/", "src/**/*.spec.ts"],
  overrides: [
    {
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        ecmaVersion: 2020,
        sourceType: "module"
      },
      plugins: ["@typescript-eslint"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended"
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
        "@typescript-eslint/no-explicit-any": "warn"
      }
    },
    {
      files: ["**/*.html"],
      parser: "@angular-eslint/template-parser",
      extends: [
        "plugin:@angular-eslint/template/recommended",
        "plugin:@angular-eslint/template/accessibility",
        "plugin:prettier/recommended"
      ],
      rules: {
        "@angular-eslint/template/click-events-have-key-events": "warn",
        "@angular-eslint/template/interactive-supports-focus": "warn",
        "@angular-eslint/template/label-has-associated-control": "warn"
      }
    }
  ]
};
