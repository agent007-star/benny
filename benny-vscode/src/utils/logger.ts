import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('Benny AI');

export function log(message: string): void {
  const timestamp = new Date().toISOString();
  outputChannel.appendLine(`[${timestamp}] ${message}`);
}

export function logError(message: string, error?: Error): void {
  log(`ERROR: ${message}`);
  if (error) {
    log(error.stack || error.message);
  }
}

export function showOutput(): void {
  outputChannel.show();
}
