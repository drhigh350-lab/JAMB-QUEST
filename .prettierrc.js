/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  printWidth: 100,
  tabWidth: 2,
  trailingComma: "es5",
  semi: true,
  singleQuote: true,
  arrowParens: "always",
  endOfLine: "lf",
  plugins: [require.resolve("@trivago/prettier-plugin-sort-imports")],
  importOrder: ["^@core/(.*)$", "^@server/(.*)$", "^@ui/(.*)$", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};

module.exports = config;
