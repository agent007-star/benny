import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
// Mock fs and os before importing
vi.mock("fs");
vi.mock("os", () => ({
    default: { homedir: vi.fn(() => "/tmp/test-home") },
    homedir: vi.fn(() => "/tmp/test-home"),
}));
// Mock chalk to avoid ANSI codes in tests
vi.mock("chalk", () => ({
    default: {
        yellow: (s) => s,
        bold: (s) => s,
        gray: (s) => s,
        red: (s) => s,
        green: (s) => s,
        cyan: (s) => s,
    },
}));
// Mock analytics to avoid side effects
vi.mock("../utils/analytics.js", () => ({
    getSummary: () => ({
        totalCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostCents: 0,
        byProvider: {},
        byCommand: {},
        recentRecords: [],
    }),
    formatSummary: () => "",
    recordUsage: () => { },
}));
import { checkLimit, PlanLimitError, getCurrentPlan, setPlan, resetBillingCycle, } from "../monetization/usage-tracker.js";
describe("usage-tracker", () => {
    const USER_FILE = "/tmp/test-home/.benny/user.json";
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fs.existsSync).mockReturnValue(false);
        vi.mocked(fs.mkdirSync).mockImplementation(() => "");
        vi.mocked(fs.readFileSync).mockReturnValue("{}");
        vi.mocked(fs.writeFileSync).mockImplementation(() => { });
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe("getCurrentPlan", () => {
        it("should return free plan by default when no user file", () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            const plan = getCurrentPlan();
            expect(plan).toBe("free");
        });
        it("should return saved plan from user file", () => {
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                if (p === USER_FILE)
                    return true;
                return false;
            });
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
                plan: "pro",
                userId: "user_123",
                billingCycleStart: new Date().toISOString(),
                totalOverageTokens: 0,
            }));
            const plan = getCurrentPlan();
            expect(plan).toBe("pro");
        });
    });
    describe("setPlan", () => {
        it("should update plan in user state", () => {
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                if (p === USER_FILE)
                    return true;
                return false;
            });
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
                plan: "free",
                userId: "user_123",
                billingCycleStart: new Date().toISOString(),
                totalOverageTokens: 0,
            }));
            setPlan("pro");
            expect(fs.writeFileSync).toHaveBeenCalled();
            const savedData = JSON.parse(vi.mocked(fs.writeFileSync).mock.calls[0][1]);
            expect(savedData.plan).toBe("pro");
        });
    });
    describe("resetBillingCycle", () => {
        it("should reset billing cycle and overage tokens", () => {
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                if (p === USER_FILE)
                    return true;
                return false;
            });
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
                plan: "pro",
                userId: "user_123",
                billingCycleStart: "2026-01-01T00:00:00Z",
                totalOverageTokens: 5000,
            }));
            resetBillingCycle();
            expect(fs.writeFileSync).toHaveBeenCalled();
            const savedData = JSON.parse(vi.mocked(fs.writeFileSync).mock.calls[0][1]);
            expect(savedData.totalOverageTokens).toBe(0);
            expect(new Date(savedData.billingCycleStart).getTime()).toBeGreaterThan(new Date("2026-01-01T00:00:00Z").getTime());
        });
    });
    describe("PlanLimitError", () => {
        it("should format Chinese error message", () => {
            const error = new PlanLimitError(90000, 100000, "free", 0.5);
            expect(error.name).toBe("PlanLimitError");
            expect(error.message).toContain("90%");
            expect(error.message).toContain("Free");
            expect(error.message).toContain("免费");
            expect(error.message).toContain("benny upgrade");
        });
        it("should calculate percentage correctly", () => {
            const error = new PlanLimitError(50000, 100000, "free", 1.0);
            expect(error.message).toContain("50%");
        });
        it("should show price for paid plans", () => {
            const error = new PlanLimitError(900000, 1000000, "pro", 2.5);
            expect(error.message).toContain("$9/月");
        });
    });
    describe("checkLimit", () => {
        it("should not throw for enterprise plan", () => {
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                if (p === USER_FILE)
                    return true;
                return false;
            });
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
                plan: "enterprise",
                userId: "user_123",
                billingCycleStart: new Date().toISOString(),
                totalOverageTokens: 0,
            }));
            expect(() => checkLimit(10000)).not.toThrow();
        });
    });
});
