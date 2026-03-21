import * as readline from "readline";
import chalk from "chalk";
import ora from "ora";
import { streamChat, chat } from "../ai/client.js";
import { PlanLimitError } from "../monetization/usage-tracker.js";
const SYSTEM_PROMPT = `你是Benny Co.的AI编程助手，专为中文开发者服务。

核心能力：
- 回答编程问题，解释代码逻辑
- 代码优化、审查、翻译
- Git工作流建议
- 中文代码风格指导

请用中文回答，保持简洁专业。`;
export async function chatLoop(model, messages, streaming = true, session) {
    if (!messages.some((m) => m.role === "system")) {
        messages.push({ role: "system", content: SYSTEM_PROMPT });
    }
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    console.log(chalk.gray(`  模型: ${model.name} | 提供商: ${model.provider} | 流式: ${streaming ? "开启" : "关闭"}\n`));
    console.log(chalk.gray("  输入 exit 退出，clear 清空对话\n"));
    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));
    while (true) {
        const input = await question(chalk.blue("你: "));
        if (!input.trim() || input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
            if (session && messages.length > 0) {
                console.log(chalk.gray(`\n对话已保存。加载: benny chat --session ${session.id}\n`));
            }
            else {
                console.log(chalk.gray("\n再见！\n"));
            }
            rl.close();
            return;
        }
        if (input.toLowerCase() === "clear") {
            messages.length = 1;
            console.log(chalk.gray("对话已清空\n"));
            continue;
        }
        messages.push({ role: "user", content: input });
        const start = Date.now();
        try {
            if (streaming && model.provider !== "wenxin") {
                process.stdout.write(chalk.green("\nBenny: "));
                let fullContent = "";
                let usage;
                await streamChat({ model, messages, temperature: 0.7, maxTokens: 2048 }, (chunk) => {
                    if (!chunk.done) {
                        process.stdout.write(chunk.content);
                        fullContent += chunk.content;
                    }
                    else if (chunk.usage) {
                        usage = chunk.usage;
                    }
                });
                messages.push({ role: "assistant", content: fullContent });
                const elapsed = ((Date.now() - start) / 1000).toFixed(1);
                const tokenInfo = usage
                    ? chalk.gray(`\n\n[${usage.totalTokens} tokens, ${elapsed}s]\n`)
                    : chalk.gray(`\n\n[${elapsed}s]\n`);
                process.stdout.write(tokenInfo);
            }
            else {
                const spinner = ora({ text: chalk.gray("Benny思考中..."), color: "cyan" });
                spinner.start();
                const response = await chat({ model, messages, temperature: 0.7, maxTokens: 2048 });
                spinner.stop();
                messages.push({ role: "assistant", content: response.content });
                const elapsed = ((Date.now() - start) / 1000).toFixed(1);
                const tokenInfo = response.usage
                    ? chalk.gray(` [${response.usage.totalTokens} tokens, ${elapsed}s]`)
                    : chalk.gray(` [${elapsed}s]`);
                console.log(chalk.green("\nBenny: ") + response.content.replace(/\n/g, "\n" + chalk.green("Benny: ")));
                console.log(tokenInfo + "\n");
            }
        }
        catch (err) {
            if (err instanceof PlanLimitError) {
                console.error(chalk.red(`\n${err.message}\n`));
                console.log(chalk.cyan("  查看升级选项: benny upgrade\n"));
            }
            else {
                console.error(chalk.red(`\n错误: ${err.message}\n`));
            }
        }
    }
}
