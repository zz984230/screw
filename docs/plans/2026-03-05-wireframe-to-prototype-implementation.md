# Wireframe to Prototype Skill 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建一个 Claude Code Skill，将手机App/小程序的框图转换为可交互的HTML界面原型。

**Architecture:** 一个纯 Skill 文件，负责框图分析、界面结构识别、用户确认流程，然后调用 frontend-design skill 生成 Tailwind CSS 原型。

**Tech Stack:** Markdown Skill, Tailwind CSS, frontend-design skill

---

## Task 1: 创建 skills 目录结构

**Files:**
- Create: `skills/.gitkeep`

**Step 1: 创建 skills 目录**

```bash
mkdir -p D:/code/screw/skills
```

**Step 2: 创建 .gitkeep 占位文件**

```bash
touch D:/code/screw/skills/.gitkeep
```

**Step 3: 验证目录创建成功**

```bash
ls -la D:/code/screw/skills/
```

Expected: 显示 `.gitkeep` 文件

**Step 4: Commit**

```bash
cd D:/code/screw && git add skills/.gitkeep && git commit -m "$(cat <<'EOF'
chore: 创建 skills 目录

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 编写 Skill 文件 - 基础结构和触发条件

**Files:**
- Create: `skills/wireframe-to-prototype.md`

**Step 1: 创建 skill 文件头部**

创建文件 `skills/wireframe-to-prototype.md`，内容：

```markdown
---
name: wireframe-to-prototype
description: 将手机App/小程序的框图（手绘草图、线框图、文字描述）转换为可交互的HTML界面原型。当用户上传框图图片或描述界面设计时使用此skill。
triggers:
  - 用户调用 /wireframe-to-prototype
  - 用户上传图片并提到：框图、草图、原型、界面设计、app设计、小程序设计、ui设计
---

# Wireframe to Prototype

将框图转换为可交互的移动端HTML原型。

## 输入格式

支持三种输入：

1. **图片输入** - 手绘草图拍照、线框图工具导出的图片
2. **文字描述** - 用文字描述界面布局和元素
3. **ASCII框图** - 用符号绘制的简单框图

## 输出

- 可交互的HTML原型（Tailwind CSS）
- 支持页面切换
- 移动端尺寸适配（375px宽度）
```

**Step 2: 验证文件创建成功**

```bash
cat D:/code/screw/skills/wireframe-to-prototype.md | head -20
```

Expected: 显示文件前20行

**Step 3: Commit**

```bash
cd D:/code/screw && git add skills/wireframe-to-prototype.md && git commit -m "$(cat <<'EOF'
feat(skill): 添加 wireframe-to-prototype 基础结构

- 定义 skill 元数据和触发条件
- 说明支持的输入格式和输出

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 编写 Skill 文件 - 工作流程：接收输入和分析框图

**Files:**
- Modify: `skills/wireframe-to-prototype.md` (追加内容)

**Step 1: 追加工作流程第一部分**

在文件末尾追加：

```markdown

---

## 工作流程

### 1. 接收输入

当用户上传图片或提供文字描述时：

**如果输入是图片：**
- 仔细观察图片内容
- 识别手绘或线框图的各个元素
- 注意标注的文字和连接线

**如果输入是文字/ASCII：**
- 解析文字描述的界面结构
- 识别ASCII符号表示的布局

### 2. 分析框图

自动识别以下信息：

**页面分析：**
- 页面数量（单页/多页）
- 页面之间的跳转关系

**页面类型识别：**
- 启动页/闪屏
- 登录页/注册页
- 首页/主页面
- 列表页
- 详情页
- 表单页
- 个人中心
- 设置页
- 搜索页
- 其他

**UI元素识别：**
- 导航栏（标题、返回按钮、操作按钮）
- 输入框（文本、密码、搜索框）
- 按钮（主要、次要、文字按钮）
- 列表（单行、多行、带图标）
- 卡片
- 底部Tab导航
- 图片区域
- 文字内容

**布局结构：**
- 头部区域
- 内容区域
- 底部区域

**平台推断：**
- 微信小程序风格（胶囊按钮、特定导航栏）
- App风格（原生导航栏、底部安全区）
```

**Step 2: 验证追加成功**

```bash
tail -30 D:/code/screw/skills/wireframe-to-prototype.md
```

