const { EventEmitter } = require("events");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const pty = require("@homebridge/node-pty-prebuilt-multiarch");

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

function posixQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function windowsQuote(value) {
  const text = String(value);
  if (!/[ \t"&|<>^]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

class TerminalManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
    this.defaultCwd = path.resolve(process.env.OPENFORGE_DEFAULT_CWD || process.cwd());
    this.workspaceRoot = process.env.OPENFORGE_WORKSPACE_ROOT
      ? path.resolve(process.env.OPENFORGE_WORKSPACE_ROOT)
      : null;
    this.nextNumber = 1;
    this.maxBufferChars = 250_000;
  }

  listSessions() {
    return [...this.sessions.values()].map((session) => this.metadata(session));
  }

  metadata(session) {
    return {
      id: session.id,
      title: session.title,
      cwd: session.cwd,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      status: session.status,
      exitCode: session.exitCode,
      signal: session.signal,
      command: session.displayCommand
    };
  }

  resolveCwd(cwd) {
    const requested = cwd ? path.resolve(cwd) : this.defaultCwd;
    if (!fs.existsSync(requested) || !fs.statSync(requested).isDirectory()) {
      throw new Error(`Working directory does not exist: ${requested}`);
    }
    if (this.workspaceRoot && !isInside(this.workspaceRoot, requested)) {
      throw new Error(`Working directory must be inside ${this.workspaceRoot}`);
    }
    return requested;
  }

  getCommand() {
    const command = process.env.OPENFORGE_OPENCODE_COMMAND || "opencode";
    const extraArgs = splitArgs(process.env.OPENFORGE_OPENCODE_ARGS || "");
    const displayCommand = [command, ...extraArgs].join(" ");

    if (process.platform === "win32") {
      const invocation = [command, ...extraArgs].map(windowsQuote).join(" ");
      return {
        file: process.env.ComSpec || "cmd.exe",
        args: ["/d", "/k", invocation],
        displayCommand
      };
    }

    const invocation = ["exec", posixQuote(command), ...extraArgs.map(posixQuote)].join(" ");
    return {
      file: process.env.SHELL || "/bin/bash",
      args: ["-lc", invocation],
      displayCommand
    };
  }

  createSession(options = {}) {
    const cwd = this.resolveCwd(options.cwd);
    const id = crypto.randomUUID();
    const number = this.nextNumber++;
    const title = String(options.title || `OpenCode ${number}`).trim().slice(0, 80) || `OpenCode ${number}`;
    const cols = Number(options.cols) || 100;
    const rows = Number(options.rows) || 32;
    const command = this.getCommand();

    const term = pty.spawn(command.file, command.args, {
      name: "xterm-256color",
      cols,
      rows,
      cwd,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        COLORTERM: "truecolor"
      }
    });

    const session = {
      id,
      title,
      cwd,
      pty: term,
      status: "running",
      exitCode: null,
      signal: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayCommand: command.displayCommand,
      buffer: ""
    };

    term.onData((data) => {
      session.updatedAt = new Date().toISOString();
      session.buffer += data;
      if (session.buffer.length > this.maxBufferChars) {
        session.buffer = session.buffer.slice(-this.maxBufferChars);
      }
      this.emit("data", { id, data });
    });

    term.onExit(({ exitCode, signal }) => {
      session.status = "exited";
      session.exitCode = exitCode;
      session.signal = signal;
      session.updatedAt = new Date().toISOString();
      this.emit("exit", this.metadata(session));
    });

    this.sessions.set(id, session);
    this.emit("created", this.metadata(session));
    return this.metadata(session);
  }

  getSession(id) {
    return this.sessions.get(id);
  }

  getBuffer(id) {
    const session = this.getSession(id);
    if (!session) throw new Error("Terminal session not found.");
    return session.buffer;
  }

  write(id, data) {
    const session = this.getSession(id);
    if (!session || session.status !== "running") return;
    session.pty.write(data);
  }

  resize(id, cols, rows) {
    const session = this.getSession(id);
    if (!session || session.status !== "running") return;
    const safeCols = Math.max(20, Math.min(Number(cols) || 100, 400));
    const safeRows = Math.max(8, Math.min(Number(rows) || 32, 160));
    session.pty.resize(safeCols, safeRows);
  }

  kill(id) {
    const session = this.getSession(id);
    if (!session) throw new Error("Terminal session not found.");
    if (session.status === "running") {
      session.pty.kill();
    }
    session.status = "closed";
    session.updatedAt = new Date().toISOString();
    this.sessions.delete(id);
    this.emit("closed", this.metadata(session));
  }

  killAll() {
    for (const session of this.sessions.values()) {
      if (session.status === "running") session.pty.kill();
    }
  }
}

module.exports = {
  TerminalManager
};
