import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import os from "os";

// Mock fs and os before importing the module under test
vi.mock("fs");
vi.mock("os", () => ({
  default: { homedir: vi.fn(() => "/tmp/test-home") },
  homedir: vi.fn(() => "/tmp/test-home"),
}));

import { getSummary, formatSummary, recordUsage } from "../utils/analytics.js";

describe("analytics", () => {
  const ANALYTICS_DIR = "/tmp/test-home/.benny";
  const ANALYTICS_FILE = path.join(ANALYTICS_DIR, "usage.json");

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: directory exists, no file
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockImplementation(() => "");
    vi.mocked(fs.readFileSync).mockReturnValue("{}");
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSummary", () => {
    it("should return empty summary when no records exist", () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        if (p === ANALYTICS_DIR) return true;
        if (p === ANALYTICS_FILE) return false;
        return false;
      });

      const summary = getSummary();
      expect(summary.totalCalls).toBe(0);
      expect(summary.totalInputTokens).toBe(0);
      expect(summary.totalOutputTokens).toBe(0);
      expect(summary.totalCostCents).toBe(0);
    });

    it("should aggregate records correctly", () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        if (p === ANALYTICS_DIR) return true;
        if (p === ANALYTICS_FILE) return true;
        return false;
      });

      const mockStore = {
        records: [
          {
            id: "1",
            timestamp: new Date().toISOString(),
            model: "qwen-plus",
            provider: "tongyi",
            command: "optimize",
            inputTokens: 100,
            outputTokens: 200,
            totalTokens: 300,
            costCents: 0.06,
            success: true,
          },
          {
            id: "2",
            timestamp: new Date().toISOString(),
            model: "ernie-4.0-8k",
            provider: "wenxin",
            command: "review",
            inputTokens: 150,
            outputTokens: 250,
            totalTokens: 400,
            costCents: 0.12,
            success: true,
          },
        ],
      };
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockStore));

      const summary = getSummary();
      expect(summary.totalCalls).toBe(2);
      expect(summary.totalInputTokens).toBe(250);
      expect(summary.totalOutputTokens).toBe(450);
      expect(summary.totalCostCents).toBe(0.18);
      expect(summary.byProvider["tongyi"].calls).toBe(1);
      expect(summary.byProvider["wenxin"].calls).toBe(1);
      expect(summary.byCommand["optimize"].calls).toBe(1);
      expect(summary.byCommand["review"].calls).toBe(1);
    });

    it("should filter by days when specified", () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        if (p === ANALYTICS_DIR) return true;
        if (p === ANALYTICS_FILE) return true;
        return false;
      });

      const now = Date.now();
      const oldDate = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago
      const recentDate = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(); // 1 day ago

      const mockStore = {
        records: [
          {
            id: "1",
            timestamp: oldDate,
            model: "qwen-plus",
            provider: "tongyi",
            command: "optimize",
            inputTokens: 100,
            outputTokens: 200,
            totalTokens: 300,
            costCents: 0.06,
            success: true,
          },
          {
            id: "2",
            timestamp: recentDate,
            model: "qwen-plus",
            provider: "tongyi",
            command: "review",
            inputTokens: 150,
            outputTokens: 250,
            totalTokens: 400,
            costCents: 0.08,
            success: true,
          },
        ],
      };
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockStore));

      const summary = getSummary(7); // last 7 days
      expect(summary.totalCalls).toBe(1);
      expect(summary.totalOutputTokens).toBe(250);
    });
  });

  describe("formatSummary", () => {
    it("should format empty summary with Chinese text", () => {
      const summary = {
        totalCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostCents: 0,
        byProvider: {},
        byCommand: {},
        recentRecords: [],
      };

      const output = formatSummary(summary);
      expect(output).toContain("Benny Usage Report");
      expect(output).toContain("Total API Calls");
      expect(output).toContain("0");
      expect(output).toContain("No activity yet.");
    });

    it("should format provider breakdown", () => {
      const summary = {
        totalCalls: 5,
        totalInputTokens: 1000,
        totalOutputTokens: 2000,
        totalCostCents: 0.5,
        byProvider: {
          tongyi: { calls: 3, inputTokens: 600, outputTokens: 1200, costCents: 0.3 },
          wenxin: { calls: 2, inputTokens: 400, outputTokens: 800, costCents: 0.2 },
        },
        byCommand: {},
        recentRecords: [],
      };

      const output = formatSummary(summary);
      expect(output).toContain("By Provider");
      expect(output).toContain("tongyi");
      expect(output).toContain("wenxin");
      expect(output).toContain("Est. Cost");
    });

    it("should format with days filter", () => {
      const summary = {
        totalCalls: 3,
        totalInputTokens: 500,
        totalOutputTokens: 1000,
        totalCostCents: 0.3,
        byProvider: {},
        byCommand: {},
        recentRecords: [],
      };

      const output = formatSummary(summary, 7);
      expect(output).toContain("last 7 days");
    });
  });
});
