# Benny AI — 開發者教程系列

## 教程 1: 5分鐘上手 Benny (完整安裝指南)

### 前置需求
- Node.js 18+
- 通義/文心/Kimi API Key (任選其一)

### 安裝

**方法一: tarball 直接安裝 (推薦，無需 npm)**
```bash
# 下載最新版本
curl -LO https://benny-co.github.io/downloads/benny-cli-latest.tgz

# 本地安裝
npm install ./benny-cli-latest.tgz -g

# 驗證
benny --version
```

**方法二: 克隆源碼 (開發者)**
```bash
git clone https://github.com/benny-co/benny.git
cd benny
npm install
npm run build
npm link
```

### 配置 API Key

```bash
# 交互式配置嚮導 (推薦)
benny init

# 或手動設置環境變量
export TONGYI_API_KEY="sk-xxxxxxxx"
export KIMI_API_KEY="sk-xxxxxxxx"
```

### 第一個命令

```bash
# 問候測試
benny chat "你好，幫我介紹一下你自己"

# 優化代碼
benny optimize -f ./src/index.ts

# 代碼審查
benny review -f ./src/utils.ts

# 查看支持的模型
benny models
```

---

## 教程 2: 使用 Benny 進行代碼審查

### 基礎審查

```bash
# 審查單個文件
benny review -f src/api/user.ts

# 審查並生成修復建議
benny review -f src/api/user.ts --fix

# 審查整個目錄
benny review -f src/
```

### 輸出示例

```
🔍 代碼審查報告: src/api/user.ts

🟡 [Warning] 缺少參數類型
  Line 23: function getUser(id) { ... }
  建議: function getUser(id: string): User { ... }

🔴 [Error] SQL 注入風險
  Line 45: query(`SELECT * FROM users WHERE id=${id}`)
  建議: 使用參數化查詢

🟢 [Suggestion] 建議添加 JSDoc
  Line 1: export function getUser...
  建議: 添加函數描述和參數說明

---
總計: 1 錯誤, 1 警告, 1 建議
```

### MCP 集成審查

```bash
# 啟動 MCP server
benny mcp start

# 使用 MCP tools 審查
benny mcp tools review_code --file src/api/user.ts
```

---

## 教程 3: MCP 協議深度應用

### MCP 工具列表

| Tool | 功能 | 示例 |
|------|------|------|
| `optimize_code` | 代碼優化 | `benny optimize -f file.ts` |
| `review_code` | 代碼審查 | `benny review -f file.ts` |
| `add_chinese_comments` | 添加中文註釋 | `benny comment -f file.ts` |
| `translate_code` | 代碼翻譯 | `benny translate -f file.ts` |
| `analyze_git_changes` | Git 變更分析 | `benny git analyze` |
| `get_available_models` | 可用模型列表 | `benny models` |

### 在 AI Agent 中使用 Benny

```javascript
// 將 Benny 集成到你的 AI Agent
const { spawn } = require('child_process');

function callBennyMCP(tool, args) {
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
      try { resolve(JSON.parse(output)); }
      catch { reject(new Error('Invalid MCP response')); }
    });
  });
}

// 使用示例
const result = await callBennyMCP('optimize_code', {
  code: 'function add(a,b){return a+b}',
  style: 'chinese-dev'
});
console.log(result);
```

### VS Code 集成 (即將推出)

```json
// .vscode/extensions.json
{
  "recommendations": ["benny-co.benny-vscode"]
}
```

---

## 教程 4: 模型對比與選擇

### Benny Compare

```bash
# 對比 3 個模型對同一問題的回答
benny compare "用 TypeScript 實現一個 LRU 緩存"

# 顯示對比結果
模型            | 耗時    | Token數 | 預覽
----------------|---------|---------|------
通義千問        | 1.2s    | 842     | class LRUCache { ... }
文心一言        | 2.1s    | 1203    | @Entry class LRUCache { ... }
Kimi            | 0.9s    | 756     | class LRUCache<T> { ... }
```

### 選擇最佳模型

| 場景 | 推薦模型 | 理由 |
|------|----------|------|
| 快速原型 | Kimi | 響應最快 |
| 中文代碼 | 文心一言 | 中文理解最好 |
| 複雜邏輯 | 通義千問 | 推理能力強 |
| 成本敏感 | 通義千問 | 性價比最高 |

---

## 教程 5: 高級用法 — 與 CI/CD 集成

### GitHub Actions

```yaml
# .github/workflows/code-review.yml
name: Benny AI Review

on:
  pull_request:
    paths:
      - '**.ts'
      - '**.js'

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Benny
        run: npm install -g @benny-co/cli
      - name: Run Benny Review
        run: |
          export TONGYI_API_KEY=${{ secrets.TONGYI_API_KEY }}
          for file in $(git diff --name-only ${{ github.event.pull_request.base.sha }}); do
            benny review -f "$file" --format github-pr-comment >> $GITHUB_STEP_SUMMARY
          done
```

### Git Hooks

```bash
# .git/hooks/pre-commit
#!/bin/bash
benny review -f $(git diff --name-only --cached --diff-filter=ACM)
```

### MCP in CI

```bash
# 使用 MCP server 進行批量審查
for file in src/**/*.ts; do
  echo "=== $file ===" 
  benny mcp tools review_code --file "$file"
done
```

---

## 常見問題

### Q: API Key 免費嗎？
各平台都有免費額度：
- 通義千問: 100 元免費代金券
- 文心一言: 測試版免費
- Kimi: 註冊送 15 元

### Q: 支持本地模型嗎？
目前僅支持雲端 API。未來規劃支持 Ollama 本地部署。

### Q: 數據隱私如何保障？
- 所有代碼僅用於 API 調用
- 不會存儲或訓練模型
- 可自部署 MCP server

### Q: 如何反饋問題？
- GitHub Issue: github.com/benny-co/benny/issues
- 郵箱: bennyco@proton.me
