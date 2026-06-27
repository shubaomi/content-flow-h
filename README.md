# ContentFlow — 短视频内容管理系统

面向内容创作者的短视频全生命周期管理工具，覆盖从**选题灵感 → 写稿审核 → 拍摄剪辑 → 多平台发布 → 数据分析**的完整工作流。

## 功能特性

- **看板管理** — 拖拽式 Kanban 看板，6 个状态列（待启动 → 写稿中 → 待审核 → 拍摄中 → 剪辑中 → 已发布 → 已归档），可视化追踪每个视频进度
- **选题库** — 灵感采集、选题采纳、与视频双向关联，选题状态随视频生命周期自动联动
- **逐字稿编辑器** — 基于 CodeMirror 6 的 Markdown 编辑器，支持字数统计、时长估算、版本管理
- **内容合规检测** — 集成 DeepSeek API，自动检测逐字稿在抖音/小红书/视频号的违规风险，输出风险分级报告和修改建议
- **多平台分发追踪** — 记录每个视频在抖音、小红书、视频号的发布状态（已发布/已违规/已跳过）、链接、推广费用
- **数据分析** — 基于 Recharts 的多维度数据图表，支持从各平台后台导入原始运营数据
- **本地优先** — 数据存储在用户本地文件系统（File System API），隐私可控，无需服务器
- **Docker 开发环境** — 一键启动的开发容器，包含前端 Vite 开发服务器 + 后端风险检测 API
- **深色/浅色主题** — 45+ CSS 变量驱动，一键切换

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 状态管理 | Zustand + Immer |
| 路由 | React Router 7 |
| 样式 | Tailwind CSS 4 |
| 拖拽 | dnd-kit |
| 编辑器 | CodeMirror 6 |
| 图表 | Recharts |
| 日期 | dayjs |
| ID 生成 | nanoid |
| 后端 | Express 5 + OpenAI SDK (DeepSeek) |
| Docker | Node 22 Alpine + docker compose |

## 快速开始

### 前置要求

- Node.js 22+
- npm 10+

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（前端 5174 + 后端 3001）
npm run dev

# Windows 双击启动脚本
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1

# Keep using http://localhost:5174. Browser directory permission is saved per origin,
# so switching between localhost, 127.0.0.1, and LAN IP may require choosing the data directory again.

# 仅前端
npx vite

# 仅后端（风险检测 API）
npm run dev:server
```

### 从内容 vault 导入每日内容包

Psychelog 每天会把可导入的内容包写入 `hongrun-content-vault/contentflow-import/YYYY-MM-DD.json`。ContentFlow 可以继续在设置页粘贴 JSON 导入，也可以用脚本直接导入本地数据目录：

```powershell
$env:CONTENTFLOW_DATA_DIR="E:\Projects\contentflow-data"
$env:HONGRUN_CONTENT_VAULT_DIR="E:\Projects\hongrun-content-vault"
npm run vault:import-packet
```

指定日期：

```powershell
npm run vault:import-packet -- --date 2026-06-27
```

脚本会创建或更新对应的选题、视频和口播稿，并在备注中写入 `vault-import:*` 标记，重复执行不会生成重复视频。

### 内容合规检测

风险检测需要 DeepSeek API Key。在项目根目录创建 `.env` 文件：

```env
DEEPSEEK_API_KEY=你的API密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### Docker 开发

```bash
# 启动容器（首次自动构建）
npm run docker:dev

# 重新构建并启动
npm run docker:dev:build

# 停止
npm run docker:down

# 停止并清理数据卷
npm run docker:clean
```

## 项目结构

```
src/
├── components/
│   ├── layout/          # 布局组件（AppShell、Sidebar、PageContainer）
│   └── ui/              # 原子 UI 组件（Button、Modal、Input、Select）
├── pages/
│   ├── Dashboard/       # 仪表盘
│   ├── Kanban/          # 看板（最复杂页面，包含门控检查弹窗）
│   ├── Videos/          # 视频库 & 视频详情
│   ├── Topics/          # 选题库
│   ├── Scripts/         # 逐字稿编辑器
│   ├── Analytics/       # 数据分析
│   └── Settings/        # 系统设置
├── services/
│   ├── fileSystem.ts    # 文件系统读写、数据迁移
│   ├── riskDetectApi.ts # 前端风险检测 API 客户端
│   └── defaultData.ts   # 默认数据
├── store/
│   └── appStore.ts      # 全局 Zustand store（所有业务逻辑）
├── styles/
│   └── global.css       # 全局样式 & CSS 变量
├── types/
│   └── index.ts         # TypeScript 类型定义
└── utils/
    ├── id.ts            # ID 生成
    └── date.ts          # 日期工具

server/
└── index.ts             # 内容风险检测 API（Express）

docs/
└── plans/               # 设计文档 & 实现方案
```

## 数据存储

所有业务数据通过 Web FileSystem API 写入用户本地文件系统：

- `data.json` — 所有结构化数据（视频、选题、逐字稿、指标等）
- `scripts/<id>.md` — 逐字稿 Markdown 内容
- 目录句柄通过 IndexedDB 持久化，避免每次刷新重新授权

首次使用需在初始化页面授权目录访问权限。数据加载时包含版本迁移逻辑，自动补全缺失字段。

## 视频生命周期

```
topic → scripting → review → filming → editing → published → archived
```

关键状态转换副作用：

- `scripting` → 自动创建关联 Script，设置 `video.scriptId`
- `published` → 自动将关联 Topic 状态置为 `done`
- `archived` → 自动将关联 Topic 状态置为 `abandoned`

选题（Topic）与视频通过 `linkedVideoId` / `topicId` 双向关联，状态随视频自动联动。

## 路线图

- [ ] 批量导入/导出
- [ ] AI 辅助逐字稿写作
- [ ] 自动封面生成
- [ ] 多用户协作
- [ ] 移动端适配

## License

MIT
