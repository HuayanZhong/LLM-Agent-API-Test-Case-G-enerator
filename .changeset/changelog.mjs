// 自定义 CHANGELOG 生成器：链接解析仍交给 changelog-github，只改行格式。
// 默认格式会同时输出 PR、提交、作者三组链接，正文里噪音太大；
// {ref} 在有 PR 时用 PR，没有时回退到提交，保留一个引用即可。
import github from "@changesets/changelog-github"

export default {
  async getReleaseLine(changeset, type, options) {
    return github.getReleaseLine(changeset, type, {
      ...options,
      template: "- {summary} {ref}",
    })
  },
  getDependencyReleaseLine(changesets, dependenciesUpdated, options) {
    return github.getDependencyReleaseLine(changesets, dependenciesUpdated, options)
  },
}
