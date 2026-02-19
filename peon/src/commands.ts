import { Bot } from "grammy";
import { doStatus, doLog, doDiff, doStop, doRun, doProjects } from "./actions";

export function registerCommands(bot: Bot): void {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Something need doing?\n\n" +
        "Just type naturally:\n" +
        "  status\n" +
        "  log test-app\n" +
        "  stop test-app\n" +
        "  diff test-app\n" +
        "  test-app fix the login bug\n" +
        "  projects\n\n" +
        "Or use /commands for the menu."
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "What you want?\n\n" +
        "Just type what you need. Examples:\n" +
        "  status\n" +
        "  log test-app 20\n" +
        "  diff test-app\n" +
        "  stop test-app\n" +
        "  test-app add user authentication\n" +
        "  projects"
    );
  });

  bot.command("run", async (ctx) => {
    const args = ctx.match?.trim();
    if (!args) {
      await ctx.reply("Usage: /run <project> <task>");
      return;
    }
    const spaceIdx = args.indexOf(" ");
    if (spaceIdx === -1) {
      await ctx.reply("Need a project and a task.\nExample: /run test-app fix the login bug");
      return;
    }
    return doRun(ctx, args.slice(0, spaceIdx), args.slice(spaceIdx + 1));
  });

  bot.command("status", (ctx) => doStatus(ctx));
  bot.command("projects", (ctx) => doProjects(ctx));

  bot.command("log", async (ctx) => {
    const parts = ctx.match?.trim().split(/\s+/) || [];
    if (!parts[0]) {
      await ctx.reply("Usage: /log <session> [lines]");
      return;
    }
    return doLog(ctx, parts[0], parts[1] || "50");
  });

  bot.command("diff", async (ctx) => {
    const session = ctx.match?.trim();
    if (!session) {
      await ctx.reply("Usage: /diff <session>");
      return;
    }
    return doDiff(ctx, session);
  });

  bot.command("stop", async (ctx) => {
    const session = ctx.match?.trim();
    if (!session) {
      await ctx.reply("Usage: /stop <session>");
      return;
    }
    return doStop(ctx, session);
  });
}
