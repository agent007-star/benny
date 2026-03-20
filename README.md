# Benny - AI代码助手 for Chinese Developers

> Benny Co. MVP - AI编程助手，深度整合国产AI模型，专为中文开发者打造。

## 核心功能

- **多模型支持**: 通义 (阿里云)、文心 (百度)、Kimi (月之暗面)
- **中文代码优化**: 风格优化、中文注释、变量命名本土化
- **AI代码审查**: 中文Review，支持安全风险、性能、可读性分析
- **Git工作流集成**: 变更分析、智能Commit、AI辅助Code Review
- **代码翻译**: 在不同编程语言间转换

## 快速开始

### 安装

```bash
cd benny
npm install
npm run build
npm link
```

### 配置API Key

**方式一：复制环境变量文件（推荐）**

```bash
cp .env.example .env
# 编辑 .env 填入你的 API Key
```

**方式二：使用 .npmrc（全局配置）**

```bash
cp .npmrc.example ~/.npmrc
# 编辑 ~/.npmrc 填入你的 API Key
```

**支持的模型：**

| 模型 | 环境变量 | 获取地址 |
|------|----------|----------|
| 通义（推荐新手） | `TONGYI_API_KEY` | [阿里云DashScope](https://dashscope.console.aliyun.com/) |
| 文心 | `WENXIN_API_KEY` + `WENXIN_SECRET_KEY` | [百度智能云](https://console.bce.baidu.com/) |
| Kimi | `KIMI_API_KEY` | [月之暗面](https://platform.moonshot.cn/) |

### 使用

```bash
# 交互式对话（默认使用通义）
benny chat

# 指定模型
benny chat -m tongyi   # 通义
benny chat -m wenxin    # 文心
benny chat -m kimi      # Kimi

# 优化代码
benny optimize -f src/index.ts --style aliyun

# 添加中文注释
benny comment -f src/utils.ts

# AI代码审查
benny review -f src/app.ts

# 代码语言翻译
benny translate -f src/app.ts --from javascript --to python

# Git变更审查
benny git review

# Git变更统计
benny git analyze

# 智能提交
benny git commit -m "添加用户认证模块"

# 列出可用模型
benny models

# 查看使用统计
benny stats --days 7
```

### 语言自动检测

`optimize`、`comment`、`review` 命令支持自动检测文件语言：

```bash
# 自动检测，无需指定 --language
benny optimize -f src/app.ts
benny review -f src/utils.py
```

支持的检测语言：TypeScript、JavaScript、Python、Go、Rust、Java、C++、C#、Ruby、PHP、Swift、Kotlin、Bash、SQL

## 项目结构

```
benny/
├── src/
│   ├── ai/           # AI模型集成层
│   ├── cli/          # CLI命令入口
│   ├── optimizers/   # 中文代码优化
│   ├── git-workflows/ # Git工作流集成
│   └── utils/        # 工具函数
├── dist/             # 编译输出
├── .env.example      # 环境变量示例
├── .npmrc.example    # .npmrc 配置示例
└── package.json
```

## 商业模式

- **Freemium**: 免费额度内使用，高频用户按token计费
- **团队版**: 共享API Key池，团队使用统计
- **企业版**: 私有化部署，定制代码风格，优先模型支持

## 技术栈

- TypeScript + Node.js
- 通义/文心/Kimi API
- simple-git (Git集成)
- Commander.js (CLI框架)
