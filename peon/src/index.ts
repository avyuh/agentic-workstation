import "dotenv/config";
import { Bot } from "grammy";
import { sh } from "./shell";
import { logger, genTraceId, truncate, escapeHtml } from "./logger";

const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOWED_USER_ID = process.env.ALLOWED_USER_ID;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set");
if (!ALLOWED_USER_ID) throw new Error("ALLOWED_USER_ID is not set");

const bot = new Bot(BOT_TOKEN);

// --- Auth middleware ---
bot.use(async (ctx, next) => {
  if (String(ctx.from?.id) !== ALLOWED_USER_ID) {
    const traceId = genTraceId();
    logger.log({
      ts: new Date().toISOString(),
      trace_id: traceId,
      event: "input",
      command: null,
      user_id: ctx.from?.id ?? null,
      chat_id: ctx.chat?.id ?? null,
      msg_id: ctx.message?.message_id ?? null,
      text: ctx.message?.text ?? "",
      latency_ms: null,
      ok: true,
    });
    await ctx.reply("Me not that kind of orc!");
    logger.log({
      ts: new Date().toISOString(),
      trace_id: traceId,
      event: "output",
      command: null,
      user_id: ctx.from?.id ?? null,
      chat_id: ctx.chat?.id ?? null,
      msg_id: ctx.message?.message_id ?? null,
      text: "Me not that kind of orc!",
      latency_ms: null,
      ok: true,
    });
    return;
  }
  await next();
});

// --- Logging middleware ---
bot.use(async (ctx, next) => {
  const traceId = genTraceId();
  const start = Date.now();
  const text = ctx.message?.text ?? "";
  const command = text.startsWith("/") ? text.split(/\s/)[0] : null;

  // Log input immediately
  logger.log({
    ts: new Date().toISOString(),
    trace_id: traceId,
    event: "input",
    command,
    user_id: ctx.from?.id ?? null,
    chat_id: ctx.chat?.id ?? null,
    msg_id: ctx.message?.message_id ?? null,
    text,
    latency_ms: null,
    ok: true,
  });

  // Wrap ctx.reply to auto-log outputs
  const origReply = ctx.reply.bind(ctx);
  ctx.reply = async (replyText: string, other?: any) => {
    const result = await origReply(replyText, other);
    logger.log({
      ts: new Date().toISOString(),
      trace_id: traceId,
      event: "output",
      command,
      user_id: ctx.from?.id ?? null,
      chat_id: ctx.chat?.id ?? null,
      msg_id: ctx.message?.message_id ?? null,
      text: typeof replyText === "string" ? replyText.slice(0, 500) : "",
      latency_ms: Date.now() - start,
      ok: true,
    });
    return result;
  };

  // Stash trace_id on ctx for error handler
  (ctx as any).traceId = traceId;
  (ctx as any).traceStart = start;
  (ctx as any).traceCommand = command;

  await next();
});

// --- /stats command ---
const STATS_CMD = [
  'printf "CPU  %s cores  load %s\\n" "$(nproc)" "$(cut -d" " -f1 /proc/loadavg)"',
  'free -m | awk \'NR==2{printf "MEM  %dM / %dM (%d%%)\\n", $3, $2, $3*100/$2}\'',
  'free -m | awk \'NR==3{if($3>0) printf "SWAP %dM / %dM\\n", $3, $2}\'',
  'df -h / | awk \'NR==2{printf "DISK %s / %s (%s)\\n", $3, $2, $5}\'',
  'uptime -p | sed "s/up /UP   /"',
].join(" && ");

bot.command("stats", async (ctx) => {
  try {
    const output = await sh(STATS_CMD);
    await ctx.reply(`<pre>${escapeHtml(output)}</pre>`, { parse_mode: "HTML" });
  } catch (err: any) {
    await ctx.reply(`Error: ${err.message}`);
  }
});

// --- Catch-all: any text message → "Work Work!" ---
bot.on("message:text", async (ctx) => {
  await ctx.reply("Work Work!");
});

// --- Error handler ---
bot.catch((err) => {
  const ctx = err.ctx as any;
  const traceId = ctx?.traceId || "unknown";
  const start = ctx?.traceStart;
  const command = ctx?.traceCommand || null;

  logger.log({
    ts: new Date().toISOString(),
    trace_id: traceId,
    event: "error",
    command,
    user_id: ctx?.from?.id ?? null,
    chat_id: ctx?.chat?.id ?? null,
    msg_id: ctx?.message?.message_id ?? null,
    text: String(err.error),
    latency_ms: start ? Date.now() - start : null,
    ok: false,
  });

  console.error(`[ERROR] ${traceId}:`, err.error);
});

// --- Start ---
bot.start({
  onStart: () => console.log("Peon ready. Something need doing?"),
  allowed_updates: ["message"],
});
