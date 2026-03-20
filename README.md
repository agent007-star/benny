# Benny - AI代码助手 for Chinese Developers

> Benny Co. MVP - AI编程助手，深度整合国产AI模型，专为中文开发者打造。

## 核心功能

- **多模型支持**: 通义 (阿里云)、文心 (百度)、Kimi (月之暗面)
- **流式输出**: 实时逐字显示响应，告别等待
- **中文代码优化**: 风格优化、中文注释、变量命名本土化
- **AI代码审查**: 中文Review，支持安全风险、性能、可读性分析
- **Git工作流集成**: 变更分析、智能Commit、AI辅助Code Review
- **代码翻译**: 在不同编程语言间转换
- **模型对比**: 一键对比三个模型的回答
- **持久对话历史**: 跨会话保存对话，随时加载继续
- **MCP Server**: 作为AI Agent的工具供应商接入生态
- **Freemium**: 免费100k tokens/月，Pro $9/Team $29

## 快速开始

### 安装

**方式一：本地安装（开发/测试）**
```bash
cd benny
npm install
npm run build
npm link    # 创建全局 benny 命令
```

**方式二：直接安装 tarball（无需发布到 npm）**
```bash
npm install ./benny-co-cli-0.1.0.tgz -g
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
# 初始化配置（推荐第一步）
benny init

# 交互式对话（默认使用通义，流式输出）
benny chat

# 加载历史对话继续
benny chat --session session_abc123

# 列出对话历史
benny history

# 指定模型
benny chat -m tongyi   # 通义
benny chat -m wenxin    # 文心
benny chat -m kimi      # Kimi

# 对比三个模型的回答
benny compare "如何实现快速排序"

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

# 查看/升级套餐
benny plan
benny upgrade
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
│   ├── ai/             # AI模型集成层（含compare.ts）
│   ├── cli/            # CLI命令入口
│   ├── mcp/            # MCP Server (Model Context Protocol)
│   ├── monetization/   # Freemium + 用量追踪
│   ├── optimizers/     # 中文代码优化
│   ├── git-workflows/  # Git工作流集成
│   └── utils/          # 工具函数（配置、analytics、chat-history）
├── dist/               # 编译输出
├── .env.example        # 环境变量示例
├── .npmrc.example      # .npmrc 配置示例
└── package.json
```

## 商业模式

| 套餐 | 价格 | 配额 | 功能 |
|------|------|------|------|
| Free | $0 | 100k tokens/月 | 所有命令，3个模型 |
| Pro | $9/月 | 1M tokens/月 | 优先模型，团队共享 |
| Team | $29/月 | 5M tokens/月 | 团队看板，API Key池，用量报表 |
| Enterprise | 定制 | 无限 | 私有部署，SLA，定制模型 |

## 技术栈

- TypeScript + Node.js
- 通义/文心/Kimi API
- MCP (Model Context Protocol)
- Commander.js (CLI框架)
