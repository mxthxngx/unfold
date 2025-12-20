#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const subcommand = args[0];

// Default to production config.
// Use the dev config for `tauri dev`.
const configPath =
  subcommand === "dev"
    ? path.join(repoRoot, "src-tauri", "tauri.conf.dev.json")
    : path.join(repoRoot, "src-tauri", "tauri.conf.json");

const env = {
  ...process.env,
  TAURI_CONFIG: configPath,
};

const tauriBin = process.platform === "win32" ? "tauri.cmd" : "tauri";
const tauriPath = path.join(repoRoot, "node_modules", ".bin", tauriBin);

const child = spawn(tauriPath, args, {
  stdio: "inherit",
  env,
  cwd: repoRoot,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
