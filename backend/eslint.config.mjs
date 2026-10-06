export default [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: { console: "readonly", process: "readonly", module: "readonly", require: "readonly", __dirname: "readonly" },
    },
    rules: { "no-unused-vars": "warn", "no-undef": "error" },
  },
];
