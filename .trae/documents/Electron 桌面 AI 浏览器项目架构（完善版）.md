## 架构目标与原则
- 目标：在 Windows/macOS 上交付稳定、可扩展的 AI 浏览器，具备多标签（后续）、AI 助手、页面理解/自动化、下载与更新。
- 原则：安全默认开启、进程边界清晰、模块可替换（AI/存储/自动化）、数据与隐私合规、发布与更新可持续。

## 目录结构与层次划分
- 根目录：
  - `apps/desktop`（Electron 桌面）：`src/main`、`src/preload`、`src/renderer`、`src/shared`、`build`
  - `packages/ai`、`packages/automation`、`packages/storage`、`packages/common`、`packages/update`
  - `tests`：端到端与集成测试

## 进程模型与通信
- 进程：`Main`（壳/权限/下载/更新）、`Renderer`（UI）、`Preload`（安全桥）、`BrowserView`（网页）。
- IPC：通道命名 `ipc://{domain}/{action}`；流事件 `event://ai/stream`、`event://download/progress`。
- 约束：仅在 `preload` 暴露白名单 API；禁用不受控消息与 `eval`。

## 安全基线
- `BrowserWindow`：`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`、严格 `CSP`。
- 权限与导航：默认拒绝权限，请求显式允许；外链拉起确认；阻断危险协议。
- 隐私与密钥：`keytar` + `safeStorage`；日志脱敏与采样上报。

## UI/交互规范（新增与细化）
- 主页面布局（启动态）：仅展示一个对话框输入区（居中或顶部），不显示网页内容区域；右侧为可折叠侧边栏用于显示“用户与模型的交互历史”。
- 对话框：
  - 组件：`ChatInput`（多行输入框 + 提交按钮“确定”）。
  - 行为：`Enter` 提交、`Shift+Enter` 换行、`Ctrl+Enter` 强制提交；点击“确定”等同提交。
  - 状态：输入中（占位提示）、提交后禁用输入并显示加载动画；支持流式结果回显。
  - 错误与回退：网络错误/配额/本地不可用时，弹出提示并提供重试按钮；回退到本地 `Ollama`（若开启）。
- 右侧侧边栏（历史）：
  - 组件：`SidebarHistory`（可调整宽度，支持折叠）；`ConversationList` + `MessageItem`。
  - 展示：按会话分组，内含消息列表（用户/模型气泡，时间戳、来源图标）。
  - 操作：搜索与筛选、复制消息、固定（Pin）、删除、导出；支持跳转到历史会话继续对话。
  - 交互：提交后将当前输入追加到当前会话；若不存在会话则自动创建 `session` 并在侧边栏出现。
- 会话与上下文：
  - 初始仅有聊天视图；网页内容区域（`BrowserView`）默认隐藏，后续当需要网页解析或导航时再显示（如模型生成“打开链接/抓取页面”的操作）。
  - 上下文构建：对话提交时，抽取当前输入与相关历史（向量检索）作为模型上下文；可显示“上下文来源卡片”（可选）。
- 渲染细节：
  - 流式输出：逐字/逐句显示，提供“停止生成”与“继续”按钮。
  - 消息卡样式：用户气泡靠右、模型靠左；支持 Markdown 渲染与代码块复制。
  - 快捷键：`Esc` 聚焦输入、`Ctrl+K` 打开命令面板（预留）。

## 浏览器壳与标签管理（MVP 约束）
- MVP 启动仅展示聊天与侧边栏；`TabManager` 与 `BrowserView` 能力保留但默认隐藏。
- 当模型返回“需要打开网页/抓取内容”时，由主进程创建 `BrowserView` 并在 UI 左侧区域展示（可覆盖下一迭代）。

## 注入与内容采集
- `preload` 暴露：`window.bridge.selection`、`window.bridge.page`；在网页实际加载后启用。
- 正文抽取：`@mozilla/readability` + 清洗；作为上下文来源记录到侧边栏可视卡片（可选）。

## AI 子系统设计
- Provider：`OpenAI`、`Anthropic`、`Gemini`、`Ollama`。
- 路由与回退：策略选择（延迟/成本/可靠性）；云失败回退本地（可配置）。
- 工具：摘要、问答、改写、结构化提取、网页操作计划生成。
- 接口：`ask({text, sessionId, stream}) => AsyncIterable<Chunk>`；消息与会话在提交后入库并侧边栏展示。

## 自动化子系统
- 录制/回放在后续迭代开放；当前只支持模型生成“操作计划”并提示用户是否执行。

## 数据持久化与索引
- SQLite 表：`sessions`、`messages`、`pages`、`embeddings`、`downloads`、`histories`、`scripts`。
- 索引：`messages(session_id, ts)`、`pages(checksum)`、向量索引（`sqlite-vss`）。
- 迁移：版本化、回滚与跨平台路径处理。

## 自动更新与发布
- 打包：`electron-builder` 输出 `nsis/msi` 与 `dmg/pkg`；资源按需分发。
- 更新：`electron-updater` + Releases/私服；事件处理与用户提示；回退。
- 签名：Windows `signtool`；macOS `codesign` + notarization；CI 自动化。

## 配置与特性开关
- 配置：`config.json` + 环境变量；平台差异集中在主进程。
- Flags：`ui.sidebarEnabled`、`ai.localFallback`、`privacy.redaction`、`automation.enabled`。

## 日志与崩溃收集
- 结构化日志（`pino`/`winston`）；崩溃上报（`sentry-electron`）脱敏与采样。

## 测试策略
- 单元：AI 路由、消息存储、会话创建；预加载桥的接口模拟。
- 集成：IPC 提交与流式事件、侧边栏渲染、消息搜索与过滤。
- 端到端：`playwright` 启动 Electron；覆盖“输入 → 提交 → 侧边栏更新 → 流式显示”。

## 性能与度量
- 指标：首屏输入可用时间、流式首字延迟、侧边栏渲染耗时、内存占用。
- 埋点：提交事件、消息追加、渲染耗时、错误分布。

## 开发体验与规范
- TypeScript `strict`；ESLint + Prettier；`commitlint`；语义化版本。
- 脚本：`npm run dev`、`npm run build`、`npm run test:e2e`。

## 实施任务列表（审批后执行）
1. 初始化 Electron 项目骨架与安全基线
2. 建立进程通信与 IPC 协议白名单
3. 搭建主页面对话框 UI（`ChatInput`）与交互逻辑
4. 实现右侧侧边栏历史视图（`SidebarHistory`）与会话管理
5. 集成 AI 路由并实现流式输出与错误回退
6. 设计并落地 SQLite schema 与迁移系统（sessions/messages 等）
7. 侧边栏搜索/复制/固定/删除与导出能力
8. 配置自动更新与双平台签名（占位配置）
9. 接入结构化日志与崩溃上报
10. 集成与端到端测试覆盖“输入→提交→侧边栏更新→流式显示”
11. 建立性能度量与优化基线（首屏/首字延迟）