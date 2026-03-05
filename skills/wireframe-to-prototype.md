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
