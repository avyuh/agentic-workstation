import { Bot } from "grammy";
import * as fs from "fs";
import * as path from "path";

const LOGS_DIR = process.env.LOG_DIR || `${process.env.HOME}/.agent-logs`;
const POLL_INTERVAL = 10_000; // 10 seconds

// Track log files we've already notified about
const notified = new Set<string>();

export function startWatcher(bot: Bot, userId: number): void {
  // Mark all existing finished logs so we don't re-notify on startup
  try {
    for (const file of fs.readdirSync(LOGS_DIR)) {
      if (!file.endsWith(".log")) continue;
      const fullPath = path.join(LOGS_DIR, file);
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes("=== AGENT FINISHED")) {
        notified.add(fullPath);
      }
    }
  } catch {
    // LOGS_DIR might not exist yet — that's fine
  }

  setInterval(async () => {
    try {
      if (!fs.existsSync(LOGS_DIR)) return;

      for (const file of fs.readdirSync(LOGS_DIR)) {
        if (!file.endsWith(".log")) continue;
        const fullPath = path.join(LOGS_DIR, file);
        if (notified.has(fullPath)) continue;

        const content = fs.readFileSync(fullPath, "utf-8");
        if (!content.includes("=== AGENT FINISHED")) continue;

        notified.add(fullPath);

        // Extract session name from filename (e.g., myproject-20260219-143000.log)
        const session = file.replace(/-\d{8}-\d{6}\.log$/, "");
        const tail = content.split("\n").filter(l => l.trim()).slice(-5).join("\n").slice(0, 500);

        if (content.includes("exit: 0")) {
          await bot.api.sendMessage(userId, `Work complete!\n\nAgent: ${session}\n\n${tail}`);
        } else {
          await bot.api.sendMessage(userId, `Agent ${session} failed.\n\nLast output:\n${tail}`);
        }
      }
    } catch (err) {
      console.error("Watcher error:", err);
    }
  }, POLL_INTERVAL);

  console.log(`Watching ${LOGS_DIR} for agent completions (every ${POLL_INTERVAL / 1000}s)`);
}
