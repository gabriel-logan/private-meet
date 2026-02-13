module.exports = {
  root: true,
  plugins: ["simple-import-sort"],
  extends: ["@react-native", "plugin:prettier/recommended"],
  rules: {
    "no-console": "warn",
    "simple-import-sort/imports": [
      "warn",
      {
        groups: [
          [String.raw`^\u0000`],
          ["^react", String.raw`^@?\w`],
          ["^@/"],
          ["^src/"],
          [String.raw`^\.`],
        ],
      },
    ],
  },
};
