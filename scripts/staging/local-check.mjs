import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const cwd = fileURLToPath(new URL("../../", import.meta.url));
if (process.argv.length !== 2)
  throw new Error("Offline checker accepts no target or live-mode arguments.");
const branch = execFileSync("git", ["branch", "--show-current"], {
  cwd,
  encoding: "utf8",
}).trim();
if (!["feature/monetcore-vps-staging", "feature/monetcore-vps-completed"].includes(branch))
  throw new Error("Use the approved development branch.");
const result = spawnSync(
  process.execPath,
  [
    "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
    "--import",
    "./tests/staging/offline-guard.mjs",
    "--import",
    "./tests/register.mjs",
    "--test",
    "./tests/staging/preparation.test.mjs",
  ],
  { cwd, stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
