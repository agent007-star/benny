import { Command } from "commander";
import chalk from "chalk";
import { optimizeCode, addChineseComments, reviewCode, translateCode, explainCode } from "../optimizers/chinese-code.js";
import { reviewChanges, smartCommit, analyzeChanges, createGitWorkflow } from "../git-workflows/index.js";
import { AVAILABLE_MODELS } from "../ai/models.js";
import { getSummary, formatSummary } from "../utils/analytics.js";
import { getConfig, saveConfig, question } from "../utils/config.js";
import { selectModel } from "../ai/client.js";
import { compareModels } from "../ai/compare.js";
import {
  formatPlanStatus,
  formatUpgradeOptions,
  activatePlan,
} from "../monetization/billing.js";
import { getCurrentPlan } from "../monetization/usage-tracker.js";
import {
  listSessions,
  loadSession,
  saveSession,
  createSession,
  deleteSession,
  formatSessionList,
} from "../utils/chat-history.js";
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
  .command("init")
  .description("交互式初始化配置")
  .action(async () => {
    console.log(chalk.bold("\n=== Benny Co. 初始化向导 ===\n"));
    console.log(chalk.gray("设置你的 API Key 和默认模型\n"));

    const existing = getConfig();

    const modelChoice = await question(`选择默认模型 (1: 通义qwen-plus, 2: 文心ernie-4.0-8k, 3: Kimi moonshot-v1-128k) [${existing?.defaultModel === "ernie-4.0-8k" ? "2" : existing?.defaultModel === "moonshot-v1-128k" ? "3" : "1"}]: `);
    const choice = modelChoice.trim() || "1";
    const defaultModel = choice === "2" ? "ernie-4.0-8k" : choice === "3" ? "moonshot-v1-128k" : "qwen-plus";

    const config: import("../utils/config.js").BennyConfig = {
      defaultModel,
      apiKeys: {},
      preferences: {},
    };

    if (defaultModel === "qwen-plus") {
      const apiKey = (await question(`通义 API Key (${process.env.TONGYI_API_KEY ? '[已设置，忽略]' : '[未设置，直接回车跳过]'}: `)).trim();
      if (apiKey) config.apiKeys.TONGYI_API_KEY = apiKey;
    } else if (defaultModel === "ernie-4.0-8k") {
      const apiKey = (await question(`文心 API Key (${process.env.WENXIN_API_KEY ? '[已设置，忽略]' : '[未设置，直接回车跳过]'}: `)).trim();
      const secretKey = (await question(`文心 Secret Key (${process.env.WENXIN_SECRET_KEY ? '[已设置，忽略]' : '[未设置，直接回车跳过]'}: `)).trim();
      if (apiKey) config.apiKeys.WENXIN_API_KEY = apiKey;
      if (secretKey) config.apiKeys.WENXIN_SECRET_KEY = secretKey;
    } else {
      const apiKey = (await question(`Kimi API Key (${process.env.KIMI_API_KEY ? '[已设置，忽略]' : '[未设置，直接回车跳过]'}: `)).trim();
      if (apiKey) config.apiKeys.KIMI_API_KEY = apiKey;
    }

    saveConfig(config);

    const { formatPlanStatus } = await import("../monetization/billing.js");

    console.log(chalk.green("\n✓ 初始化完成！\n"));
    console.log(chalk.gray("你的 Benny 计划:"));
    process.stdout.write(formatPlanStatus());
    console.log(chalk.cyan("\n开始使用:\n"));
    console.log(chalk.cyan("  benny chat                          # 开始对话"));
    console.log(chalk.cyan("  benny models                        # 查看可用模型"));
    console.log(chalk.cyan("  benny plan                          # 查看计划状态"));
    console.log(chalk.cyan("  benny upgrade                       # 查看升级选项\n"));
  });

program
  .command("chat")
  .description("交互式AI对话")
  .option("-m, --model <provider>", "选择AI模型提供商", "tongyi")
  .option("-t, --temperature <n>", "温度参数", "0.7")
  .option("--no-stream", "禁用流式输出")
  .option("-s, --session <id>", "加载指定会话")
  .option("--new", "创建新会话")
  .action(async (opts) => {
    const config = getConfig();
    const model = (config?.defaultModel)
      ? AVAILABLE_MODELS.find((m) => m.name === config.defaultModel) ?? selectModel(opts.model)
      : selectModel(opts.model);

    let session = opts.session ? loadSession(opts.session) : null;
    if (!session || opts.new) {
      session = createSession(model.name, model.provider);
    }

    console.log(chalk.cyan(`已选择模型: ${model.name} (${model.provider})`));
    if (session.messages.length > 0) {
      const userMsgs = session.messages.filter((m) => m.role === "user").length;
      console.log(chalk.gray(`已加载会话: ${session.title} (${userMsgs}条消息)\n`));
    } else {
      console.log(chalk.gray("新会话\n"));
    }

    const { chatLoop } = await import("./interactive.js");
    await chatLoop(model, session.messages, opts.stream !== false, session);
    saveSession(session);
  });

