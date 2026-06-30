(function () {
  const els = {
    authView: document.getElementById("auth-view"),
    appView: document.getElementById("app-view"),
    setupForm: document.getElementById("setup-form"),
    loginForm: document.getElementById("login-form"),
    authMessage: document.getElementById("auth-message"),
    newButton: document.getElementById("new-terminal-button"),
    sessionList: document.getElementById("session-list"),
    opencodeStatus: document.getElementById("opencode-status"),
    installButton: document.getElementById("install-button"),
    signedInUser: document.getElementById("signed-in-user"),
    logoutButton: document.getElementById("logout-button"),
    terminalTitle: document.getElementById("terminal-title"),
    terminalSubtitle: document.getElementById("terminal-subtitle"),
    terminalWrap: document.getElementById("terminal-wrap"),
    terminal: document.getElementById("terminal"),
    emptyState: document.getElementById("empty-state"),
    fitButton: document.getElementById("fit-button"),
    killButton: document.getElementById("kill-button"),
    dialog: document.getElementById("new-terminal-dialog"),
    newForm: document.getElementById("new-terminal-form"),
    cancelNew: document.getElementById("cancel-new-terminal"),
    cwdInput: document.getElementById("cwd-input")
  };

  const state = {
    status: null,
    socket: null,
    sessions: [],
    activeId: null,
    terminal: null,
    fitAddon: null,
    resizeObserver: null
  };

  async function api(path, options = {}) {
    const response = await fetch(path, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }
    return data;
  }

  function showAuth(mode) {
    els.authView.classList.remove("hidden");
    els.appView.classList.add("hidden");
    els.setupForm.classList.toggle("hidden", mode !== "setup");
    els.loginForm.classList.toggle("hidden", mode !== "login");
  }

  function showApp() {
    els.authView.classList.add("hidden");
    els.appView.classList.remove("hidden");
  }

  function setAuthMessage(message) {
    els.authMessage.textContent = message || "";
  }

  function setStatus(status) {
    state.status = status;
    els.signedInUser.textContent = status.user ? `@${status.user.username}` : "";
    els.cwdInput.value = status.defaults?.cwd || "";
    renderOpencode(status.opencode);
  }

  function renderOpencode(opencode) {
    els.opencodeStatus.className = "status-pill";
    els.installButton.classList.add("hidden");

    if (opencode.installing) {
      els.opencodeStatus.textContent = "Installing";
      els.opencodeStatus.classList.add("busy");
      return;
    }

    if (opencode.installed) {
      els.opencodeStatus.textContent = "OpenCode Ready";
      els.opencodeStatus.classList.add("ready");
      return;
    }

    els.opencodeStatus.textContent = "OpenCode Missing";
    els.opencodeStatus.classList.add("error");
    els.installButton.classList.remove("hidden");
  }

  function connectSocket() {
    if (state.socket) state.socket.disconnect();

    state.socket = io();
    state.socket.on("connect_error", (error) => {
      console.warn(error.message);
    });
    state.socket.on("sessions:list", (sessions) => {
      state.sessions = sessions;
      renderSessions();
      if (!state.activeId && sessions.length) selectSession(sessions[0].id);
      if (state.activeId && !sessions.some((session) => session.id === state.activeId)) {
        selectSession(sessions[0]?.id || null);
      }
    });
    state.socket.on("terminal:data", ({ id, data }) => {
      if (id === state.activeId && state.terminal) {
        state.terminal.write(data);
      }
    });
    state.socket.on("opencode:status", renderOpencode);
  }

  function renderSessions() {
    els.sessionList.replaceChildren();

    for (const session of state.sessions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `session-item${session.id === state.activeId ? " active" : ""}`;
      button.dataset.id = session.id;

      const title = document.createElement("strong");
      title.textContent = session.title;
      const detail = document.createElement("span");
      detail.textContent = session.status === "running" ? session.cwd : session.status;

      button.append(title, detail);
      button.addEventListener("click", () => selectSession(session.id));
      els.sessionList.append(button);
    }
  }

  function currentSession() {
    return state.sessions.find((session) => session.id === state.activeId) || null;
  }

  function ensureTerminal() {
    if (state.terminal) return;

    state.terminal = new Terminal({
      cursorBlink: true,
      fontFamily: "Consolas, 'Cascadia Mono', 'SFMono-Regular', Menlo, monospace",
      fontSize: 14,
      lineHeight: 1.18,
      theme: {
        background: "#08090b",
        foreground: "#f3f5f7",
        cursor: "#4dbd91",
        selectionBackground: "#315b4b"
      }
    });
    state.fitAddon = new FitAddon.FitAddon();
    state.terminal.loadAddon(state.fitAddon);
    state.terminal.open(els.terminal);
    state.terminal.onData((data) => {
      if (state.activeId && state.socket?.connected) {
        state.socket.emit("terminal:input", { id: state.activeId, data });
      }
    });

    state.resizeObserver = new ResizeObserver(() => fitTerminal());
    state.resizeObserver.observe(els.terminalWrap);
  }

  function fitTerminal() {
    if (!state.terminal || !state.fitAddon || !state.activeId) return;
    requestAnimationFrame(() => {
      try {
        state.fitAddon.fit();
        state.socket.emit("terminal:resize", {
          id: state.activeId,
          cols: state.terminal.cols,
          rows: state.terminal.rows
        });
      } catch (error) {
        console.warn(error.message);
      }
    });
  }

  function renderActiveHeader() {
    const session = currentSession();
    els.emptyState.classList.toggle("hidden", Boolean(session));
    els.terminal.classList.toggle("hidden", !session);
    els.fitButton.disabled = !session;
    els.killButton.disabled = !session;

    if (!session) {
      els.terminalTitle.textContent = "No Terminal";
      els.terminalSubtitle.textContent = "";
      return;
    }

    els.terminalTitle.textContent = session.title;
    els.terminalSubtitle.textContent = `${session.cwd} · ${session.status}`;
  }

  function selectSession(id) {
    state.activeId = id;
    renderSessions();
    renderActiveHeader();

    if (!id) {
      if (state.terminal) state.terminal.clear();
      return;
    }

    ensureTerminal();
    state.terminal.clear();
    state.socket.emit("terminal:attach", { id }, (response) => {
      if (!response?.ok) {
        state.terminal.write(`\r\n${response?.error || "Unable to attach terminal."}\r\n`);
        return;
      }
      state.terminal.write(response.buffer || "");
      fitTerminal();
    });
  }

  async function createSession(payload) {
    return new Promise((resolve, reject) => {
      state.socket.emit("session:create", payload, (response) => {
        if (!response?.ok) {
          reject(new Error(response?.error || "Unable to create terminal."));
          return;
        }
        resolve(response.session);
      });
    });
  }

  async function boot() {
    try {
      const status = await api("/api/status");
      setStatus(status);

      if (!status.configured) {
        showAuth("setup");
        return;
      }

      if (!status.authenticated) {
        showAuth("login");
        return;
      }

      showApp();
      connectSocket();
    } catch (error) {
      showAuth("login");
      setAuthMessage(error.message);
    }
  }

  els.setupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthMessage("");
    const form = new FormData(els.setupForm);
    try {
      await api("/api/setup", {
        method: "POST",
        body: {
          username: form.get("username"),
          password: form.get("password")
        }
      });
      await boot();
    } catch (error) {
      setAuthMessage(error.message);
    }
  });

  els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthMessage("");
    const form = new FormData(els.loginForm);
    try {
      await api("/api/login", {
        method: "POST",
        body: {
          username: form.get("username"),
          password: form.get("password")
        }
      });
      await boot();
    } catch (error) {
      setAuthMessage(error.message);
    }
  });

  els.logoutButton.addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" });
    if (state.socket) state.socket.disconnect();
    state.sessions = [];
    state.activeId = null;
    showAuth("login");
  });

  els.newButton.addEventListener("click", () => {
    els.dialog.showModal();
    window.setTimeout(() => els.newForm.elements.title.focus(), 0);
  });

  els.cancelNew.addEventListener("click", () => {
    els.dialog.close();
  });

  els.newForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(els.newForm);
    try {
      const session = await createSession({
        title: form.get("title"),
        cwd: form.get("cwd"),
        cols: state.terminal?.cols,
        rows: state.terminal?.rows
      });
      els.dialog.close();
      els.newForm.reset();
      if (state.status?.defaults?.cwd) els.cwdInput.value = state.status.defaults.cwd;
      selectSession(session.id);
    } catch (error) {
      alert(error.message);
    }
  });

  els.installButton.addEventListener("click", async () => {
    try {
      const response = await api("/api/opencode/install", { method: "POST" });
      renderOpencode(response.opencode);
    } catch (error) {
      alert(error.message);
    }
  });

  els.fitButton.addEventListener("click", fitTerminal);

  els.killButton.addEventListener("click", () => {
    const session = currentSession();
    if (!session) return;
    state.socket.emit("session:kill", { id: session.id }, (response) => {
      if (!response?.ok) alert(response?.error || "Unable to stop terminal.");
    });
  });

  window.addEventListener("resize", fitTerminal);
  boot();
})();
