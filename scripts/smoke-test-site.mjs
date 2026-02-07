#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log(`Usage:
  node scripts/smoke-test-site.mjs [--start-server]

Options:
  --start-server           Start Next.js production server before tests.

Environment variables:
  BASE_URL                 Base URL to test (default: http://127.0.0.1:SMOKE_PORT).
  SMOKE_PORT               Port used when BASE_URL is not set (default: 3301).
  SMOKE_TIMEOUT_MS         Request timeout in ms (default: 12000).
  SMOKE_STARTUP_TIMEOUT_MS Startup timeout in ms when starting server (default: 90000).
  SMOKE_VERBOSE            Set to 1 to print server logs while smoke tests run.
`);
  process.exit(0);
}

const shouldStartServer = args.has("--start-server");
const defaultPort = shouldStartServer ? 3301 : 3000;
const smokePort = Number(process.env.SMOKE_PORT || String(defaultPort));
const requestTimeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || "12000");
const startupTimeoutMs = Number(process.env.SMOKE_STARTUP_TIMEOUT_MS || "90000");
const baseUrl = (process.env.BASE_URL || `http://127.0.0.1:${smokePort}`).replace(
  /\/+$/,
  ""
);
const verbose = process.env.SMOKE_VERBOSE === "1";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm" : "npm";
let serverProcess = null;

const checks = [
  { path: "/", statuses: [200] },
  { path: "/shop", statuses: [200] },
  { path: "/admin/login", statuses: [200] },
  { path: "/api/products", statuses: [200], json: true },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();
  // Small backoff + retry loop until endpoint is available.
  while (Date.now() - startedAt < timeoutMs) {
    if (serverProcess && serverProcess.exitCode !== null) {
      throw new Error(`Server exited early with code ${serverProcess.exitCode}`);
    }

    try {
      const response = await fetchWithTimeout(url, Math.min(requestTimeoutMs, 4000));
      if (response.ok) {
        return;
      }
    } catch {
      // Keep retrying until timeout.
    }

    await sleep(1000);
  }

  throw new Error(`Server was not ready within ${timeoutMs}ms`);
}

function startServer() {
  if (isWindows) {
    serverProcess = spawn(
      `${npmCommand} run start -- -H 127.0.0.1 -p ${smokePort}`,
      {
        env: { ...process.env, NODE_ENV: "production" },
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      }
    );
  } else {
    serverProcess = spawn(
      npmCommand,
      ["run", "start", "--", "-H", "127.0.0.1", "-p", String(smokePort)],
      {
        env: { ...process.env, NODE_ENV: "production" },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
  }

  if (verbose) {
    serverProcess.stdout.on("data", (chunk) => {
      process.stdout.write(`[server] ${chunk}`);
    });
    serverProcess.stderr.on("data", (chunk) => {
      process.stderr.write(`[server] ${chunk}`);
    });
  }
}

async function ensureServerBooted(minUptimeMs = 1200) {
  await sleep(minUptimeMs);
  if (serverProcess && serverProcess.exitCode !== null) {
    throw new Error(`Server exited before readiness check (code ${serverProcess.exitCode})`);
  }
}

async function stopServer() {
  if (!serverProcess || serverProcess.exitCode !== null) {
    return;
  }

  if (isWindows && serverProcess.pid) {
    spawnSync("taskkill", ["/PID", String(serverProcess.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    return;
  }

  serverProcess.kill("SIGTERM");
  await sleep(750);
  if (serverProcess.exitCode === null) {
    serverProcess.kill("SIGKILL");
  }
}

async function runSmokeChecks() {
  console.log(`Running smoke checks against ${baseUrl}`);

  let products = [];

  for (const check of checks) {
    const url = `${baseUrl}${check.path}`;
    const response = await fetchWithTimeout(url, requestTimeoutMs);

    if (!check.statuses.includes(response.status)) {
      throw new Error(
        `Check failed for ${check.path}: status ${response.status}, expected ${check.statuses.join(", ")}`
      );
    }

    console.log(`OK ${check.path} (${response.status})`);

    if (check.json) {
      const payload = await response.json();
      if (!Array.isArray(payload)) {
        throw new Error(`Expected JSON array from ${check.path}`);
      }
      products = payload;
      console.log(`OK ${check.path} returned ${products.length} products`);
    }
  }

  const firstProductWithSlug = products.find(
    (item) => item && typeof item.slug === "string" && item.slug.trim().length > 0
  );

  if (firstProductWithSlug) {
    const slugPath = `/shop/${encodeURIComponent(firstProductWithSlug.slug.trim())}`;
    const response = await fetchWithTimeout(`${baseUrl}${slugPath}`, requestTimeoutMs);

    if (response.status !== 200) {
      throw new Error(`Check failed for ${slugPath}: status ${response.status}, expected 200`);
    }

    console.log(`OK ${slugPath} (${response.status})`);
  } else {
    console.log("Skipped /shop/[slug] check because no product slug was available.");
  }
}

async function main() {
  try {
    if (shouldStartServer) {
      console.log(`Starting Next.js production server on port ${smokePort}...`);
      startServer();
      await ensureServerBooted();
      await waitForServer(`${baseUrl}/api/products`, startupTimeoutMs);
      console.log("Server is ready.");
    }

    await runSmokeChecks();
    console.log("Smoke test suite completed successfully.");
  } finally {
    await stopServer();
  }
}

main().catch((error) => {
  console.error("Smoke test suite failed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
