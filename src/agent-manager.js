const { EventEmitter } = require("events");
const { spawn } = require("child_process");
const crypto = require("crypto");
const path = require("path");
const { resolveSpawnTarget, killTree } = require("./shell-quote");

function splitArgs(input) {
  if (!input) return [];

  const args = [];
  const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = regex.exec(input))) {
    args.push(match[1] ?? match[2] ?? match[3]);
  }
  return args;
}

function appendBounded(value, chunk, maxChars = 120_000) {
  const next = `${value || ""}${String(chunk || "")}`;
  return next.length > maxChars ? next.slice(-maxChars) : next;
}

function normalizeDays(days) {
  const unique = new Set();
  for (const day of Array.isArray(days) ? days : []) {
    const value = Number(day);
    if (Number.isInteger(value) && value >= 0 && value <= 6) unique.add(value);
  }
  return [...unique].sort((a, b) => a - b);
}

function normalizeTime(value) {
  const text = String(value || "09:00");
  return /^\d{2}:\d{2}$/.test(text) ? text : "09:00";
}

function computeNextRunAt(schedule, fromDate = new Date()) {
  const days = normalizeDays(schedule?.days);
  if (!days.length) return null;

  const [hours, minutes] = normalizeTime(schedule?.time).split(":").map(Number);
  for (let offset = 0; offset <= 14; offset += 1) {
    const candidate = new Date(fromDate);
    candidate.setSeconds(0, 0);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);
    if (days.includes(candidate.getDay()) && candidate > fromDate) {
      return candidate.toISOString();
    }
  }
  return null;
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;

