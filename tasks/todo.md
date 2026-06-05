# 视频库封面图支持下载到本地

## Spec

- 视频详情页已有竖屏 / 横屏封面图时，需要提供“下载”操作。
- 下载应把当前视频的封面图保存到用户本地下载位置，文件名应包含视频标题、方向和扩展名，便于辨认。
- 不改变现有封面数据结构，继续使用 `covers/<videoId>_<orientation>.<ext>` 存储和 `Video.coverPortrait` / `Video.coverLandscape` 记录扩展名。
- 下载失败或封面缺失时，不影响上传、预览和删除功能。

## Tasks

- [x] 探索当前视频库封面图展示、读写和存储逻辑。
- [x] 确认推荐方案：补充读取封面 File 的服务函数，详情页按钮触发浏览器下载。
- [x] 等待设计确认。
- [x] 写入实现计划文档。
- [x] 实现封面下载服务函数和详情页下载按钮。
- [x] 运行 lint、类型检查、构建验证。
- [x] 浏览器检查详情页封面按钮状态。
- [x] 更新 `tasks/lessons.md`。
- [x] 添加 review / 复盘。

## Review / 复盘

- 新增 `readCoverFile`，从现有 `covers/<videoId>_<orientation>.<ext>` 读取原始封面 `File`，不改变现有封面存储结构。
- 视频详情页的竖屏 / 横屏封面槽在已有封面时新增“下载”操作，文件名包含视频标题和封面方向。
- 下载通过浏览器原生 `<a download>` 触发，失败或封面缺失时不会影响上传、预览、删除。
- `npm run lint` 已通过。
- `npx tsc -b --pretty false` 已通过。
- `npm run build` 已通过。
- 浏览器已打开 `http://127.0.0.1:5174/videos/vid_demo01`；当前浏览器会话没有已授权数据目录，应用停在“选择数据目录”页，因此未能完成真实封面文件的点击下载手测。

---

# 同步选题、逐字稿和视频标题

---

# 实现视频之间关联重拍 / 变体关系

## Spec

- 根据 `docs/plans/2026-06-03-video-relations-implementation.md` 实现视频到视频的显式关联关系。
- 使用独立 `videoRelations` 集合和 `videoRelations.json` 持久化，不混入选题 / 逐字稿生产链关系。
- 详情页支持新增、查看、备注和移除相关视频；看板抽屉提供只读摘要。
- Store 层负责校验：禁止自关联、禁止不存在视频、禁止重复视频对，并在删除视频时清理关系。

## Tasks

- [x] 读取实现计划并确认方案适配当前代码结构。
- [x] 添加 `VideoRelation` 类型、`AppData.videoRelations` 和关系 ID helper。
- [x] 接入默认数据、拆分文件持久化和旧数据迁移兼容。
- [x] 在 store 中添加关系增删改 action、重复校验和删除视频清理。
- [x] 在视频详情页增加“相关视频”区域和关联视频弹窗。
- [x] 在看板抽屉增加相关视频只读摘要。
- [x] 运行 lint、类型检查、构建和浏览器验证。
- [x] 更新 `tasks/lessons.md`。
- [x] 添加 review / 复盘。

## Review / 复盘

- 已新增 `VideoRelation` 类型和 `videoRelations` 数据集合，并通过 `videoRelations.json` 独立持久化。
- 旧 `data.json` 迁移、拆分文件读取、空目录初始化、Markdown 恢复索引路径都补齐了 `videoRelations: []` 兼容。
- Store 新增 `addVideoRelation`、`updateVideoRelation`、`deleteVideoRelation`，并在 `deleteVideo` 时清理关联；新增关系会阻止自关联、缺失视频和重复双向视频对。
- 视频详情页新增“相关视频”区块，可关联视频、填写备注、跳转查看、移除关系，并可在已有关系卡片中编辑备注。
- 看板抽屉新增最多两条相关视频摘要，点击可跳转到相关视频详情。
- `npx tsc -b --pretty false` 已通过。
- `npm run lint` 已通过。
- `npm run build` 已通过。
- 浏览器打开 `http://127.0.0.1:5174/videos/vid_demo01` 成功；当前浏览器会话没有已授权数据目录，应用停在“选择数据目录”页，因此未能完成新增/删除关系的真实数据交互手测。

---

# 视频库支持关联重拍 / 变体视频

## Spec

