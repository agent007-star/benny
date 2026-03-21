import chalk from "chalk";
import { execSync } from "child_process";
import { PLANS, formatPlan, type PlanTier } from "./plans.js";
import {
  getMonthlyUsage,
  getCurrentPlan,
  setPlan,
  resetBillingCycle,
} from "./usage-tracker.js";

const KOFI_BASE = "https://ko-fi.com";
const UPGRADE_LINKS: Record<string, string> = {
  pro: `${KOFI_BASE}/bennyco/shop/benny-pro`,
  team: `${KOFI_BASE}/bennyco/shop/benny-team`,
  enterprise: `${KOFI_BASE}/bennyco/shop/benny-enterprise`,
};

export function formatPlanStatus(): string {
  const { used, limit, plan } = getMonthlyUsage();
  const p = PLANS[plan];

  const lines: string[] = [];
  lines.push(chalk.bold("\n=== Benny Plan 状态 ===\n"));

  const tierColors: Record<PlanTier, (s: string) => string> = {
    free: chalk.gray,
    pro: chalk.cyan,
    team: chalk.green,
    enterprise: chalk.magenta,
  };

  const tierColor = tierColors[plan] ?? chalk.white;
  lines.push(`  计划: ${tierColor(p.name)}`);

  if (p.priceMonthly === 0) {
    lines.push(`  价格: ${chalk.green("免费")}`);
  } else if (p.priceMonthly > 0) {
    lines.push(`  价格: ${chalk.cyan(`$${p.priceMonthly}/月`)}`);
  } else {
    lines.push(`  价格: ${chalk.magenta("企业定制")}`);
  }

  if (p.tokenLimitMonthly > 0) {
    const pct = Math.min(100, Math.round((used / limit) * 100));
    const barLen = 20;
    const filled = Math.round((barLen * pct) / 100);
    const bar = "█".repeat(filled) + "░".repeat(barLen - filled);
    const colorFn = pct >= 90 ? chalk.red : pct >= 70 ? chalk.yellow : chalk.green;
    lines.push(`\n  配额: ${colorFn(bar)} ${pct}%`);
    lines.push(`       ${used.toLocaleString()} / ${limit.toLocaleString()} tokens`);
    const remaining = Math.max(0, limit - used);
    lines.push(`       剩余: ${(remaining / 1000).toFixed(0)}k tokens`);
  } else {
    lines.push(`\n  配额: ${chalk.green("∞ 无限")}`);
  }

  lines.push(chalk.bold("\n\n=== 功能 ===\n"));
  for (const feat of p.features) {
    lines.push(`  ${chalk.green("✓")} ${feat}`);
  }

  const nextTier = plan === "free" ? "pro" : plan === "pro" ? "team" : null;
  if (nextTier) {
    lines.push(chalk.bold("\n\n=== 升级建议 ===\n"));
    const next = PLANS[nextTier];
    lines.push(`  ${chalk.cyan("→")} 升级到 ${next.name}: ${formatPlan(next)}`);
    lines.push(`    运行 ${chalk.green("benny upgrade")} 查看详细`);
  }

  lines.push("");
  return lines.join("\n");
}

export function formatUpgradeOptions(currentTier: PlanTier): string {
  const lines: string[] = [];
  lines.push(chalk.bold("\n=== Benny 升级计划 ===\n"));
  lines.push(chalk.gray("  所有付费计划包含当前计划的全部功能\n"));

  const tiers: PlanTier[] = ["pro", "team", "enterprise"];
  for (const tier of tiers) {
    const p = PLANS[tier];
    const isCurrent = tier === currentTier;
    const isDowngrade = tiers.indexOf(tier) <= tiers.indexOf(currentTier);

    lines.push(chalk.bold(`\n【 ${p.name} 】`));
    if (isCurrent) {
      lines.push(chalk.green("  ✓ 当前计划"));
    } else if (isDowngrade) {
      lines.push(chalk.gray(`  (已解锁更高计划)`));
    }
    lines.push(`  价格: ${p.priceMonthly > 0 ? chalk.cyan(`$${p.priceMonthly}/月`) : chalk.magenta("企业定制")}`);

    const tokens = p.tokenLimitMonthly < 0 ? "无限制" : `${(p.tokenLimitMonthly / 1000).toLocaleString()}k tokens/月`;
    lines.push(`  配额: ${tokens}`);

    for (const feat of p.features) {
      const prefix = isCurrent ? chalk.gray("  · ") : chalk.green("  · ");
      lines.push(`${prefix}${feat}`);
    }

    if (!isCurrent && UPGRADE_LINKS[tier]) {
      lines.push(chalk.cyan(`\n  → 支持链接: ${UPGRADE_LINKS[tier]}`));
    }
    lines.push("");
  }

  lines.push(chalk.gray("  付款后运行以下命令激活:\n"));
  lines.push(chalk.green("    benny plan --activate <tier>\n"));
  lines.push(chalk.gray("  或使用: benny upgrade --open <tier> 直接打开付款页面\n"));

  return lines.join("\n");
}

export async function activatePlan(tierArg: string): Promise<void> {
  const tierMap: Record<string, PlanTier> = {
    free: "free", pro: "pro", team: "team", enterprise: "enterprise",
  };
  const tier = tierMap[tierArg.toLowerCase()];
  if (!tier) {
    console.error(chalk.red(`无效的计划: ${tierArg}。可用: free, pro, team, enterprise`));
    process.exit(1);
  }

  const current = getCurrentPlan();
  setPlan(tier);
  resetBillingCycle();

  if (tier !== current) {
    console.log(chalk.green(`\n✓ 计划已更新: ${PLANS[current].name} → ${PLANS[tier].name}`));
    console.log(chalk.gray("  配额已重置，请重新运行命令。\n"));
  } else {
    console.log(chalk.gray(`\n  已经是 ${PLANS[tier].name} 计划。\n`));
  }
}

export function openUpgradeLink(tier: string): void {
  const link = UPGRADE_LINKS[tier.toLowerCase()];
  if (!link) {
    console.error(chalk.red(`无效的计划: ${tier}。可用: pro, team, enterprise`));
    return;
  }

  console.log(chalk.cyan(`\n正在打开 ${tier} 计划付款页面...\n`));
  console.log(chalk.gray(`  ${link}\n`));

  const platform = process.platform;
  let command: string;
  if (platform === "darwin") {
    command = `open "${link}"`;
  } else if (platform === "win32") {
    command = `start "" "${link}"`;
  } else {
    command = `xdg-open "${link}"`;
  }

  try {
    execSync(command, { stdio: "ignore" });
    console.log(chalk.green("✓ 已打开浏览器\n"));
  } catch {
    console.log(chalk.yellow("无法自动打开浏览器，请手动访问上述链接\n"));
  }
}
