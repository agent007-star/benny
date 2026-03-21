import * as vscode from 'vscode';

export interface BennyConfig {
  defaultModel: string;
  enableInlineSuggestions: boolean;
  cliPath: string;
  enableChat: boolean;
  enableCodeReview: boolean;
  language: 'zh-TW' | 'zh-CN' | 'en';
}

export function getConfig(): BennyConfig {
  const config = vscode.workspace.getConfiguration('benny');
  return {
    defaultModel: config.get<string>('defaultModel', 'qwen-plus'),
    enableInlineSuggestions: config.get<boolean>('enableInlineSuggestions', true),
    cliPath: config.get<string>('cliPath', 'benny'),
    enableChat: config.get<boolean>('enableChat', true),
    enableCodeReview: config.get<boolean>('enableCodeReview', true),
    language: config.get<'zh-TW' | 'zh-CN' | 'en'>('language', 'zh-TW')
  };
}

export function getBennyPath(): string {
  const config = vscode.workspace.getConfiguration('benny');
  return config.get<string>('cliPath', 'benny');
}
