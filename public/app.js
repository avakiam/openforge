(function () {
  const I18N = {
    en: {
      firstAdmin: "First Admin",
      username: "Username",
      password: "Password",
      createAccount: "Create Account",
      signIn: "Sign In",
      newTerminal: "New",
      newTerminalTitle: "New terminal",
      terminals: "Terminals",
      installOpenCode: "Install OpenCode",
      signOut: "Sign Out",
      noTerminal: "No Terminal",
      fit: "Fit",
      fitTerminal: "Fit terminal",
      close: "Close",
      noTerminals: "No terminals",
      newTerminalHeading: "New Terminal",
      name: "Name",
      workingDirectory: "Working directory",
      cancel: "Cancel",
      create: "Create",
      checking: "Checking",
      installing: "Installing",
      opencodeReady: "OpenCode Ready",
      opencodeMissing: "OpenCode Missing",
      running: "running",
      exited: "exited",
      closed: "closed",
      closeSession: "Close session",
      closeSessionNamed: "Close {title}",
      requestFailed: "Request failed.",
      unableAttachTerminal: "Unable to attach terminal.",
      unableCreateTerminal: "Unable to create terminal.",
      unableCloseTerminal: "Unable to close terminal.",
      error_auth_required: "Authentication required.",
      error_setup_completed: "Setup has already been completed.",
      error_invalid_username:
        "Username must be 3-32 characters using letters, numbers, dots, underscores, or dashes.",
      error_invalid_password: "Password must be at least 8 characters.",
      error_invalid_credentials: "Invalid username or password.",
      error_server_error: "Server error."
    },
    es: {
      firstAdmin: "Primer administrador",
      username: "Usuario",
      password: "Contraseña",
      createAccount: "Crear cuenta",
      signIn: "Iniciar sesión",
      newTerminal: "Nueva",
      newTerminalTitle: "Nueva terminal",
      terminals: "Terminales",
      installOpenCode: "Instalar OpenCode",
      signOut: "Cerrar sesión",
      noTerminal: "Sin terminal",
      fit: "Ajustar",
      fitTerminal: "Ajustar terminal",
      close: "Cerrar",
      noTerminals: "No hay terminales",
      newTerminalHeading: "Nueva terminal",
      name: "Nombre",
      workingDirectory: "Directorio de trabajo",
      cancel: "Cancelar",
      create: "Crear",
      checking: "Comprobando",
      installing: "Instalando",
      opencodeReady: "OpenCode listo",
      opencodeMissing: "Falta OpenCode",
      running: "en ejecución",
      exited: "finalizada",
      closed: "cerrada",
      closeSession: "Cerrar terminal",
      closeSessionNamed: "Cerrar {title}",
      requestFailed: "La solicitud falló.",
      unableAttachTerminal: "No se pudo conectar la terminal.",
      unableCreateTerminal: "No se pudo crear la terminal.",
      unableCloseTerminal: "No se pudo cerrar la terminal.",
      error_auth_required: "Debes iniciar sesión.",
      error_setup_completed: "La configuración inicial ya se completó.",
      error_invalid_username:
        "El usuario debe tener 3-32 caracteres y usar letras, números, puntos, guiones bajos o guiones.",
      error_invalid_password: "La contraseña debe tener al menos 8 caracteres.",
      error_invalid_credentials: "Usuario o contraseña incorrectos.",
      error_server_error: "Error del servidor."
    },
    ca: {
      firstAdmin: "Primer administrador",
      username: "Usuari",
      password: "Contrasenya",
      createAccount: "Crear compte",
      signIn: "Inicia sessió",
      newTerminal: "Nova",
      newTerminalTitle: "Terminal nova",
      terminals: "Terminals",
      installOpenCode: "Instal·la OpenCode",
      signOut: "Tanca sessió",
      noTerminal: "Cap terminal",
      fit: "Ajusta",
      fitTerminal: "Ajusta la terminal",
      close: "Tanca",
      noTerminals: "No hi ha terminals",
      newTerminalHeading: "Terminal nova",
      name: "Nom",
      workingDirectory: "Directori de treball",
      cancel: "Cancel·la",
      create: "Crea",
      checking: "Comprovant",
      installing: "Instal·lant",
      opencodeReady: "OpenCode a punt",
      opencodeMissing: "Falta OpenCode",
      running: "en execució",
      exited: "finalitzada",
      closed: "tancada",
      closeSession: "Tanca la terminal",
      closeSessionNamed: "Tanca {title}",
      requestFailed: "La sol·licitud ha fallat.",
      unableAttachTerminal: "No s'ha pogut connectar la terminal.",
      unableCreateTerminal: "No s'ha pogut crear la terminal.",
      unableCloseTerminal: "No s'ha pogut tancar la terminal.",
      error_auth_required: "Cal iniciar sessió.",
      error_setup_completed: "La configuració inicial ja s'ha completat.",
      error_invalid_username:
        "L'usuari ha de tenir 3-32 caràcters i usar lletres, números, punts, guions baixos o guions.",
      error_invalid_password: "La contrasenya ha de tenir com a mínim 8 caràcters.",
      error_invalid_credentials: "Usuari o contrasenya incorrectes.",
      error_server_error: "Error del servidor."
    }
  };

  function detectLanguage() {
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language || "en"];
    for (const language of languages) {
      const root = String(language).toLowerCase().split("-")[0];
      if (root === "ca" || root === "es" || root === "en") return root;
    }
    return "en";
  }

  const state = {
    language: detectLanguage(),
    status: null,
    socket: null,
    sessions: [],
    activeId: null,
    terminal: null,
    fitAddon: null,
    resizeObserver: null
  };

  function t(key, replacements = {}) {
    const template = I18N[state.language]?.[key] || I18N.en[key] || key;
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => {
      return Object.prototype.hasOwnProperty.call(replacements, name) ? replacements[name] : match;
    });
  }

  function translateErrorMessage(message) {
    const knownMessages = {
      "Authentication required.": "error_auth_required",
      "Setup has already been completed.": "error_setup_completed",
      "Username must be 3-32 characters using letters, numbers, dots, underscores, or dashes.":
        "error_invalid_username",
      "Password must be at least 8 characters.": "error_invalid_password",
      "Invalid username or password.": "error_invalid_credentials",
      "Server error.": "error_server_error",
      "Request failed.": "requestFailed"
    };
    return knownMessages[message] ? t(knownMessages[message]) : message;
  }

  function translateErrorData(data) {
    if (data?.code && I18N.en[`error_${data.code}`]) return t(`error_${data.code}`);
    return translateErrorMessage(data?.error || t("requestFailed"));
  }

  function translateStaticUi() {
    document.documentElement.lang = state.language;

    for (const element of document.querySelectorAll("[data-i18n]")) {
      element.textContent = t(element.dataset.i18n);
    }
    for (const element of document.querySelectorAll("[data-i18n-title]")) {
      element.setAttribute("title", t(element.dataset.i18nTitle));
    }
    for (const element of document.querySelectorAll("[data-i18n-aria-label]")) {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    }
    for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
      element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
    }
  }

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
      throw new Error(translateErrorData(data));
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
    els.authMessage.textContent = message ? translateErrorMessage(message) : "";
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
      els.opencodeStatus.textContent = t("installing");
      els.opencodeStatus.classList.add("busy");
      return;
    }

    if (opencode.installed) {
      els.opencodeStatus.textContent = t("opencodeReady");
      els.opencodeStatus.classList.add("ready");
      return;
    }

    els.opencodeStatus.textContent = t("opencodeMissing");
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
      } else {
        renderActiveHeader();
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
      const row = document.createElement("div");
      row.className = `session-row${session.id === state.activeId ? " active" : ""}`;
      row.dataset.id = session.id;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "session-item";

      const title = document.createElement("strong");
      title.textContent = session.title;
      const detail = document.createElement("span");
      detail.textContent = session.status === "running" ? session.cwd : t(session.status);

      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "session-close";
      closeButton.title = t("closeSession");
      closeButton.setAttribute("aria-label", t("closeSessionNamed", { title: session.title }));
      closeButton.textContent = "x";

      button.append(title, detail);
      button.addEventListener("click", () => selectSession(session.id));
      closeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        closeSession(session.id);
      });

      row.append(button, closeButton);
      els.sessionList.append(row);
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
      els.terminalTitle.textContent = t("noTerminal");
      els.terminalSubtitle.textContent = "";
      return;
    }

    els.terminalTitle.textContent = session.title;
    els.terminalSubtitle.textContent = `${session.cwd} | ${t(session.status)}`;
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
        state.terminal.write(`\r\n${translateErrorMessage(response?.error) || t("unableAttachTerminal")}\r\n`);
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
          reject(new Error(translateErrorMessage(response?.error) || t("unableCreateTerminal")));
          return;
        }
        resolve(response.session);
      });
    });
  }

  function closeSession(id) {
    if (!id) return;
    state.socket.emit("session:kill", { id }, (response) => {
      if (!response?.ok) alert(translateErrorMessage(response?.error) || t("unableCloseTerminal"));
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
    closeSession(session.id);
  });

  window.addEventListener("resize", fitTerminal);
  translateStaticUi();
  boot();
})();
