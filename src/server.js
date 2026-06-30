const path = require("path");
const os = require("os");
const express = require("express");
const http = require("http");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const { Server } = require("socket.io");
const { attachAuthRoutes, publicUser, requireAuth } = require("./auth");
const { OpencodeInstaller } = require("./opencode");
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

  const store = new Store();
  await store.init();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    serveClient: true,
    transports: ["websocket", "polling"]
  });
  const terminals = new TerminalManager();
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
    res.json({
      configured: store.hasUsers(),
      authenticated: Boolean(user),
      user: publicUser(user),
      opencode: installer.snapshot(),
      defaults: {
        cwd: terminals.defaultCwd,
        workspaceRoot: terminals.workspaceRoot
      }
    });
  });

  attachAuthRoutes(app, store);

  app.get("/api/sessions", requireAuth, (req, res) => {
    res.json({ sessions: terminals.listSessions() });
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

  io.on("connection", (socket) => {
    socket.emit("sessions:list", terminals.listSessions());
    socket.emit("opencode:status", installer.snapshot());

    socket.on("session:create", (payload = {}, ack) => {
      try {
        const sessionMeta = terminals.createSession(payload);
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

    socket.on("session:kill", (payload = {}, ack) => {
      try {
        terminals.kill(payload.id);
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
  terminals.on("exit", () => {
    io.emit("sessions:list", terminals.listSessions());
  });
  terminals.on("closed", () => {
    io.emit("sessions:list", terminals.listSessions());
  });
  installer.on("change", (status) => {
    io.emit("opencode:status", status);
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Server error." });
  });

  const host = process.env.HOST || "0.0.0.0";
  const port = Number(process.env.PORT || 8734);
  server.listen(port, host, () => {
    console.log(`OpenForge listening on http://${host}:${port}`);
  });

  if (process.env.OPENFORGE_AUTO_INSTALL !== "0") {
    installer.ensureInstalled().catch((error) => {
      installer.status.installing = false;
      installer.status.error = error.message;
      installer.emitChange();
    });
  } else {
    installer.refresh().catch((error) => {
      installer.status.error = error.message;
      installer.emitChange();
    });
  }

  const shutdown = () => {
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
