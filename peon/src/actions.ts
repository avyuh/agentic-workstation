import { sh, truncate, escapeHtml, listProjects } from "./shell";
import { Context } from "grammy";

export async function doStatus(ctx: Context): Promise<void> {
  try {
    const output = await sh("agent-status");
    await ctx.reply(`<pre>${escapeHtml(truncate(output))}</pre>`, { parse_mode: "HTML" });
  } catch (err: any) {
    const msg = err.stderr || err.stdout || err.message;
    if (msg.includes("No agent sessions")) {
      await ctx.reply("No agents running. Something need doing?");
    } else {
      await ctx.reply(`Error:\n${truncate(msg)}`);
    }
  }
}

export async function doLog(ctx: Context, session: string, lines = "50"): Promise<void> {
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
}

export async function doDiff(ctx: Context, session: string): Promise<void> {
  if (!/^[\w-]+$/.test(session)) {
    await ctx.reply("Invalid session name.");
    return;
  }
  try {
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
}

export async function doStop(ctx: Context, session: string): Promise<void> {
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
}

export async function doRun(ctx: Context, project: string, task: string): Promise<void> {
  if (!/^[\w-]+$/.test(project)) {
    await ctx.reply("Invalid project name.");
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
}

export async function doProjects(ctx: Context): Promise<void> {
  try {
    const projects = await listProjects();
    if (projects.length === 0) {
      await ctx.reply("No projects found in ~/projects/ or ~/worktrees/");
      return;
    }
    await ctx.reply("Projects:\n" + projects.map((p) => `  ${p}`).join("\n"));
  } catch (err: any) {
    await ctx.reply(`Error:\n${truncate(err.message)}`);
  }
}