- 目标是在视频库中让一条视频可以关联另一条视频，用于记录同一内容的重拍、换形式复拍、违规后重发、爆款复刻等关系。
- 先完成产品和技术设计，不直接修改业务代码。
- 设计需要区分“视频与选题 / 逐字稿的生产链关系”和“视频与视频之间的内容变体关系”，避免触发标题同步或误改原有关联链。
- 设计完成前需要给出 2-3 个实现方案、推荐方案、数据模型、交互入口、验证方式和风险边界。

## Tasks

- [x] 探索当前视频数据模型、存储和状态管理。
- [x] 探索视频库列表、视频详情、看板抽屉的展示和编辑入口。
- [x] 澄清视频关联的业务语义和成功标准。
- [x] 提出 2-3 个方案并说明取舍。
- [x] 输出推荐设计规格。
- [x] 经确认后写入 `docs/plans/YYYY-MM-DD-video-relations-design.md`。
- [x] 进入实现计划。

## Review / 复盘

- 已确认视频关联需要支持自由备注，不使用固定原因枚举。
- 推荐采用独立 `videoRelations` 集合，避免把复拍 / 变体关系混入 `Video.topicId`、`Video.scriptId` 这条生产链关系。
- 关系按一条记录存储，详情页双向展示，备注只维护一份。
- 设计文档已写入 `docs/plans/2026-06-03-video-relations-design.md`。
- 实现计划已写入 `docs/plans/2026-06-03-video-relations-implementation.md`。

---

# 概览页移除动态并增加投放成本

## Spec

- 概览页不再展示“最近动态 / 最新动态”列表。
- 顶部统计卡增加“本月投放成本”，汇总本月平台投放费用。
- 本月投放成本优先按平台 `publishedAt` 归属月份统计；没有 `publishedAt` 但有投放费用时，按视频 `createdAt` 兜底归属。
- 概览页展示拍摄形式分布图，使用 `Video.shootingFormats` 和既有拍摄形式标签。
- 只调整概览展示层，不改变数据模型和其它页面。

## Tasks

- [x] 定位概览页统计卡、动态列表、投放成本字段和拍摄形式字段。
- [x] 在 `tasks/todo.md` 写入本次可验证任务清单。
- [x] 实现本月投放成本统计和格式化展示。
- [x] 移除概览页动态列表及无用计算。
- [x] 调整底部图表布局，展示标签构成和拍摄形式分布。
- [x] 运行验证命令。
- [x] 更新 `tasks/lessons.md`。
- [x] 添加 review / 复盘。

## Review / 复盘

- 概览页顶部统计卡新增“本月投放成本”，金额来自 `PlatformPublish.promotionCost`。
- 成本统计优先使用平台 `publishedAt` 判断是否属于本月；缺少发布时间时使用视频 `createdAt` 兜底。
- 概览页已移除“最近动态 / 最新动态”区域，并删除对应的 `recentActivity` 计算。
- 底部图表调整为“内容标签构成”和“拍摄形式分布”并列展示，拍摄形式分布复用 `Video.shootingFormats` 与既有标签映射。
- `npx eslint src/pages/Dashboard/index.tsx` 已通过。
- `npx tsc -b --pretty false` 已通过。
- `npm run build` 已通过。

---

# 视频库平台状态列改为图标

---

# 视频库去掉状态列

## Spec

- 视频库列表不再展示“状态”列。
- 保留“已发布”“已违规”“已跳过”三列的平台图标状态展示。
- 只调整列表展示层，不改变筛选、视频状态数据和详情页。

## Tasks

- [x] 确认视频库状态列位置和列宽配置。
- [x] 移除表格“状态”列和行内状态徽标。
- [x] 运行验证命令。
- [x] 添加 review / 复盘。

## Review / 复盘

- 视频库列表已移除“状态”列和行内 `StatusBadge`。
- 筛选区仍保留“全部 / 已发布 / 已归档 / 已违规 / 已跳过”，没有改变数据筛选语义。
- 表格主体仍保留“已发布”“已违规”“已跳过”的平台图标状态列。
- `npm run lint` 已通过。
- `npm run build` 已通过。

---

## Spec

- 视频库列表不再展示单独的“平台”列。
- “已发布”“已违规”“已跳过”三列都使用平台图标展示，不使用平台名称文本。
- 三个状态列内的平台图标顺序固定为：视频号、小红书、抖音。
- 只调整视频库列表展示层，不改变筛选、状态判断和数据结构。

