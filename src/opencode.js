const { EventEmitter } = require("events");
const { execFile, spawn } = require("child_process");
const os = require("os");
const { resolveSpawnTarget } = require("./shell-quote");

function appendBoundedLog(log, chunk) {
  const text = String(chunk || "");
  if (!text) return;

  const entries = text.split(/\r?\n/).filter(Boolean);
  for (const entry of entries) {
    log.push({
      at: new Date().toISOString(),
      line: entry
    });
  }
  while (log.length > 200) log.shift();
}

function findCommand(command) {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      execFile("where.exe", [command], { windowsHide: true }, (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        resolve(stdout.split(/\r?\n/).find(Boolean) || null);
      });
      return;
    }

    execFile("sh", ["-lc", `command -v ${command}`], (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      resolve(stdout.trim().split(/\r?\n/).find(Boolean) || null);
    });
  });
}

async function makeInstallPlan() {
  if (process.env.OPENFORGE_OPENCODE_INSTALL_COMMAND) {
    return {
      display: process.env.OPENFORGE_OPENCODE_INSTALL_COMMAND,
      command: process.env.OPENFORGE_OPENCODE_INSTALL_COMMAND,
      args: [],
      shell: true
    };
  }

  if (process.platform === "win32") {
    const npm = await findCommand("npm");
    if (npm) {
      return {
        display: "npm install -g opencode-ai",
        command: npm,
        args: ["install", "-g", "opencode-ai"],
        shell: true
      };
    }

    const scoop = await findCommand("scoop");
    if (scoop) {
      return {
        display: "scoop install opencode",
        command: scoop,
        args: ["install", "opencode"],
        shell: true
      };
    }

    const choco = await findCommand("choco");
    if (choco) {
      return {
        display: "choco install opencode -y",
        command: choco,
        args: ["install", "opencode", "-y"],
        shell: true
      };
    }

    throw new Error("OpenCode is missing, and npm, Scoop, or Chocolatey were not found.");
  }

  const bash = await findCommand("bash");
  const curl = await findCommand("curl");
  if (bash && curl) {
    return {
      display: "curl -fsSL https://opencode.ai/install | bash",
      command: bash,
      args: ["-lc", "curl -fsSL https://opencode.ai/install | bash"],
      shell: false
    };
  }

  const npm = await findCommand("npm");
  if (npm) {
    return {
      display: "npm install -g opencode-ai",
      command: npm,
      args: ["install", "-g", "opencode-ai"],
      shell: false
    };
  }

  throw new Error("OpenCode is missing, and neither curl+bash nor npm were found.");
}

let modelCatalogCache = null;
let modelCatalogFetchedAt = 0;
const MODEL_CATALOG_TTL_MS = 60 * 60 * 1000;

async function fetchModelCatalog() {
  const now = Date.now();
  if (modelCatalogCache && now - modelCatalogFetchedAt < MODEL_CATALOG_TTL_MS) {
    return modelCatalogCache;
  }
  const response = await fetch("https://models.dev/api.json", { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`models.dev responded with ${response.status}`);
  const data = await response.json();
  modelCatalogCache = data;
  modelCatalogFetchedAt = now;
  return data;
}

function runOpencodeModels(args) {
  const target = resolveSpawnTarget("opencode", args);
  return new Promise((resolve, reject) => {
    execFile(target.file, target.args, { windowsHide: true, timeout: 20_000 }, (error, stdout) => {
      if (error) {
        reject(new Error(error.message));
        return;
      }
      const models = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => /^[^\s/]+\/[^\s]+$/.test(line));
      resolve([...new Set(models)]);
    });
  });
}

async function listModels({ refresh } = {}) {
  const opencodePath = await findCommand("opencode");
  if (!opencodePath) {
    const error = new Error("OpenCode is not installed.");
    error.code = "opencode_not_installed";
    throw error;
  }

  const args = ["models"];
  if (refresh) args.push("--refresh");
  const ids = await runOpencodeModels(args);

  let catalog = null;
  try {
    catalog = await fetchModelCatalog();
  } catch {
    catalog = null;
  }

  return ids.map((id) => {
    const separatorIndex = id.indexOf("/");
    const providerId = id.slice(0, separatorIndex);
    const modelId = id.slice(separatorIndex + 1);
    const entry = catalog?.[providerId]?.models?.[modelId];
    const effortOptions = entry?.reasoning_options?.find((option) => option.type === "effort")?.values || [];
    return { id, reasoning: Boolean(entry?.reasoning), effortOptions };
  });
}

class OpencodeInstaller extends EventEmitter {
  constructor() {
    super();
    this.status = {
      installed: false,
      installing: false,
      path: null,
      checkedAt: null,
      error: null,
      platform: `${os.platform()} ${os.arch()}`,
      log: []
    };
    this.installPromise = null;
  }

  snapshot() {
    return {
      ...this.status,
      log: [...this.status.log]
    };
  }

  emitChange() {
    this.emit("change", this.snapshot());
  }

  async refresh() {
    const opencodePath = await findCommand("opencode");
    this.status.installed = Boolean(opencodePath);
    this.status.path = opencodePath;
    this.status.checkedAt = new Date().toISOString();
    if (opencodePath) this.status.error = null;
    this.emitChange();
    return this.snapshot();
  }

  async ensureInstalled() {
    await this.refresh();
    if (this.status.installed) return this.snapshot();

    if (process.env.OPENFORGE_SKIP_OPENCODE_INSTALL === "1") {
      this.status.error = "OpenCode install skipped by OPENFORGE_SKIP_OPENCODE_INSTALL=1.";
      appendBoundedLog(this.status.log, this.status.error);
      this.emitChange();
      return this.snapshot();
    }

    return this.install();
  }

  async install() {
    if (this.installPromise) return this.installPromise;

    this.installPromise = this.runInstall().finally(() => {
      this.installPromise = null;
    });
    return this.installPromise;
  }

  async runInstall() {
    await this.refresh();
    if (this.status.installed) return this.snapshot();

    if (process.env.OPENFORGE_SKIP_OPENCODE_INSTALL === "1") {
      this.status.error = "OpenCode install skipped by OPENFORGE_SKIP_OPENCODE_INSTALL=1.";
      appendBoundedLog(this.status.log, this.status.error);
      this.emitChange();
      return this.snapshot();
    }

    const plan = await makeInstallPlan();
    this.status.installing = true;
    this.status.error = null;
    appendBoundedLog(this.status.log, `Installing OpenCode with: ${plan.display}`);
    this.emitChange();

    await new Promise((resolve) => {
      const child = spawn(plan.command, plan.args, {
        shell: plan.shell,
        windowsHide: true,
        env: process.env
      });

      child.stdout.on("data", (chunk) => {
        appendBoundedLog(this.status.log, chunk);
        this.emitChange();
      });
      child.stderr.on("data", (chunk) => {
        appendBoundedLog(this.status.log, chunk);
        this.emitChange();
      });
      child.on("error", (error) => {
        this.status.error = error.message;
        appendBoundedLog(this.status.log, error.message);
        resolve();
      });
      child.on("close", (code) => {
        if (code !== 0) {
          this.status.error = `OpenCode installer exited with code ${code}.`;
          appendBoundedLog(this.status.log, this.status.error);
        }
        resolve();
      });
    });

    this.status.installing = false;
    await this.refresh();
    if (!this.status.installed && !this.status.error) {
      this.status.error = "OpenCode was not found on PATH after installation.";
      appendBoundedLog(this.status.log, this.status.error);
      this.emitChange();
    }
    return this.snapshot();
  }
}

module.exports = {
  OpencodeInstaller,
  findCommand,
  listModels
};
