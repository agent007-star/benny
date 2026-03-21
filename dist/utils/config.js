import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import chalk from "chalk";
import * as readline from "readline";
const CONFIG_DIR = path.join(os.homedir(), ".benny");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
export function getConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
        }
    }
    catch {
        // ignore
    }
    return null;
}
export function saveConfig(config) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(chalk.green(`\n✓ 配置已保存到 ${CONFIG_FILE}\n`));
}
export function configFilePath() {
    return CONFIG_FILE;
}
export function question(prompt) {
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
