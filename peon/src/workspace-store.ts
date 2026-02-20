import * as fs from "fs";
import * as path from "path";
import type { Context } from "grammy";

const DEFAULT_PATH = path.join(
  process.env.HOME || "/root",
  ".peon",
  "workspaces.json",
);

/** Composite key: "chatId:threadId" — unique per DM, group, or forum topic. */
export function contextKey(ctx: Context): string {
  const chatId = ctx.chat?.id ?? 0;
  const threadId = ctx.message?.message_thread_id ?? 0;
  return `${chatId}:${threadId}`;
}

export class WorkspaceStore {
  private map = new Map<string, string>();
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? DEFAULT_PATH;
    this.load();
  }

  get(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.map.set(key, value);
    this.save();
  }

  delete(key: string): void {
    this.map.delete(key);
    this.save();
  }

  getAll(): Map<string, string> {
    return new Map(this.map);
  }

  private load(): void {
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      const obj = JSON.parse(raw);
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string") this.map.set(k, v);
      }
    } catch {
      // Missing or corrupt file — start empty
    }
  }

  private save(): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    const obj = Object.fromEntries(this.map);
    fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2) + "\n");
  }
}
