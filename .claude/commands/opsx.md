---
description: OpenSpec 快捷入口，按参数转发到对应技能
argument-hint: <explore|propose|apply|update|sync|archive> [参数]
---

根据 `$ARGUMENTS` 的第一个词，调用对应技能；把剩余内容作为该技能的参数传入。

| 第一个词 | 技能 |
|---|---|
| `explore` | `openspec-explore` |
| `propose` | `openspec-propose` |
| `apply` | `openspec-apply-change` |
| `update` | `openspec-update-change` |
| `sync` | `openspec-sync-specs` |
| `archive` | `openspec-archive-change` |

第一个词缺失或无法识别时，列出上表并询问要执行哪一个。不要在这个命令里直接写代码或实现功能。
