/** @type {import("prettier").Options} */
module.exports = {
  endOfLine: 'lf',
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  arrowParens: 'avoid',
  plugins: ['prettier-plugin-packagejson', 'prettier-plugin-sort-json'],
  jsonRecursiveSort: true,
};
