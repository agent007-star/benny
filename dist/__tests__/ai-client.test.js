import { describe, it, expect, vi } from "vitest";
import { selectModel, FriendlyError } from "../ai/client.js";
import { AVAILABLE_MODELS } from "../ai/models.js";
// Mock dependencies
vi.mock("../utils/config.js", () => ({
    getConfig: () => null,
    saveConfig: () => { },
    question: () => Promise.resolve(""),
}));
vi.mock("../utils/analytics.js", () => ({
    recordUsage: () => { },
    getSummary: () => ({}),
    formatSummary: () => "",
}));
vi.mock("../monetization/usage-tracker.js", () => ({
    checkLimit: () => { },
    getMonthlyUsage: () => ({ used: 0, limit: 100000 }),
    getCurrentPlan: () => "free",
}));
describe("ai-client", () => {
    describe("selectModel", () => {
        it("should return first model when no provider specified", () => {
            const model = selectModel();
            expect(model).toEqual(AVAILABLE_MODELS[0]);
            expect(model.provider).toBe("tongyi");
        });
        it("should return tongyi model when provider is tongyi", () => {
            const model = selectModel("tongyi");
            expect(model.provider).toBe("tongyi");
            expect(model.name).toBe("qwen-plus");
        });
        it("should return wenxin model when provider is wenxin", () => {
            const model = selectModel("wenxin");
            expect(model.provider).toBe("wenxin");
            expect(model.name).toBe("ernie-4.0-8k");
        });
        it("should return kimi model when provider is kimi", () => {
            const model = selectModel("kimi");
            expect(model.provider).toBe("kimi");
            expect(model.name).toBe("moonshot-v1-128k");
        });
        it("should return default model for unknown provider", () => {
            const model = selectModel("unknown");
            expect(model).toEqual(AVAILABLE_MODELS[0]);
        });
    });
    describe("FriendlyError", () => {
        it("should create error with message and code", () => {
            const error = new FriendlyError("Test error", "test_code");
            expect(error.message).toBe("Test error");
            expect(error.code).toBe("test_code");
            expect(error.name).toBe("FriendlyError");
            expect(error).toBeInstanceOf(Error);
        });
    });
});
