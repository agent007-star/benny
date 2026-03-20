import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import chalk from "chalk";
import * as readline from "readline";

const CONFIG_DIR = path.join(os.homedir(), ".benny");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export interface BennyConfig {
  defaultModel: string;
  apiKeys: {
    TONGYI_API_KEY?: string;
    WENXIN_API_KEY?: string;
    WENXIN_SECRET_KEY?: string;
    KIMI_API_KEY?: string;
  };
  preferences: {
    temperature?: number;
    maxTokens?: number;
  };
}

export function getConfig(): BennyConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) as BennyConfig;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveConfig(config: BennyConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(chalk.green(`\n✓ 配置已保存到 ${CONFIG_FILE}\n`));
}

export function configFilePath(): string {
  return CONFIG_FILE;
}

export function question(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(chalk.blue(prompt), (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
