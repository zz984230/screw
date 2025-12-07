# 项目架构总览

## 目标与原则
- Windows/macOS 跨平台 AI 浏览器，专注聊天与历史侧边栏。
- 安全默认开启、进程边界清晰、模块可替换、隐私合规、发布与更新可持续。

## 目录结构
- apps/desktop：Electron 桌面工程（main/preload/renderer/shared/build）
- packages/ai：模型路由、提示模板、工具
- packages/automation：录制/回放、脚本执行器
- packages/storage：SQLite 与向量索引
- packages/common：类型、日志、配置、错误
- packages/update：更新服务客户端（可选）
- tests：端到端与集成测试

## 进程模型与 IPC
- 进程：Main（壳/权限/下载/更新）、Renderer（UI）、Preload（安全桥）、BrowserView（网页）
- 通道：`ipc://{domain}/{action}` 与 `event://{domain}/{topic}` 流事件
- 约束：仅在 Preload 暴露白名单 API；禁用不受控消息与 eval

## 安全基线
- BrowserWindow：`contextIsolation`、`sandbox`、`nodeIntegration=false`、严格 CSP
- 权限：默认拒绝，显式允许；外链拉起确认；阻断危险协议
- 隐私：`keytar` + `safeStorage` 保存密钥与敏感配置；日志脱敏与采样上报

## UI 与交互规范
- 主页面：仅展示一个对话框输入区；右侧为历史侧边栏，可折叠与调整宽度
- 输入：Enter 提交，Shift+Enter 换行，Ctrl+Enter 强制提交；提交后显示流式输出并可停止/继续
- 侧边栏：按会话分组的消息列表，支持搜索、复制、固定、删除、导出；新输入自动创建或续接会话
- 渲染：用户消息右对齐、模型左对齐；支持 Markdown 与代码块复制；空态提供引导提示

## 浏览器壳与标签
- MVP 启动仅聊天与侧边栏；BrowserView 默认隐藏
- 当需要网页解析或导航时再创建并展示 BrowserView（后续迭代拓展多标签）

## 注入与采集
- Preload 暴露 `window.bridge.selection` 与 `window.bridge.page`
- 正文抽取采用 `@mozilla/readability` 并清洗；来源记录为上下文卡片（可选显示）

## AI 子系统
- Provider：OpenAI/Anthropic/Gemini/Ollama；路由按延迟/成本/可靠性选择，并支持云失败回退本地
- 工具：摘要、问答、改写、结构化提取、网页操作计划
- 接口：`ask({text, sessionId, stream}) => AsyncIterable<Chunk>`；消息与会话入库并在侧边栏展示

## 自动化子系统
- 录制：捕获点击/输入/导航/等待，生成 JSON DSL 脚本
- 回放：在 BrowserView 注入执行器；复杂场景可用 Playwright 独立驱动
- 编排：队列、重试、超时、状态可视化；失败截图与日志

## 数据持久化与索引
- 引擎：better-sqlite3 + sqlite-vss 或 LanceDB
- 表：sessions、messages、pages、embeddings、downloads、histories、scripts
- 迁移：版本化迁移与回滚；跨平台路径处理

## 自动更新与发布
- 打包：electron-builder 输出 nsis/msi 与 dmg/pkg；资源按需分发
- 更新：electron-updater 事件处理与用户提示；失败回退
- 签名：Windows signtool；macOS codesign + notarization；CI 自动化

## 测试与质量
- 单元：AI 路由、消息存储、会话创建；Preload 桥接口模拟
- 集成：IPC 提交与流事件、侧边栏渲染、消息搜索与过滤
- 端到端：Playwright 启动 Electron；覆盖“输入→提交→侧边栏更新→流式显示”

## 性能与度量
- 指标：首屏输入可用时间、流式首字延迟、侧边栏渲染耗时、内存占用
- 埋点：提交事件、消息追加、渲染耗时、错误分布

## 风险与缓解
- 资源占用：按需加载与模块裁剪
- 注入安全：白名单 API 与严格 CSP
- 更新签名：CI 校验与回滚
- 云不可用：多路由与本地回退

