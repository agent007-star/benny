import * as readline from "readline";
import chalk from "chalk";
import { chat } from "../ai/client.js";
import ora from "ora";
const SYSTEM_PROMPT = `你是Benny Co.的AI编程助手，专为中文开发者服务。

核心能力：
- 回答编程问题，解释代码逻辑
- 代码优化、审查、翻译
- Git工作流建议
- 中文代码风格指导

请用中文回答，保持简洁专业。`;
export async function chatLoop(model, messages) {
    if (!messages.some((m) => m.role === "system")) {
        messages.push({ role: "system", content: SYSTEM_PROMPT });
    }
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    console.log(chalk.gray(`  模型: ${model.name} | 提供商: ${model.provider}\n`));
    console.log(chalk.gray("  输入 exit 退出，clear 清空对话\n"));
    const prompt = () => new Promise((resolve) => {
        rl.question(chalk.blue("👤 你: "), (answer) => resolve(answer));
    });
    while (true) {
        const input = await prompt();
        if (!input.trim() || input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
            console.log(chalk.gray("\n再见！👋\n"));
            rl.close();
            return;
        }
        if (input.toLowerCase() === "clear") {
            messages.length = 1;
            console.log(chalk.gray("对话已清空\n"));
            continue;
        }
        messages.push({ role: "user", content: input });
        const spinner = ora({ text: chalk.gray("Benny思考中..."), color: "cyan" }).start();
        const start = Date.now();
        try {
            const response = await chat({ model, messages, temperature: 0.7, maxTokens: 2048 });
            spinner.stop();
            messages.push({ role: "assistant", content: response.content });
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);
            const tokenInfo = response.usage
                ? chalk.gray(` [${response.usage.totalTokens} tokens, ${elapsed}s]`)
                : chalk.gray(` [${elapsed}s]`);
            console.log(chalk.green("\n🤖 Benny: ") + response.content.replace(/\n/g, "\n" + chalk.green("🤖 Benny: ")));
            console.log(tokenInfo + "\n");
        }
        catch (err) {
            spinner.stop();
            console.error(chalk.red(`\n错误: ${err.message}\n`));
        }
    }
}
