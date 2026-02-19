import "dotenv/config";
import { Bot } from "grammy";
import { registerCommands } from "./commands";
import { routeMessage } from "./router";
import { startWatcher } from "./watcher";

const BOT_TOKEN = process.env.BOT_TOKEN;
const ALLOWED_USER_ID = process.env.ALLOWED_USER_ID;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set");
if (!ALLOWED_USER_ID) throw new Error("ALLOWED_USER_ID is not set");

const bot = new Bot(BOT_TOKEN);

// Auth middleware — reject anyone who isn't the owner
bot.use(async (ctx, next) => {
  if (String(ctx.from?.id) !== ALLOWED_USER_ID) {
    await ctx.reply("Me not that kind of orc!");
    return;
  }
  await next();
});

// Slash commands (shortcuts)
registerCommands(bot);

// Freeform text — the main interface
bot.on("message:text", routeMessage);

// Watch agent logs for completions/errors and push notifications
startWatcher(bot, Number(ALLOWED_USER_ID));

bot.start();
console.log("Peon ready. Something need doing?");
