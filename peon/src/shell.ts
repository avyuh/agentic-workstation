import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const BIN = `${process.env.HOME}/bin`;
const NVM = `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`;

export const MAX_MSG = 4000;

export function truncate(text: string, max = MAX_MSG): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n... (truncated)";
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Run a raw shell command */
export async function sh(cmd: string, timeout = 30_000): Promise<string> {
  const { stdout, stderr } = await execAsync(cmd, {
    timeout,
    shell: "/bin/bash",
    env: { ...process.env, PATH: `${BIN}:${process.env.PATH}` },
  });
  return (stdout + stderr).trim();
}

/** Run claude -p with a prompt */
export async function claude(prompt: string, timeout = 120_000): Promise<string> {
  const escaped = prompt.replace(/'/g, "'\\''");
  const cmd = `${NVM} && claude -p '${escaped}' --allowedTools 'Bash(npm:*) Bash(npx:*) Bash(node:*) Bash(git:*) Bash(mkdir:*) Bash(chmod:*) Bash(cat:*) Bash(ls:*) Read Write Edit Glob Grep'`;
  const { stdout } = await execAsync(cmd, {
    timeout,
    shell: "/bin/bash",
    cwd: process.env.HOME,
    env: { ...process.env, PATH: `${BIN}:${process.env.PATH}` },
    maxBuffer: 1024 * 1024,
  });
  return stdout.trim();
}
