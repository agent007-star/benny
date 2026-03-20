import { Command } from "commander";
import chalk from "chalk";
import { optimizeCode, addChineseComments, reviewCode, translateCode } from "../optimizers/chinese-code.js";
import { reviewChanges, smartCommit, analyzeChanges, createGitWorkflow } from "../git-workflows/index.js";
import { AVAILABLE_MODELS } from "../ai/models.js";
import { getSummary, formatSummary } from "../utils/analytics.js";
import { selectModel, chat } from "../ai/client.js";
import type { ChatMessage } from "../ai/models.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const version = JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json"), "utf-8")).version as string;

const program = new Command();

program
  .name("benny")
  .description("Benny Co. AI代码助手 - 为中文开发者打造的AI编程工具")
  .version(version);

program
  .command("chat")
  .description("交互式AI对话")
  .option("-m, --model <provider>", "选择AI模型提供商", "tongyi")
  .option("-t, --temperature <n>", "温度参数", "0.7")
  .action(async (opts) => {
    const model = selectModel(opts.model);
    console.log(chalk.cyan(`已选择模型: ${model.name} (${model.provider})`));
    console.log(chalk.gray("输入消息与Benny对话，输入 'exit' 退出\n"));

    const messages: ChatMessage[] = [];
    const { chatLoop } = await import("./interactive.js");
    await chatLoop(model, messages);
  });

program
  .command("optimize")
  .description("优化代码（风格、中文注释、命名）")
  .requiredOption("-f, --file <path>", "代码文件路径")
  .option("-s, --style <style>", "代码风格", "general")
  .option("-l, --language <lang>", "编程语言 (auto-detect by default)", "")
  .action(async (opts) => {
    const code = fs.readFileSync(opts.file, "utf-8");
    const language = opts.language || detectLanguage(opts.file);
    console.log(chalk.cyan(`优化 ${path.basename(opts.file)} (${language})...`));
    try {
      const optimized = await optimizeCode(code, language, { style: opts.style as "aliyun" | "baidu" | "tencent" | "general" });
      console.log(chalk.green("\n优化结果:"));
      console.log(optimized);
    } catch (err) {
      console.error(chalk.red(`错误: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("comment")
  .description("为代码添加中文注释")
  .requiredOption("-f, --file <path>", "代码文件路径")
  .option("-l, --language <lang>", "编程语言", "")
  .action(async (opts) => {
    const code = fs.readFileSync(opts.file, "utf-8");
    const language = opts.language || detectLanguage(opts.file);
    console.log(chalk.cyan(`为 ${path.basename(opts.file)} 添加中文注释...`));
    try {
      const commented = await addChineseComments(code, language);
      console.log(chalk.green("\n注释结果:"));
      console.log(commented);
    } catch (err) {
      console.error(chalk.red(`错误: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("review")
  .description("AI代码审查")
  .requiredOption("-f, --file <path>", "代码文件路径")
  .option("-l, --language <lang>", "编程语言", "")
  .action(async (opts) => {
    const code = fs.readFileSync(opts.file, "utf-8");
    const language = opts.language || detectLanguage(opts.file);
    console.log(chalk.cyan("正在进行AI代码审查...\n"));
    try {
      const review = await reviewCode(code, language);
      console.log(review);
    } catch (err) {
      console.error(chalk.red(`错误: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("translate")
  .description("代码语言翻译")
  .requiredOption("-f, --file <path>", "代码文件路径")
  .requiredOption("--from <lang>", "源语言")
  .requiredOption("--to <lang>", "目标语言")
  .action(async (opts) => {
    console.log(chalk.cyan(`翻译 ${opts.file}: ${opts.from} -> ${opts.to}...`));
    const code = fs.readFileSync(opts.file, "utf-8");
    try {
      const translated = await translateCode(code, opts.from, opts.to);
      console.log(chalk.green("\n翻译结果:"));
      console.log(translated);
    } catch (err) {
      console.error(chalk.red(`错误: ${(err as Error).message}`));
      process.exit(1);
    }
  });

const gitCmd = program.command("git").description("Git工作流集成");

gitCmd
  .command("review")
  .description("审查当前暂存的Git变更")
  .option("-d, --dir <path>", "Git仓库目录", ".")
  .action(async (opts) => {
    console.log(chalk.cyan("分析Git变更并进行AI审查...\n"));
    try {
      const git = createGitWorkflow(opts.dir);
      const report = await reviewChanges(git);
      console.log(report);
    } catch (err) {
      console.error(chalk.red(`错误: ${(err as Error).message}`));
      process.exit(1);
    }
  });

gitCmd
  .command("commit")
  .description("智能提交（AI分析变更后提交）")
  .option("-d, --dir <path>", "Git仓库目录", ".")
  .option("-m, --message <msg>", "提交信息", "")
  .action(async (opts) => {
    if (!opts.message) {
      console.error(chalk.red("请提供提交信息: -m <message>"));
      process.exit(1);
    }
    try {
      const git = createGitWorkflow(opts.dir);
      await smartCommit(git, opts.message);
      console.log(chalk.green(`✓ 提交成功: ${opts.message}`));
    } catch (err) {
      console.error(chalk.red(`错误: ${(err as Error).message}`));
      process.exit(1);
    }
  });

gitCmd
  .command("analyze")
  .description("分析当前Git变更统计")
  .option("-d, --dir <path>", "Git仓库目录", ".")
  .action(async (opts) => {
    try {
      const git = createGitWorkflow(opts.dir);
      const analysis = await analyzeChanges(git);
      console.log(chalk.bold("\n## 变更统计\n"));
      console.log(`  分支: ${chalk.cyan(analysis.summary)}`);
      console.log(`  文件: ${analysis.files.length} 个`);
      console.log(`  增行: ${chalk.green(`+${analysis.additions}`)}`);
      console.log(`  删行: ${chalk.red(`-${analysis.deletions}`)}`);
      if (analysis.risks.length > 0) {
        console.log(chalk.yellow("\n  风险提示:"));
        for (const risk of analysis.risks) {
          console.log(`    ⚠️ ${risk}`);
        }
      }
    } catch (err) {
      console.error(chalk.red(`错误: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("models")
  .description("列出可用的AI模型")
  .action(() => {
    console.log(chalk.bold("\n支持的AI模型:\n"));
    for (const m of AVAILABLE_MODELS) {
      console.log(`  ${chalk.cyan(m.provider.padEnd(8))} ${m.name} (${chalk.gray(`$${m.apiKeyEnv}`)})`);
    }
    console.log();
  });

program
  .command("stats")
  .description("查看使用统计和成本分析")
  .option("-d, --days <n>", "统计天数", "30")
  .action((opts) => {
    const days = parseInt(opts.days, 10);
    if (isNaN(days) || days < 1) {
      console.error(chalk.red("请提供有效的天数，例如: benny stats --days 7"));
      process.exit(1);
    }
    const summary = getSummary(days);
    console.log(formatSummary(summary, days));
    console.log();
    if (summary.totalCalls > 0) {
      console.log(chalk.gray(`  数据存储于 ~/.benny/usage.json`));
    }
  });

program.parse(process.argv);

function detectLanguage(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".py": "python",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".cs": "csharp",
    ".rb": "ruby",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".sh": "bash",
    ".sql": "sql",
  };
  return map[ext] ?? "text";
}
