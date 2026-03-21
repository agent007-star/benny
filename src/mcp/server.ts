#!/usr/bin/env node
import { chat, FriendlyError } from "../ai/client.js";
import type { ChatRequest, ChatMessage } from "../ai/models.js";
import { AVAILABLE_MODELS } from "../ai/models.js";
import { getConfig } from "../utils/config.js";
import * as path from "path";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const TOOLS: McpTool[] = [
  {
    name: "optimize_code",
    description: "Optimize code with AI. Adds Chinese comments, improves naming, fixes style. Supports: TypeScript, JavaScript, Python, Go, Rust, Java, C++, and more.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "The source code to optimize" },
        language: { type: "string", description: "Programming language (auto-detected if empty)", enum: ["typescript", "javascript", "python", "go", "rust", "java", "cpp", "c", "csharp", "ruby", "php", "swift", "kotlin", "bash", "sql"] },
        style: { type: "string", description: "Code style preset", enum: ["general", "aliyun", "baidu", "tencent"], default: "general" },
      },
      required: ["code"],
    },
  },
  {
    name: "review_code",
    description: "AI-powered code review. Analyzes code for bugs, security issues, performance problems, and best practice violations. Returns detailed review report in Chinese.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "The source code to review" },
        language: { type: "string", description: "Programming language" },
      },
      required: ["code"],
    },
  },
  {
    name: "add_chinese_comments",
    description: "Add Chinese comments to source code. Preserves all original code logic, only adds comments.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "The source code to add comments to" },
        language: { type: "string", description: "Programming language" },
      },
      required: ["code"],
    },
  },
  {
    name: "translate_code",
    description: "Translate source code from one programming language to another. Preserves logic and structure.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "The source code to translate" },
        from: { type: "string", description: "Source language" },
        to: { type: "string", description: "Target language" },
      },
      required: ["code", "from", "to"],
    },
  },
  {
    name: "analyze_git_changes",
    description: "Analyze uncommitted Git changes in a repository. Returns statistics (additions, deletions, file count) and risk analysis.",
    inputSchema: {
      type: "object",
      properties: {
        repo_path: { type: "string", description: "Path to the Git repository (default: current directory)", default: "." },
      },
    },
  },
  {
    name: "get_available_models",
    description: "List all available AI models that Benny supports.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

function detectLanguageFromContent(code: string): string {
  if (/^\s*import\s+.*from\s+['"][^'"]+['"]/m.test(code) && (code.includes(": ") || code.includes("const ") || code.includes("let "))) return "typescript";
  if (/def\s+\w+\s*\(/m.test(code) && !code.includes("func ")) return "python";
  if (/func\s+\w+\s*\(/m.test(code) || /package\s+\w+/m.test(code)) return "go";
  if (/fn\s+\w+\s*\(/m.test(code) || /let\s+mut\s+\w+/m.test(code)) return "rust";
  if (/public\s+(static\s+)?(void|class|interface)/m.test(code) || /System\.out\.println/m.test(code)) return "java";
  if (/#include\s*</m.test(code) || /int\s+main\s*\(/m.test(code)) return "cpp";
  return "text";
}

function detectLanguage(filename: string, code: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".ts": "typescript", ".tsx": "typescript",
    ".js": "javascript", ".jsx": "javascript",
    ".py": "python", ".go": "go", ".rs": "rust",
    ".java": "java", ".cpp": "cpp", ".c": "c",
    ".cs": "csharp", ".rb": "ruby", ".php": "php",
    ".swift": "swift", ".kt": "kotlin",
    ".sh": "bash", ".sql": "sql",
  };
  if (map[ext]) return map[ext];
  return detectLanguageFromContent(code);
}

async function callTool(name: string, args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
  const config = getConfig();
  const model = config?.defaultModel
    ? AVAILABLE_MODELS.find((m) => m.name === config.defaultModel) ?? AVAILABLE_MODELS[0]
    : AVAILABLE_MODELS[0];

  if (name === "get_available_models") {
    const lines = AVAILABLE_MODELS.map(m => `• ${m.provider}: ${m.name}`).join("\n");
    return { content: [{ type: "text", text: `支持的 AI 模型:\n${lines}` }] };
  }

  if (name === "analyze_git_changes") {
    try {
      const simpleGit = (await import("simple-git")).default;
      const git = simpleGit(args.repo_path as string || ".");
      const diff = await git.diff(["--stat"]);
      const status = await git.status();
      return {
        content: [{
          type: "text",
          text: `Git 变更分析:\n${diff}\n当前分支: ${status.current}\n暂存文件: ${status.staged.length} 个\n未暂存: ${status.modified.length} 个`,
        }],
      };
    } catch {
      return { content: [{ type: "text", text: "无法读取 Git 仓库。请确保当前目录是 Git 仓库。" }] };
    }
  }

  const code = args.code as string;
  const language = (args.language as string) || detectLanguage("code.txt", code);
  const style = (args.style as string) || "general";

  const systemPrompt = name === "optimize_code"
    ? `你是一个代码优化助手，遵循 ${style} 风格。用户会提供一段 ${language} 代码，请优化它：添加中文注释、改善命名、提高可读性、修复明显的风格问题。只返回优化后的代码，不要解释。`
    : name === "review_code"
    ? `你是一个高级代码审查员。请审查以下 ${language} 代码，从以下维度分析：\n1. Bug 和逻辑错误\n2. 安全漏洞\n3. 性能问题\n4. 代码风格和可读性\n5. 最佳实践\n\n请用中文输出详细的审查报告。格式：\n## 总体评价\n## 发现的问题\n## 改进建议`
    : name === "add_chinese_comments"
    ? `你是一个代码注释助手。请为以下 ${language} 代码添加中文注释，解释关键逻辑。只返回带注释的代码，不要其他内容。`
    : `你是一个代码翻译助手。请将以下代码从 ${args.from} 翻译到 ${args.to}。只返回翻译后的代码，不要解释。`;

  const userContent = name === "translate_code"
    ? `请将以下代码翻译为 ${args.to}：\n\n${code}`
    : code;

  try {
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    const request: ChatRequest = { model, messages, temperature: 0.7 };
    const response = await chat(request, name);
    return { content: [{ type: "text", text: response.content }] };
  } catch (err) {
    if (err instanceof FriendlyError) {
      return { content: [{ type: "text", text: `错误: ${err.message} (${err.code})` }] };
    }
    return { content: [{ type: "text", text: `错误: ${(err as Error).message}` }] };
  }
}

async function handleRequest(req: JsonRpcRequest): Promise<JsonRpcResponse> {
  const { id, method, params } = req;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "benny-mcp", version: "0.1.0" },
      },
    };
  }

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  }

  if (method === "tools/call") {
    const toolName = params?.name as string;
    const toolArgs = (params?.arguments as Record<string, unknown>) || {};
    try {
      const result = await callTool(toolName, toolArgs);
      return { jsonrpc: "2.0", id, result };
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: `Tool error: ${(err as Error).message}` },
      };
    }
  }

  if (method === "notifications/initialized") {
    return { jsonrpc: "2.0", id: 0 };
  }

  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

async function main() {
  let buffer = "";

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    buffer += line + "\n";

    try {
      const req = JSON.parse(buffer) as JsonRpcRequest;
      buffer = "";
      const response = await handleRequest(req);
      process.stdout.write(JSON.stringify(response) + "\n");
    } catch {
      // wait for more data
    }
  }
}

main().catch((err) => {
  process.stderr.write(`MCP server error: ${err.message}\n`);
  process.exit(1);
});