class AgentManager extends EventEmitter {
  constructor({ store, defaultCwd, workspaceRoot }) {
    super();
    this.store = store;
    this.defaultCwd = path.resolve(defaultCwd || process.cwd());
    this.workspaceRoot = workspaceRoot ? path.resolve(workspaceRoot) : null;
    this.running = new Set();
    this.processes = new Map();
    this.timer = null;
    this.timeoutMs = Number(process.env.OPENFORGE_AGENT_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  }

  async reconcileOrphanedRuns() {
    const orphaned = this.store.getAgentRuns(null, Infinity).filter((run) => run.status === "running");
    for (const run of orphaned) {
      const finishedAt = new Date().toISOString();
      await this.store.updateAgentRun(run.id, {
        status: "failed",
        finishedAt,
        error: "Interrupted by server restart."
      });
      const agent = this.store.getAgent(run.agentId);
      if (agent && agent.lastRunId === run.id) {
        await this.store.updateAgent(run.agentId, { status: "failed" });
      }
    }
    if (orphaned.length) this.emit("agents:changed", this.store.getAgents());
  }

  start() {
    if (this.timer) return;
    this.reconcileOrphanedRuns().catch((error) => console.error("Agent reconciliation failed:", error));
    this.timer = setInterval(() => {
      this.tick().catch((error) => console.error("Agent scheduler failed:", error));
    }, 30_000);
    this.tick().catch((error) => console.error("Agent scheduler failed:", error));
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  resolveCwd(cwd) {
    const resolved = path.resolve(cwd || this.defaultCwd);
    if (this.workspaceRoot && !isInside(this.workspaceRoot, resolved)) {
      const error = new Error(`Working directory must be inside ${this.workspaceRoot}`);
      error.code = "path_outside_workspace";
      throw error;
    }
    return resolved;
  }

  normalizeAgent(input, existing = {}) {
    const schedule = {
      days: normalizeDays(input.schedule?.days),
      time: normalizeTime(input.schedule?.time)
    };
    const now = new Date().toISOString();
    const enabled = Boolean(input.enabled);
    const agent = {
      ...existing,
      id: existing.id || crypto.randomUUID(),
      name: String(input.name || existing.name || "New Agent").trim().slice(0, 80) || "New Agent",
      description: String(input.description || "").trim().slice(0, 400),
      cwd: this.resolveCwd(input.cwd || existing.cwd || this.defaultCwd),
      prompt: String(input.prompt || "").trim(),
      model: String(input.model ?? existing.model ?? "").trim().slice(0, 200),
      variant: String(input.variant ?? existing.variant ?? "").trim().slice(0, 100),
      enabled,
      schedule,
      status: existing.status || "idle",
      createdAt: existing.createdAt || now,
      updatedAt: now
    };
    agent.nextRunAt = enabled ? computeNextRunAt(schedule) : null;
    return agent;
  }

  async listAgents() {
    return this.store.getAgents();
  }

  async createAgent(input) {
    const agent = this.normalizeAgent(input);
    await this.store.addAgent(agent);
    this.emit("agents:changed", this.store.getAgents());
    return agent;
  }

  async updateAgent(id, input) {
    const existing = this.store.getAgent(id);
    if (!existing) return null;
    const agent = this.normalizeAgent(input, existing);
    await this.store.updateAgent(id, agent);
    this.emit("agents:changed", this.store.getAgents());
    return this.store.getAgent(id);
  }

  async removeAgent(id) {
    const removed = await this.store.removeAgent(id);
    if (removed) this.emit("agents:changed", this.store.getAgents());
    return removed;
  }

  async tick() {
    const now = new Date();
    for (const agent of this.store.getAgents()) {
      if (!agent.enabled || this.running.has(agent.id)) continue;
      if (!agent.nextRunAt) {
        await this.store.updateAgent(agent.id, {
          nextRunAt: computeNextRunAt(agent.schedule),
          status: agent.status || "idle"
        });
        continue;
      }
      if (new Date(agent.nextRunAt) <= now) {
        this.runAgent(agent.id, "schedule").catch((error) => {
          console.error(`Scheduled agent ${agent.id} failed:`, error);
        });
      }
    }
  }

  buildCommand(agent) {
    const command =
      process.env.OPENFORGE_AGENT_COMMAND ||
      process.env.OPENFORGE_OPENCODE_COMMAND ||
      "opencode";
    const envArgs = splitArgs(process.env.OPENFORGE_AGENT_ARGS || "");
    if (envArgs.length) {
      const hasPromptPlaceholder = envArgs.some((arg) => arg.includes("{prompt}"));
      const args = envArgs.map((arg) =>
        arg
          .replaceAll("{prompt}", agent.prompt)
          .replaceAll("{cwd}", agent.cwd)
          .replaceAll("{model}", agent.model || "")
          .replaceAll("{variant}", agent.variant || "")
      );
      if (!hasPromptPlaceholder) args.push(agent.prompt);
      return { command, args };
    }
    const args = ["run", "--auto", "--dir", agent.cwd];
    if (agent.model) args.push("--model", agent.model);
    if (agent.variant) args.push("--variant", agent.variant);
    args.push(agent.prompt);
    return { command, args };
  }

  stopAgent(agentId) {
    const processState = this.processes.get(agentId);
    if (!processState) {
      const error = new Error("Agent is not running.");
      error.code = "agent_not_running";
      throw error;
    }
    processState.stopRequested = true;
    killTree(processState.child);
    return true;
  }

  async runAgent(agentId, trigger = "manual") {
    const agent = this.store.getAgent(agentId);
    if (!agent) {
      const error = new Error("Agent not found.");
      error.code = "agent_not_found";
      throw error;
    }
    if (!agent.prompt) {
      const error = new Error("Agent prompt is required.");
      error.code = "agent_prompt_required";
      throw error;
    }
    if (this.running.has(agentId)) {
      const error = new Error("Agent is already running.");
      error.code = "agent_already_running";
      throw error;
    }

    const nextRunAt = agent.enabled ? computeNextRunAt(agent.schedule, new Date(Date.now() + 1000)) : null;
    const run = {
      id: crypto.randomUUID(),
      agentId,
      agentName: agent.name,
      trigger,
      status: "running",
      cwd: agent.cwd,
      prompt: agent.prompt,
      command: null,
      args: [],
      startedAt: new Date().toISOString(),
      finishedAt: null,
      durationMs: null,
      exitCode: null,
      signal: null,
      stdout: "",
      stderr: "",
      error: null
    };

    const command = this.buildCommand(agent);
    run.command = command.command;
    run.args = command.args;
    await this.store.addAgentRun(run);
    await this.store.updateAgent(agentId, {
      status: "running",
      lastRunAt: run.startedAt,
      lastRunId: run.id,
      nextRunAt
    });
    this.emit("agents:changed", this.store.getAgents());
    this.emit("runs:changed", { agentId, runs: this.store.getAgentRuns(agentId) });

    this.running.add(agentId);
    const started = Date.now();

    let timedOut = false;
    const target = resolveSpawnTarget(command.command, command.args);

    await new Promise((resolve) => {
      const child = spawn(target.file, target.args, {
        cwd: agent.cwd,
        env: process.env,
        windowsHide: true
      });
      const processState = { child, stopRequested: false };
      this.processes.set(agentId, processState);

      const timeoutTimer = setTimeout(() => {
        timedOut = true;
        killTree(child);
      }, this.timeoutMs);
      timeoutTimer.unref();

      child.stdout.on("data", async (chunk) => {
        run.stdout = appendBounded(run.stdout, chunk);
        await this.store.updateAgentRun(run.id, { stdout: run.stdout });
        this.emit("runs:changed", { agentId, runs: this.store.getAgentRuns(agentId) });
      });

      child.stderr.on("data", async (chunk) => {
        run.stderr = appendBounded(run.stderr, chunk);
        await this.store.updateAgentRun(run.id, { stderr: run.stderr });
        this.emit("runs:changed", { agentId, runs: this.store.getAgentRuns(agentId) });
      });

      child.on("error", (error) => {
        clearTimeout(timeoutTimer);
        run.error = error.message;
        run.status = "failed";
        resolve();
      });

      child.on("close", (code, signal) => {
        clearTimeout(timeoutTimer);
        run.exitCode = code;
        run.signal = signal;
        run.status = code === 0 ? "success" : "failed";
        if (timedOut) run.error = `Timed out after ${this.timeoutMs}ms.`;
        else if (processState.stopRequested) run.error = "Stopped by user.";
        resolve();
      });
    });

    this.processes.delete(agentId);
    this.running.delete(agentId);
    run.finishedAt = new Date().toISOString();
    run.durationMs = Date.now() - started;
    await this.store.updateAgentRun(run.id, run);
    await this.store.updateAgent(agentId, {
      status: run.status,
      lastRunAt: run.finishedAt,
      lastRunId: run.id,
      nextRunAt
    });
    this.emit("agents:changed", this.store.getAgents());
    this.emit("runs:changed", { agentId, runs: this.store.getAgentRuns(agentId) });
    return run;
  }
}

module.exports = {
  AgentManager,
  computeNextRunAt
};
