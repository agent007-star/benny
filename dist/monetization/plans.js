export const PLANS = {
    free: {
        id: "free",
        name: "Free",
        priceMonthly: 0,
        tokenLimitMonthly: 100_000,
        pricePerOverage: 0,
        features: [
            "通义/文心/Kimi 全模型",
            "所有 CLI 命令",
            "MCP Server",
            "100k tokens/月",
        ],
        apiKeyPool: false,
        teamDashboard: false,
        prioritySupport: false,
    },
    pro: {
        id: "pro",
        name: "Pro",
        priceMonthly: 9,
        tokenLimitMonthly: 1_000_000,
        pricePerOverage: 0.1,
        features: [
            "Free 全部功能",
            "1M tokens/月",
            "优先模型访问",
            "团队 API Key 分享",
        ],
        apiKeyPool: false,
        teamDashboard: false,
        prioritySupport: false,
    },
    team: {
        id: "team",
        name: "Team",
        priceMonthly: 29,
        tokenLimitMonthly: 5_000_000,
        pricePerOverage: 0.08,
        features: [
            "Pro 全部功能",
            "5M tokens/月",
            "团队仪表盘",
            "API Key 池管理",
            "使用报告",
        ],
        apiKeyPool: true,
        teamDashboard: true,
        prioritySupport: false,
    },
    enterprise: {
        id: "enterprise",
        name: "Enterprise",
        priceMonthly: -1,
        tokenLimitMonthly: -1,
        pricePerOverage: -1,
        features: [
            "Team 全部功能",
            "无限 tokens",
            "私有化部署",
            "专属 SLA",
            "自定义模型",
            "7x24 支持",
        ],
        apiKeyPool: true,
        teamDashboard: true,
        prioritySupport: true,
    },
};
export function formatPlan(p) {
    const price = p.priceMonthly === 0
        ? "免费"
        : p.priceMonthly < 0
            ? "定制价格"
            : `$${p.priceMonthly}/月`;
    const tokens = p.tokenLimitMonthly < 0
        ? "无限"
        : `${(p.tokenLimitMonthly / 1000).toLocaleString()}k tokens/月`;
    return `${p.name} — ${price} — ${tokens}`;
}
