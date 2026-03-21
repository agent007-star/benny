import { chat, selectModel } from "../ai/client.js";
import { ChatMessage } from "../ai/models.js";

export interface OptimizeOptions {
  style: "aliyun" | "baidu" | "tencent" | "general";
  addComments: boolean;
  fixNaming: boolean;
}

export async function optimizeCode(
  code: string,
  language: string,
  options: Partial<OptimizeOptions> = {}
): Promise<string> {
  const opts: OptimizeOptions = {
    style: "general",
    addComments: true,
    fixNaming: true,
    ...options,
  };

  const styleInstructions: Record<string, string> = {
    aliyun: "遵循阿里云/通义代码风格：简洁务实，重视可读性，使用中文注释。",
    baidu: "遵循百度代码风格：工程化优先，模块化清晰，中文注释规范。",
    tencent: "遵循腾讯代码风格：高效务实，重视性能，注释简洁明了。",
    general: "代码风格：简洁清晰，中文注释，变量命名直观易懂。",
  };

  const model = selectModel();
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `你是Benny Co.的中文代码优化助手。你的任务是优化用户提供的代码。

优化原则：
1. ${styleInstructions[opts.style]}
2. 变量命名使用中文拼音或英文，保持一致性
3. 添加必要的注释说明关键逻辑
4. 保持代码功能不变
5. 优化代码结构和可读性

请直接返回优化后的代码，不要解释。`,
    },
    {
      role: "user",
      content: `优化以下${language}代码：\n\n\`\`\`${language}\n${code}\n\`\`\``,
    },
  ];

  const response = await chat({ model, messages, temperature: 0.3 }, "optimize");
  return extractCodeBlock(response.content, language);
}

export async function addChineseComments(
  code: string,
  language: string
): Promise<string> {
  const model = selectModel();
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "你是一个中文代码注释助手。请为代码添加中文注释，解释关键逻辑。直接返回带注释的代码，不要额外说明。",
    },
    {
      role: "user",
      content: `为以下${language}代码添加中文注释：\n\n\`\`\`${language}\n${code}\n\`\`\``,
    },
  ];

  const response = await chat({ model, messages, temperature: 0.3 }, "comment");
  return extractCodeBlock(response.content, language);
}

export async function reviewCode(
  code: string,
  language: string
): Promise<string> {
  const model = selectModel();
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `你是Benny Co.的代码审查助手。使用中文审查代码问题，包括：
1. 潜在bug和安全风险
2. 代码风格问题
3. 性能优化建议
4. 可读性改进

格式：使用markdown列表，分四个部分。`,
    },
    {
      role: "user",
      content: `审查以下${language}代码：\n\n\`\`\`${language}\n${code}\n\`\`\``,
    },
  ];

  const response = await chat({ model, messages, temperature: 0.5, maxTokens: 2048 }, "review");
  return response.content;
}

export async function translateCode(
  code: string,
  fromLang: string,
  toLang: string
): Promise<string> {
  const model = selectModel();
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `你是一个代码翻译助手。将代码从${fromLang}翻译到${toLang}，保持逻辑和功能不变。直接返回翻译后的代码，不要解释。`,
    },
    {
      role: "user",
      content: `翻译代码从${fromLang}到${toLang}：\n\n\`\`\`${fromLang}\n${code}\n\`\`\``,
    },
  ];

  const response = await chat({ model, messages, temperature: 0.3 }, "translate");
  return extractCodeBlock(response.content, toLang);
}

function extractCodeBlock(content: string, _language: string): string {
  const match = content.match(/```(?:\w+)?\n([\s\S]*?)```/);
  if (match) return match[1].trim();
  return content.trim();
}

export async function explainCode(code: string, language: string): Promise<string> {
  const model = selectModel();
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "你是一个代码导师。用简洁的中文解释代码逻辑，包括：1) 整体功能概述 2) 关键逻辑解释 3) 重要的设计模式或算法 4) 对初学者友好的建议。使用markdown格式，适当使用代码块。",
    },
    {
      role: "user",
      content: `解释以下${language}代码：\n\n\`\`\`${language}\n${code}\n\`\`\``,
    },
  ];

  const response = await chat({ model, messages, temperature: 0.3 }, "explain");
  return response.content;
}
