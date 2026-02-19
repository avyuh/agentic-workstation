import { Bot } from "grammy";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const MAX_MSG = 4000;
const BIN = `${process.env.HOME}/bin`;

function truncate(text: string): string {
  if (text.length <= MAX_MSG) return text;
  return text.slice(0, MAX_MSG) + "\n... (truncated)";
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sh(cmd: string, timeout = 30_000): Promise<string> {
  const { stdout, stderr } = await execAsync(cmd, {
    timeout,
    shell: "/bin/bash",
    env: { ...process.env, PATH: `${BIN}:${process.env.PATH}` },
  });
  return (stdout + stderr).trim();
}

export function registerCommands(bot: Bot): void {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Something need doing?\n\n" +
        "/run <project> <task> - Start an agent\n" +
        "/status - Show running agents\n" +
        "/log <session> [lines] - Tail agent log\n" +
        "/diff <session> - Show git diff\n" +
        "/stop <session> - Stop an agent\n" +
        "/help - Show this message"
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "What you want?\n\n" +
        "/run <project> <task> - Start an agent\n" +
        "/status - Show running agents\n" +
        "/log <session> [lines] - Tail agent log\n" +
        "/diff <session> - Show git diff\n" +
        "/stop <session> - Stop an agent"
    );
  });

  bot.command("run", async (ctx) => {
    const args = ctx.match?.trim();
    if (!args) {
      await ctx.reply("Usage: /run <project> <task>\n\nExample: /run myproject Add user authentication");
      return;
    }

    const spaceIdx = args.indexOf(" ");
    if (spaceIdx === -1) {
      await ctx.reply("Usage: /run <project> <task>\n\nNeed both a project name and a task description.");
      return;
    }

    const project = args.slice(0, spaceIdx);
    const task = args.slice(spaceIdx + 1);

    // Validate project name to prevent injection
    if (!/^[\w-]+$/.test(project)) {
      await ctx.reply("Invalid project name. Use letters, numbers, dash, or underscore.");
      return;
    }

    await ctx.reply(`Work, work! Starting agent on ${project}...`);

    try {
      const escapedTask = task.replace(/'/g, "'\\''");
      const output = await sh(`agent-run '${project}' '${escapedTask}'`, 15_000);
      await ctx.reply(`Right-o!\n\n${truncate(output)}`);
    } catch (err: any) {
      const msg = err.stderr || err.stdout || err.message;
      await ctx.reply(`Something need doing differently...\n\n${truncate(msg)}`);
    }
  });

  bot.command("status", async (ctx) => {
    try {
      const output = await sh("agent-status");
      await ctx.reply(`<pre>${escapeHtml(truncate(output))}</pre>`, { parse_mode: "HTML" });
    } catch (err: any) {
      const msg = err.stderr || err.stdout || err.message;
      if (msg.includes("No agent sessions")) {
        await ctx.reply("Me not busy. Something need doing?");
      } else {
        await ctx.reply(`Error:\n${truncate(msg)}`);
      }
    }
  });

  bot.command("log", async (ctx) => {
    const args = ctx.match?.trim();
    if (!args) {
      await ctx.reply("Usage: /log <session> [lines]");
      return;
    }

    const parts = args.split(/\s+/);
    const session = parts[0];
    const lines = parts[1] || "50";

    if (!/^[\w-]+$/.test(session)) {
      await ctx.reply("Invalid session name.");
      return;
    }

    try {
      const output = await sh(`agent-log '${session}' '${lines}'`);
      await ctx.reply(`<pre>${escapeHtml(truncate(output))}</pre>`, { parse_mode: "HTML" });
    } catch (err: any) {
      await ctx.reply(`Error:\n${truncate(err.stderr || err.message)}`);
    }
  });

  bot.command("diff", async (ctx) => {
    const session = ctx.match?.trim();
    if (!session) {
      await ctx.reply("Usage: /diff <session>");
      return;
    }

    if (!/^[\w-]+$/.test(session)) {
      await ctx.reply("Invalid session name.");
      return;
    }

    try {
      // Resolve project/worktree directory (same logic as agent-run)
      const dir = await sh(`
        if [ -d "$HOME/worktrees/${session}" ]; then echo "$HOME/worktrees/${session}"
        elif [ -d "$HOME/projects/${session}" ]; then echo "$HOME/projects/${session}"
        else echo "NOT_FOUND"; fi
      `);

      if (dir === "NOT_FOUND") {
        await ctx.reply(`No project or worktree found: ${session}`);
        return;
      }

      const output = await sh(`cd '${dir}' && git diff`);
      if (!output) {
        await ctx.reply("No changes.");
        return;
      }
      await ctx.reply(`<pre>${escapeHtml(truncate(output))}</pre>`, { parse_mode: "HTML" });
    } catch (err: any) {
      await ctx.reply(`Error:\n${truncate(err.stderr || err.message)}`);
    }
  });

  bot.command("stop", async (ctx) => {
    const session = ctx.match?.trim();
    if (!session) {
      await ctx.reply("Usage: /stop <session>");
      return;
    }

    if (!/^[\w-]+$/.test(session)) {
      await ctx.reply("Invalid session name.");
      return;
    }

    await ctx.reply(`Okie dokie. Stopping ${session}...`);

    try {
      const output = await sh(`agent-stop '${session}'`, 20_000);
      await ctx.reply(truncate(output));
    } catch (err: any) {
      await ctx.reply(`Error:\n${truncate(err.stderr || err.message)}`);
    }
  });
}
