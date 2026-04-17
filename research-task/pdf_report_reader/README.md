# 外部研究报告阅读分析子项目

这个子项目服务于主终端里的“外部研究”模块，目标不是简单保存 PDF，而是把 `外部研究报告/` 目录中的内容拆成可以直接并入主系统的数据层。

## 目标

- 扫描本地 PDF 研究报告
- 提取正文与关键页
- 自动映射到现有系统的：
  - 理论框架
  - 宏观情景
  - 资产映射
  - 配置方法论
  - 历史复盘
  - 当前判断
- 识别系统里原本没有明确沉淀的新知识点
- 统计全量处理耗时，支持后续优化

## 输出位置

- 结构化数据：`data/external_reports.json`
- 人工校正层：`data/external_reports_review.json`
- 图表页图片：`research-task/generated/external-reports/charts/`
- 单报告缓存：`research-task/generated/external-reports/cache/`

## 运行方式

优先使用项目内虚拟环境：

```bash
.venv/bin/python scripts/build_external_reports_data.py
```

常用参数：

```bash
.venv/bin/python scripts/build_external_reports_data.py --force
.venv/bin/python scripts/build_external_reports_data.py --max-reports 10
.venv/bin/python scripts/build_external_reports_data.py --charts-per-report 2 --render-scale 1.6
```

## 当前实现策略

当前采用“自动抽取 + 缓存 + 人工校正”的方案：

1. 用 `PyMuPDF` 提取每页文本
2. 先识别封面页、目录页、正文页和图表页，尽量避免把封面和目录当成关键图
3. 按关键词、图表信号和页面类型给页面打分
4. 从关键页及其相邻页提取摘要，而不是只扫前几页
5. 仅渲染最有代表性的关键页，而不是全量转图片
6. 按文件大小、修改时间、渲染参数和人工校正配置生成缓存签名
7. 未变化文件直接复用缓存结果
8. 对少数自动抽取不稳定的报告，通过 `data/external_reports_review.json` 指定首选页、状态和备注

## 结构化结果字段

`data/external_reports.json` 当前至少包含：

- `title` / `date` / `institution`
- `source_pdf_path`
- `summary`
- `highlights`
- `top_pages`
- `framework_matches`
- `scenario_matches`
- `asset_matches`
- `method_matches`
- `history_matches`
- `new_knowledge_points`
- `review_status`
- `review_notes`
- `preferred_page_number`

这些字段会被主项目继续消费，而不是只停留在子项目内部。

## 人工校正层的用途

`data/external_reports_review.json` 主要用来处理三类问题：

1. 自动选错关键图
   - 例如抽到封面页、目录页、评级页或页眉很重的页面
2. PDF 本身结构较差
   - 例如文本抽取质量差、部分页损坏、图页基本不可用
3. 需要给前端补状态
   - 例如 `reviewed`、`needs_source_fix`

推荐校正字段包括：

- `review_status`
- `review_notes`
- `preferred_page_number`
- `preferred_label`
- `suppress_preview`

## 优化方向

- 如果后续更重视图表，可把 `--charts-per-report` 从 `1` 提高到 `2-3`
- 如果更重视速度，可维持单页渲染，并把 `render_scale` 控制在 `1.2-1.4`
- 如果需要更细的章节级拆解，可在现有 JSON 上继续补“章节标题识别”和“表格页单独分类”
- 如果要减少人工校正成本，可继续加入 OCR 或更强的页面分类
