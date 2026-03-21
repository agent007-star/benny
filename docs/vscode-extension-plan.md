# Benny VS Code Extension — Technical Specification
**CEO Engineering Review | 2026-03-20**

## Overview

Lightweight VS Code extension that brings Benny's AI capabilities directly into the editor.
Target: Chinese developers who want inline AI assist without leaving their IDE.

## Architecture

```
┌─────────────────────────────────────────┐
│  VS Code Extension (TypeScript)         │
│  ┌──────────┐  ┌──────────────────────┐│
│  │ Sidebar  │  │ Inline Decorations   ││
│  │ (Chat)   │  │ (Inline suggestions) ││
│  └────┬─────┘  └──────────┬───────────┘│
│       │                    │            │
│  ┌────▼────────────────────▼────┐       │
│  │    Benny MCP Client (stdio)  │       │
│  └───────────────────────────────┘       │
│                    │                     │
│         ┌──────────▼──────────┐          │
│         │  @benny-co/cli      │          │
│         │  (already installed)│          │
│         └─────────────────────┘          │
└─────────────────────────────────────────┘
```

## Design Principles

1. **零配置**: 自動檢測 `benny` CLI，安裝引導
2. **輕量**: 僅 sidebar + inline，不影響編輯器性能
3. **MCP 優先**: 通過 stdio 調用現有 MCP server
4. **中文優先**: 默認中文界面

## Feature Breakdown

### P0 (MVP)

#### F1: Sidebar Chat Panel
- 打開 `Cmd/Ctrl+Shift+P` → "Benny: Open Chat"
- 底部 sidebar 面板，400px 高度
- 類 VS Code Copilot 樣式
- 支持代碼塊渲染 (markdown)
- 快捷命令按鈕: Optimize / Review / Explain / Translate

#### F2: Inline Code Assist (Ghost Text)
- 選擇代碼 → 右鍵 → "Benny: Optimize"
- 在選中位置下方顯示 AI 建議 (灰色 ghost text)
- `Tab` 接受建議，`Esc` 拒絕
- 使用 `src/optimizers/chinese-code.ts` 的 optimize 邏輯

#### F3: Code Review Panel
- `Cmd/Ctrl+Shift+P` → "Benny: Review File"
- 打開新 panel 顯示 review 結果
- 問題分級: 🔴 嚴重 / 🟡 警告 / 🟢 建議
- 點擊問題 → 跳轉到對應代碼行

### P1 (v0.2)

#### F4: Inline Diff Preview
- AI 修改後，顯示 inline diff
- 綠色高亮新增，紅色高亮刪除
- 一鍵接受/拒絕

#### F5: MCP Tool Integration
- 6 個 MCP tools 直接在 VS Code 中可用
- 在 chat 中 @tool_name 調用
- 狀態欄顯示 MCP 連接狀態

#### F6: Selection-based Context
- 自動將當前文件的相關代碼傳給 AI
- 智能上下文窗口 (不要發送整個文件)

### P2 (v0.3)

#### F7: Multi-file Analysis
- 分析整個 folder 的架構
- 架構問題檢測
- 建議重構方案

#### F8: Git Integration
- PR 描述生成
- Commit message 建議
- Review summary 生成

## Technical Implementation

### Package Structure

