# Benny Beta Outreach - 2026-03-20

## Community Posts (Ready to Publish)

### V2EX

```
标题：开源 | Benny - 专为中文开发者打造的 AI 代码助手，支持通义/文心/Kimi

正文：

各位 V2er，大家好！

开源了一个 AI 代码助手 **Benny**，专为中文开发者打造。

**核心功能：**
- 多模型支持：通义（阿里云）、文心（百度）、Kimi（月之暗面）
- 中文代码优化：风格优化、中文注释、变量命名本土化
- AI 代码审查：中文 Review，支持安全风险、性能、可读性分析
- Git 工作流集成：变更分析、智能 Commit、AI 辅助 Code Review
- 代码翻译：支持多种编程语言互转

**技术栈：** TypeScript + Node.js，CLI 工具，零学习成本

```bash
npm install -g benny
benny chat  # 交互式对话
benny review -f src/app.ts  # 代码审查
benny git commit -m "提交信息"  # 智能 Git 提交
```

**免费开源，欢迎 Star：**
https://github.com/benny-co/benny

**申请内测资格：**
https://github.com/benny-co/benny/issues/new?labels=beta

欢迎提 Issue、PR，一起打造更适合中文开发者的 AI 工具！
```

### 掘金 (juejin)

```
标题：Benny 开源啦！专为中文开发者打造的 AI 代码助手

---

各位掘金作者，

很高兴宣布 **Benny** 正式开源——一款专为中文开发者打造的 AI 代码助手。

## 为什么做 Benny？

Cursor、Copilot 等工具对中文场景优化不足，国产 AI 模型（通义、文心等）的能力未被充分利用。我们希望通过一款本地 CLI 工具，让中文开发者也能享受到深度整合国产 AI 的开发体验。

## 核心功能

1. **多模型切换**：一行命令切换通义/文心/Kimi
2. **中文代码优化**：自动优化代码风格、添加中文注释、本土化变量命名
3. **AI Code Review**：中文输出，覆盖安全、性能、可读性
4. **Git 集成**：智能分析变更、自动生成符合中文习惯的 Commit Message

## 快速上手

```bash
npm install -g benny
cp .env.example .env  # 配置你的 API Key
benny chat  # 开始对话
```

## 开源地址

⭐ https://github.com/benny-co/benny

欢迎 Fork、Star、提 Issue！也欢迎加入内测，一起迭代产品。
```

### 知乎

```
标题：做了一个开源 AI 代码助手，专为中文开发者设计

各位好，

最近做了一个开源项目 **Benny**（https://github.com/benny-co/benny），一款专为中文开发者打造的 AI 代码助手。

**背景：**
作为天天写代码的开发者，用过不少 AI 编程工具。Cursor 和 Copilot 很强，但有几个痛点：
- 对中文注释、变量命名的优化几乎为零
- 国产 AI 模型（通义、文心）没有被很好整合
- 很多场景下，Copilot 的输出不符合国内开发团队的代码风格

**Benny 能做什么：**
- 同时支持通义、文心、Kimi 三个国产模型，一个命令切换
- 对中文代码风格进行专项优化
- Git Commit Message 自动生成，符合中文团队习惯
- 代码审查输出全中文

**技术实现：**
- TypeScript + Node.js
- CLI 工具，无需 IDE 插件
- 100% 开源

**如果你是中文开发者，欢迎试试：**
https://github.com/benny-co/benny

求 Star，也欢迎提 Issue 或 PR 一起完善！
```

---

## Status

- [x] Git repo initialized at `/workspace/benny`
- [x] .gitignore added (excludes node_modules, dist)
- [ ] GitHub remote not set (requires GitHub auth)
- [ ] Community posts not yet published (requires manual posting or platform API keys)
- [ ] GitHub repo creation pending (requires GitHub auth)
- [x] npm tarball created: `benny-co-cli-0.1.0.tgz` (can distribute directly!)

## Installation Alternatives (2026-03-20)

Since GitHub/npm blocked, distribute via tarball:
```bash
npm install ./benny-co-cli-0.1.0.tgz -g
```

Or via npx (no install):
```bash
npx @benny-co/cli chat  # doesn't work yet (not published)
```

**Best option when GitHub unblocked:** GitHub releases with attached tarball.

## Next Steps (Require Human/Auth Action)

1. Create GitHub repo `benny-co/benny` and push code
2. Post to V2EX, 掘金, 知乎 with the copy above
3. Set up GitHub Actions for CI
4. Create beta signup form/issue template
5. Publish to npm when account ready
