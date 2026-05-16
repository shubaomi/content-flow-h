# 看板写稿到待审核检查项

## Spec

- 在看板中，视频从「写稿中」推进到「待审核」时，必须确认检查项：「已完成开头优化（降低2～5秒跳出率）」。
- 覆盖看板拖拽和卡片侧边栏推进按钮两条路径。
- 不影响其它状态流转，也不复用发布前检查项配置，避免混淆阶段语义。

## Tasks

- [x] 定位看板状态流转入口和现有确认弹窗模式。
- [x] 确认实现方案：新增写稿提交审核专用确认弹窗。
- [x] 新增 `ScriptingReviewChecklistDialog` 组件。
- [x] 在看板拖拽 `scripting -> review` 时弹出检查项。
- [x] 在侧边栏推进 `scripting -> review` 时弹出检查项。
- [x] 运行构建或类型检查验证。
- [x] 记录 review / 复盘。

## Review / 复盘

- 实现保持为阶段流转的临时确认，不写入持久化数据，避免和发布前检查项设置混在一起。
- 两个看板入口共用同一个弹窗组件，降低文案或交互不一致的风险。
- `npx tsc -b --pretty false` 已通过。
- `npm run build` 和默认 `npm run lint` 受当前 Node.js `21.5.0` 影响失败；Vite 要求 `20.19+` 或 `22.12+`，且当前 Node 缺少 `node:util.styleText`。
- `npx eslint . -f json` 可运行，新增看板相关文件无 lint 报错；失败来自既有 `src/pages/Scripts/index.tsx` 和 `src/services/fileSystem.ts` 规则问题。
