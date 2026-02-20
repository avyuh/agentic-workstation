import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const BIN = `${process.env.HOME}/bin`;

/** Run a raw shell command */
export async function sh(cmd: string, timeout = 30_000): Promise<string> {
  const { stdout, stderr } = await execAsync(cmd, {
    timeout,
    shell: "/bin/bash",
    env: { ...process.env, PATH: `${BIN}:${process.env.PATH}` },
  });
  return (stdout + stderr).trim();
}
