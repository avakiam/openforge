(function () {
  const THEME_STORAGE_KEY = "openforge-theme";

  function detectTheme() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  document.documentElement.dataset.theme = detectTheme();

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
      toggleTheme: "Toggle light / dark theme",
      security: "Security",
      securitySettings: "Login Security",
      captchaProvider: "Captcha provider",
      captchaNone: "None",
      captchaRecaptchaV2: "reCAPTCHA v2",
      captchaRecaptchaV3: "reCAPTCHA v3",
      captchaTurnstile: "Cloudflare Turnstile",
      siteKey: "Site key",
      secretKey: "Secret key",
      minScore: "Minimum score",
      securityHelp:
        "Login will require solving this captcha. If you get locked out, edit \"security\" in your data directory's state.json and restart OpenForge.",
      securitySaved: "Security settings saved.",
      unableLoadSecurity: "Unable to load security settings.",
      unableSaveSecurity: "Unable to save security settings.",
      signOut: "Sign Out",
      agents: "Agents",
      newAgent: "New Agent",
      newAgentTitle: "New agent",
      runNow: "Run Now",
      stop: "Stop",
      model: "Model",
      useDefaultModel: "Use OpenCode default",
      effort: "Effort level",
      useDefaultEffort: "Use model default",
      modelNotListed: "not in OpenCode",
      refresh: "Refresh",
      save: "Save",
      delete: "Delete",
      description: "Description",
      prompt: "Prompt",
      enabled: "Enabled",
      runTime: "Run time",
      runDays: "Run days",
      runHistory: "Run History",
      noAgentSelected: "No agent selected",
      noRuns: "No runs yet",
      nextRun: "Next run",
      lastRun: "Last run",
      idle: "idle",
      success: "success",
      failed: "failed",
      manual: "manual",
      schedule: "schedule",
      mondayShort: "Mon",
      tuesdayShort: "Tue",
      wednesdayShort: "Wed",
      thursdayShort: "Thu",
      fridayShort: "Fri",
      saturdayShort: "Sat",
      sundayShort: "Sun",
      noTerminal: "No Terminal",
      fit: "Fit",
      fitTerminal: "Fit terminal",
      close: "Close",
      browse: "Browse",
      noTerminals: "No terminals",
      newTerminalHeading: "New Terminal",
      name: "Name",
      workingDirectory: "Working directory",
      chooseFolder: "Choose Folder",
      choose: "Choose",
      parentDirectory: "Up",
      loading: "Loading...",
      noFolders: "No folders",
      folderIcon: "Folder",
      closeTerminalTitle: "Close terminal?",
      closeTerminalBody: "This will stop the running OpenCode terminal \"{title}\" and remove it from the list.",
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
      unableSaveAgent: "Unable to save agent.",
      unableRunAgent: "Unable to run agent.",
      unableStopAgent: "Unable to stop agent.",
      error_auth_required: "Authentication required.",
      error_setup_completed: "Setup has already been completed.",
      error_invalid_username:
        "Username must be 3-32 characters using letters, numbers, dots, underscores, or dashes.",
      error_invalid_password: "Password must be at least 8 characters.",
      error_invalid_credentials: "Invalid username or password.",
      error_server_error: "Server error.",
      error_path_not_found: "Path not found.",
      error_path_access_denied: "Path access denied.",
      error_path_outside_workspace: "Path must stay inside the configured workspace.",
      error_path_not_directory: "Path is not a directory.",
      error_agent_not_found: "Agent not found.",
      error_agent_prompt_required: "Agent prompt is required.",
      error_agent_already_running: "Agent is already running.",
      error_agent_not_running: "Agent is not running.",
      error_invalid_captcha_provider: "Invalid captcha provider.",
      error_captcha_keys_required: "Site key and secret key are required.",
      error_captcha_required: "Please complete the captcha.",
      error_captcha_failed: "Captcha verification failed.",
      error_captcha_unavailable: "Could not reach the captcha verification service."
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
      toggleTheme: "Cambiar tema claro / oscuro",
      security: "Seguridad",
      securitySettings: "Seguridad del inicio de sesión",
      captchaProvider: "Proveedor de captcha",
      captchaNone: "Ninguno",
      captchaRecaptchaV2: "reCAPTCHA v2",
      captchaRecaptchaV3: "reCAPTCHA v3",
      captchaTurnstile: "Cloudflare Turnstile",
      siteKey: "Clave de sitio",
      secretKey: "Clave secreta",
      minScore: "Puntuación mínima",
      securityHelp:
        "El inicio de sesión requerirá resolver este captcha. Si te quedas bloqueado, edita \"security\" en el state.json de tu directorio de datos y reinicia OpenForge.",
      securitySaved: "Configuración de seguridad guardada.",
      unableLoadSecurity: "No se pudo cargar la configuración de seguridad.",
      unableSaveSecurity: "No se pudo guardar la configuración de seguridad.",
      signOut: "Cerrar sesión",
      agents: "Agentes",
      newAgent: "Nuevo agente",
      newAgentTitle: "Nuevo agente",
      runNow: "Ejecutar ahora",
      stop: "Detener",
      model: "Modelo",
      useDefaultModel: "Usar el predeterminado de OpenCode",
      effort: "Nivel de esfuerzo",
      useDefaultEffort: "Usar el predeterminado del modelo",
      modelNotListed: "no está en OpenCode",
      refresh: "Actualizar",
      save: "Guardar",
      delete: "Eliminar",
      description: "Descripción",
      prompt: "Prompt",
      enabled: "Activado",
      runTime: "Hora",
      runDays: "Días",
      runHistory: "Historial",
      noAgentSelected: "Ningún agente seleccionado",
      noRuns: "Todavía no hay ejecuciones",
      nextRun: "Próxima ejecución",
      lastRun: "Última ejecución",
      idle: "en espera",
      success: "correcta",
      failed: "fallida",
      manual: "manual",
      schedule: "programada",
      mondayShort: "Lun",
      tuesdayShort: "Mar",
      wednesdayShort: "Mié",
      thursdayShort: "Jue",
      fridayShort: "Vie",
      saturdayShort: "Sáb",
      sundayShort: "Dom",
      noTerminal: "Sin terminal",
      fit: "Ajustar",
      fitTerminal: "Ajustar terminal",
      close: "Cerrar",
      browse: "Examinar",
      noTerminals: "No hay terminales",
      newTerminalHeading: "Nueva terminal",
      name: "Nombre",
      workingDirectory: "Directorio de trabajo",
      chooseFolder: "Elegir carpeta",
      choose: "Elegir",
      parentDirectory: "Subir",
      loading: "Cargando...",
      noFolders: "No hay carpetas",
      folderIcon: "Carpeta",
      closeTerminalTitle: "¿Cerrar terminal?",
      closeTerminalBody: "Esto detendrá la terminal de OpenCode \"{title}\" y la quitará de la lista.",
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
      unableSaveAgent: "No se pudo guardar el agente.",
      unableRunAgent: "No se pudo ejecutar el agente.",
      unableStopAgent: "No se pudo detener el agente.",
      error_auth_required: "Debes iniciar sesión.",
      error_setup_completed: "La configuración inicial ya se completó.",
      error_invalid_username:
        "El usuario debe tener 3-32 caracteres y usar letras, números, puntos, guiones bajos o guiones.",
      error_invalid_password: "La contraseña debe tener al menos 8 caracteres.",
      error_invalid_credentials: "Usuario o contraseña incorrectos.",
      error_server_error: "Error del servidor.",
      error_path_not_found: "Ruta no encontrada.",
      error_path_access_denied: "Acceso denegado a la ruta.",
      error_path_outside_workspace: "La ruta debe estar dentro del espacio de trabajo configurado.",
      error_path_not_directory: "La ruta no es un directorio.",
      error_agent_not_found: "Agente no encontrado.",
      error_agent_prompt_required: "El prompt del agente es obligatorio.",
      error_agent_already_running: "El agente ya se está ejecutando.",
      error_agent_not_running: "El agente no se está ejecutando.",
      error_invalid_captcha_provider: "Proveedor de captcha no válido.",
      error_captcha_keys_required: "Se requieren la clave de sitio y la clave secreta.",
      error_captcha_required: "Completa el captcha.",
      error_captcha_failed: "La verificación del captcha ha fallado.",
      error_captcha_unavailable: "No se pudo contactar con el servicio de verificación del captcha."
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
      toggleTheme: "Canvia tema clar / fosc",
      security: "Seguretat",
      securitySettings: "Seguretat de l'inici de sessió",
      captchaProvider: "Proveïdor de captcha",
      captchaNone: "Cap",
      captchaRecaptchaV2: "reCAPTCHA v2",
      captchaRecaptchaV3: "reCAPTCHA v3",
      captchaTurnstile: "Cloudflare Turnstile",
      siteKey: "Clau del lloc",
      secretKey: "Clau secreta",
      minScore: "Puntuació mínima",
      securityHelp:
        "L'inici de sessió requerirà resoldre aquest captcha. Si et quedes bloquejat, edita \"security\" a l'state.json del teu directori de dades i reinicia OpenForge.",
      securitySaved: "Configuració de seguretat desada.",
      unableLoadSecurity: "No s'ha pogut carregar la configuració de seguretat.",
      unableSaveSecurity: "No s'ha pogut desar la configuració de seguretat.",
      signOut: "Tanca sessió",
      agents: "Agents",
      newAgent: "Agent nou",
      newAgentTitle: "Agent nou",
      runNow: "Executa ara",
      stop: "Atura",
      model: "Model",
      useDefaultModel: "Usa el predeterminat d'OpenCode",
      effort: "Nivell d'esforç",
      useDefaultEffort: "Usa el predeterminat del model",
      modelNotListed: "no és a OpenCode",
      refresh: "Actualitza",
      save: "Desa",
      delete: "Elimina",
      description: "Descripció",
      prompt: "Prompt",
      enabled: "Activat",
      runTime: "Hora",
      runDays: "Dies",
      runHistory: "Historial",
      noAgentSelected: "Cap agent seleccionat",
      noRuns: "Encara no hi ha execucions",
      nextRun: "Proper execució",
      lastRun: "Última execució",
      idle: "en espera",
      success: "correcta",
      failed: "fallida",
      manual: "manual",
      schedule: "programada",
      mondayShort: "Dl",
      tuesdayShort: "Dt",
      wednesdayShort: "Dc",
      thursdayShort: "Dj",
      fridayShort: "Dv",
      saturdayShort: "Ds",
      sundayShort: "Dg",
      noTerminal: "Cap terminal",
      fit: "Ajusta",
      fitTerminal: "Ajusta la terminal",
      close: "Tanca",
      browse: "Navega",
      noTerminals: "No hi ha terminals",
      newTerminalHeading: "Terminal nova",
      name: "Nom",
      workingDirectory: "Directori de treball",
      chooseFolder: "Tria carpeta",
      choose: "Tria",
      parentDirectory: "Puja",
      loading: "Carregant...",
      noFolders: "No hi ha carpetes",
      folderIcon: "Carpeta",
      closeTerminalTitle: "Vols tancar la terminal?",
      closeTerminalBody: "Això aturarà la terminal d'OpenCode \"{title}\" i la traurà de la llista.",
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
      unableSaveAgent: "No s'ha pogut desar l'agent.",
      unableRunAgent: "No s'ha pogut executar l'agent.",
      unableStopAgent: "No s'ha pogut aturar l'agent.",
      error_auth_required: "Cal iniciar sessió.",
      error_setup_completed: "La configuració inicial ja s'ha completat.",
      error_invalid_username:
        "L'usuari ha de tenir 3-32 caràcters i usar lletres, números, punts, guions baixos o guions.",
      error_invalid_password: "La contrasenya ha de tenir com a mínim 8 caràcters.",
      error_invalid_credentials: "Usuari o contrasenya incorrectes.",
      error_server_error: "Error del servidor.",
      error_path_not_found: "No s'ha trobat la ruta.",
      error_path_access_denied: "Accés denegat a la ruta.",
      error_path_outside_workspace: "La ruta ha d'estar dins de l'espai de treball configurat.",
      error_path_not_directory: "La ruta no és un directori.",
      error_agent_not_found: "No s'ha trobat l'agent.",
      error_agent_prompt_required: "El prompt de l'agent és obligatori.",
      error_agent_already_running: "L'agent ja s'està executant.",
      error_agent_not_running: "L'agent no s'està executant.",
      error_invalid_captcha_provider: "Proveïdor de captcha no vàlid.",
      error_captcha_keys_required: "Calen la clau del lloc i la clau secreta.",
      error_captcha_required: "Completa el captcha.",
      error_captcha_failed: "La verificació del captcha ha fallat.",
      error_captcha_unavailable: "No s'ha pogut contactar amb el servei de verificació del captcha."
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
    theme: document.documentElement.dataset.theme,
    status: null,
    socket: null,
    sessions: [],
    agents: [],
    agentRuns: [],
    models: [],
    activeId: null,
    activeAgentId: null,
    mode: "terminals",
    terminal: null,
    fitAddon: null,
    resizeObserver: null,
    pendingCloseId: null,
    directoryPath: null,
    directoryTarget: "terminal",
    security: null
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
    terminalsModeButton: document.getElementById("terminals-mode-button"),
    agentsModeButton: document.getElementById("agents-mode-button"),
    newButton: document.getElementById("new-terminal-button"),
    newAgentButton: document.getElementById("new-agent-button"),
    sessionList: document.getElementById("session-list"),
    agentList: document.getElementById("agent-list"),
    opencodeStatus: document.getElementById("opencode-status"),
    installButton: document.getElementById("install-button"),
    themeToggleButton: document.getElementById("theme-toggle-button"),
    signedInUser: document.getElementById("signed-in-user"),
    logoutButton: document.getElementById("logout-button"),
    terminalTitle: document.getElementById("terminal-title"),
    terminalSubtitle: document.getElementById("terminal-subtitle"),
    terminalWorkspace: document.getElementById("terminal-workspace"),
    agentsWorkspace: document.getElementById("agents-workspace"),
    terminalWrap: document.getElementById("terminal-wrap"),
    terminal: document.getElementById("terminal"),
    emptyState: document.getElementById("empty-state"),
    fitButton: document.getElementById("fit-button"),
    killButton: document.getElementById("kill-button"),
    dialog: document.getElementById("new-terminal-dialog"),
    newForm: document.getElementById("new-terminal-form"),
    cancelNew: document.getElementById("cancel-new-terminal"),
    cwdInput: document.getElementById("cwd-input"),
    browseCwdButton: document.getElementById("browse-cwd-button"),
    filesystemDialog: document.getElementById("filesystem-dialog"),
    fsUpButton: document.getElementById("fs-up-button"),
    fsCurrentPath: document.getElementById("fs-current-path"),
    fsRoots: document.getElementById("fs-roots"),
    fsList: document.getElementById("fs-list"),
    cancelFilesystem: document.getElementById("cancel-filesystem"),
    selectCwdButton: document.getElementById("select-cwd-button"),
    confirmCloseDialog: document.getElementById("confirm-close-dialog"),
    confirmCloseBody: document.getElementById("confirm-close-body"),
    cancelCloseSession: document.getElementById("cancel-close-session"),
    confirmCloseSession: document.getElementById("confirm-close-session"),
    agentTitle: document.getElementById("agent-title"),
    agentSubtitle: document.getElementById("agent-subtitle"),
    agentForm: document.getElementById("agent-form"),
    agentNameInput: document.getElementById("agent-name-input"),
    agentDescriptionInput: document.getElementById("agent-description-input"),
    agentCwdInput: document.getElementById("agent-cwd-input"),
    browseAgentCwdButton: document.getElementById("browse-agent-cwd-button"),
    agentPromptInput: document.getElementById("agent-prompt-input"),
    agentModelInput: document.getElementById("agent-model-input"),
    agentVariantInput: document.getElementById("agent-variant-input"),
    refreshModelsButton: document.getElementById("refresh-models-button"),
    agentEnabledInput: document.getElementById("agent-enabled-input"),
    agentTimeInput: document.getElementById("agent-time-input"),
    agentRuns: document.getElementById("agent-runs"),
    runAgentButton: document.getElementById("run-agent-button"),
    stopAgentButton: document.getElementById("stop-agent-button"),
    saveAgentButton: document.getElementById("save-agent-button"),
    deleteAgentButton: document.getElementById("delete-agent-button"),
    loginCaptcha: document.getElementById("login-captcha"),
    securitySettingsButton: document.getElementById("security-settings-button"),
    securityDialog: document.getElementById("security-dialog"),
    securityProviderInput: document.getElementById("security-provider-input"),
    securityKeyFields: document.getElementById("security-key-fields"),
    securitySiteKeyInput: document.getElementById("security-site-key-input"),
    securitySecretKeyInput: document.getElementById("security-secret-key-input"),
    securityMinScoreField: document.getElementById("security-min-score-field"),
    securityMinScoreInput: document.getElementById("security-min-score-input"),
    securityMessage: document.getElementById("security-message"),
    cancelSecurity: document.getElementById("cancel-security"),
    saveSecurityButton: document.getElementById("save-security-button")
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

  const CAPTCHA_SCRIPTS = {
    recaptcha_v2: "https://www.google.com/recaptcha/api.js",
    recaptcha_v3: "https://www.google.com/recaptcha/api.js",
    turnstile: "https://challenges.cloudflare.com/turnstile/v0/api.js"
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.append(script);
    });
  }

  function waitFor(check, timeout = 8000, interval = 100) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        if (check()) {
          resolve();
          return;
        }
        if (Date.now() - start > timeout) {
          reject(new Error("Timed out waiting for captcha script"));
          return;
        }
        setTimeout(tick, interval);
      };
      tick();
    });
  }

  async function setupLoginCaptcha(security) {
    state.security = security || { captchaProvider: "none", siteKey: "" };
    const provider = state.security.captchaProvider;
    els.loginCaptcha.replaceChildren();

    if (provider === "none" || !state.security.siteKey) {
      els.loginCaptcha.classList.add("hidden");
      return;
    }

    els.loginCaptcha.classList.toggle("hidden", provider === "recaptcha_v3");

    try {
      await loadScript(CAPTCHA_SCRIPTS[provider]);
    } catch (error) {
      console.warn(error.message);
      return;
    }

    if (provider === "turnstile") {
      await waitFor(() => window.turnstile?.render);
      window.turnstile.render(els.loginCaptcha, { sitekey: state.security.siteKey });
    } else if (provider === "recaptcha_v2") {
      await waitFor(() => window.grecaptcha?.render);
      window.grecaptcha.render(els.loginCaptcha, { sitekey: state.security.siteKey });
    }
  }

  async function getCaptchaToken() {
    const provider = state.security?.captchaProvider;
    if (!provider || provider === "none" || !state.security.siteKey) return "";

    if (provider === "turnstile") {
      return window.turnstile?.getResponse() || "";
    }
    if (provider === "recaptcha_v2") {
      return window.grecaptcha?.getResponse() || "";
    }
    if (provider === "recaptcha_v3") {
      if (!window.grecaptcha) return "";
      return new Promise((resolve) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(state.security.siteKey, { action: "login" })
            .then(resolve)
            .catch(() => resolve(""));
        });
      });
    }
    return "";
  }

  function resetCaptcha() {
    const provider = state.security?.captchaProvider;
    if (provider === "turnstile") window.turnstile?.reset();
    else if (provider === "recaptcha_v2") window.grecaptcha?.reset();
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
    if (!status.authenticated) setupLoginCaptcha(status.security).catch((error) => console.warn(error.message));
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
    state.socket.on("agents:list", (agents) => {
      state.agents = agents;
      renderAgents();
      if (!state.activeAgentId && agents.length) {
        selectAgent(agents[0].id).catch((error) => console.warn(error.message));
        return;
      }
      if (state.activeAgentId && !agents.some((agent) => agent.id === state.activeAgentId)) {
        selectAgent(agents[0]?.id || null).catch((error) => console.warn(error.message));
        return;
      }
      renderAgentStatus();
    });
    state.socket.on("agents:runs", ({ agentId, runs }) => {
      if (agentId === state.activeAgentId) {
        state.agentRuns = runs;
        renderAgentRuns();
      }
    });
  }

  function setMode(mode) {
    state.mode = mode;
    const isAgents = mode === "agents";
    els.terminalsModeButton.classList.toggle("active", !isAgents);
    els.agentsModeButton.classList.toggle("active", isAgents);
    els.newButton.classList.toggle("hidden", isAgents);
    els.newAgentButton.classList.toggle("hidden", !isAgents);
    els.sessionList.classList.toggle("hidden", isAgents);
    els.agentList.classList.toggle("hidden", !isAgents);
    els.terminalWorkspace.classList.toggle("hidden", isAgents);
    els.agentsWorkspace.classList.toggle("hidden", !isAgents);
    if (isAgents) {
      loadAgents().catch((error) => alert(error.message));
      loadModels();
    } else fitTerminal();
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
      closeButton.innerHTML =
        '<svg class="icon" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

      button.append(title, detail);
      button.addEventListener("click", () => selectSession(session.id));
      closeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        requestCloseSession(session.id);
      });

      row.append(button, closeButton);
      els.sessionList.append(row);
    }
  }

  async function loadAgents() {
    const data = await api("/api/agents");
    state.agents = data.agents || [];
    state.agentRuns = state.activeAgentId
      ? (data.runs || []).filter((run) => run.agentId === state.activeAgentId)
      : [];
    renderAgents();
    if (!state.activeAgentId && state.agents.length) await selectAgent(state.agents[0].id);
    else renderAgentForm();
  }

  async function loadModels(refresh = false) {
    try {
      const data = await api(`/api/opencode/models${refresh ? "?refresh=1" : ""}`);
      state.models = data.models || [];
    } catch (error) {
      state.models = [];
    }
    syncModelFields(currentAgent());
  }

  function setSelectValue(select, value) {
    select.value = value || "";
    if (select.value !== (value || "") && value) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = `${value} (${t("modelNotListed")})`;
      select.append(option);
      select.value = value;
    }
  }

  function renderModelOptions() {
    els.agentModelInput.replaceChildren();
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = t("useDefaultModel");
    els.agentModelInput.append(defaultOption);
    for (const model of state.models) {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.id;
      els.agentModelInput.append(option);
    }
  }

  function renderVariantOptions(modelId) {
    const model = state.models.find((item) => item.id === modelId);
    els.agentVariantInput.replaceChildren();
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = t("useDefaultEffort");
    els.agentVariantInput.append(defaultOption);
    for (const value of model?.effortOptions || []) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      els.agentVariantInput.append(option);
    }
  }

  function syncModelFields(agent) {
    renderModelOptions();
    setSelectValue(els.agentModelInput, agent?.model || "");
    renderVariantOptions(els.agentModelInput.value);
    setSelectValue(els.agentVariantInput, agent?.variant || "");
  }

  function renderAgents() {
    els.agentList.replaceChildren();

    for (const agent of state.agents) {
      const row = document.createElement("div");
      row.className = `session-row agent-row${agent.id === state.activeAgentId ? " active" : ""}`;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "session-item";

      const title = document.createElement("strong");
      title.textContent = agent.name;
      const detail = document.createElement("span");
      detail.textContent = agent.status ? t(agent.status) : t("idle");

      button.append(title, detail);
      button.addEventListener("click", () => selectAgent(agent.id));
      row.append(button);
      els.agentList.append(row);
    }
  }

  function currentAgent() {
    return state.agents.find((agent) => agent.id === state.activeAgentId) || null;
  }

  async function selectAgent(id) {
    state.activeAgentId = id;
    renderAgents();
    renderAgentForm();
    if (!id) {
      state.agentRuns = [];
      renderAgentRuns();
      return;
    }
    const data = await api(`/api/agents/${encodeURIComponent(id)}/runs`);
    state.agentRuns = data.runs || [];
    renderAgentRuns();
  }

  function newAgentDraft() {
    state.activeAgentId = "__new";
    state.agentRuns = [];
    renderAgents();
    renderAgentForm({
      id: "__new",
      name: t("newAgent"),
      description: "",
      cwd: state.status?.defaults?.cwd || "",
      prompt: "",
      enabled: false,
      schedule: { days: [1, 3, 5], time: "09:00" },
      status: "idle"
    });
    renderAgentRuns();
  }

  // Only touches status-derived bits (buttons, title, subtitle) so it's safe to call on
  // every live agents:list update without clobbering in-progress edits to the form fields.
  function renderAgentStatus(agent = currentAgent()) {
    const hasAgent = Boolean(agent);
    const isRunning = hasAgent && agent.status === "running";
    els.agentForm.classList.toggle("hidden", !hasAgent);
    els.runAgentButton.disabled = !hasAgent || agent.id === "__new" || isRunning;
    els.stopAgentButton.classList.toggle("hidden", !isRunning);
    els.stopAgentButton.disabled = !isRunning;
    els.saveAgentButton.disabled = !hasAgent;
    els.deleteAgentButton.disabled = !hasAgent || agent.id === "__new";

    if (!hasAgent) {
      els.agentTitle.textContent = t("noAgentSelected");
      els.agentSubtitle.textContent = "";
      return;
    }

    els.agentTitle.textContent = agent.name || t("newAgent");
    els.agentSubtitle.textContent = [
      agent.nextRunAt ? `${t("nextRun")}: ${formatDate(agent.nextRunAt)}` : null,
      agent.lastRunAt ? `${t("lastRun")}: ${formatDate(agent.lastRunAt)}` : null
    ]
      .filter(Boolean)
      .join(" | ");
  }

  function renderAgentForm(agent = currentAgent()) {
    renderAgentStatus(agent);
    if (!agent) return;

    els.agentNameInput.value = agent.name || "";
    els.agentDescriptionInput.value = agent.description || "";
    els.agentCwdInput.value = agent.cwd || state.status?.defaults?.cwd || "";
    els.agentPromptInput.value = agent.prompt || "";
    syncModelFields(agent);
    els.agentEnabledInput.checked = Boolean(agent.enabled);
    els.agentTimeInput.value = agent.schedule?.time || "09:00";
    const days = new Set((agent.schedule?.days || []).map(String));
    for (const input of els.agentForm.querySelectorAll('input[name="days"]')) {
      input.checked = days.has(input.value);
    }
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat(state.language, {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function collectAgentForm() {
    return {
      name: els.agentNameInput.value,
      description: els.agentDescriptionInput.value,
      cwd: els.agentCwdInput.value,
      prompt: els.agentPromptInput.value,
      model: els.agentModelInput.value,
      variant: els.agentVariantInput.value,
      enabled: els.agentEnabledInput.checked,
      schedule: {
        time: els.agentTimeInput.value || "09:00",
        days: [...els.agentForm.querySelectorAll('input[name="days"]:checked')].map((input) =>
          Number(input.value)
        )
      }
    };
  }

  async function saveAgent() {
    const payload = collectAgentForm();
    const isNew = state.activeAgentId === "__new";
    const response = isNew
      ? await api("/api/agents", { method: "POST", body: payload })
      : await api(`/api/agents/${encodeURIComponent(state.activeAgentId)}`, { method: "PUT", body: payload });
    await loadAgents();
    await selectAgent(response.agent.id);
  }

  function renderAgentRuns() {
    els.agentRuns.replaceChildren();
    if (!state.agentRuns.length) {
      const empty = document.createElement("div");
      empty.className = "directory-empty";
      empty.textContent = t("noRuns");
      els.agentRuns.append(empty);
      return;
    }

    for (const run of state.agentRuns) {
      const item = document.createElement("article");
      item.className = "run-item";

      const header = document.createElement("header");
      const meta = document.createElement("span");
      meta.textContent = `${formatDate(run.startedAt)} | ${t(run.trigger || "manual")}`;
      const status = document.createElement("span");
      status.className = `run-status ${run.status}`;
      status.textContent = t(run.status || "idle");
      header.append(meta, status);

      const output = document.createElement("pre");
      output.className = "run-output";
      output.textContent = [run.stdout, run.stderr, run.error].filter(Boolean).join("\n").trim();
      if (!output.textContent) output.textContent = run.command ? `${run.command} ${run.args.join(" ")}` : "";

      item.append(header, output);
      els.agentRuns.append(item);
    }
  }

  const TERMINAL_THEMES = {
    dark: {
      background: "#0a0d0a",
      foreground: "#e1e3df",
      cursor: "#6cdbb2",
      selectionBackground: "#33564a"
    },
    light: {
      background: "#ffffff",
      foreground: "#191c19",
      cursor: "#146c52",
      selectionBackground: "#bfe8d6"
    }
  };

  function applyTerminalTheme() {
    if (!state.terminal) return;
    state.terminal.options.theme = TERMINAL_THEMES[state.theme] || TERMINAL_THEMES.dark;
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    els.themeToggleButton.querySelector(".theme-icon-dark").classList.toggle("hidden", theme === "light");
    els.themeToggleButton.querySelector(".theme-icon-light").classList.toggle("hidden", theme !== "light");
    applyTerminalTheme();
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
      theme: TERMINAL_THEMES[state.theme] || TERMINAL_THEMES.dark
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

  function requestCloseSession(id) {
    const session = state.sessions.find((item) => item.id === id);
    if (!session) return;

    state.pendingCloseId = id;
    els.confirmCloseBody.textContent = t("closeTerminalBody", { title: session.title });
    els.confirmCloseDialog.showModal();
  }

  function closeSessionNow(id) {
    if (!id) return;
    state.socket.emit("session:kill", { id }, (response) => {
      if (!response?.ok) alert(translateErrorMessage(response?.error) || t("unableCloseTerminal"));
    });
  }

  function setDirectoryLoading() {
    els.fsList.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "directory-empty";
    empty.textContent = t("loading");
    els.fsList.append(empty);
  }

  async function loadDirectory(targetPath) {
    setDirectoryLoading();
    const query = targetPath ? `?path=${encodeURIComponent(targetPath)}` : "";
    const data = await api(`/api/fs/directories${query}`);
    state.directoryPath = data.current;
    renderDirectoryBrowser(data);
  }

  function renderDirectoryBrowser(data) {
    els.fsCurrentPath.textContent = data.current;
    els.fsUpButton.disabled = !data.parent;
    els.fsUpButton.dataset.parent = data.parent || "";

    els.fsRoots.replaceChildren();
    for (const root of data.roots || []) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = root.name;
      button.addEventListener("click", () => {
        loadDirectory(root.path).catch((error) => alert(error.message));
      });
      els.fsRoots.append(button);
    }

    els.fsList.replaceChildren();
    if (!data.entries.length) {
      const empty = document.createElement("div");
      empty.className = "directory-empty";
      empty.textContent = t("noFolders");
      els.fsList.append(empty);
      return;
    }

    for (const entry of data.entries) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "directory-entry";
      button.setAttribute("role", "listitem");
      button.title = entry.path;

      const icon = document.createElement("span");
      icon.setAttribute("aria-label", t("folderIcon"));
      icon.textContent = ">";

      const label = document.createElement("span");
      label.textContent = entry.name;

      button.append(icon, label);
      button.addEventListener("click", () => {
        loadDirectory(entry.path).catch((error) => alert(error.message));
      });
      els.fsList.append(button);
    }
  }

  async function openDirectoryPicker(target = "terminal") {
    state.directoryTarget = target;
    const input = target === "agent" ? els.agentCwdInput : els.cwdInput;
    setDirectoryLoading();
    els.filesystemDialog.showModal();
    try {
      await loadDirectory(input.value || state.status?.defaults?.cwd || "");
    } catch (error) {
      alert(error.message);
      els.filesystemDialog.close();
    }
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
      const captchaToken = await getCaptchaToken();
      await api("/api/login", {
        method: "POST",
        body: {
          username: form.get("username"),
          password: form.get("password"),
          captchaToken
        }
      });
      await boot();
    } catch (error) {
      resetCaptcha();
      setAuthMessage(error.message);
    }
  });

  els.themeToggleButton.addEventListener("click", () => {
    applyTheme(state.theme === "light" ? "dark" : "light");
  });

  els.logoutButton.addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" });
    if (state.socket) state.socket.disconnect();
    state.sessions = [];
    state.activeId = null;
    await boot();
  });

  els.terminalsModeButton.addEventListener("click", () => setMode("terminals"));
  els.agentsModeButton.addEventListener("click", () => setMode("agents"));

  els.newButton.addEventListener("click", () => {
    els.dialog.showModal();
    window.setTimeout(() => els.newForm.elements.title.focus(), 0);
  });

  els.newAgentButton.addEventListener("click", () => {
    newAgentDraft();
  });

  els.cancelNew.addEventListener("click", () => {
    els.dialog.close();
  });

  els.browseCwdButton.addEventListener("click", () => {
    openDirectoryPicker("terminal");
  });

  els.browseAgentCwdButton.addEventListener("click", () => {
    openDirectoryPicker("agent");
  });

  els.cancelFilesystem.addEventListener("click", () => {
    els.filesystemDialog.close();
  });

  els.fsUpButton.addEventListener("click", () => {
    const current = state.directoryPath;
    if (!current) return;
    const parent = els.fsUpButton.disabled ? null : els.fsUpButton.dataset.parent;
    if (parent) {
      loadDirectory(parent).catch((error) => alert(error.message));
    }
  });

  els.selectCwdButton.addEventListener("click", () => {
    if (state.directoryPath) {
      const input = state.directoryTarget === "agent" ? els.agentCwdInput : els.cwdInput;
      input.value = state.directoryPath;
    }
    els.filesystemDialog.close();
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

  els.saveAgentButton.addEventListener("click", async () => {
    try {
      await saveAgent();
    } catch (error) {
      alert(error.message || t("unableSaveAgent"));
    }
  });

  els.runAgentButton.addEventListener("click", async () => {
    const agent = currentAgent();
    if (!agent) return;
    try {
      await api(`/api/agents/${encodeURIComponent(agent.id)}/run`, { method: "POST" });
      await loadAgents();
      await selectAgent(agent.id);
    } catch (error) {
      alert(error.message || t("unableRunAgent"));
    }
  });

  els.stopAgentButton.addEventListener("click", async () => {
    const agent = currentAgent();
    if (!agent) return;
    try {
      await api(`/api/agents/${encodeURIComponent(agent.id)}/stop`, { method: "POST" });
      await loadAgents();
      await selectAgent(agent.id);
    } catch (error) {
      alert(error.message || t("unableStopAgent"));
    }
  });

  els.refreshModelsButton.addEventListener("click", () => loadModels(true));

  els.agentModelInput.addEventListener("change", () => {
    renderVariantOptions(els.agentModelInput.value);
  });

  els.deleteAgentButton.addEventListener("click", async () => {
    const agent = currentAgent();
    if (!agent) return;
    try {
      await api(`/api/agents/${encodeURIComponent(agent.id)}`, { method: "DELETE" });
      state.activeAgentId = null;
      await loadAgents();
    } catch (error) {
      alert(error.message);
    }
  });

  els.killButton.addEventListener("click", () => {
    const session = currentSession();
    if (!session) return;
    requestCloseSession(session.id);
  });

  function updateSecurityFieldVisibility() {
    const provider = els.securityProviderInput.value;
    els.securityKeyFields.classList.toggle("hidden", provider === "none");
    els.securityMinScoreField.classList.toggle("hidden", provider !== "recaptcha_v3");
  }

  async function openSecurityDialog() {
    els.securityMessage.textContent = "";
    els.securityMessage.classList.remove("success");
    els.securityDialog.showModal();
    try {
      const data = await api("/api/security");
      els.securityProviderInput.value = data.security.captchaProvider;
      els.securitySiteKeyInput.value = data.security.siteKey || "";
      els.securitySecretKeyInput.value = data.security.secretKey || "";
      els.securityMinScoreInput.value = data.security.recaptchaMinScore ?? 0.5;
      updateSecurityFieldVisibility();
    } catch (error) {
      alert(error.message || t("unableLoadSecurity"));
      els.securityDialog.close();
    }
  }

  els.securitySettingsButton.addEventListener("click", () => {
    openSecurityDialog();
  });

  els.securityProviderInput.addEventListener("change", updateSecurityFieldVisibility);

  els.cancelSecurity.addEventListener("click", () => {
    els.securityDialog.close();
  });

  els.saveSecurityButton.addEventListener("click", async () => {
    els.securityMessage.textContent = "";
    els.securityMessage.classList.remove("success");
    try {
      const data = await api("/api/security", {
        method: "PUT",
        body: {
          captchaProvider: els.securityProviderInput.value,
          siteKey: els.securitySiteKeyInput.value,
          secretKey: els.securitySecretKeyInput.value,
          recaptchaMinScore: Number(els.securityMinScoreInput.value) || 0.5
        }
      });
      state.status.security = { captchaProvider: data.security.captchaProvider, siteKey: data.security.siteKey };
      els.securityMessage.classList.add("success");
      els.securityMessage.textContent = t("securitySaved");
    } catch (error) {
      els.securityMessage.textContent = error.message || t("unableSaveSecurity");
    }
  });

  els.cancelCloseSession.addEventListener("click", () => {
    state.pendingCloseId = null;
    els.confirmCloseDialog.close();
  });

  els.confirmCloseSession.addEventListener("click", () => {
    const id = state.pendingCloseId;
    state.pendingCloseId = null;
    els.confirmCloseDialog.close();
    closeSessionNow(id);
  });

  window.addEventListener("resize", fitTerminal);
  translateStaticUi();
  applyTheme(state.theme);
  boot();
})();