Expected: 显示刚追加的工作流程内容

**Step 3: Commit**

```bash
cd D:/code/screw && git add skills/wireframe-to-prototype.md && git commit -m "$(cat <<'EOF'
feat(skill): 添加输入接收和框图分析流程

- 定义图片和文字输入的处理方式
- 详细列出页面类型识别清单
- 详细列出UI元素识别清单
- 添加平台推断逻辑

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: 编写 Skill 文件 - 工作流程：确认和生成

**Files:**
- Modify: `skills/wireframe-to-prototype.md` (追加内容)

**Step 1: 追加确认和生成流程**

在文件末尾追加：

```markdown

### 3. 确认识别结果

使用以下格式展示识别结果，等待用户确认：

```
📝 识别结果：

📱 页面数量：[数量]个
   - 页面1：[页面类型/名称]
   - 页面2：[页面类型/名称]
   ...

🎯 目标平台：[微信小程序/App]

🧩 识别到的元素：
   - [元素1]
   - [元素2]
   ...

🎨 设计风格：自动智能设计（可自定义）
   - 主色调：[推断的颜色]
   - 风格：[简洁/商务/活泼等]

确认生成原型？或需要修改？
```

### 4. 处理用户反馈

**如果用户确认：** 进入生成阶段

**如果用户要求修改：**
- 根据用户反馈调整识别结果
- 更新页面类型、元素、平台或设计风格
- 重新展示确认信息

**如果用户提供自定义配置：**
- 记录用户指定的颜色、字体等配置
- 在生成阶段应用这些配置

支持的配置项：
- `--theme`: 主色调（如 #1890ff）
- `--theme-light`: 浅色背景
- `--text-primary`: 主文字颜色
- `--font-family`: 字体
- `--border-radius`: 圆角大小
- `--platform`: 平台风格（wechat/app）

### 5. 生成原型

**调用 frontend-design skill：**

使用 Skill tool 调用 frontend-design skill，传入以下信息：

```
请使用 frontend-design skill 生成移动端界面原型：

**目标：** [微信小程序/App] 界面原型

**页面：**
1. [页面1名称]：[元素描述]
2. [页面2名称]：[元素描述]

**设计规范：**
- 宽度：375px（iPhone标准）
- 框架：Tailwind CSS
- 风格：[设计风格描述]
- 主色调：[颜色]
- [其他自定义配置]

**交互需求：**
- 支持页面切换（底部Tab/按钮跳转）
- 静态展示为主

**参考移动端规范：**
- 页面边距：16px
- 元素间距：12px
- 列表项高度：44-56px
- 大标题：20px
- 标题：16px
- 正文：14px
- 辅助文字：12px
```
```

**Step 2: 验证追加成功**

```bash
tail -40 D:/code/screw/skills/wireframe-to-prototype.md
```

Expected: 显示确认和生成流程内容

**Step 3: Commit**

```bash
cd D:/code/screw && git add skills/wireframe-to-prototype.md && git commit -m "$(cat <<'EOF'
feat(skill): 添加确认流程和原型生成逻辑

- 定义识别结果展示格式
- 添加用户反馈处理逻辑
- 支持自定义配置项
- 定义 frontend-design skill 调用方式

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: 编写 Skill 文件 - 迭代优化和示例

**Files:**
- Modify: `skills/wireframe-to-prototype.md` (追加内容)

**Step 1: 追加迭代优化和示例**

在文件末尾追加：

```markdown

### 6. 迭代优化

生成原型后，用户可以继续对话进行优化：

**常见优化请求：**
- "把主色调改成蓝色"
- "这个按钮太小了"
- "添加一个返回按钮"
- "字体再大一点"
- "列表项增加图标"

**处理方式：**
- 直接调用 frontend-design skill 进行修改
- 或提供修改后的HTML代码

---

## 移动端设计规范参考

### 尺寸规范
| 项目 | 值 |
|------|-----|
| 设计稿宽度 | 375px |
| 安全区域顶部 | 44px |
| 安全区域底部 | 34px |
| 状态栏 | 20px |

### 间距规范
| 项目 | 值 |
|------|-----|
| 页面边距 | 16px |
| 元素间距 | 12px |
| 列表项高度 | 44-56px |

### 字号规范
| 用途 | 字号 |
|------|------|
| 大标题 | 20px |
| 标题 | 16px |
| 正文 | 14px |
| 辅助文字 | 12px |

### 颜色建议
| 类型 | 场景 | 推荐色 |
|------|------|--------|
| 电商 | 购物类App | 橙红色 #ff4d4f |
| 金融 | 银行/理财 | 蓝色 #1890ff |
| 社交 | 社区/聊天 | 绿色 #52c41a |
| 教育 | 学习类 | 青色 #13c2c2 |
| 医疗 | 健康类 | 蓝绿色 #2f54eb |

---

## 完整示例

### 示例1：手绘登录页

**用户输入：** [上传手绘登录页草图]

**Skill响应：**

```
📝 识别结果：

