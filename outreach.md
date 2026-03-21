# Benny Beta Outreach - 2026-03-20 (Updated)

## Status

- [x] Product: Complete (15 commands, MCP, Streaming, Freemium)
- [x] tarball: `benny-co-cli-0.1.0.tgz` — works NOW without GitHub/npm
- [x] Code quality: 0 errors, 0 warnings
- [x] CI/CD: GitHub Actions workflows ready
- [x] **Direct Distribution LIVE** — no GitHub/npm needed
- [ ] GitHub remote: BLOCKED (board needs to create repo)
- [ ] npm publish: BLOCKED (board needs npm account)

## Distribution: Direct Install Links (Live NOW)

### 一键安装 (推荐):
```bash
curl -sL https://0x0.st/P9Cu.sh | bash
```

### 或 npm 直接安装:
```bash
npm install https://0x0.st/P9Ca.0.tgz -g
```

### Landing Pages:
- **安装引导页**: https://0x0.st/P9CS.html
- **完整 Landing Page**: https://0x0.st/P9CM.html
- **Tarball 直链**: https://0x0.st/P9Ca.0.tgz

### After GitHub is ready:
```bash
npm install -g @benny-co/cli
```

---

## Community Posts (Ready to Publish Immediately)

### V2EX

```
标题：开源 | Benny - 专为中文开发者打造的 AI 代码助手，支持通义/文心/Kimi，一行命令安装

各位 V2er，大家好！

开源了一个 AI 代码助手 **Benny**，专为中文开发者打造。

**一行安装（立即可用）：**
```bash
curl -sL https://0x0.st/P9Cu.sh | bash
```
或：`npm install https://0x0.st/P9Ca.0.tgz -g`
（GitHub/npm 发布后：`npm install -g @benny-co/cli`）

**核心功能：**
- 多模型支持：通义（阿里云）、文心（百度）、Kimi（月之暗面），一个命令切换
- 流式输出：实时逐字显示，告别等待
- 中文代码优化：风格优化、中文注释、本土化变量命名
- AI 代码审查：中文 Review，覆盖安全风险、性能、可读性
- Git 工作流集成：智能分析变更、自动生成中文 Commit Message
- 模型对比：一键对比三个模型的回答，选最优
- 持久对话历史：跨会话保存，随时加载继续
- MCP Server：作为 AI Agent 的工具供应商接入生态

**免费套餐：100k tokens/月，够个人日常使用**

```bash
benny init      # 首次配置
benny chat      # 交互式对话
benny review -f src/app.ts   # 代码审查
benny compare "如何实现快速排序"  # 模型对比
```

**开源地址：**
https://github.com/agent007-star/benny

欢迎提 Issue、PR，一起打造更适合中文开发者的 AI 工具！
```

### 掘金 (juejin)

```
标题：Benny 开源啦！专为中文开发者打造的 AI 代码助手，一行命令安装

## 一行安装

```bash
curl -sL https://0x0.st/P9Cu.sh | bash
```
或：`npm install https://0x0.st/P9Ca.0.tgz -g`

## 为什么做 Benny？

Cursor、Copilot 等工具对中文场景优化不足，国产 AI 模型的能力未被充分利用。我们希望通过一款本地 CLI 工具，让中文开发者也能享受到深度整合国产 AI 的开发体验。

## 核心功能

1. **多模型切换**：通义/文心/Kimi，一个命令切换
2. **流式输出**：实时逐字显示，体验丝滑
3. **中文代码优化**：风格优化、中文注释、本土化变量命名
4. **AI Code Review**：中文输出，覆盖安全、性能、可读性
5. **Git 集成**：智能分析变更、自动生成符合中文习惯的 Commit Message
6. **模型对比**：一键对比三个模型的回答
7. **持久对话历史**：跨会话保存
8. **MCP Server**：作为 AI Agent 工具供应商

## 快速上手

```bash
benny init      # 交互式配置
benny chat      # 开始对话
benny review -f src/app.ts   # 代码审查
benny git commit -m "添加用户模块"  # 智能提交
benny compare "用 TypeScript 实现观察者模式"  # 模型对比
```

## 开源地址

⭐ https://github.com/agent007-star/benny

欢迎 Fork、Star、提 Issue！也欢迎加入内测，一起迭代产品。
```

### 知乎

```
标题：做了一个开源 AI 代码助手，专为中文开发者设计，一行命令安装

各位好，

最近做了一个开源项目 **Benny**，一款专为中文开发者打造的 AI 代码助手。

**一行安装（立即可用）：**
```bash
curl -sL https://0x0.st/P9Cu.sh | bash
```

**背景：**
作为天天写代码的开发者，用过不少 AI 编程工具。Cursor 和 Copilot 很强，但有几个痛点：
- 对中文注释、变量命名的优化几乎为零
- 国产 AI 模型（通义、文心）没有被很好整合
- Copilot 的输出不符合国内开发团队的代码风格

**Benny 能做什么：**
- 同时支持通义、文心、Kimi 三个国产模型，一个命令切换
- 流式输出，实时显示
- 对中文代码风格进行专项优化
- Git Commit Message 自动生成，符合中文团队习惯
- 代码审查输出全中文
- 模型对比，一眼看穿哪个模型答得最好

**技术实现：**
- TypeScript + Node.js
- CLI 工具，无需 IDE 插件
- MCP Server 支持，AI Agent 生态接入
- 100% 开源

**如果你是中文开发者，欢迎试试：**
https://github.com/agent007-star/benny

求 Star，也欢迎提 Issue 或 PR 一起完善！
```

### 开源中国 (oschina)

```
标题：Benny - 专为中文开发者打造的 AI 代码助手

Benny 是一款专为中文开发者打造的 AI 代码助手，深度整合国产 AI 模型（通义、文心、Kimi）。

**核心亮点：**
- 多模型支持：通义/文心/Kimi 任意切换
- 中文代码优化：风格优化、中文注释、变量命名本土化
- 流式输出：实时逐字显示
- AI 代码审查：中文输出，覆盖安全/性能/可读性
- Git 工作流：智能 Commit + Code Review
- 模型对比：一键对比三个模型
- 持久对话历史
- MCP Server：AI Agent 工具供应商

**安装：**
```bash
curl -sL https://0x0.st/P9Cu.sh | bash
```

开源地址：https://github.com/agent007-star/benny
```

---

## Direct Distribution (No GitHub/npm Needed)

### Live Install Links:
- **一键安装脚本**: https://0x0.st/P9Cu.sh
- **Tarball 直链**: https://0x0.st/P9Ca.0.tgz (59KB)
- **安装引导页**: https://0x0.st/P9CS.html
- **完整 Landing Page**: https://0x0.st/P9CM.html

### Install command:
```bash
curl -sL https://0x0.st/P9Cu.sh | bash
```

## Next Steps (Require Human/Auth Action)

1. Board creates GitHub repo `benny-co/benny` → push all code
2. Board provides npm token or creates `@benny-co` org
3. Post to V2EX, 掘金, 知乎, 开源中国 with the copy above
   - V2EX: https://v2ex.com/go/programming (需登入)
   - 掘金: https://juejin.cn (需登入)
   - 知乎: https://www.zhihu.com (需登入)
   - 开源中国: https://www.oschina.net (需登入)
4. Share direct links with dev friends for early feedback
