import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getConfig } from "./config.js";

const CONFIG_DIR = path.join(os.homedir(), ".benny");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const HISTORY_FILE = path.join(os.homedir(), ".benny", "history.json");

export interface DoctorResult {
  node: boolean;
  version: string;
  config: boolean;
  configPath: string;
  apiKeys: {
    tongyi: boolean;
    wenxin: boolean;
    kimi: boolean;
  };
  history: boolean;
  ready: boolean;
}

export function runDoctor(): DoctorResult {
  const result: DoctorResult = {
    node: true,
    version: process.version,
    config: false,
    configPath: CONFIG_FILE,
    apiKeys: { tongyi: false, wenxin: false, kimi: false },
    history: false,
    ready: false,
  };

  const config = getConfig();

  result.config = config !== null;
  if (config) {
    result.apiKeys.tongyi = !!config.apiKeys.TONGYI_API_KEY;
    result.apiKeys.wenxin = !!(config.apiKeys.WENXIN_API_KEY && config.apiKeys.WENXIN_SECRET_KEY);
    result.apiKeys.kimi = !!config.apiKeys.KIMI_API_KEY;
  }

  result.apiKeys.tongyi = result.apiKeys.tongyi || !!process.env.TONGYI_API_KEY;
  result.apiKeys.kimi = result.apiKeys.kimi || !!process.env.KIMI_API_KEY;

  if (process.env.WENXIN_API_KEY && process.env.WENXIN_SECRET_KEY) {
    result.apiKeys.wenxin = true;
  }

  result.history = fs.existsSync(HISTORY_FILE);

  const hasAnyKey = result.apiKeys.tongyi || result.apiKeys.wenxin || result.apiKeys.kimi;
  result.ready = result.config && hasAnyKey;

  return result;
}

export function formatDoctorOutput(result: DoctorResult): string {
  const lines: string[] = [];

  lines.push(chalk.bold("\n=== Benny 环境诊断 ===\n"));

  lines.push(chalk.bold("  环境"));
  lines.push(`  ${checkIcon(result.node)} Node.js: ${result.version}`);

  lines.push(chalk.bold("\n  配置文件"));
  lines.push(`  ${checkIcon(result.config)} 配置目录: ${CONFIG_DIR}`);
  lines.push(`  ${checkIcon(result.config)} 配置文件: ${result.configPath}`);

  lines.push(chalk.bold("\n  API Key"));
  const envPrefix = "    ";
  lines.push(`${envPrefix}${checkIcon(result.apiKeys.tongyi)} 通义 (TONGYI_API_KEY): ${result.apiKeys.tongyi ? chalk.green("已配置") : chalk.red("未配置")}`);
  lines.push(`${envPrefix}${checkIcon(result.apiKeys.wenxin)} 文心 (WENXIN_API_KEY + WENXIN_SECRET_KEY): ${result.apiKeys.wenxin ? chalk.green("已配置") : chalk.red("未配置")}`);
  lines.push(`${envPrefix}${checkIcon(result.apiKeys.kimi)} Kimi (KIMI_API_KEY): ${result.apiKeys.kimi ? chalk.green("已配置") : chalk.red("未配置")}`);

  if (!result.apiKeys.tongyi && !result.apiKeys.wenxin && !result.apiKeys.kimi) {
    lines.push(chalk.yellow("\n  ⚠️  没有检测到任何 API Key！"));
    lines.push(chalk.yellow("  运行 ") + chalk.cyan("benny init") + chalk.yellow(" 或手动配置 ~/.benny/config.json"));
  }

  lines.push(chalk.bold("\n  数据"));
  lines.push(`  ${checkIcon(result.history)} 对话历史: ${result.history ? "已启用" : "未启用"}`);

  lines.push(chalk.bold("\n  就绪状态"));
  if (result.ready) {
    lines.push(chalk.green("  ✓ Benny 已就绪！运行 ") + chalk.cyan("benny chat") + chalk.green(" 开始对话"));
  } else {
    lines.push(chalk.red("  ✗ Benny 未就绪"));
    lines.push(chalk.gray("  运行 ") + chalk.cyan("benny init") + chalk.gray(" 完成初始配置"));
  }

  lines.push("");
  return lines.join("\n");
}

function checkIcon(pass: boolean): string {
  return pass ? chalk.green("✓") : chalk.red("✗");
}