📱 页面数量：1个
   - 页面1：登录页

🎯 目标平台：App风格

🧩 识别到的元素：
   - Logo区域（顶部居中）
   - 手机号输入框
   - 密码输入框
   - 登录按钮（主按钮）
   - 忘记密码链接
   - 注册入口

🎨 设计风格：自动智能设计
   - 主色调：蓝色 #1890ff
   - 风格：现代简洁

确认生成原型？或需要修改？
```

**用户确认后：** 调用 frontend-design skill 生成HTML原型

### 示例2：文字描述首页

**用户输入：**
```
/wireframe-to-prototype

首页设计：
- 顶部搜索栏
- 轮播图区域
- 4个快捷入口图标（横向排列）
- 推荐商品列表（双列卡片）
- 底部Tab（首页、分类、购物车、我的）

平台：微信小程序
```

**Skill响应：**

```
📝 识别结果：

📱 页面数量：1个
   - 页面1：首页（电商）

🎯 目标平台：微信小程序风格

🧩 识别到的元素：
   - 搜索栏（带搜索图标）
   - 轮播图（图片切换）
   - 快捷入口（4个图标+文字）
   - 商品列表（双列卡片布局）
   - 底部Tab导航（4项）

🎨 设计风格：自动智能设计
   - 主色调：橙红色 #ff4d4f（电商风格）
   - 风格：活泼现代

确认生成原型？或需要修改？
```

### 示例3：带自定义配置

**用户输入：**
```
确认生成，主色调改成 #00b578，这是绿色主题的环保App
```

**Skill响应：** 调用 frontend-design skill，应用绿色主题配置

---

## 注意事项

1. **始终先确认再生成** - 避免误解用户意图
2. **移动端优先** - 所有设计以375px宽度为基准
3. **简洁实用** - 原型是展示用途，不需要复杂交互
4. **复用能力** - 充分利用 frontend-design skill 的设计能力
5. **迭代友好** - 生成后支持继续优化修改
```

**Step 2: 验证文件完整性**

```bash
wc -l D:/code/screw/skills/wireframe-to-prototype.md
```

Expected: 约 200+ 行

**Step 3: Commit**

```bash
cd D:/code/screw && git add skills/wireframe-to-prototype.md && git commit -m "$(cat <<'EOF'
feat(skill): 完成迭代优化流程和使用示例

- 添加迭代优化指导
- 添加移动端设计规范参考表
- 添加三个完整使用示例
- 添加注意事项

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 验证 Skill 可用性

**Files:**
- None (验证步骤)

**Step 1: 检查 skill 文件语法**

```bash
head -10 D:/code/screw/skills/wireframe-to-prototype.md
```

Expected: 显示正确的 YAML front matter

**Step 2: 检查文件完整性**

```bash
cat D:/code/screw/skills/wireframe-to-prototype.md | grep -c "^##"
```

Expected: 显示主要章节数量（应 > 5）

**Step 3: 最终确认**

确认 skill 文件包含：
- [x] YAML front matter (name, description, triggers)
- [x] 输入格式说明
- [x] 工作流程（6个步骤）
- [x] 移动端设计规范
- [x] 完整示例
- [x] 注意事项

---

## 完成清单

- [ ] Task 1: 创建 skills 目录结构
- [ ] Task 2: 编写 Skill 文件 - 基础结构和触发条件
- [ ] Task 3: 编写 Skill 文件 - 接收输入和分析框图
- [ ] Task 4: 编写 Skill 文件 - 确认和生成
- [ ] Task 5: 编写 Skill 文件 - 迭代优化和示例
- [ ] Task 6: 验证 Skill 可用性
