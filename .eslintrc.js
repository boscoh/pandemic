// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  extends: ["prettier-standard", "plugin:vue/recommended"],
  plugins: ["vue", "prettier"],
  rules: {
    "prettier/prettier": "error"
  },
}
