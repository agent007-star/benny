import * as vscode from 'vscode';
import { MCPClient } from '../mcp/client';

export class ReviewPanel {
  public static currentPanel: ReviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly mcpClient: MCPClient;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    mcpClient: MCPClient,
    code: string,
    language: string
  ) {
    const column = vscode.ViewColumn.Two;

    if (ReviewPanel.currentPanel) {
      ReviewPanel.currentPanel.panel.reveal(column);
      ReviewPanel.currentPanel.startReview(code, language);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'benny.review',
      'Benny Code Review',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    ReviewPanel.currentPanel = new ReviewPanel(panel, extensionUri, mcpClient, code, language);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    mcpClient: MCPClient,
    code: string,
    language: string
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.mcpClient = mcpClient;

    this.update();
    this.startReview(code, language);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private async startReview(code: string, language: string): Promise<void> {
    try {
      this.panel.webview.postMessage({ type: 'loading', isLoading: true });

      const result = await this.mcpClient.callTool('review_code', {
        code,
        language
      });

      this.panel.webview.postMessage({
        type: 'reviewResult',
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

  private update(): void {
    this.panel.webview.html = this.getHtmlForWebview();
  }

  private getHtmlForWebview(): string {
    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benny Code Review</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    .container {
      padding: 16px;
    }
    .header {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .review-content {
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .loading {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
      text-align: center;
      padding: 40px;
    }
    .error {
      color: var(--vscode-inputValidation-errorForeground);
      background: var(--vscode-inputValidation-errorBackground);
      padding: 12px;
      border-radius: 4px;
    }
    h1, h2, h3 {
      margin-top: 24px;
      margin-bottom: 12px;
    }
    ul, ol {
      margin: 8px 0;
      padding-left: 24px;
    }
    li {
      margin: 4px 0;
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
    .severity-critical {
      color: #ff6b6b;
    }
    .severity-warning {
      color: #ffd93d;
    }
    .severity-info {
      color: #6bcb77;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      🔍 Benny Code Review
    </div>
    <div id="content">
      <div class="loading">正在進行代碼審查...</div>
    </div>
  </div>

  <script>
    window.addEventListener('message', event => {
      const message = event.data;
      const contentDiv = document.getElementById('content');

      switch (message.type) {
        case 'loading':
          if (message.isLoading) {
            contentDiv.innerHTML = '<div class="loading">正在進行代碼審查...</div>';
          }
          break;
        case 'reviewResult':
          contentDiv.innerHTML = formatReview(message.text);
          break;
        case 'error':
          contentDiv.innerHTML = \`<div class="error">\${message.text}</div>\`;
          break;
      }
    });

    function formatReview(text) {
      // Simple markdown-like formatting
      let formatted = text
        .replace(/## (.*)/g, '<h2>$1</h2>')
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/🔴 (.*)/g, '<span class="severity-critical">🔴 $1</span>')
        .replace(/🟡 (.*)/g, '<span class="severity-warning">🟡 $1</span>')
        .replace(/🟢 (.*)/g, '<span class="severity-info">🟢 $1</span>')
        .replace(/\\n/g, '<br>');

      return '<div class="review-content">' + formatted + '</div>';
    }
  </script>
</body>
</html>`;
  }

  private dispose(): void {
    ReviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
