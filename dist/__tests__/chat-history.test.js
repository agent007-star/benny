import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
// Mock fs and os before importing the module under test
vi.mock("fs");
vi.mock("os", () => ({
    default: { homedir: vi.fn(() => "/tmp/test-home") },
    homedir: vi.fn(() => "/tmp/test-home"),
}));
import { createSession, generateSessionId, formatSessionList, listSessions, loadSession, deleteSession, } from "../utils/chat-history.js";
describe("chat-history", () => {
    const HISTORY_FILE = "/tmp/test-home/.benny/history.json";
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
    describe("createSession", () => {
        it("should create a session with correct defaults", () => {
            const session = createSession("qwen-plus", "tongyi");
            expect(session.title).toBe("新对话");
            expect(session.model).toBe("qwen-plus");
            expect(session.provider).toBe("tongyi");
            expect(session.messages).toEqual([]);
            expect(session.id).toMatch(/^session_\d+_[a-z0-9]+$/);
            expect(session.createdAt).toBeDefined();
            expect(session.updatedAt).toBeDefined();
        });
    });
    describe("generateSessionId", () => {
        it("should generate unique IDs", () => {
            const id1 = generateSessionId();
            const id2 = generateSessionId();
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
        });
    });
    describe("formatSessionList", () => {
        it("should return empty message in Chinese when no sessions", () => {
            const output = formatSessionList([]);
            expect(output).toContain("没有历史对话");
        });
        it("should format sessions with model and message count", () => {
            const sessions = [
                {
                    id: "session_1234567890_abc123",
                    title: "Test conversation",
                    model: "qwen-plus",
                    provider: "tongyi",
                    messages: [
                        { role: "user", content: "Hello" },
                        { role: "assistant", content: "Hi" },
                        { role: "user", content: "How are you" },
                    ],
                    createdAt: "2026-03-20T10:00:00Z",
                    updatedAt: "2026-03-20T10:05:00Z",
                },
            ];
            const output = formatSessionList(sessions);
            expect(output).toContain("qwen-plus");
            expect(output).toContain("2条消息"); // 2 user messages
            expect(output).toContain("Test conversation");
            expect(output).toContain("session_"); // first 8 chars of session ID
        });
    });
    describe("listSessions", () => {
        it("should return empty array when no history file exists", () => {
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                if (p === "/tmp/test-home/.benny")
                    return true;
                if (p === HISTORY_FILE)
                    return false;
                return false;
            });
            const sessions = listSessions();
            expect(sessions).toEqual([]);
        });
        it("should sort sessions by updatedAt descending", () => {
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                if (p === "/tmp/test-home/.benny")
                    return true;
                if (p === HISTORY_FILE)
                    return true;
                return false;
            });
            const mockHistory = {
                sessions: [
                    {
                        id: "old",
                        title: "Old",
                        model: "qwen-plus",
                        provider: "tongyi",
                        messages: [],
                        createdAt: "2026-03-19T10:00:00Z",
                        updatedAt: "2026-03-19T10:00:00Z",
                    },
                    {
                        id: "new",
                        title: "New",
                        model: "qwen-plus",
                        provider: "tongyi",
                        messages: [],
                        createdAt: "2026-03-20T10:00:00Z",
                        updatedAt: "2026-03-20T10:00:00Z",
                    },
                ],
                currentSessionId: null,
            };
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockHistory));
            const sessions = listSessions();
            expect(sessions[0].id).toBe("new");
            expect(sessions[1].id).toBe("old");
        });
    });
    describe("loadSession", () => {
        it("should return null for non-existent session", () => {
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                if (p === "/tmp/test-home/.benny")
                    return true;
                if (p === HISTORY_FILE)
                    return true;
                return false;
            });
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ sessions: [], currentSessionId: null }));
            const result = loadSession("non-existent");
            expect(result).toBeNull();
        });
        it("should return session when found", () => {
            const mockSession = {
                id: "session_123",
                title: "Test",
                model: "qwen-plus",
                provider: "tongyi",
                messages: [],
                createdAt: "2026-03-20T10:00:00Z",
                updatedAt: "2026-03-20T10:00:00Z",
            };
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                if (p === "/tmp/test-home/.benny")
                    return true;
                if (p === HISTORY_FILE)
                    return true;
                return false;
            });
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ sessions: [mockSession], currentSessionId: null }));
            const result = loadSession("session_123");
            expect(result).toEqual(mockSession);
        });
    });
    describe("deleteSession", () => {
        it("should return false when session not found", () => {
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                if (p === "/tmp/test-home/.benny")
                    return true;
                if (p === HISTORY_FILE)
                    return true;
                return false;
            });
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ sessions: [], currentSessionId: null }));
            const result = deleteSession("non-existent");
            expect(result).toBe(false);
        });
        it("should delete session and update currentSessionId", () => {
            const mockHistory = {
                sessions: [
                    {
                        id: "session_1",
                        title: "Session 1",
                        model: "qwen-plus",
                        provider: "tongyi",
                        messages: [],
                        createdAt: "2026-03-20T10:00:00Z",
                        updatedAt: "2026-03-20T10:00:00Z",
                    },
                    {
                        id: "session_2",
                        title: "Session 2",
                        model: "qwen-plus",
                        provider: "tongyi",
                        messages: [],
                        createdAt: "2026-03-20T11:00:00Z",
                        updatedAt: "2026-03-20T11:00:00Z",
                    },
                ],
                currentSessionId: "session_1",
            };
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                if (p === "/tmp/test-home/.benny")
                    return true;
                if (p === HISTORY_FILE)
                    return true;
                return false;
            });
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockHistory));
            const result = deleteSession("session_1");
            expect(result).toBe(true);
            // Verify saveHistory was called with updated state
            expect(fs.writeFileSync).toHaveBeenCalled();
            const savedData = JSON.parse(vi.mocked(fs.writeFileSync).mock.calls[0][1]);
            expect(savedData.sessions).toHaveLength(1);
            expect(savedData.sessions[0].id).toBe("session_2");
            expect(savedData.currentSessionId).toBe("session_2");
        });
    });
});
