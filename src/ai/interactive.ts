import * as readline from "readline";
import chalk from "chalk";
import ora from "ora";
import type { AiModel, ChatMessage } from "../ai/models.js";
import { chat } from "./client.js";

const SYSTEM_PROMPT = `你是Benny Co.的AI编程助手，专为中文开发者服务。

核心能力：
- 回答编程问题，解释代码逻辑
- 代码优化、审查、翻译
- Git工作流建议
- 中文代码风格指导

请用中文回答，保持简洁专业。`;

export async function chatLoop(model: AiModel, messages: ChatMessage[]): Promise<void> {
  messages.push({ role: "system", content: SYSTEM_PROMPT });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  process.stdout.write(chalk.gray("  (输入 exit 退出)\n\n"));

  while (true) {
    const userInput = await question(chalk.blue("你 > "));
    const trimmed = userInput.trim();

    if (!trimmed) continue;
    if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
      console.log(chalk.gray("\n再见！👋\n"));
      rl.close();
      return;
    }

    messages.push({ role: "user", content: trimmed });

    const spinner = ora({ text: chalk.gray("Benny思考中..."), color: "cyan" }).start();
    const start = Date.now();

    try {
      const response = await chat({
        model,
        messages,
        temperature: 0.7,
        maxTokens: 2048,
      }, "chat");

      spinner.stop();

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const tokenInfo = response.usage
        ? chalk.gray(` [${response.usage.totalTokens} tokens, ${elapsed}s]`)
        : chalk.gray(` [${elapsed}s]`);

      console.log(chalk.green("\nBenny > ") + response.content.replace(/\n/g, "\n" + chalk.green("Benny > ")));
      console.log(tokenInfo + "\n");

      messages.push({ role: "assistant", content: response.content });
    } catch (err) {
      spinner.stop();
      console.error(chalk.red(`\n错误: ${(err as Error).message}\n`));
    }
  }
}
