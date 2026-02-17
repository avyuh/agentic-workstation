import { Bot } from "grammy";

export function registerCommands(bot: Bot): void {
  // /run <task> — start a new Claude Code agent for the given task
  // TODO: parse task description from ctx.match, create a new tmux window or
  // worktree, invoke `claude` with the task, capture the agent ID, reply with it.
  bot.command("run", async (ctx) => {
    await ctx.reply("TODO: implement /run — start a Claude Code agent");
  });

  // /status — list all running agents
  // TODO: read a process registry (e.g. a JSON file written by agent launchers),
  // format each agent as: ID | worktree | uptime | current step.
  bot.command("status", async (ctx) => {
    await ctx.reply("TODO: implement /status — show running agents");
  });

  // /log [id] — tail recent log lines for an agent
  // TODO: look up agent ID in the registry, read the last N lines from its log
  // file in LOG_DIR, reply with a code block.
  bot.command("log", async (ctx) => {
    await ctx.reply("TODO: implement /log — tail agent log");
  });

  // /diff [id] — show git diff for an agent's worktree
  // TODO: resolve the worktree path from the registry, run `git diff`, reply
  // with a trimmed code block (truncate if too long for Telegram's 4096 char limit).
  bot.command("diff", async (ctx) => {
    await ctx.reply("TODO: implement /diff — show agent worktree diff");
  });

  // /stop <id> — stop a running agent
  // TODO: look up the agent's PID or tmux session, send SIGTERM, update registry,
  // reply with confirmation.
  bot.command("stop", async (ctx) => {
    await ctx.reply("TODO: implement /stop — terminate a running agent");
  });

  // /approve <id> — approve a HumanLayer checkpoint
  // TODO: post approval to the HumanLayer API or write an approval token to the
  // path the agent is watching, then reply with confirmation.
  bot.command("approve", async (ctx) => {
    await ctx.reply("TODO: implement /approve — approve a HumanLayer checkpoint");
  });
}
