import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
const ANALYTICS_DIR = path.join(homedir(), ".benny");
const ANALYTICS_FILE = path.join(ANALYTICS_DIR, "usage.json");
function loadStore() {
    try {
        if (!fs.existsSync(ANALYTICS_DIR)) {
            fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
        }
        if (!fs.existsSync(ANALYTICS_FILE)) {
            return { records: [] };
        }
        const raw = fs.readFileSync(ANALYTICS_FILE, "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return { records: [] };
    }
}
function saveStore(store) {
    try {
        if (!fs.existsSync(ANALYTICS_DIR)) {
            fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
        }
        fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(store, null, 2));
    }
    catch (err) {
        console.error("Failed to save analytics:", err);
    }
}
const COST_PER_1K_TOKENS = {
    tongyi: 0.2,
    wenxin: 0.3,
    kimi: 0.25,
};
export function recordUsage(model, provider, command, inputTokens, outputTokens, totalTokens, success, error) {
    const store = loadStore();
    const rate = COST_PER_1K_TOKENS[provider] ?? 0.2;
    const costCents = (totalTokens / 1000) * rate;
    const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        model,
        provider,
        command,
        inputTokens,
        outputTokens,
        totalTokens,
        costCents: Math.round(costCents * 100) / 100,
        success,
        error,
    };
    store.records.push(record);
    const maxRecords = 10000;
    if (store.records.length > maxRecords) {
        store.records = store.records.slice(-maxRecords);
    }
    saveStore(store);
}
export function getSummary(days) {
    const store = loadStore();
    let records = store.records;
    if (days) {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        records = records.filter((r) => new Date(r.timestamp).getTime() >= cutoff);
    }
    const byProvider = {};
    const byCommand = {};
    for (const r of records) {
        if (!byProvider[r.provider]) {
            byProvider[r.provider] = { calls: 0, inputTokens: 0, outputTokens: 0, costCents: 0 };
        }
        const bp = byProvider[r.provider];
        bp.calls++;
        bp.inputTokens += r.inputTokens;
        bp.outputTokens += r.outputTokens;
        bp.costCents += r.costCents;
        if (!byCommand[r.command]) {
            byCommand[r.command] = { calls: 0, costCents: 0 };
        }
        const bc = byCommand[r.command];
        bc.calls++;
        bc.costCents += r.costCents;
    }
    const totalInputTokens = records.reduce((s, r) => s + r.inputTokens, 0);
    const totalOutputTokens = records.reduce((s, r) => s + r.outputTokens, 0);
    const totalCostCents = records.reduce((s, r) => s + r.costCents, 0);
    return {
        totalCalls: records.length,
        totalInputTokens,
        totalOutputTokens,
        totalCostCents: Math.round(totalCostCents * 100) / 100,
        byProvider,
        byCommand,
        recentRecords: records.slice(-20).reverse(),
    };
}
export function formatSummary(s, days) {
    const lines = [];
    const period = days ? ` (last ${days} days)` : "";
    lines.push(`\n## Benny Usage Report${period}`);
    lines.push("");
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total API Calls | ${s.totalCalls} |`);
    lines.push(`| Input Tokens | ${s.totalInputTokens.toLocaleString()} |`);
    lines.push(`| Output Tokens | ${s.totalOutputTokens.toLocaleString()} |`);
    lines.push(`| **Est. Cost** | **$${s.totalCostCents.toFixed(2)}** |`);
    if (Object.keys(s.byProvider).length > 0) {
        lines.push("");
        lines.push(`### By Provider`);
        lines.push(`| Provider | Calls | Input Tokens | Output Tokens | Est. Cost |`);
        lines.push(`|----------|-------|--------------|----------------|-----------|`);
        for (const [p, v] of Object.entries(s.byProvider)) {
            lines.push(`| ${p} | ${v.calls} | ${v.inputTokens.toLocaleString()} | ${v.outputTokens.toLocaleString()} | $${v.costCents.toFixed(2)} |`);
        }
    }
    if (Object.keys(s.byCommand).length > 0) {
        lines.push("");
        lines.push(`### By Command`);
        lines.push(`| Command | Calls | Est. Cost |`);
        lines.push(`|---------|-------|-----------|`);
        for (const [c, v] of Object.entries(s.byCommand)) {
            lines.push(`| ${c} | ${v.calls} | $${v.costCents.toFixed(2)} |`);
        }
    }
    lines.push("");
    lines.push(`### Recent Activity`);
    if (s.recentRecords.length === 0) {
        lines.push("No activity yet.");
    }
    else {
        lines.push(`| Time | Model | Command | Tokens | Cost | Status |`);
        lines.push(`|------|-------|---------|--------|------|--------|`);
        for (const r of s.recentRecords.slice(0, 10)) {
            const time = new Date(r.timestamp).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
            lines.push(`| ${time} | ${r.model} | ${r.command} | ${r.totalTokens} | $${r.costCents.toFixed(4)} | ${r.success ? "✅" : "❌"} |`);
        }
    }
    return lines.join("\n");
}
