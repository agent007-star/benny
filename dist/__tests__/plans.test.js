import { describe, it, expect } from "vitest";
import { PLANS, formatPlan } from "../monetization/plans.js";
describe("plans", () => {
    describe("PLANS", () => {
        it("should have 4 tiers", () => {
            expect(Object.keys(PLANS)).toHaveLength(4);
            expect(PLANS.free).toBeDefined();
            expect(PLANS.pro).toBeDefined();
            expect(PLANS.team).toBeDefined();
            expect(PLANS.enterprise).toBeDefined();
        });
        it("free plan should have 100k token limit and $0 price", () => {
            expect(PLANS.free.priceMonthly).toBe(0);
            expect(PLANS.free.tokenLimitMonthly).toBe(100_000);
        });
        it("pro plan should have 1M token limit and $9 price", () => {
            expect(PLANS.pro.priceMonthly).toBe(9);
            expect(PLANS.pro.tokenLimitMonthly).toBe(1_000_000);
        });
        it("team plan should have 5M token limit and $29 price", () => {
            expect(PLANS.team.priceMonthly).toBe(29);
            expect(PLANS.team.tokenLimitMonthly).toBe(5_000_000);
            expect(PLANS.team.apiKeyPool).toBe(true);
            expect(PLANS.team.teamDashboard).toBe(true);
        });
        it("enterprise plan should have unlimited tokens", () => {
            expect(PLANS.enterprise.tokenLimitMonthly).toBe(-1);
            expect(PLANS.enterprise.priceMonthly).toBe(-1);
            expect(PLANS.enterprise.prioritySupport).toBe(true);
        });
        it("free plan should not have team features", () => {
            expect(PLANS.free.apiKeyPool).toBe(false);
            expect(PLANS.free.teamDashboard).toBe(false);
            expect(PLANS.free.prioritySupport).toBe(false);
        });
    });
    describe("formatPlan", () => {
        it("should format free plan in Chinese", () => {
            const result = formatPlan(PLANS.free);
            expect(result).toContain("Free");
            expect(result).toContain("免费");
            expect(result).toContain("100k tokens/月");
        });
        it("should format pro plan with price", () => {
            const result = formatPlan(PLANS.pro);
            expect(result).toContain("Pro");
            expect(result).toContain("$9/月");
            expect(result).toContain("1,000k tokens/月");
        });
        it("should format team plan with price", () => {
            const result = formatPlan(PLANS.team);
            expect(result).toContain("Team");
            expect(result).toContain("$29/月");
            expect(result).toContain("5,000k tokens/月");
        });
        it("should format enterprise plan as custom price", () => {
            const result = formatPlan(PLANS.enterprise);
            expect(result).toContain("Enterprise");
            expect(result).toContain("定制价格");
            expect(result).toContain("无限");
        });
    });
});
