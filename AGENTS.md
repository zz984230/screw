# Project Agents Documentation

## Available Skills

### 1. wireframe-to-prototype
将手机App/小程序的框图（手绘草图、线框图、文字描述）转换为可交互的HTML界面原型。

**路径**: `skills/wireframe-to-prototype.md`

**使用场景**:
- 用户上传框图图片
- 手绘草图转原型
- 文字描述界面设计
- App/小程序原型制作

### 2. superdesign
AI 产品设计 Agent，从自然语言提示生成 UI 原型、组件和线框图。

**路径**: `skills/superdesign/`

**GitHub**: https://github.com/superdesigndev/superdesign

**核心功能**:
- 🖼️ Product Mock - 从提示生成完整 UI 界面
- 🧩 UI Components - 创建可复用组件
- 📝 Wireframes - 探索低保真布局
- 🔁 Fork & Iterate - 轻松复制和迭代设计

**设计原则**:
- 优雅极简主义与功能性平衡
- 4pt/8pt 间距系统
- Tailwind CSS via CDN
- 纯黑白文字（可适度强调色）
- 响应式设计优先

**使用方式**:
```
用户: "设计一个现代登录界面"
→ 启动 3 个子代理并行创建变体
→ 输出到 .superdesign/design_iterations/
→ 命名: login_1.html, login_2.html, login_3.html
```

**参考文档**:
- `SKILL.md` - 完整使用指南
- `system-prompt.txt` - 系统提示词
- `.cursor/rules/` - Cursor IDE 规则

## Project Structure

```
.
├── AGENTS.md                    # 本文件
├── docs/                        # 文档目录
├── prototypes/                  # 原型文件
│   ├── recruitment-app.html     # 木质风格招聘App
│   └── recruitment-app-blue.html # 蓝色风格招聘App
├── skills/                      # Skill 目录
│   ├── wireframe-to-prototype.md
│   └── superdesign/             # AI 设计 Agent
│       ├── SKILL.md
│       ├── system-prompt.txt
│       ├── README.md
│       └── .cursor/rules/
└── README.md
```

## Quick Start

### 创建新原型

**方式 1: 从框图开始**
1. 准备框图（手绘拍照或文字描述）
2. 使用 wireframe-to-prototype skill 生成基础原型
3. 使用 superdesign skill 美化设计
4. 迭代调整

**方式 2: 直接设计**
1. 使用 superdesign skill 生成多个设计变体
2. 选择最符合需求的版本
3. 基于选定版本迭代优化

### 设计工作流示例

```
用户: "设计一个电商首页"

Step 1: superdesign skill
→ 生成 3 个变体 (home_1.html, home_2.html, home_3.html)
→ 存储在 .superdesign/design_iterations/

Step 2: 用户选择 home_2.html

Step 3: 迭代优化
→ "基于 home_2.html，把导航栏改成悬浮的"
→ 生成 home_2_1.html

Step 4: wireframe-to-prototype skill
→ 添加交互逻辑
→ 输出最终原型
```

## Design Principles

1. **一致性** - 使用统一的图标系统
2. **简洁性** - 保持界面简洁清晰
3. **可用性** - 注重用户体验和交互
4. **可维护性** - 使用模块化设计
