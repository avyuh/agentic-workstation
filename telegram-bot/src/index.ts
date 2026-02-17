import "dotenv/config";
import { Bot } from "grammy";
import { registerCommands } from "./commands";

// TODO: validate that BOT_TOKEN and ALLOWED_USER_ID are set at startup
const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOWED_USER_ID = process.env.ALLOWED_USER_ID;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set in environment");
}
if (!ALLOWED_USER_ID) {
  throw new Error("ALLOWED_USER_ID is not set in environment");
}

const bot = new Bot(BOT_TOKEN);

// TODO: middleware — reject any message not from ALLOWED_USER_ID
// bot.use(async (ctx, next) => {
//   if (String(ctx.from?.id) !== ALLOWED_USER_ID) {
//     await ctx.reply("Unauthorized.");
//     return;
//   }
//   await next();
// });

// Register all command handlers
registerCommands(bot);

// TODO: set up proactive notification emitter
// This should watch LOG_DIR for new agent output and push messages to ALLOWED_USER_ID
// via bot.api.sendMessage(ALLOWED_USER_ID, ...) without waiting for a user command.

// TODO: register /worktree command (lists active git worktrees)

bot.start();
console.log("Bot is running...");
