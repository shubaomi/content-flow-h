# 恢复真实数据目录元数据并防止 mock 覆盖

## Spec

- 选择 `/Users/liuxingqi/Documents/Claude/Projects/ip_scripts` 作为数据目录后，应用应展示目录内真实脚本数据，而不是默认 demo/mock 数据。
- 读取已有 `data.json` 失败时不得静默覆盖真实目录；只有明确不存在 `data.json` 时才初始化。
- 当目录中已有真实 `scripts/*.md`，但 `data.json` 是默认 demo 数据时，自动从 Markdown 脚本生成可展示的脚本和视频索引。
- Markdown 导入应保留已有设置、标签、平台原始数据等非视频索引信息，只重建 demo 视频/脚本/选题索引。
- 当用户提供历史备份时，以备份中的 `data.json` 元数据为准恢复看板状态、选题、标签、平台发布记录和指标。
- 修改保持最小影响，集中在数据读取/迁移层，不改页面业务交互。

## Tasks

- [x] 定位数据加载入口、默认数据兜底逻辑和目标数据目录结构。
- [x] 确认根因：读取失败/首次初始化路径会写入默认 demo，且不会从已有 Markdown 脚本导入真实数据。
- [x] 确认实现方案：错误分型 + demo 索引检测 + Markdown 索引重建。
- [x] 实现数据读取错误分型，避免解析或迁移失败时静默写 mock。
- [x] 实现已有 Markdown 脚本自动导入/迁移。
- [x] 移除脚本编辑页 demo 内容 fallback，避免保存时把 demo 文本写入真实目录。
- [x] 新空目录初始化为空视频/脚本索引，并拦截明显误选 `scripts` 子目录的场景。
- [x] 验证目标目录可导入真实脚本标题，不再只显示 demo。
- [x] 运行类型检查/构建或记录环境限制。
- [x] 更新 `tasks/lessons.md`。
- [x] 添加 review / 复盘。
- [x] 对比用户提供的 2026-05-23 备份与当前目标目录。
- [x] 备份当前错误恢复后的 `data.json`。
- [x] 用历史备份恢复目标目录根 `data.json`。
- [x] 验证看板元数据数量和状态从备份恢复。

## Review / 复盘

- 根因是旧版 `readAppData()` 把所有读取异常都当作首次使用，直接写入 `defaultAppData()`；真实目录一旦出现短暂读取/解析/权限问题，就可能被 demo 索引覆盖。
- 修复后只有 `data.json` 明确不存在时才初始化；其它读取失败会抛出 `READ_DATA_FAILED`，不再静默写 mock。
- 目标目录 `/Users/liuxingqi/Documents/Claude/Projects/ip_scripts` 当前已恢复为 16 条真实视频索引和 16 篇真实脚本索引，`vid_demo*` / `script_demo*` 不再出现在根 `data.json` 索引中。
- 新空目录会初始化为空索引；已有 `scripts/*.md` 会导入为视频/脚本索引；明显选到 `scripts` 子目录时会提示选择数据根目录。
- 脚本编辑页移除了 demo 内容 fallback，读不到脚本文件时不会再展示并保存测试稿。
- `npx tsc -b --pretty false` 已通过。
- `npx eslint src/services/fileSystem.ts -f json` 已通过；`src/pages/Scripts/index.tsx` 存在既有 `react-hooks/set-state-in-effect` lint 问题，不是本次 demo fallback 移除引入。
- `npm run build` 仍受当前 Node.js `21.5.0` 影响失败；Vite/Rolldown 需要 `node:util.styleText`，建议切到 Node `22.12+` 或符合 Vite 要求的 `20.19+` 后再跑完整构建。
- 用户提供 `/Users/liuxingqi/Downloads/ip_content_backup_2026-05-23 (1).json` 后，已将其恢复到目标目录根 `data.json`；恢复前的错误索引已备份为 `/Users/liuxingqi/Documents/Claude/Projects/ip_scripts/data.before-restore-2026-05-25T03-30-42-554Z.json`。
- 备份恢复后验证结果：15 个视频、15 篇脚本、24 个选题、9 个标签、6 条指标、4 条抖音原始记录、7 条视频号原始记录；状态分布为 published 12、editing 1、review 1、topic 1，且所有索引脚本都有对应 Markdown 文件。