```
benny-vscode/
├── src/
│   ├── extension.ts          # Entry point
│   ├── sidebar/
│   │   ├── ChatPanel.ts      # Sidebar webview
│   │   ├── chat.tsx          # React components
│   │   └── styles.css
│   ├── inline/
│   │   ├── GhostText.ts      # Inline suggestion provider
│   │   └── decorations.ts    # VS Code decorations
│   ├── mcp/
│   │   └── client.ts         # MCP stdio client
│   ├── review/
│   │   └── ReviewPanel.ts    # Code review results
│   └── utils/
│       ├── config.ts          # VS Code settings
│       └── logger.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Key Dependencies

```json
{
  "vscode": "^1.85.0",
  "@types/vscode": "^1.85.0",
  "@vscode/webview-ui-toolkit": "^1.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

### Webview Communication

```typescript
// sidebar ↔ extension
const panel = vscode.window.createWebviewPanel(
  'benny.chat',
  'Benny AI',
  vscode.ViewColumn.Two,
  { enableScripts: true }
);

// Send message from webview to extension
panel.webview.postMessage({ type: 'optimize', code: selectedCode });

// Handle in extension
panel.webview.onDidReceiveMessage(msg => {
  if (msg.type === 'optimize') {
    callBennyMCP('optimize_code', { code: msg.code })
      .then(result => panel.webview.postMessage({ type: 'result', data: result }));
  }
});
```

### MCP Client (stdio)

```typescript
// src/mcp/client.ts
import { spawn } from 'child_process';

export function callMCPTool(tool: string, args: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('benny', ['mcp', 'tools', '--json'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: `tools/${tool}`,
      params: args
    });
    
    proc.stdin.write(request + '\n');
    
    let output = '';
    proc.stdout.on('data', data => { output += data.toString(); });
    proc.stdout.on('end', () => {
      try {
        resolve(JSON.parse(output));
      } catch {
        reject(new Error('Invalid MCP response'));
      }
    });
  });
}
```

### Ghost Text Implementation

```typescript
// src/inline/GhostText.ts
import * as vscode from 'vscode';

export class GhostTextProvider implements vscode.InlineCompletionItemProvider {
  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[]> {
    const selectedText = document.getText(document.selection);
    if (!selectedText) return [];

    const suggestion = await callBennyMCP('optimize_code', {
      code: selectedText,
      style: 'chinese-dev'
    });

    return [{
      insertText: suggestion,
      range: new vscode.Range(position, position),
      command: {
        title: 'Accept',
        command: 'benny.acceptSuggestion'
      }
    }];
  }
}
```

## Installation UX

### If Benny CLI not installed:
1. VS Code notification: "Benny CLI 未檢測到"
2. Button: "下載 Benny CLI"
3. 彈出: 安裝說明 (npm install -g, or tarball)
4. 驗證: `benny --version`

### If API keys not configured:
1. `benny init` 引導配置
2. 或直接點擊 "Configure API Keys"
3. 狀態欄顯示: "🔴 Benny: 未配置" / "🟢 Benny: 就緒"

## Publishing

```json
// package.json
{
  "name": "benny-vscode",
  "displayName": "Benny AI — AI Code Assistant",
  "description": "為中文開發者打造的AI代碼助手，支持通義/文心/Kimi",
  "publisher": "benny-co",
  "version": "0.1.0",
  "engines": { "vscode": "^1.85.0" },
  "galleryBanner": {
    "color": "#1a1a2e",
    "theme": "dark"
  },
  "keywords": ["ai", "chinese", "copilot", "benny", "tongyi", "kimi", "wenxin"]
}
```

**Publisher:** `benny-co` (需要 VS Code Marketplace publisher account, $0)
**Install base:** VS Code Chinese users (potential 500k+)

## Timeline

| Week | Milestone |
|------|-----------|
| 1 | P0: Sidebar chat + MCP client |
| 2 | P0: Inline assist + review panel |
| 3 | P1: Diff preview + selection context |
| 4 | P1: MCP tool integration in chat |
| 5 | P2: Multi-file analysis + Git integration |
| 6 | Beta release, 10 VS Code users |

## Metrics

- VS Code Marketplace: 100+ installs
- Monthly Active Users: 20+
- Revenue from Pro upgrades: $50+ MRR
- GitHub stars: 50+

## Competition

| Product | Strength | Weakness | Benny Advantage |
|---------|----------|----------|-----------------|
| GitHub Copilot | Brand, deep IDE | $10/mo, 英語優先 | $9/mo, 中文+國產模型 |
| 百度Comate | 中文, 本地生態 | 百度封閉 | 開源, 模型中立 |
| CodeGeex | 免費 | 功能基礎 | MCP+Streaming+Compare |
| Cursor | All-in-one | $20/mo, 封閉 | 開源CLI, MCP生態 |

## Risk: VS Code Marketplace Rejection

VS Code 審核可能以 "功能不足" 或 "spam" 為由拒絕。
**緩解:** 先 GitHub release `.vsix`，累積 100 stars 後再提交 Marketplace。
