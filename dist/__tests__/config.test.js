import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
// Mock chalk to avoid color codes in tests
vi.mock("chalk", () => ({
    default: {
        green: (s) => s,
        blue: (s) => s,
    },
}));
// Mock readline
vi.mock("readline", () => ({
    createInterface: () => ({
        question: (_prompt, callback) => {
            callback("test-answer");
            return { close: () => { } };
        },
        close: () => { },
    }),
}));
describe("config", () => {
    const testDir = path.join(os.tmpdir(), "benny-test-" + Date.now());
    const testConfigFile = path.join(testDir, "config.json");
    beforeEach(() => {
        fs.mkdirSync(testDir, { recursive: true });
        // Clean up any existing config
        if (fs.existsSync(testConfigFile)) {
            fs.unlinkSync(testConfigFile);
        }
    });
    afterEach(() => {
        fs.rmSync(testDir, { recursive: true, force: true });
    });
    describe("configFilePath", () => {
        it("should return config file path", async () => {
            const { configFilePath } = await import("../utils/config.js");
            const filePath = configFilePath();
            expect(filePath).toContain(".benny");
            expect(filePath).toContain("config.json");
        });
    });
    describe("getConfig", () => {
        it("should return null when config file does not exist", async () => {
            // Delete any existing config
            const { configFilePath, getConfig } = await import("../utils/config.js");
            const configPath = configFilePath();
            if (fs.existsSync(configPath)) {
                fs.unlinkSync(configPath);
            }
            const config = getConfig();
            expect(config).toBeNull();
        });
    });
    describe("saveConfig", () => {
        it("should save config to file", async () => {
            const { saveConfig, configFilePath } = await import("../utils/config.js");
            const config = {
                defaultModel: "tongyi",
                apiKeys: {
                    TONGYI_API_KEY: "test-key",
                },
                preferences: {
                    temperature: 0.7,
                },
            };
            saveConfig(config);
            expect(fs.existsSync(configFilePath())).toBe(true);
        });
    });
});
