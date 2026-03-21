import * as vscode from 'vscode';
import { MCPClient } from '../mcp/client';

export class GhostTextProvider implements vscode.InlineCompletionItemProvider {
  private mcpClient: MCPClient;
  private debounceTimer: NodeJS.Timeout | undefined;
  private lastRequestTime = 0;
  private readonly debounceMs = 500;
  private readonly minCodeLength = 10;

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[]> {
    // Check if we should provide suggestions
    if (!this.shouldProvideSuggestion(document, position)) {
      return [];
    }

    // Debounce requests
    const now = Date.now();
    if (now - this.lastRequestTime < this.debounceMs) {
      return [];
    }

    // Get selected text or current line context
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return [];
    }

    const selection = editor.selection;
    const selectedText = document.getText(selection);
    
    // Only provide suggestions for selected code
    if (!selectedText || selectedText.length < this.minCodeLength) {
      return [];
    }

    // Check for cancellation
    if (token.isCancellationRequested) {
      return [];
    }

    this.lastRequestTime = now;

    try {
      const language = this.getLanguageId(document);
      
      // Request optimization from MCP
      const result = await this.mcpClient.callTool('optimize_code', {
        code: selectedText,
        language,
        style: 'general'
      });

      if (token.isCancellationRequested) {
        return [];
      }

      const suggestion = result.content[0]?.text;
      if (!suggestion || suggestion === selectedText) {
        return [];
      }

      // Create inline completion item
      const item = new vscode.InlineCompletionItem(
        suggestion,
        new vscode.Range(position, position)
      );

      // Add command to accept suggestion
      item.command = {
        title: 'Accept Benny Suggestion',
        command: 'benny.acceptSuggestion',
        arguments: [suggestion, selection]
      };

      return [item];
    } catch (err) {
      console.error('GhostText error:', err);
      return [];
    }
  }

  private shouldProvideSuggestion(document: vscode.TextDocument, position: vscode.Position): boolean {
    // Don't suggest in certain contexts
    const lineText = document.lineAt(position.line).text;
    
    // Skip comments
    if (lineText.trim().startsWith('//') || lineText.trim().startsWith('#')) {
      return false;
    }

    // Skip strings
    const beforeCursor = lineText.substring(0, position.character);
    if (beforeCursor.includes('"') || beforeCursor.includes("'") || beforeCursor.includes('`')) {
      return false;
    }

    // Skip if cursor is at the end of a line with only whitespace
    if (position.character === lineText.length && lineText.trim() === '') {
      return false;
    }

    return true;
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

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}
