const path = require("path");
const os = require("os");
const express = require("express");
const http = require("http");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const { Server } = require("socket.io");
const { AgentManager } = require("./agent-manager");
const { attachAuthRoutes, publicUser, requireAuth } = require("./auth");
const { FilesystemBrowser } = require("./filesystem");
const { OpencodeInstaller, listModels } = require("./opencode");
const { Store } = require("./store");
const { TerminalManager } = require("./terminal-manager");

const rootDir = path.resolve(__dirname, "..");

function prependPathOnce(directory) {
  const currentPath = process.env.PATH || "";
  const entries = currentPath.split(path.delimiter).filter(Boolean);
  if (!entries.includes(directory)) {
    process.env.PATH = [directory, ...entries].join(path.delimiter);
  }
}

async function main() {
  prependPathOnce(path.join(os.homedir(), ".opencode", "bin"));

  let shuttingDown = false;
  let restoredSessions = false;
  const store = new Store();
  await store.init();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    serveClient: true,
    transports: ["websocket", "polling"]
  });
  const terminals = new TerminalManager();
  const filesystem = new FilesystemBrowser({
    defaultCwd: terminals.defaultCwd,
    workspaceRoot: terminals.workspaceRoot
  });
  const agents = new AgentManager({
    store,
    defaultCwd: terminals.defaultCwd,
    workspaceRoot: terminals.workspaceRoot
  });
  const installer = new OpencodeInstaller();

  if (process.env.OPENFORGE_TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
  }

  const sessionMiddleware = session({
    name: "openforge.sid",
    secret: store.getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    store: new FileStore({
      path: path.join(store.dataDir, "sessions"),
      retries: 0
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.OPENFORGE_COOKIE_SECURE === "1",
      maxAge: 1000 * 60 * 60 * 24 * 14
    }
  });

  app.use(express.json({ limit: "1mb" }));
  app.use(sessionMiddleware);

  app.use("/vendor/xterm", express.static(path.join(rootDir, "node_modules", "@xterm", "xterm")));
  app.use(
    "/vendor/xterm-addon-fit",
    express.static(path.join(rootDir, "node_modules", "@xterm", "addon-fit"))
  );
  app.use(express.static(path.join(rootDir, "public")));

  app.get("/api/status", (req, res) => {
    const user = req.session.user ? store.getUserById(req.session.user.id) : null;
    const security = store.getSecuritySettings();
    res.json({
      configured: store.hasUsers(),
      authenticated: Boolean(user),
      user: publicUser(user),
      opencode: installer.snapshot(),
      defaults: {
        cwd: terminals.defaultCwd,
        workspaceRoot: terminals.workspaceRoot
      },
      security: {
        captchaProvider: security.captchaProvider,
        siteKey: security.siteKey
      }
    });
  });

  attachAuthRoutes(app, store);

  const CAPTCHA_PROVIDERS = new Set(["none", "recaptcha_v2", "recaptcha_v3", "turnstile"]);

  app.get("/api/security", requireAuth, (req, res) => {
    res.json({ security: store.getSecuritySettings() });
  });

  app.put("/api/security", requireAuth, async (req, res, next) => {
    try {
      const captchaProvider = String(req.body.captchaProvider || "none");
      if (!CAPTCHA_PROVIDERS.has(captchaProvider)) {
        res.status(400).json({ code: "invalid_captcha_provider", error: "Invalid captcha provider." });
        return;
      }

      const siteKey = String(req.body.siteKey || "").trim().slice(0, 500);
      const secretKey = String(req.body.secretKey || "").trim().slice(0, 500);
      const recaptchaMinScore = Math.min(1, Math.max(0, Number(req.body.recaptchaMinScore) || 0));

      if (captchaProvider !== "none" && (!siteKey || !secretKey)) {
        res.status(400).json({ code: "captcha_keys_required", error: "Site key and secret key are required." });
        return;
      }

      const security = await store.updateSecuritySettings({
        captchaProvider,
        siteKey,
        secretKey,
        recaptchaMinScore: recaptchaMinScore || 0.5
      });
      res.json({ security });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sessions", requireAuth, (req, res) => {
    res.json({ sessions: terminals.listSessions() });
  });

  app.get("/api/agents", requireAuth, async (req, res, next) => {
    try {
      res.json({
        agents: await agents.listAgents(),
        runs: store.getAgentRuns(null, 50)
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/agents", requireAuth, async (req, res, next) => {
    try {
      const agent = await agents.createAgent(req.body || {});
      res.status(201).json({ agent });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/agents/:id", requireAuth, async (req, res, next) => {
    try {
      const agent = await agents.updateAgent(req.params.id, req.body || {});
      if (!agent) {
        res.status(404).json({ code: "agent_not_found", error: "Agent not found." });
        return;
      }
      res.json({ agent });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/agents/:id", requireAuth, async (req, res, next) => {
    try {
      const removed = await agents.removeAgent(req.params.id);
      if (!removed) {
        res.status(404).json({ code: "agent_not_found", error: "Agent not found." });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/agents/:id/runs", requireAuth, (req, res) => {
    res.json({ runs: store.getAgentRuns(req.params.id, 50) });
  });

  app.delete("/api/agents/:id/runs", requireAuth, async (req, res, next) => {
    try {
      await store.clearAgentRuns(req.params.id);
      agents.emit("runs:changed", { agentId: req.params.id, runs: store.getAgentRuns(req.params.id) });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/agents/:id/run", requireAuth, async (req, res, next) => {
    try {
      agents.runAgent(req.params.id, "manual").catch((error) => {
        console.error(`Manual agent run failed for ${req.params.id}:`, error);
      });
      res.json({ ok: true });
    } catch (error) {
      if (error.code) {
        res.status(400).json({ code: error.code, error: error.message });
        return;
      }
      next(error);
    }
  });

  app.get("/api/opencode/models", requireAuth, async (req, res) => {
    try {
      const models = await listModels({ refresh: req.query.refresh === "1" });
      res.json({ models });
    } catch (error) {
      res.status(503).json({ code: error.code || "opencode_models_failed", error: error.message });
    }
  });

  app.post("/api/agents/:id/stop", requireAuth, async (req, res, next) => {
    try {
      agents.stopAgent(req.params.id);
      res.json({ ok: true });
    } catch (error) {
      if (error.code) {
        res.status(400).json({ code: error.code, error: error.message });
        return;
      }
      next(error);
    }
  });

  app.get("/api/fs/directories", requireAuth, async (req, res, next) => {
    try {
      res.json(await filesystem.list(req.query.path));
    } catch (error) {
      if (error.code === "ENOENT") {
        res.status(404).json({ code: "path_not_found", error: "Path not found." });
        return;
      }
      if (error.code === "EACCES" || error.code === "EPERM") {
        res.status(403).json({ code: "path_access_denied", error: "Path access denied." });
        return;
      }
      if (error.code === "path_outside_workspace") {
        res.status(400).json({ code: error.code, error: error.message });
        return;
      }
      if (error.code === "path_not_directory") {
        res.status(400).json({ code: error.code, error: error.message });
        return;
      }
      next(error);
    }
  });

  app.post("/api/opencode/install", requireAuth, async (req, res, next) => {
    try {
      installer.install().catch((error) => {
        installer.status.installing = false;
        installer.status.error = error.message;
        installer.emitChange();
      });
      res.json({ opencode: installer.snapshot() });
    } catch (error) {
      next(error);
    }
  });

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(rootDir, "public", "index.html"));
  });

  io.engine.use(sessionMiddleware);
  io.use((socket, next) => {
    const user = socket.request.session?.user;
    if (!user) {
      next(new Error("Authentication required."));
      return;
    }
    next();
  });

  async function restorePersistedSessions() {
    if (restoredSessions) return;
    restoredSessions = true;

    const opencodeReady =
      installer.status.installed ||
      process.env.OPENFORGE_SKIP_OPENCODE_INSTALL === "1" ||
      Boolean(process.env.OPENFORGE_OPENCODE_COMMAND);

    if (!opencodeReady) {
      const savedCount = store.getTerminalSessions().length;
      if (savedCount > 0) {
        console.warn(`Skipping restore for ${savedCount} saved terminal session(s): OpenCode is not ready.`);
      }
      return;
    }

    const { restored, failed } = terminals.restoreSessions(store.getTerminalSessions());
    if (restored.length > 0) {
      console.log(`Restored ${restored.length} terminal session(s).`);
      io.emit("sessions:list", terminals.listSessions());
    }
    for (const failure of failed) {
      console.warn(`Failed to restore terminal "${failure.title}" (${failure.cwd}): ${failure.error}`);
    }
  }

  io.on("connection", (socket) => {
    socket.emit("sessions:list", terminals.listSessions());
    socket.emit("opencode:status", installer.snapshot());
    socket.emit("agents:list", store.getAgents());

    socket.on("session:create", async (payload = {}, ack) => {
      try {
        const sessionMeta = terminals.createSession(payload);
        await store.upsertTerminalSession(sessionMeta);
        io.emit("sessions:list", terminals.listSessions());
        if (typeof ack === "function") ack({ ok: true, session: sessionMeta });
      } catch (error) {
        if (typeof ack === "function") ack({ ok: false, error: error.message });
      }
    });

    socket.on("terminal:attach", (payload = {}, ack) => {
      try {
        const sessionMeta = terminals.getSession(payload.id);
        if (!sessionMeta) throw new Error("Terminal session not found.");
        if (typeof ack === "function") {
          ack({
            ok: true,
            session: terminals.metadata(sessionMeta),
            buffer: terminals.getBuffer(payload.id)
          });
        }
      } catch (error) {
        if (typeof ack === "function") ack({ ok: false, error: error.message });
      }
    });

    socket.on("terminal:input", (payload = {}) => {
      if (typeof payload.data === "string") {
        terminals.write(payload.id, payload.data);
      }
    });

    socket.on("terminal:resize", (payload = {}) => {
      terminals.resize(payload.id, payload.cols, payload.rows);
    });

    socket.on("session:kill", async (payload = {}, ack) => {
      try {
        terminals.kill(payload.id);
        await store.removeTerminalSession(payload.id);
        io.emit("sessions:list", terminals.listSessions());
        if (typeof ack === "function") ack({ ok: true });
      } catch (error) {
        if (typeof ack === "function") ack({ ok: false, error: error.message });
      }
    });
  });

  terminals.on("data", (payload) => {
    io.emit("terminal:data", payload);
  });
  terminals.on("exit", (session) => {
    if (!shuttingDown) {
      store.removeTerminalSession(session.id).catch((error) => {
        console.error(`Failed to remove exited terminal session ${session.id}:`, error);
      });
    }
    io.emit("sessions:list", terminals.listSessions());
  });
  terminals.on("closed", () => {
    io.emit("sessions:list", terminals.listSessions());
  });
  installer.on("change", (status) => {
    io.emit("opencode:status", status);
  });
  agents.on("agents:changed", (list) => {
    io.emit("agents:list", list);
  });
  agents.on("runs:changed", (payload) => {
    io.emit("agents:runs", payload);
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    if (error.code && (String(error.code).startsWith("agent_") || String(error.code).startsWith("path_"))) {
      res.status(400).json({ code: error.code, error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ code: "server_error", error: "Server error." });
  });

  const host = process.env.HOST || "0.0.0.0";
  const port = Number(process.env.PORT || 8734);
  server.listen(port, host, () => {
    console.log(`OpenForge listening on http://${host}:${port}`);
  });

  if (process.env.OPENFORGE_AUTO_INSTALL !== "0") {
    installer
      .ensureInstalled()
      .then(() => restorePersistedSessions())
      .catch((error) => {
        installer.status.installing = false;
        installer.status.error = error.message;
        installer.emitChange();
        restorePersistedSessions().catch((restoreError) => {
          console.error("Failed to restore terminal sessions:", restoreError);
        });
      });
  } else {
    installer
      .refresh()
      .then(() => restorePersistedSessions())
      .catch((error) => {
        installer.status.error = error.message;
        installer.emitChange();
        restorePersistedSessions().catch((restoreError) => {
          console.error("Failed to restore terminal sessions:", restoreError);
        });
      });
  }

  agents.start();

  const shutdown = () => {
    shuttingDown = true;
    agents.stop();
    terminals.killAll();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
