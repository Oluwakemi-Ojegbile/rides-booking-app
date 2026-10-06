export default [
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { window: "readonly", document: "readonly", localStorage: "readonly", navigator: "readonly", AbortController: "readonly", setInterval: "readonly", clearInterval: "readonly" },
    },
    rules: { "no-unused-vars": "off", "no-undef": "error" },
  },
];
