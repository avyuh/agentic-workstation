import { Context } from "grammy";
import { listProjects } from "./shell";
import { doStatus, doLog, doDiff, doStop, doRun, doProjects } from "./actions";

// Cache projects for 60s so we're not hitting the filesystem every message
let projectCache: string[] = [];
let cacheTime = 0;

async function getProjects(): Promise<string[]> {
  if (Date.now() - cacheTime > 60_000) {
    projectCache = await listProjects();
    cacheTime = Date.now();
  }
  return projectCache;
}

export async function routeMessage(ctx: Context): Promise<void> {
  const raw = ctx.message?.text?.trim();
  if (!raw) return;

  const text = raw.toLowerCase();

  // --- Status ---
  if (/^(status|what'?s running|agents?|who'?s working|running\??)$/i.test(text)) {
    return doStatus(ctx);
  }

  // --- Projects list ---
  if (/^(projects?|list projects?|what projects?)$/i.test(text)) {
    return doProjects(ctx);
  }

  // --- Log: "log <session>" or "log <session> <lines>" ---
  const logMatch = raw.match(/^(?:log|logs|show log|tail)\s+([\w-]+)(?:\s+(\d+))?$/i);
  if (logMatch) {
    return doLog(ctx, logMatch[1], logMatch[2] || "50");
  }

  // --- Stop: "stop <session>" ---
  const stopMatch = raw.match(/^(?:stop|kill|cancel)\s+([\w-]+)$/i);
  if (stopMatch) {
    return doStop(ctx, stopMatch[1]);
  }

  // --- Diff: "diff <session>" ---
  const diffMatch = raw.match(/^(?:diff|changes|show diff)\s+([\w-]+)$/i);
  if (diffMatch) {
    return doDiff(ctx, diffMatch[1]);
  }

  // --- Run: explicit "run <project> <task>" ---
  const runMatch = raw.match(/^run\s+([\w-]+)\s+(.+)$/i);
  if (runMatch) {
    return doRun(ctx, runMatch[1], runMatch[2]);
  }

  // --- Freeform: "<project> <task>" or "<project>: <task>" ---
  // If the first word matches a known project, treat rest as task
  const projects = await getProjects();
  const firstWord = raw.split(/[\s:]+/)[0];

  if (projects.includes(firstWord)) {
    const task = raw.slice(firstWord.length).replace(/^[\s:]+/, "").trim();
    if (task) {
      return doRun(ctx, firstWord, task);
    }
    // Just the project name — show diff
    return doDiff(ctx, firstWord);
  }

  // --- Don't know ---
  const projectList = projects.length > 0 ? projects.join(", ") : "(none found)";
  await ctx.reply(
    "Not sure what you need. Try:\n\n" +
      "status - what's running\n" +
      "log <session> - see output\n" +
      "stop <session> - kill an agent\n" +
      "diff <session> - see changes\n" +
      "<project> <task> - start an agent\n" +
      `\nProjects: ${projectList}`
  );
}
