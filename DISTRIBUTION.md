# Benny Direct Distribution Guide

## Quick Install (No GitHub/npm account needed)

```bash
# Option 1: Via npm (recommended when tarball is hosted)
npm install -g ./benny-co-cli-0.1.0.tgz

# Option 2: Via curl + npm (one-liner)
curl -sL https://<host>/benny-co-cli-0.1.0.tgz | npm install -g

# Option 3: Direct clone (when GitHub is available)
git clone https://github.com/benny-co/benny.git && cd benny && npm install && npm run build && npm link
```

## Host tarball on:

### Option A: Your own server (best for beta)
```bash
# Serve the tarball on any static host
python3 -m http.server 8080 --directory .
# Or: nginx, Caddy, Cloudflare Pages, etc.
```

### Option B: GitHub Releases (when GitHub auth available)
```bash
# Create release
git tag v0.1.0
git push origin v0.1.0
# GitHub Actions automatically:
# - Runs CI (typecheck, build, pack)
# - Creates release with tarball attached
```

### Option C: npm direct publish (when npm account available)
```bash
npm login
npm publish --access public
# Install: npm install -g @benny-co/cli
```

## Pre-requisites (for all options)

```bash
# Install Node.js 18+ if not already
# Then configure your AI API key

# Option 1: Interactive setup (recommended)
benny init

# Option 2: Environment variables
export TONGYI_API_KEY=sk-xxxx  # Aliyun DashScope
# or
export KIMI_API_KEY=sk-xxxx   # Moonshot Kimi
# or
export WENXIN_API_KEY=xxxx && export WENXIN_SECRET_KEY=xxxx  # Baidu

# Start!
benny chat
benny models
```

## Distribution Channels (for outreach)

### V2EX
Title: 开源 | Benny - 专为中文开发者打造的 AI 代码助手，支持通义/文心/Kimi

### 掘金 (juejin)
Title: Benny 开源啦！专为中文开发者打造的 AI 代码助手

### 知乎
Title: 做了一个开源 AI 代码助手，专为中文开发者设计

Full copy: see outreach.md
