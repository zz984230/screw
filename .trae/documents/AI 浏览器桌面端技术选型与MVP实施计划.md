## 产品范围与 MVP
- MVP 功能：多标签浏览、AI 侧边栏（摘要/问答/改写）、页面选中内容抓取、下载管理、历史/书签、自动更新与签名。
- 非目标（MVP 阶段）：Chrome 扩展完整兼容、同步账号体系、插件市场。

## 架构与进程模型
- 进程：`Main`（应用壳与系统集成）、`Renderer`（UI/侧边栏）、`Preload`（安全桥）、`BrowserView`（页面渲染）。
- 通信：IPC 单向/双向通道（主进程 <-预加载-> 渲染），严控可调用接口白名单。
- 隔离：启用 `contextIsolation`、`sandbox`、禁用 `nodeIntegration`；只在 `preload` 暴露受限 API。

## 目录结构规范
- `apps/desktop`：Electron 工程
  - `src/main`：主进程（窗口管理、下载、权限、自动更新）
  - `src/preload`：桥接层（DOM 注入、安全 API 暴露）
  - `src/renderer`：UI（React/Vite；标签栏、侧边栏、设置）
- `packages/ai`：AI 能力（模型路由、提示词模板、流式输出）
- `packages/automation`：页面自动化（录制/回放、脚本运行器）
- `packages/storage`：持久化与索引（SQLite/向量库、密钥管理）
- `packages/common`：类型、日志、配置、协议定义

## 核心模块设计
- 浏览器壳：`BrowserWindow` + 多 `BrowserView`，支持标签管理、前进后退、地址栏、下载与权限处理。
- 页面注入：`preload` 注入 `content-script`，实现选中文本、正文抽取、DOM 事件、上下文采集。
- 侧边栏：AI 对话、多工具卡片（摘要/问答/改写/提取）、历史记录、快捷操作。
- 下载/网络：统一下载目录、断点续传、任务列表；网络请求拦截统计。

## 安全与隐私
- 安全配置：`contextIsolation: true`、`sandbox: true`、`nodeIntegration: false`、`allowRunningInsecureContent: false`、严格 `CSP`。
- 权限治理：`session.setPermissionRequestHandler`、自定义域名白名单与导航范围、外链拉起确认。
- 资源拦截：`webRequest.onBeforeRequest` 阻断恶意域名与协议；限制文件系统访问。
- 密钥与隐私：`keytar` 存储 API 密钥；敏感日志脱敏；可选 `safeStorage` 本地加密。

## AI 集成设计
- 模型路由：优先云（OpenAI/Anthropic/Gemini），本地回退 `Ollama`（HTTP）。
- 文本抽取：正文抽取使用 `@mozilla/readability`；清洗后入库向量检索（`sqlite-vss`）。
- 对话与工具：统一 `Agent` 接口，工具包含摘要、问答、改写、结构化提取、网页操作计划生成。
- 流式输出：使用 SSE/分片回传；渲染器渐进式显示。

## 自动化与脚本
- 录制/回放：用户操作录制为脚本（点击/输入/导航），支持变量与条件。
- 执行引擎：在 `BrowserView` 注入执行器；复杂场景可用 `playwright` 驱动独立 Chromium 进行任务。
- 任务编排：队列、重试、超时、断点续跑；可视化状态与日志。

## 数据持久化与索引
- 本地库：`better-sqlite3`（历史/书签/缓存/设置）；向量：`sqlite-vss` 或 `LanceDB`。
- 结构：会话、消息、网页片段、向量嵌入、下载记录、自动化脚本。
- 备份与迁移：版本化 schema、导入/导出；平台差异处理（路径、权限）。

## 打包与自动更新
- 打包：`electron-builder` 生成 `nsis/msi`（Windows）、`dmg/pkg`（macOS）。
- 更新：`electron-updater` 检查更新（GitHub Releases 或私有更新服务）；差分更新与回滚策略。
- 资源：`extraResources` 分发模型/词表（可选下载）。

## 代码签名与发布
- Windows：`signtool` 或证书服务签名，`PublisherName` 与安装权限校验。
- macOS：`codesign` + 公证（notarization）；`entitlements` 与沙箱权限配置。
- 渠道：内测（私链/企业分发）、公测（受控曝光）、正式发布。

## 测试与质量保障
- 端到端：`playwright` 驱动 Electron；关键流程（启动、标签操作、注入、AI 对话、下载）。
- 单元/集成：UI/主进程/预加载分层测试；模拟 IPC 与网络。
- 崩溃与日志：`sentry`/`appcenter`；最小化匿名上报；问题归档与 SLA。

## 性能与体验指标
- 启动时长、首个标签可用时间、内存占用、CPU 峰值、渲染帧率。
- AI 交互：响应延迟、流式首字延时、上下文检索命中率。
- 自动化：脚本成功率、重试次数、超时分布。

## 迭代路线图（参考）
- 迭代 1：项目骨架、标签壳、侧边栏 UI、云模型对接、正文抽取。
- 迭代 2：下载与权限、向量检索、自动更新与签名、崩溃上报。
- 迭代 3：录制/回放自动化、脚本存储与调度、本地模型回退、性能优化。

## 关键配置与命令
- 初始化：`npm create electron-vite@latest` 或 `npx electron-forge init`
- 打包：`npm run build`（配置 `electron-builder.yml`）；发布到 Releases 或私服。
- 更新：在主进程集成 `autoUpdater`，监听更新事件并提示用户重启。

## 风险与应对
- 体积与资源占用：模块按需加载、禁用未用子系统、图片与模型分离下载。
- 注入与权限边界：只通过 `preload` 暴露最小 API，建立域名白名单与导航策略。
- 云服务不可用：配置多家模型路由与本地 `Ollama` 回退；降级提示。
- 签名/公证失败：CI 前置校验与离线测试；失败时回滚上一版本。

## 下一步
- 搭建 Electron 项目骨架与安全基线；完成标签与 AI 侧边栏的 MVP；配置自动更新与签名，产出双平台安装包供内测。