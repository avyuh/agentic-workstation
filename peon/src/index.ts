import "dotenv/config";
import { Bot } from "grammy";
import { startWatcher } from "./watcher";
import { sh, truncate } from "./shell";

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

// Every text message = shell command on VPS
bot.on("message:text", async (ctx) => {
  const cmd = ctx.message.text.trim();
  if (!cmd) return;

  try {
    const output = await sh(cmd, 60_000);
    if (output) {
      await ctx.reply(`<pre>${escapeHtml(truncate(output))}</pre>`, { parse_mode: "HTML" });
    } else {
      await ctx.reply("(no output)");
    }
  } catch (err: any) {
    const msg = (err.stderr || err.stdout || err.message || "").trim();
    if (msg) {
      await ctx.reply(`<pre>${escapeHtml(truncate(msg))}</pre>`, { parse_mode: "HTML" });
    } else {
      await ctx.reply(`Exit code: ${err.code || "unknown"}`);
    }
  }
});

startWatcher(bot, Number(ALLOWED_USER_ID));

bot.start();
console.log("Peon ready. Something need doing?");

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
