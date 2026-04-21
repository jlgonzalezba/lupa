module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*",
    "/generated/**/*",
  ],
  rules: {
    "quotes": "off",
    "indent": "off",
    "max-len": "off",
    "object-curly-spacing": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "eol-last": "off",
  },
};
