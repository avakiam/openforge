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
    terminalSessions: []
  };
}

class Store {
  constructor() {
    this.dataDir = getDataDir();
    this.stateFile = path.join(this.dataDir, "state.json");
    this.state = createDefaultState();
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

    if (changed || !fs.existsSync(this.stateFile)) {
      await this.save();
    }
  }

  async save() {
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
}

module.exports = {
  Store
};
