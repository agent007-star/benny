# Benny AI VS Code Extension

為中文開發者打造的AI代碼助手，支持通義/文心/Kimi。

## 功能

### P0 (MVP)
- **側邊欄聊天面板**: 類似 Copilot 的聊天界面
- **代碼優化**: 選取代碼 → 右鍵 → 優化
- **代碼審查**: AI 驅動的代碼審查
- **代碼解釋**: 中文解釋代碼邏輯

### P1 (v0.2)
- **行內建議**: 類似 Ghost Text 的代碼建議
- **MCP 工具集成**: 直接在 VS Code 中使用 Benny MCP 工具
- **智能上下文**: 自動傳遞相關代碼給 AI

## 安裝

### 前置要求
1. 安裝 Benny CLI:
   ```bash
   npm install -g @benny-co/cli
   ```

2. 初始化配置:
   ```bash
   benny init
   ```

### 安裝擴展
1. 從 VS Code Marketplace 安裝 (即將上線)
2. 或從 GitHub Release 下載 `.vsix` 文件

## 使用

### 快捷操作
- `Cmd/Ctrl+Shift+P` → "Benny: Open Chat" 打開聊天面板
- 選取代碼 → 右鍵 → "Benny: Optimize" 優化代碼
- 選取代碼 → 右鍵 → "Benny: Explain" 解釋代碼

### 聊天面板
1. 打開側邊欄聊天面板
2. 使用快捷按鈕: 優化 / 審查 / 解釋
3. 直接輸入問題

### 行內建議
1. 選取代碼
2. 等待 AI 建議出現 (灰色文字)
3. 按 `Tab` 接受建議，`Esc` 拒絕

## 配置

在 VS Code 設置中搜索 "Benny":

- `benny.defaultModel`: 默認 AI 模型 (qwen-plus / ernie-4.0-8k / moonshot-v1-128k)
- `benny.enableInlineSuggestions`: 啟用行內代碼建議
- `benny.cliPath`: Benny CLI 路徑（自動檢測或手動指定）
- `benny.enableChat`: 啟用聊天面板
- `benny.enableCodeReview`: 啟用代碼審查功能
- `benny.language`: 界面語言 (zh-TW / zh-CN / en)

## 架構

```
VS Code Extension
├── Sidebar Chat Panel (Webview)
├── Inline Suggestions (Ghost Text)
├── Code Review Panel
└── MCP Client (stdio)
         │
         ▼
    @benny-co/cli
    (MCP Server)
```

## 開發

```bash
# 安裝依賴
pnpm install

# 編譯
pnpm run compile

# 監聽模式
pnpm run watch

# 代碼檢查
pnpm run lint
```

## 許可證

MIT
