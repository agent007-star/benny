import { describe, it, expect } from "vitest";
import { AVAILABLE_MODELS, DEFAULT_MODEL } from "../ai/models.js";

describe("models", () => {
  describe("AVAILABLE_MODELS", () => {
    it("should have 3 models", () => {
      expect(AVAILABLE_MODELS).toHaveLength(3);
    });

    it("should include tongyi (qwen-plus)", () => {
      const tongyi = AVAILABLE_MODELS.find((m) => m.provider === "tongyi");
      expect(tongyi).toBeDefined();
      expect(tongyi!.name).toBe("qwen-plus");
      expect(tongyi!.endpoint).toContain("dashscope.aliyuncs.com");
      expect(tongyi!.apiKeyEnv).toBe("TONGYI_API_KEY");
    });

    it("should include wenxin (ernie-4.0-8k)", () => {
      const wenxin = AVAILABLE_MODELS.find((m) => m.provider === "wenxin");
      expect(wenxin).toBeDefined();
      expect(wenxin!.name).toBe("ernie-4.0-8k");
      expect(wenxin!.endpoint).toContain("baidubce.com");
      expect(wenxin!.apiKeyEnv).toBe("WENXIN_API_KEY");
    });

    it("should include kimi (moonshot-v1-128k)", () => {
      const kimi = AVAILABLE_MODELS.find((m) => m.provider === "kimi");
      expect(kimi).toBeDefined();
      expect(kimi!.name).toBe("moonshot-v1-128k");
      expect(kimi!.endpoint).toContain("api.moonshot.cn");
      expect(kimi!.apiKeyEnv).toBe("KIMI_API_KEY");
    });
  });

  describe("DEFAULT_MODEL", () => {
    it("should default to tongyi", () => {
      expect(DEFAULT_MODEL.provider).toBe("tongyi");
      expect(DEFAULT_MODEL.name).toBe("qwen-plus");
    });
  });
});
