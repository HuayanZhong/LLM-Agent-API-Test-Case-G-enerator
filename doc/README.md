# 接口测试用例辅助生成系统 · 文档索引

按论文阅读顺序：

| # | 图 | 内容 |
|---|---|---|
| 1 | [业务架构](business-architecture.html) | 四行骨架 + 核心能力层 |
| 2 | [技术架构](technical-architecture.html) | 桌面端技术栈与组件 |
| 3 | [RAG 数据流](rag-dataflow.html) | 索引、检索与回流 |
| 4 | [A2A 生命周期](a2a-lifecycle.html) | 派发、回执与复验 |
| 5 | [数据模型 · 主链](erd-core.html) | 接口、用例、执行、基线与报告 |
| 6 | [数据模型 · 知识与协同](erd-knowledge.html) | GraphRAG、OKF、A2A 与治理 |

所有 HTML 都是单文件，可直接打开；右上角可切换深浅色与视图。

## 目录约定

- `source/`：可编辑的 Archify candidate JSON。改图从这里改，再执行 finalize 重新生成对应 HTML。
- `_evidence/`：校验回执、截图与历史迭代，属于生成物，不影响文档阅读，可整体删除。

## 阅读顺序

先看业务架构确定范围与分层，再看技术架构落技术选型；RAG 与 A2A 是两条关键链路，最后用两张 ERD 落到数据表。
