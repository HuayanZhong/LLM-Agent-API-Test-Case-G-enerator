export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // header 保证 git log --oneline 可读；正文多为中文长句，不按行长卡
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
}
