import * as vscode from 'vscode';
import { MCPClient } from '../mcp/client';

export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly mcpClient: MCPClient;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, mcpClient: MCPClient) {
    const column = vscode.ViewColumn.Two;

    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'benny.chat',
      'Benny AI',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, mcpClient);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, mcpClient: MCPClient) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.mcpClient = mcpClient;

    this.update();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'userMessage':
            await this.handleUserMessage(message.text);
            break;
          case 'optimize':
            await this.handleOptimize(message.code);
            break;
          case 'review':
            await this.handleReview(message.code);
            break;
          case 'explain':
            await this.handleExplain(message.code);
            break;
        }
      },
      null,
      this.disposables
    );
  }

  public sendMessage(text: string): void {
    this.panel.webview.postMessage({
      type: 'userMessage',
      text
    });
  }

  private async handleUserMessage(text: string): Promise<void> {
    try {
      this.panel.webview.postMessage({ type: 'loading', isLoading: true });

      // Check for tool invocation (@tool_name)
      const toolMatch = text.match(/^@(\w+)\s*(.*)/);
      if (toolMatch) {
        const toolName = toolMatch[1];
        const toolArgs = toolMatch[2];
        
        // Get available tools
        const tools = await this.mcpClient.listTools();
        const tool = tools.find(t => t.name === toolName || t.name.includes(toolName));
        
        if (tool) {
          // Parse tool arguments
          let args: Record<string, unknown> = {};
          
          // Simple argument parsing for common tools
          if (toolName === 'optimize' || toolName === 'optimize_code') {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              const selection = editor.selection;
              const selectedText = editor.document.getText(selection);
              args = {
                code: selectedText || toolArgs,
                language: this.getLanguageId(editor.document),
                style: 'general'
              };
            }
          } else if (toolName === 'review' || toolName === 'review_code') {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              args = {
                code: editor.document.getText(),
                language: this.getLanguageId(editor.document)
              };
            }
          } else if (toolName === 'add_chinese_comments') {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              const selection = editor.selection;
              const selectedText = editor.document.getText(selection);
              args = {
                code: selectedText || toolArgs,
                language: this.getLanguageId(editor.document)
              };
            }
          } else if (toolName === 'translate_code') {
            // Parse --from and --to from arguments
            const fromMatch = toolArgs.match(/--from\s+(\w+)/);
            const toMatch = toolArgs.match(/--to\s+(\w+)/);
            const codeMatch = toolArgs.match(/--code\s+"([^"]+)"/);
            
            if (fromMatch && toMatch) {
              const editor = vscode.window.activeTextEditor;
              args = {
                code: codeMatch ? codeMatch[1] : (editor ? editor.document.getText(editor.selection) : ''),
                from: fromMatch[1],
                to: toMatch[1]
              };
            }
          } else if (toolName === 'analyze_git_changes') {
            args = { repo_path: '.' };
          }
          
          // Call the tool
          const result = await this.mcpClient.callTool(tool.name, args);
          
          this.panel.webview.postMessage({
            type: 'assistantMessage',
            text: `**工具調用: ${tool.name}**\n\n${result.content[0]?.text || '工具執行完成'}`
          });
          return;
        }
      }

      // Get current editor context
      const editor = vscode.window.activeTextEditor;
      let context = '';
      
      if (editor) {
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        const fileName = editor.document.fileName;
        const language = this.getLanguageId(editor.document);
        
        // Build context with file information
        context = `\n\n當前文件: ${fileName}\n語言: ${language}`;
        
        if (selectedText) {
          context += `\n選中代碼:\n\`\`\`${language}\n${selectedText}\n\`\`\``;
        } else {
          // Get surrounding context (current function/block)
          const position = editor.selection.active;
          const line = position.line;
          const startLine = Math.max(0, line - 10);
          const endLine = Math.min(editor.document.lineCount - 1, line + 10);
          const range = new vscode.Range(startLine, 0, endLine, 0);
          const surroundingCode = editor.document.getText(range);
          
          if (surroundingCode.trim()) {
            context += `\n周圍代碼:\n\`\`\`${language}\n${surroundingCode}\n\`\`\``;
          }
        }
      }

      // Call MCP tool for chat (using optimize as a general chat for now)
      const result = await this.mcpClient.callTool('optimize_code', {
        code: text + context,
        language: 'text',
        style: 'general'
      });

      this.panel.webview.postMessage({
        type: 'assistantMessage',
        text: result.content[0]?.text || '無法處理請求'
      });
    } catch (err) {
      this.panel.webview.postMessage({
        type: 'error',
        text: `錯誤: ${(err as Error).message}`
      });
    } finally {
      this.panel.webview.postMessage({ type: 'loading', isLoading: false });
    }
  }

  private async handleOptimize(code: string): Promise<void> {
    try {
      this.panel.webview.postMessage({ type: 'loading', isLoading: true });

      const editor = vscode.window.activeTextEditor;
      const language = editor ? this.getLanguageId(editor.document) : 'text';

      const result = await this.mcpClient.callTool('optimize_code', {
        code,
        language,
        style: 'general'
      });

      this.panel.webview.postMessage({
        type: 'assistantMessage',
        text: `**優化結果:**\n\n\`\`\`${language}\n${result.content[0]?.text || ''}\n\`\`\``
      });
    } catch (err) {
      this.panel.webview.postMessage({
        type: 'error',
        text: `優化失敗: ${(err as Error).message}`
      });
    } finally {
      this.panel.webview.postMessage({ type: 'loading', isLoading: false });
    }
  }

  private async handleReview(code: string): Promise<void> {
    try {
      this.panel.webview.postMessage({ type: 'loading', isLoading: true });

      const editor = vscode.window.activeTextEditor;
      const language = editor ? this.getLanguageId(editor.document) : 'text';

      const result = await this.mcpClient.callTool('review_code', {
        code,
        language
      });

      this.panel.webview.postMessage({
        type: 'assistantMessage',
        text: result.content[0]?.text || '審查完成'
      });
    } catch (err) {
      this.panel.webview.postMessage({
        type: 'error',
        text: `審查失敗: ${(err as Error).message}`
      });
    } finally {
      this.panel.webview.postMessage({ type: 'loading', isLoading: false });
    }
  }

  private async handleExplain(code: string): Promise<void> {
    try {
      this.panel.webview.postMessage({ type: 'loading', isLoading: true });

      const editor = vscode.window.activeTextEditor;
      const language = editor ? this.getLanguageId(editor.document) : 'text';

      // Use optimize with explanation focus
      const result = await this.mcpClient.callTool('optimize_code', {
        code: `請詳細解釋以下代碼的功能和邏輯:\n\n\`\`\`${language}\n${code}\n\`\`\``,
        language: 'text',
        style: 'general'
      });

      this.panel.webview.postMessage({
        type: 'assistantMessage',
        text: result.content[0]?.text || '解釋完成'
      });
    } catch (err) {
      this.panel.webview.postMessage({
        type: 'error',
        text: `解釋失敗: ${(err as Error).message}`
      });
    } finally {
      this.panel.webview.postMessage({ type: 'loading', isLoading: false });
    }
  }

  private getLanguageId(document: vscode.TextDocument): string {
    const langMap: Record<string, string> = {
      typescript: 'typescript',
      javascript: 'javascript',
      python: 'python',
      go: 'go',
      rust: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'csharp',
      ruby: 'ruby',
      php: 'php',
      swift: 'swift',
      kotlin: 'kotlin',
      shellscript: 'bash',
      sql: 'sql'
    };
    return langMap[document.languageId] || 'text';
  }

  private update(): void {
    this.panel.webview.html = this.getHtmlForWebview();
  }

  private getHtmlForWebview(): string {
    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benny AI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    .container {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
      font-weight: 600;
      font-size: 14px;
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .message {
      margin-bottom: 16px;
      padding: 12px;
      border-radius: 8px;
    }
    .user-message {
      background: var(--vscode-input-background);
      margin-left: 20%;
    }
    .assistant-message {
      background: var(--vscode-editor-inactiveSelectionBackground);
      margin-right: 20%;
    }
    .error-message {
      background: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
    }
    .message-header {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }
    .message-content {
      white-space: pre-wrap;
      line-height: 1.5;
    }
    .input-area {
      padding: 12px;
      border-top: 1px solid var(--vscode-panel-border);
      display: flex;
      gap: 8px;
    }
    .input-area input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
    }
    .input-area button {
      padding: 8px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .input-area button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .quick-actions {
      padding: 8px 16px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .quick-action {
      padding: 4px 12px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 12px;
      font-size: 12px;
      cursor: pointer;
    }
    .loading {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }
    code {
      background: var(--vscode-textCodeBlock-background);
      padding: 2px 4px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family);
    }
    pre {
      background: var(--vscode-textCodeBlock-background);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span>✨ Benny AI — 中文代碼助手</span>
    </div>
    <div class="quick-actions">
      <span class="quick-action" onclick="sendQuickAction('optimize')">優化</span>
      <span class="quick-action" onclick="sendQuickAction('review')">審查</span>
      <span class="quick-action" onclick="sendQuickAction('explain')">解釋</span>
    </div>
    <div class="messages" id="messages">
      <div class="message assistant-message">
        <div class="message-header">Benny</div>
        <div class="message-content">你好！我是 Benny AI，你的中文代碼助手。我可以幫你：
• 優化代碼風格
• 添加中文注釋
• 進行代碼審查
• 解釋代碼邏輯

選擇上方快捷操作，或直接輸入問題。</div>
      </div>
    </div>
    <div class="input-area">
      <input type="text" id="userInput" placeholder="輸入問題..." onkeypress="handleKeyPress(event)">
      <button onclick="sendMessage()">發送</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messagesDiv = document.getElementById('messages');

    function addMessage(type, header, content) {
      const messageDiv = document.createElement('div');
      messageDiv.className = \`message \${type}-message\`;
      messageDiv.innerHTML = \`
        <div class="message-header">\${header}</div>
        <div class="message-content">\${content}</div>
      \`;
      messagesDiv.appendChild(messageDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function sendMessage() {
      const input = document.getElementById('userInput');
      const text = input.value.trim();
      if (!text) return;

      addMessage('user', '你', text);
      input.value = '';

      vscode.postMessage({ type: 'userMessage', text });
    }

    function handleKeyPress(event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    }

    function sendQuickAction(action) {
      const editor = window.activeTextEditor;
      const code = 'selected code'; // Will be replaced by extension context
      
      vscode.postMessage({ type: action, code });
    }

    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.type) {
        case 'assistantMessage':
          addMessage('assistant', 'Benny', message.text);
          break;
        case 'error':
          addMessage('error', '錯誤', message.text);
          break;
        case 'loading':
          if (message.isLoading) {
            addMessage('assistant', 'Benny', '<span class="loading">思考中...</span>');
          }
          break;
      }
    });
  </script>
</body>
</html>`;
  }

  private dispose(): void {
    ChatPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
