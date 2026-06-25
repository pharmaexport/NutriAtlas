import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "python" : "python3";
const result = spawnSync(command, ["scripts/generate-ciqual-index.py"], {
  stdio: "inherit",
  shell: false
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
