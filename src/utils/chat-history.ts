import * as fs from "fs";
import * as path from "path";
import os from "os";
import type { ChatMessage } from "../ai/models.js";

const HISTORY_DIR = path.join(os.homedir(), ".benny");
const HISTORY_FILE = path.join(HISTORY_DIR, "history.json");

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  provider: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistory {
  sessions: ChatSession[];
  currentSessionId: string | null;
}

function ensureDir(): void {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function loadHistory(): ChatHistory {
  ensureDir();
  if (!fs.existsSync(HISTORY_FILE)) {
    return { sessions: [], currentSessionId: null };
  }
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8")) as ChatHistory;
  } catch {
    return { sessions: [], currentSessionId: null };
  }
}

function saveHistory(history: ChatHistory): void {
  ensureDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSession(model: string, provider: string): ChatSession {
  return {
    id: generateSessionId(),
    title: "新对话",
    model,
    provider,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function listSessions(limit = 10): ChatSession[] {
  const history = loadHistory();
  return history.sessions
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

export function loadSession(sessionId: string): ChatSession | null {
  const history = loadHistory();
  return history.sessions.find((s) => s.id === sessionId) ?? null;
}

export function saveSession(session: ChatSession): void {
  const history = loadHistory();
  const idx = history.sessions.findIndex((s) => s.id === session.id);
  session.updatedAt = new Date().toISOString();

  if (session.messages.length > 1) {
    const firstUser = session.messages.find((m) => m.role === "user");
    if (firstUser) {
      session.title = firstUser.content.slice(0, 50).replace(/\n/g, " ") + (firstUser.content.length > 50 ? "..." : "");
    }
  }

  if (idx >= 0) {
    history.sessions[idx] = session;
  } else {
    history.sessions.push(session);
  }
  history.currentSessionId = session.id;
  saveHistory(history);
}

export function deleteSession(sessionId: string): boolean {
  const history = loadHistory();
  const before = history.sessions.length;
  history.sessions = history.sessions.filter((s) => s.id !== sessionId);
  if (history.currentSessionId === sessionId) {
    history.currentSessionId = history.sessions[0]?.id ?? null;
  }
  saveHistory(history);
  return history.sessions.length < before;
}

export function formatSessionList(sessions: ChatSession[]): string {
  if (sessions.length === 0) return "  没有历史对话";
  return sessions
    .map((s) => {
      const date = new Date(s.updatedAt).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      const msgs = s.messages.filter((m) => m.role === "user").length;
      return `  [${s.id.slice(0, 8)}] ${date} | ${s.model} | ${msgs}条消息 | ${s.title}`;
    })
    .join("\n");
}
