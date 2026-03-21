import { ChildProcess, spawn } from 'child_process';
import * as vscode from 'vscode';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
}

export class MCPClient {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
  }>();
  private buffer = '';
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      // Find benny CLI - try multiple paths
      const bennyPath = await this.findBennyPath();
      
      this.process = spawn(bennyPath, ['mcp', 'start'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        this.handleResponse(data.toString());
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        console.error('MCP stderr:', data.toString());
      });

      this.process.on('error', (err) => {
        console.error('MCP process error:', err);
        vscode.window.showErrorMessage(`Benny MCP 連接失敗: ${err.message}`);
      });

      this.process.on('close', (code) => {
        console.log('MCP process closed with code:', code);
        this.isConnected = false;
      });

      // Initialize MCP connection
      await this.initialize();
      this.isConnected = true;
    } catch (err) {
      console.error('Failed to connect to MCP:', err);
      vscode.window.showErrorMessage(
        '無法連接到 Benny MCP Server。請確保已安裝 Benny CLI: npm install -g @benny-co/cli'
      );
    }
  }

  private async findBennyPath(): Promise<string> {
    // Try common paths
    const paths = [
      'benny',
      'npx benny',
      `${process.env.HOME}/.npm/bin/benny`,
      '/usr/local/bin/benny'
    ];

    for (const p of paths) {
      try {
        const { execSync } = require('child_process');
        execSync(`${p} --version`, { stdio: 'ignore' });
        return p;
      } catch {
        continue;
      }
    }

    // Default to 'benny' and let it fail with a clear error
    return 'benny';
  }

  private handleResponse(data: string): void {
    this.buffer += data;
    
    // Process complete JSON responses
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const response = JSON.parse(line) as JsonRpcResponse;
        const pending = this.pendingRequests.get(response.id);
        
        if (pending) {
          this.pendingRequests.delete(response.id);
          
          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      } catch {
        // Not a complete JSON yet, wait for more data
      }
    }
  }

  private async initialize(): Promise<void> {
    const result = await this.sendRequest('initialize', {});
    console.log('MCP initialized:', result);
  }

  private sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin) {
        reject(new Error('MCP process not connected'));
        return;
      }

      const id = ++this.requestId;
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.pendingRequests.set(id, { resolve, reject });
      this.process.stdin.write(JSON.stringify(request) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.sendRequest('tools/call', {
      name,
      arguments: args
    });

    return result as MCPToolResult;
  }

  async listTools(): Promise<Array<{ name: string; description: string }>> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    const result = await this.sendRequest('tools/list', {});
    return (result as { tools: Array<{ name: string; description: string }> }).tools;
  }

  dispose(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.isConnected = false;
  }
}
