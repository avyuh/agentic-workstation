import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const BIN = `${process.env.HOME}/bin`;

export const MAX_MSG = 4000;

export function truncate(text: string, max = MAX_MSG): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n... (truncated)";
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sh(cmd: string, timeout = 30_000): Promise<string> {
  const { stdout, stderr } = await execAsync(cmd, {
    timeout,
    shell: "/bin/bash",
    env: { ...process.env, PATH: `${BIN}:${process.env.PATH}` },
  });
  return (stdout + stderr).trim();
}

/** List project names from ~/projects/ and ~/worktrees/ */
export async function listProjects(): Promise<string[]> {
  const output = await sh(
    'ls -1 "$HOME/projects/" 2>/dev/null; ls -1 "$HOME/worktrees/" 2>/dev/null'
  );
  return output
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
