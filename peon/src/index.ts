import "dotenv/config";
import { Bot } from "grammy";
import { sh } from "./shell";
import { logger, genTraceId, truncate, escapeHtml } from "./logger";
import { WorkspaceStore, contextKey } from "./workspace-store";
import * as fs from "fs";
import * as path from "path";

const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOWED_USER_ID = process.env.ALLOWED_USER_ID;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set");
if (!ALLOWED_USER_ID) throw new Error("ALLOWED_USER_ID is not set");

const WS_ROOT = path.join(process.env.HOME || "/root", "ws");

const bot = new Bot(BOT_TOKEN);

// --- Workspace state (per-context, persisted) ---
const wsStore = new WorkspaceStore();

// --- Service message guard (ignore pins, photos, etc.) ---
bot.use(async (ctx, next) => {
  if (!ctx.message?.text) return;
  await next();
});

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
      workspace: null,
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
      workspace: null,
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
    workspace: wsStore.get(contextKey(ctx)),
  });

  // Wrap ctx.reply to auto-log outputs and prepend workspace prefix
  const origReply = ctx.reply.bind(ctx);
  ctx.reply = async (replyText: string, other?: any) => {
    let prefixed = replyText;
    const ws = wsStore.get(contextKey(ctx));
    if (ws) {
      prefixed = other?.parse_mode === "HTML"
        ? `<b>[${escapeHtml(ws)}]</b>\n${replyText}`
        : `[${ws}] ${replyText}`;
    }
    const result = await origReply(prefixed, other);
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
      workspace: wsStore.get(contextKey(ctx)),
    });
    return result;
  };

  // Stash trace_id on ctx for error handler
  (ctx as any).traceId = traceId;
  (ctx as any).traceStart = start;
  (ctx as any).traceCommand = command;

  await next();
});

// --- Workspace helpers ---
function wsExists(name: string): boolean {
  const wsPath = path.join(WS_ROOT, name);
  try {
    return fs.statSync(wsPath).isDirectory();
  } catch {
    return false;
  }
}

function listWorkspaces(): string[] {
  try {
    return fs
      .readdirSync(WS_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

// --- Workspace name validation ---
const WS_NAME_RE = /^[a-zA-Z0-9_-]+$/;

// --- /ws:new <name> ---
bot.hears(/^\/ws:new\s+(.+)/, async (ctx) => {
  const name = ctx.match[1].trim();

  if (!WS_NAME_RE.test(name)) {
    await ctx.reply("Invalid name. Use alphanumeric, dash, underscore only.");
    return;
  }

  if (wsExists(name)) {
    wsStore.set(contextKey(ctx), name);
    await ctx.reply("Already exists, switched.");
    return;
  }

  fs.mkdirSync(path.join(WS_ROOT, name), { recursive: true });
  wsStore.set(contextKey(ctx), name);
  await ctx.reply("Workspace created.");
});

// --- /ws:ls ---
bot.hears(/^\/ws:ls$/, async (ctx) => {
  const dirs = listWorkspaces();

  if (dirs.length === 0) {
    await ctx.reply("No workspaces yet. Use /ws:new <name> to create one.");
    return;
  }

  const myWs = wsStore.get(contextKey(ctx));
  const lines = dirs.map((d) => (d === myWs ? `>> ${d}` : `   ${d}`));
  await ctx.reply(`<pre>${escapeHtml(lines.join("\n"))}</pre>`, {
    parse_mode: "HTML",
  });
});

// --- /ws:cd [name] ---
bot.hears(/^\/ws:cd(?:\s+(.+))?$/, async (ctx) => {
  const name = ctx.match[1]?.trim();

  if (!name) {
    wsStore.delete(contextKey(ctx));
    await ctx.reply("Workspace unset.");
    return;
  }

  if (!wsExists(name)) {
    await ctx.reply(`Workspace '${escapeHtml(name)}' not found.`, {
      parse_mode: "HTML",
    });
    return;
  }

  wsStore.set(contextKey(ctx), name);
  await ctx.reply("Switched.");
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
    workspace: wsStore.get(contextKey(ctx)),
  });

  console.error(`[ERROR] ${traceId}:`, err.error);
});

// --- Start ---
bot.start({
  onStart: () => console.log("Peon ready. Something need doing?"),
  allowed_updates: ["message"],
});
