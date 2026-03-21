import { describe, it, expect, vi, beforeEach } from "vitest";
import { optimizeCode, addChineseComments, reviewCode, translateCode, explainCode } from "../optimizers/chinese-code.js";

// Mock the AI client
vi.mock("../ai/client.js", () => ({
  chat: vi.fn().mockResolvedValue({
    content: '```typescript\nconst test = "optimized";\n```',
  }),
  selectModel: vi.fn().mockReturnValue({
    provider: "tongyi",
    name: "qwen-plus",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiKeyEnv: "TONGYI_API_KEY",
  }),
}));

describe("chinese-code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("optimizeCode", () => {
    it("should optimize code with default options", async () => {
      const code = "const x = 1;";
      const result = await optimizeCode(code, "typescript");
      expect(result).toBe('const test = "optimized";');
    });

    it("should optimize code with specific style", async () => {
      const code = "const x = 1;";
      const result = await optimizeCode(code, "typescript", { style: "aliyun" });
      expect(result).toBe('const test = "optimized";');
    });

    it("should handle code without comments option", async () => {
      const code = "const x = 1;";
      const result = await optimizeCode(code, "typescript", { addComments: false });
      expect(result).toBe('const test = "optimized";');
    });
  });

  describe("addChineseComments", () => {
    it("should add Chinese comments to code", async () => {
      const code = "const x = 1;";
      const result = await addChineseComments(code, "typescript");
      expect(result).toBe('const test = "optimized";');
    });
  });

  describe("reviewCode", () => {
    it("should review code and return feedback", async () => {
      const code = "const x = 1;";
      const result = await reviewCode(code, "typescript");
      expect(result).toContain("const test = \"optimized\";");
    });
  });

  describe("translateCode", () => {
    it("should translate code between languages", async () => {
      const code = "const x = 1;";
      const result = await translateCode(code, "typescript", "python");
      expect(result).toBe('const test = "optimized";');
    });
  });

  describe("explainCode", () => {
    it("should explain code in Chinese", async () => {
      const code = "const x = 1;";
      const result = await explainCode(code, "typescript");
      expect(result).toContain("const test = \"optimized\";");
    });
  });
});
