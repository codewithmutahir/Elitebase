/**
 * Launch Next.js with Node 20 when available.
 * Cursor/PATH often prefers a system Node 26 at "C:\\Program Files\\nodejs"
 * even after `nvm use 20`, which causes spawn UNKNOWN + warning floods.
 *
 * Also kills leftover elitebase Next/PostCSS workers before start — a bad
 * compile (e.g. broken @config path) can orphan hundreds of postcss.js
 * children and freeze Windows via RAM exhaustion.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");

function majorOf(nodePath) {
  const r = spawnSync(nodePath, ["-p", "process.versions.node"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (r.status !== 0) return null;
  const v = (r.stdout || "").trim();
  const major = Number(v.split(".")[0]);
  return Number.isFinite(major) ? { version: v, major } : null;
}

function candidates() {
  const list = [];
  const nvmHome =
    process.env.NVM_HOME ||
    path.join(process.env.LOCALAPPDATA || "", "Author Software", "nvm");

  if (nvmHome) {
    list.push(path.join(nvmHome, ".nodejs", "node.exe"));
    const installs = path.join(nvmHome, "installs");
    if (fs.existsSync(installs)) {
      for (const name of fs.readdirSync(installs).sort().reverse()) {
        if (/^v?20\./.test(name) || name === "v20.20.2") {
          list.push(path.join(installs, name, "node.exe"));
        }
      }
      for (const name of fs.readdirSync(installs).sort().reverse()) {
        if (/^v?20\./.test(name)) continue;
        list.push(path.join(installs, name, "node.exe"));
      }
    }
  }

  list.push(process.execPath);
  return list;
}

function resolveNode() {
  let preferred = null;
  let fallback = null;

  for (const candidate of candidates()) {
    if (!candidate || !fs.existsSync(candidate)) continue;
    const info = majorOf(candidate);
    if (!info) continue;
    if (info.major === 20) {
      preferred = { path: candidate, ...info };
      break;
    }
    if (!fallback) fallback = { path: candidate, ...info };
  }

  return preferred || fallback;
}

/**
 * Kill orphaned Next/Turbopack/PostCSS node workers from prior elitebase runs.
 * Never kills this launcher process.
 */
function killOrphanedElitebaseWorkers() {
  if (process.platform !== "win32") return 0;

  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$self = ${process.pid}
$needle = '${webRoot.replace(/'/g, "''")}'.ToLowerInvariant()
$match = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object {
  if (-not $_.CommandLine) { return $false }
  if ($_.ProcessId -eq $self) { return $false }
  $cmd = $_.CommandLine.ToLowerInvariant()
  return ($cmd.Contains($needle) -or $cmd.Contains('.next\\dev\\build\\postcss'))
})
$count = $match.Count
foreach ($p in $match) { Stop-Process -Id $p.ProcessId -Force }
Write-Output $count
`.trim();

  const r = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
    { encoding: "utf8", windowsHide: true, timeout: 60_000 }
  );
  if (r.status !== 0) return 0;
  const n = Number((r.stdout || "").trim().split(/\r?\n/).pop());
  return Number.isFinite(n) ? n : 0;
}

function assertTailwindConfigResolvable() {
  const rootConfig = path.join(webRoot, "tailwind.config.mjs");
  const appConfig = path.join(webRoot, "app", "tailwind.config.mjs");
  if (!fs.existsSync(rootConfig) || !fs.existsSync(appConfig)) {
    console.error(
      `[elitebase] Tailwind config missing.\n` +
        `  Need both:\n` +
        `    ${rootConfig}\n` +
        `    ${appConfig}  (re-export for Turbopack @config from app/)\n` +
        `  globals.css must use @config "./tailwind.config.mjs".\n` +
        `  A broken path spawns endless PostCSS workers and can freeze Windows.`
    );
    process.exit(1);
  }
}

const node = resolveNode();
if (!node) {
  console.error("[elitebase] Could not find a Node.js binary.");
  process.exit(1);
}

if (node.major >= 25) {
  console.error(
    `\n[elitebase] Refusing to start on Node ${node.version}.\n` +
      `  Next.js on Node 25+ breaks on Windows (spawn UNKNOWN) and floods Cursor.\n` +
      `  Fix:\n` +
      `    1) nvm install 20\n` +
      `    2) nvm use 20\n` +
      `    3) Close this terminal, open a NEW one, confirm: node -v  -> v20.x\n` +
      `    4) If still v26: uninstall/rename "C:\\\\Program Files\\\\nodejs" (system Node)\n` +
      `       so nvm's Node wins PATH, then retry.\n`
  );
  process.exit(1);
}

assertTailwindConfigResolvable();

const orphans = killOrphanedElitebaseWorkers();
if (orphans > 0) {
  console.log(`[elitebase] Cleared ${orphans} leftover Next/PostCSS worker(s)`);
}

if (path.normalize(node.path) !== path.normalize(process.execPath)) {
  console.log(`[elitebase] Using Node ${node.version} (${node.path})`);
}

const nodeDir = path.dirname(node.path);
const env = {
  ...process.env,
  PATH: `${nodeDir}${path.delimiter}${process.env.PATH || ""}`,
  UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE || "4",
};

const nodeOpts = [
  "--max-old-space-size=4096",
  // Avoid intermittent ENOTFOUND/fetch failures to Cloudflare dual-stack hosts (Resend, Upstash).
  "--dns-result-order=ipv4first",
  "--disable-warning=DEP0205",
  "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
  "--no-deprecation",
];
const existing = (env.NODE_OPTIONS || "").split(/\s+/).filter(Boolean);
env.NODE_OPTIONS = [...new Set([...nodeOpts, ...existing])].join(" ");

const child = spawn(
  node.path,
  // Cap well below machine RAM: 8192 on ~16GB PCs lets Next + Cursor swap-thrash the IDE.
  [
    "--max-old-space-size=4096",
    "--dns-result-order=ipv4first",
    nextBin,
    "dev",
    "-H",
    "0.0.0.0",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    cwd: webRoot,
    env,
    windowsHide: true,
  }
);

function shutdown(signal) {
  try {
    child.kill(signal);
  } catch {
    /* ignore */
  }
  // Give the tree a moment, then reap stragglers.
  setTimeout(() => {
    killOrphanedElitebaseWorkers();
    process.exit(0);
  }, 500);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

child.on("exit", (code, signal) => {
  killOrphanedElitebaseWorkers();
  if (signal) {
    process.exit(0);
    return;
  }
  process.exit(code ?? 1);
});
