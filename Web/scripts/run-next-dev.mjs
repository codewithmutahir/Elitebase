/**
 * Launch Next.js with Node 20 when available.
 * Cursor/PATH often prefers a system Node 26 at "C:\\Program Files\\nodejs"
 * even after `nvm use 20`, which causes spawn UNKNOWN + warning floods.
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

if (path.normalize(node.path) !== path.normalize(process.execPath)) {
  console.log(`[elitebase] Using Node ${node.version} (${node.path})`);
}

const nodeDir = path.dirname(node.path);
const env = {
  ...process.env,
  PATH: `${nodeDir}${path.delimiter}${process.env.PATH || ""}`,
};

if (node.major >= 22) {
  const silence = [
    "--disable-warning=DEP0205",
    "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
    "--no-deprecation",
  ];
  const existing = (env.NODE_OPTIONS || "").split(/\s+/).filter(Boolean);
  env.NODE_OPTIONS = [...new Set([...silence, ...existing])].join(" ");
}

const child = spawn(
  node.path,
  // Cap well below machine RAM: 8192 on ~16GB PCs lets Next + Cursor swap-thrash the IDE.
  ["--max-old-space-size=4096", nextBin, "dev", "-H", "0.0.0.0", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    cwd: webRoot,
    env,
    windowsHide: true,
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
