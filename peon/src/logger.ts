import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const LOG_DIR = path.join(process.env.HOME || "/root", ".peon", "logs");
const LOG_FILE = path.join(LOG_DIR, "peon.jsonl");

export const MAX_MSG = 4000;

export function truncate(text: string, max = MAX_MSG): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n... (truncated)";
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function genTraceId(): string {
  const time = Date.now().toString(36);
  const rand = crypto.randomBytes(4).toString("hex");
  return `${time}-${rand}`;
}

export interface LogEntry {
  ts: string;
  trace_id: string;
  event: "input" | "output" | "error";
  command: string | null;
  user_id: number | null;
  chat_id: number | null;
  msg_id: number | null;
  text: string;
  latency_ms: number | null;
  ok: boolean;
  workspace: string | null;
}

class Logger {
  private stream: fs.WriteStream;

  constructor() {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    this.stream = fs.createWriteStream(LOG_FILE, { flags: "a" });
  }

  log(entry: LogEntry): void {
    // JSONL to file
    this.stream.write(JSON.stringify(entry) + "\n");

    // Human-readable one-liner to stdout
    const time = new Date(entry.ts).toLocaleTimeString("en-GB", { hour12: false });
    const tag = entry.event === "input" ? "IN " : entry.event === "output" ? "OUT" : "ERR";
    const ws = entry.workspace || "-";
    const tid = entry.trace_id;
    const text = (entry.text || "").slice(0, 80).replace(/\n/g, " ");
    const suffix = entry.latency_ms != null ? ` (${entry.latency_ms}ms)` : "";

    console.log(`[${time}] ${tag} ${ws} ${tid} ${text}${suffix}`);
  }
}

export const logger = new Logger();
