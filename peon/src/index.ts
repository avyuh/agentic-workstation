import "dotenv/config";
import { Bot } from "grammy";
import { startWatcher } from "./watcher";
import { sh, claude, truncate, escapeHtml } from "./shell";

const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOWED_USER_ID = process.env.ALLOWED_USER_ID;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set");
if (!ALLOWED_USER_ID) throw new Error("ALLOWED_USER_ID is not set");

const bot = new Bot(BOT_TOKEN);

// Auth middleware
bot.use(async (ctx, next) => {
  if (String(ctx.from?.id) !== ALLOWED_USER_ID) {
    await ctx.reply("Me not that kind of orc!");
    return;
  }
  await next();
});

// /sh <cmd> — direct shell execution
bot.command("sh", async (ctx) => {
  const cmd = ctx.match?.trim();
  if (!cmd) {
    await ctx.reply("Usage: /sh <command>");
    return;
  }
  try {
    const output = await sh(cmd, 60_000);
    await ctx.reply(`<pre>${escapeHtml(truncate(output || "(no output)"))}</pre>`, {
      parse_mode: "HTML",
    });
  } catch (err: any) {
    const msg = (err.stderr || err.stdout || err.message || "").trim();
    await ctx.reply(`<pre>${escapeHtml(truncate(msg || `Exit code: ${err.code}`))}</pre>`, {
      parse_mode: "HTML",
    });
  }
});

// /stats — CPU, RAM, disk
bot.command("stats", async (ctx) => {
  try {
    const output = await sh(
      'echo "=== CPU ===" && top -bn1 | head -5 && echo "" && echo "=== MEMORY ===" && free -h && echo "" && echo "=== DISK ===" && df -h / && echo "" && echo "=== UPTIME ===" && uptime'
    );
    await ctx.reply(`<pre>${escapeHtml(truncate(output))}</pre>`, { parse_mode: "HTML" });
  } catch (err: any) {
    await ctx.reply(`Error: ${err.message}`);
  }
});

// Default: every text message → claude -p
bot.on("message:text", async (ctx) => {
  const prompt = ctx.message.text.trim();
  if (!prompt) return;

  await ctx.reply("Work, work...");

  try {
    const output = await claude(prompt);
    if (!output) {
      await ctx.reply("(no response)");
      return;
    }
    // Split long responses into chunks for Telegram's 4096 char limit
    const chunks = splitMessage(output, 4000);
    for (const chunk of chunks) {
      await ctx.reply(chunk);
    }
  } catch (err: any) {
    if (err.killed || err.signal === "SIGTERM") {
      await ctx.reply("Timed out (2 min). For long tasks, use:\n/sh agent-run <project> \"<task>\"");
    } else {
      const msg = (err.stderr || err.message || "").trim();
      await ctx.reply(`Error:\n${truncate(msg)}`);
    }
  }
});

startWatcher(bot, Number(ALLOWED_USER_ID));

bot.start();
console.log("Peon ready. Something need doing?");

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    // Try to split at a newline near the limit
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt <= 0) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }
  return chunks;
}
