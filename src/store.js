const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

function getDataDir() {
  return path.resolve(process.env.OPENFORGE_DATA_DIR || path.join(process.cwd(), "data"));
}

function createDefaultState() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    cookieSecret: crypto.randomBytes(32).toString("hex"),
    users: [],
    terminalSessions: [],
    agents: [],
    agentRuns: []
  };
}

class Store {
  constructor() {
    this.dataDir = getDataDir();
    this.stateFile = path.join(this.dataDir, "state.json");
    this.state = createDefaultState();
    this.saveQueue = Promise.resolve();
  }

  async init() {
    await fsp.mkdir(this.dataDir, { recursive: true });

    if (fs.existsSync(this.stateFile)) {
      const raw = await fsp.readFile(this.stateFile, "utf8");
      this.state = JSON.parse(raw);
    }

    let changed = false;
    if (!this.state.cookieSecret) {
      this.state.cookieSecret = crypto.randomBytes(32).toString("hex");
      changed = true;
    }
    if (!Array.isArray(this.state.users)) {
      this.state.users = [];
      changed = true;
    }
    if (!Array.isArray(this.state.terminalSessions)) {
      this.state.terminalSessions = [];
      changed = true;
    }
    if (!Array.isArray(this.state.agents)) {
      this.state.agents = [];
      changed = true;
    }
    if (!Array.isArray(this.state.agentRuns)) {
      this.state.agentRuns = [];
      changed = true;
    }

    if (changed || !fs.existsSync(this.stateFile)) {
      await this.save();
    }
  }

  // Concurrent callers (e.g. rapid stdout/stderr chunks from an agent run) can each
  // trigger a save() before the previous one finishes. Since every call writes to the
  // same pid-based tmp file, overlapping writes race on the rename and one of them fails
  // with ENOENT because the other already renamed it away. Chaining through saveQueue
  // ensures only one write+rename is in flight at a time.
  async save() {
    this.saveQueue = this.saveQueue.catch(() => {}).then(() => this.writeState());
    return this.saveQueue;
  }

  async writeState() {
    await fsp.mkdir(this.dataDir, { recursive: true });
    const tmpFile = `${this.stateFile}.${process.pid}.tmp`;
    await fsp.writeFile(tmpFile, `${JSON.stringify(this.state, null, 2)}\n`, { mode: 0o600 });
    await fsp.rename(tmpFile, this.stateFile);
  }

  hasUsers() {
    return this.state.users.length > 0;
  }

  getSessionSecret() {
    return this.state.cookieSecret;
  }

  getUserByUsername(username) {
    const normalized = username.toLowerCase();
    return this.state.users.find((user) => user.username.toLowerCase() === normalized);
  }

  getUserById(id) {
    return this.state.users.find((user) => user.id === id);
  }

  async addUser({ username, passwordHash }) {
    const user = {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    this.state.users.push(user);
    await this.save();
    return user;
  }

  getTerminalSessions() {
    return this.state.terminalSessions.map((session) => ({ ...session }));
  }

  async upsertTerminalSession(session) {
    const persisted = {
      id: session.id,
      title: session.title,
      cwd: session.cwd,
      createdAt: session.createdAt,
      updatedAt: new Date().toISOString()
    };

    const index = this.state.terminalSessions.findIndex((item) => item.id === session.id);
    if (index >= 0) {
      this.state.terminalSessions[index] = {
        ...this.state.terminalSessions[index],
        ...persisted
      };
    } else {
      this.state.terminalSessions.push(persisted);
    }

    await this.save();
  }

  async removeTerminalSession(id) {
    const nextSessions = this.state.terminalSessions.filter((session) => session.id !== id);
    if (nextSessions.length === this.state.terminalSessions.length) return;
    this.state.terminalSessions = nextSessions;
    await this.save();
  }

  getAgents() {
    return this.state.agents.map((agent) => ({ ...agent, schedule: { ...agent.schedule } }));
  }

  getAgent(id) {
    const agent = this.state.agents.find((item) => item.id === id);
    return agent ? { ...agent, schedule: { ...agent.schedule } } : null;
  }

  async addAgent(agent) {
    this.state.agents.push(agent);
    await this.save();
    return this.getAgent(agent.id);
  }

  async updateAgent(id, patch) {
    const index = this.state.agents.findIndex((agent) => agent.id === id);
    if (index < 0) return null;
    this.state.agents[index] = {
      ...this.state.agents[index],
      ...patch,
      schedule: {
        ...this.state.agents[index].schedule,
        ...(patch.schedule || {})
      },
      updatedAt: new Date().toISOString()
    };
    await this.save();
    return this.getAgent(id);
  }

  async removeAgent(id) {
    const nextAgents = this.state.agents.filter((agent) => agent.id !== id);
    if (nextAgents.length === this.state.agents.length) return false;
    this.state.agents = nextAgents;
    this.state.agentRuns = this.state.agentRuns.filter((run) => run.agentId !== id);
    await this.save();
    return true;
  }

  getAgentRuns(agentId, limit = 25) {
    return this.state.agentRuns
      .filter((run) => !agentId || run.agentId === agentId)
      .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))
      .slice(0, limit)
      .map((run) => ({ ...run }));
  }

  async addAgentRun(run) {
    this.state.agentRuns.push(run);
    this.pruneAgentRuns();
    await this.save();
    return { ...run };
  }

  async updateAgentRun(id, patch) {
    const index = this.state.agentRuns.findIndex((run) => run.id === id);
    if (index < 0) return null;
    this.state.agentRuns[index] = {
      ...this.state.agentRuns[index],
      ...patch
    };
    this.pruneAgentRuns();
    await this.save();
    return { ...this.state.agentRuns[index] };
  }

  pruneAgentRuns() {
    const maxRuns = Number(process.env.OPENFORGE_MAX_AGENT_RUNS || 200);
    if (this.state.agentRuns.length <= maxRuns) return;
    this.state.agentRuns = this.state.agentRuns
      .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))
      .slice(0, maxRuns);
  }
}

module.exports = {
  Store
};
