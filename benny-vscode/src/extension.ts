import * as vscode from 'vscode';
import { ChatPanel } from './sidebar/ChatPanel';
import { MCPClient } from './mcp/client';
import { GhostTextProvider } from './inline/GhostText';
import { ReviewPanel } from './review/ReviewPanel';
import { getConfig } from './utils/config';

let mcpClient: MCPClient | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Benny AI extension activated');

  const config = getConfig();

  // Initialize MCP client
  mcpClient = new MCPClient();

  // Register commands
  const openChatCommand = vscode.commands.registerCommand('benny.openChat', () => {
    if (!config.enableChat) {
      vscode.window.showWarningMessage('聊天面板已禁用，請在設置中啟用');
      return;
    }
    ChatPanel.createOrShow(context.extensionUri, mcpClient!);
  });

  const optimizeCommand = vscode.commands.registerCommand('benny.optimize', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('請先選擇要優化的代碼');
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    if (!selectedText) {
      vscode.window.showErrorMessage('請先選擇要優化的代碼');
      return;
    }

    const language = getLanguageId(editor.document);
    try {
      vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: '正在優化代碼...' },
        async () => {
          const result = await mcpClient!.callTool('optimize_code', {
            code: selectedText,
            language,
            style: 'general'
          });
          
          if (result?.content?.[0]?.text) {
            const optimizedCode = result.content[0].text;
            
            // Show diff preview before applying
            const showDiff = await vscode.window.showInformationMessage(
              '代碼優化完成，預覽差異？',
              '預覽差異',
              '直接應用',
              '取消'
            );
            
            if (showDiff === '預覽差異') {
              await showDiffPreview(selectedText, optimizedCode, language);
            } else if (showDiff === '直接應用') {
              await editor.edit(editBuilder => {
                editBuilder.replace(selection, optimizedCode);
              });
              vscode.window.showInformationMessage('✓ 代碼優化完成');
            }
          }
        }
      );
    } catch (err) {
      vscode.window.showErrorMessage(`優化失敗: ${(err as Error).message}`);
    }
  });

  const reviewCommand = vscode.commands.registerCommand('benny.review', async () => {
    if (!config.enableCodeReview) {
      vscode.window.showWarningMessage('代碼審查功能已禁用，請在設置中啟用');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('請先打開要審查的文件');
      return;
    }

    const code = editor.document.getText();
    const language = getLanguageId(editor.document);
    
    ReviewPanel.createOrShow(context.extensionUri, mcpClient!, code, language);
  });

  const explainCommand = vscode.commands.registerCommand('benny.explain', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('請先選擇要解釋的代碼');
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    if (!selectedText) {
      vscode.window.showErrorMessage('請先選擇要解釋的代碼');
      return;
    }

    const language = getLanguageId(editor.document);
    
    // Open chat panel with explanation request
    ChatPanel.createOrShow(context.extensionUri, mcpClient!);
    ChatPanel.currentPanel?.sendMessage(`請解釋以下 ${language} 代碼:\n\n\`\`\`${language}\n${selectedText}\n\`\`\``);
  });

  const acceptSuggestionCommand = vscode.commands.registerCommand('benny.acceptSuggestion', async (suggestion: string, selection: vscode.Range) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    await editor.edit(editBuilder => {
      editBuilder.replace(selection, suggestion);
    });
    
    vscode.window.showInformationMessage('✓ 已接受 Benny 建議');
  });

  // Register inline completion provider if enabled
  if (config.enableInlineSuggestions) {
    const inlineProvider = vscode.languages.registerInlineCompletionItemProvider(
      { language: '*' },
      new GhostTextProvider(mcpClient!)
    );
    context.subscriptions.push(inlineProvider);
  }

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = '$(sparkle) Benny';
  statusBarItem.tooltip = `Benny AI Code Assistant\n模型: ${config.defaultModel}\n語言: ${config.language}`;
  statusBarItem.command = 'benny.openChat';
  statusBarItem.show();

  context.subscriptions.push(
    openChatCommand,
    optimizeCommand,
    reviewCommand,
    explainCommand,
    acceptSuggestionCommand,
    statusBarItem
  );
}

async function showDiffPreview(originalCode: string, optimizedCode: string, language: string): Promise<void> {
  // Create temporary files for diff comparison
  const originalUri = vscode.Uri.parse(`untitled:original.${language}`);
  const optimizedUri = vscode.Uri.parse(`untitled:optimized.${language}`);
  
  // Create virtual documents (required for diff)
  await vscode.workspace.openTextDocument(originalUri);
  await vscode.workspace.openTextDocument(optimizedUri);
  
  // Insert content
  const originalEdit = new vscode.WorkspaceEdit();
  originalEdit.insert(originalUri, new vscode.Position(0, 0), originalCode);
  await vscode.workspace.applyEdit(originalEdit);
  
  const optimizedEdit = new vscode.WorkspaceEdit();
  optimizedEdit.insert(optimizedUri, new vscode.Position(0, 0), optimizedCode);
  await vscode.workspace.applyEdit(optimizedEdit);
  
  // Show diff
  await vscode.commands.executeCommand(
    'vscode.diff',
    originalUri,
    optimizedUri,
    `Benny: 優化差異預覽 (${language})`
  );
}

export function deactivate() {
  if (mcpClient) {
    mcpClient.dispose();
  }
}

function getLanguageId(document: vscode.TextDocument): string {
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
