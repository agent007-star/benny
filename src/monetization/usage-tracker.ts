import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import chalk from "chalk";
import { PLANS, type PlanTier } from "./plans.js";
import { getSummary } from "../utils/analytics.js";

const BENNY_DIR = path.join(os.homedir(), ".benny");
const USER_FILE = path.join(BENNY_DIR, "user.json");

export interface UserState {
  plan: PlanTier;
  userId: string;
  billingCycleStart: string;
  totalOverageTokens: number;
  billingEmail?: string;
  upgradeLinks?: {
    pro: string;
    team: string;
    enterprise: string;
  };
}

function loadUserState(): UserState {
  try {
    if (fs.existsSync(USER_FILE)) {
      return JSON.parse(fs.readFileSync(USER_FILE, "utf-8")) as UserState;
    }
  } catch {
    // ignore
  }
  return {
    plan: "free",
    userId: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    billingCycleStart: new Date().toISOString(),
    totalOverageTokens: 0,
  };
}

function saveUserState(state: UserState): void {
  fs.mkdirSync(BENNY_DIR, { recursive: true });
  fs.writeFileSync(USER_FILE, JSON.stringify(state, null, 2));
}

function getBillingPeriodStart(): Date {
  const state = loadUserState();
  const start = new Date(state.billingCycleStart);
  const now = new Date();
  while (start < now) {
    start.setMonth(start.getMonth() + 1);
  }
  const periodStart = new Date(start);
  periodStart.setMonth(periodStart.getMonth() - 1);
  return periodStart;
}

export function getMonthlyUsage(): { used: number; limit: number; plan: PlanTier } {
  const state = loadUserState();
  const periodStart = getBillingPeriodStart();
  const summary = getSummary();
  const stateStart = new Date(state.billingCycleStart);

  const cutoff = stateStart > periodStart ? stateStart : periodStart;
  const records = summary.recentRecords.filter(
    (r) => new Date(r.timestamp) >= cutoff
  );
  const used = records.reduce((s, r) => s + r.totalTokens, 0);

  const plan = PLANS[state.plan];
  const limit = plan.tokenLimitMonthly;

  return { used, limit, plan: state.plan };
}

export class PlanLimitError extends Error {
  constructor(
    public readonly used: number,
    public readonly limit: number,
    public readonly plan: PlanTier,
    public readonly overageCost: number
  ) {
    const pct = Math.round((used / limit) * 100);
    super(
      `本月使用量已达 ${pct}% (${used.toLocaleString()}/${limit.toLocaleString()} tokens)\n` +
      `你的计划: ${PLANS[plan].name} (${plan === "free" ? "免费" : `$${PLANS[plan].priceMonthly}/月`})\n` +
      `超额费用: $${overageCost.toFixed(2)}/1k tokens\n\n` +
      `运行 'benny upgrade' 升级计划，或等待下月配额重置。`
    );
    this.name = "PlanLimitError";
  }
}

export function checkLimit(additionalTokens: number = 5000): void {
  const { used, limit, plan } = getMonthlyUsage();
  const p = PLANS[plan];

  if (p.tokenLimitMonthly < 0) return;

  const remaining = p.tokenLimitMonthly - used;
  if (remaining < 0) {
    const overageCost = (additionalTokens / 1000) * p.pricePerOverage;
    throw new PlanLimitError(used, limit, plan, overageCost);
  }

  if (remaining < additionalTokens) {
    const pct = Math.round((used / limit) * 100);
    console.warn(
      chalk.yellow(
        `\n⚠️  配额警告: 已使用 ${pct}% (${used.toLocaleString()}/${limit.toLocaleString()} tokens)\n` +
        `    剩余 ~${(remaining / 1000).toFixed(0)}k tokens。运行 'benny upgrade' 升级。\n`
      )
    );
  }
}

export function recordOverage(tokens: number): void {
  const state = loadUserState();
  state.totalOverageTokens += tokens;
  saveUserState(state);
}

export function getCurrentPlan(): PlanTier {
  return loadUserState().plan;
}

export function setPlan(tier: PlanTier): void {
  const state = loadUserState();
  state.plan = tier;
  saveUserState(state);
}

export function resetBillingCycle(): void {
  const state = loadUserState();
  state.billingCycleStart = new Date().toISOString();
  state.totalOverageTokens = 0;
  saveUserState(state);
}