program
  .command("history")
  .description("查看和管理对话历史")
  .option("-d, --delete <id>", "删除指定会话")
  .option("-c, --clear", "删除所有历史")
  .action((opts) => {
    if (opts.clear) {
      for (const s of listSessions(100)) {
        deleteSession(s.id);
      }
      console.log(chalk.green("已清空所有对话历史\n"));
      return;
    }
    if (opts.delete) {
      if (deleteSession(opts.delete)) {
        console.log(chalk.green(`已删除会话 ${opts.delete}\n`));
      } else {
        console.log(chalk.red(`未找到会话 ${opts.delete}\n`));
      }
      return;
    }
    const sessions = listSessions(20);
    console.log(chalk.bold("\n=== Benny 对话历史 ===\n"));
    console.log(formatSessionList(sessions));
    console.log(chalk.gray("\n  使用 benny chat --session <id> 加载会话"));
    console.log(chalk.gray("  使用 benny history --delete <id> 删除会话\n"));
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
  .command("explain")
  .description("AI代码解释（中文教学）")
  .requiredOption("-f, --file <path>", "代码文件路径")
  .option("-l, --language <lang>", "编程语言", "")
  .action(async (opts) => {
    const code = fs.readFileSync(opts.file, "utf-8");
    const language = opts.language || detectLanguage(opts.file);
    console.log(chalk.cyan(`正在解释 ${path.basename(opts.file)} (${language})...\n`));
    try {
      const explanation = await explainCode(code, language);
      console.log(explanation);
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

const mcpCmd = program.command("mcp").description("MCP Server 工具");

mcpCmd
  .command("start")
  .description("启动 MCP Server (Model Context Protocol)")
  .action(() => {
    console.log(chalk.cyan("Benny MCP Server 使用说明:"));
    console.log("  运行: node dist/mcp/server.js");
    console.log("  MCP Server 通过 stdio 接收 JSON-RPC 请求");
  });

mcpCmd
  .command("tools")
  .description("列出 MCP Server 支持的所有工具")
  .action(() => {
    console.log(chalk.bold("\nBenny MCP Server 工具列表:\n"));
    console.log("  " + chalk.cyan("optimize_code") + "        优化代码（风格、中文注释、命名）");
    console.log("  " + chalk.cyan("review_code") + "          AI 代码审查");
    console.log("  " + chalk.cyan("add_chinese_comments") + "  添加中文注释");
    console.log("  " + chalk.cyan("translate_code") + "       代码语言翻译");
    console.log("  " + chalk.cyan("analyze_git_changes") + "  分析 Git 变更");
    console.log("  " + chalk.cyan("get_available_models") + " 查看可用模型\n");
    console.log(chalk.gray("使用 MCP 客户端连接 stdio 进行交互。\n"));
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

program
  .command("compare")
  .description("对比多个AI模型的回答")
  .argument("<prompt>", "要提问的内容或代码")
  .option("-m, --model <names>", "指定模型（逗号分隔或'all'）", "all")
  .option("-t, --temperature <n>", "温度参数", "0.7")
  .option("-s, --system <text>", "系统提示词")
  .action(async (prompt, opts) => {
    console.log(chalk.bold("\n=== Benny 模型对比 ===\n"));
    console.log(chalk.gray(`问题: ${prompt}\n`));

    const modelsToUse = opts.model === "all"
      ? AVAILABLE_MODELS
      : AVAILABLE_MODELS.filter((m) => opts.model.split(",").map((s: string) => s.trim()).includes(m.provider));

    if (modelsToUse.length === 0) {
      console.error(chalk.red("未找到指定的模型。使用 --model all 或指定 provider (tongyi,wenxin,kimi)。"));
      process.exit(1);
    }

    const { default: createOra } = await import("ora");
    const spinner = createOra({ text: "正在对比模型...", spinner: "dots" }).start();

    try {
      const results = await compareModels(prompt, opts.system);

      spinner.succeed("对比完成!\n");

      for (const result of results) {
        const status = result.error ? chalk.red("[错误]") : chalk.green("[成功]");
        console.log(chalk.bold(`\n--- ${result.provider} / ${result.model} ${status}`));
        if (!result.error) {
          console.log(chalk.gray(`  耗时: ${result.time}ms | Token: ${result.tokens}\n`));
          const lines = result.content.split("\n");
          const preview = lines.length > 15 ? lines.slice(0, 15).join("\n") + "\n  ..." : result.content;
          console.log(`  ${preview}`);
        } else {
          console.log(`  ${chalk.red(result.error)}`);
        }
      }
      console.log();
    } catch (err) {
      spinner.fail("对比失败");
      console.error(chalk.red(`错误: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program
  .command("plan")
  .description("查看当前计划状态和配额")
  .option("-a, --activate <tier>", "激活指定计划 (free|pro|team|enterprise)")
  .action((opts) => {
    if (opts.activate) {
      activatePlan(opts.activate);
    } else {
      process.stdout.write(formatPlanStatus());
    }
  });

program
  .command("upgrade")
  .description("查看升级选项")
  .action(() => {
    const current = getCurrentPlan();
    process.stdout.write(formatUpgradeOptions(current));
  });

program
  .command("status")
  .description("查看 Benny 状态（计划 + 使用量）")
  .action(() => {
    process.stdout.write(formatPlanStatus());
    const summary = getSummary(30);
    if (summary.totalCalls > 0) {
      console.log(chalk.bold("\n=== 最近 30 天使用 ===\n"));
      console.log(`  API 调用: ${summary.totalCalls}`);
      console.log(`  Tokens:   ${(summary.totalInputTokens + summary.totalOutputTokens).toLocaleString()}`);
      console.log(`  成本:     $${summary.totalCostCents.toFixed(2)}\n`);
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