## Tasks

- [x] 定位视频库列表表格和平台图标组件。
- [x] 确认实现方案：复用 `PlatformIcon`，新增固定平台排序，状态列按排序渲染图标。
- [x] 更新表格列配置、表头和状态列渲染。
- [x] 运行验证命令并检查页面表现。
- [x] 更新 `tasks/lessons.md`。
- [x] 添加 review / 复盘。

## Review / 复盘

- 视频库列表现在移除了单独的“平台”列，保留“已发布”“已违规”“已跳过”三列。
- 三个状态列统一通过 `PlatformStatusIcons` 渲染图标，按 `shipinhao`、`xiaohongshu`、`douyin` 固定排序，对应展示为视频号、小红书、抖音。
- 平台状态判断沿用原逻辑：缺省状态仍按 `published` 处理，`violated` 和 `skipped` 只匹配显式状态。
- 为让全仓 lint 通过，同时修正了视频库封面 effect 的同步 setState 问题，并处理了逐字稿页同类既有 lint 问题；移除了 `App.tsx` 中一个已失效的 eslint-disable 注释。
- `npm run lint` 已通过。
- `npm run build` 已通过。
- 浏览器已打开 `http://127.0.0.1:5174/videos`，但当前会话没有已授权的数据目录，应用停在“选择数据目录”页，无法直接进入真实视频库做截图验证。

---

## Spec

- 选题库、逐字稿和视频库中有关联关系的条目，应始终使用同一个标题。
- 用户在任一入口修改标题后，关联的 `Topic.title`、`Script.title`、`Video.title` 应同步更新。
- 同步范围只覆盖已有明确关联的条目，不靠相同标题做猜测匹配，避免误改无关条目。
- 保持页面交互不变，将同步逻辑集中在 store 层，减少三个页面重复处理。
- 非标题字段更新不应触发无关同步。

## Tasks

- [x] 定位三类条目的数据模型、关联字段和标题编辑入口。
- [x] 确认实现方案：在 `src/store/appStore.ts` 的更新方法内集中同步关联标题。
- [x] 在 `tasks/todo.md` 写入可验证任务清单。
- [x] 实现标题同步 helper，并接入 `updateTopic`、`updateScript`、`updateVideo`。
- [x] 检查关联创建/绑定路径，确保新建立关系时标题不会继续漂移。
- [x] 运行类型检查或构建验证。
- [x] 更新 `tasks/lessons.md`。
- [x] 添加 review / 复盘。

## Review / 复盘

- 根因是 `Topic.title`、`Script.title`、`Video.title` 各自存储，创建/流转时只复制初始标题，后续任一入口编辑都只更新自身。
- 修复集中在 `src/store/appStore.ts`：新增标题同步 helper，并在 `updateVideo`、`updateTopic`、`updateScript` 中触发同步。
- 同步只沿明确 ID 关联的一条主链进行，不靠标题猜测匹配，也不把整个历史连通分量都同化，避免旧绑定造成误同步。
- 绑定变更时会清理旧的反向引用，并补齐新的双向引用，例如视频换选题、选题换视频、逐字稿换视频。
- `linkTopicToVideo`、`adoptTopic`、`moveVideo` 中建立或修复关系的路径也会对齐标题，避免刚关联后继续漂移。
- 移除了 `src/pages/Scripts/ScriptEditor.tsx` 中未使用的 theme 订阅；该组件已使用 CSS 变量，不需要显式读取主题。
- `npx eslint src/store/appStore.ts` 已通过。
- `npx tsc -b --pretty false` 已通过。
- `npm run build` 已通过。

---

# 修复视频库筛选列展示

## Spec

- 视频库在“全部”和“已发布”筛选下应展示完整表格列，而不是只露出标题相关信息。
- 保持“已违规”“已跳过”等平台筛选的现有行为和数据语义不变。
- 修复应优先定位根因，尽量限制在视频库列表或必要样式上。
- 完成前通过类型检查/构建和页面验证证明功能有效。

## Tasks

- [x] 读取视频库页面、容器和全局样式，定位表格列渲染逻辑。
- [x] 复现或确认“全部 / 已发布”下列不可见的根因。
- [x] 实现最小范围修复。
- [ ] 运行验证命令并检查页面表现。
- [ ] 更新 `tasks/lessons.md`。
- [ ] 添加 review / 复盘。

## Review / 复盘

- 待补充。
