const bcrypt = require("bcryptjs");

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username
  };
}

function validateCredentials(username, password) {
  if (!USERNAME_PATTERN.test(username || "")) {
    return {
      code: "invalid_username",
      message: "Username must be 3-32 characters using letters, numbers, dots, underscores, or dashes."
    };
  }
  if (typeof password !== "string" || password.length < 8) {
    return {
      code: "invalid_password",
      message: "Password must be at least 8 characters."
    };
  }
  return null;
}

function saveSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        reject(regenerateError);
        return;
      }

      req.session.user = publicUser(user);
      req.session.save((saveError) => {
        if (saveError) reject(saveError);
        else resolve();
      });
    });
  });
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    res.status(401).json({ code: "auth_required", error: "Authentication required." });
    return;
  }
  next();
}

function attachAuthRoutes(app, store) {
  app.post("/api/setup", async (req, res, next) => {
    try {
      if (store.hasUsers()) {
        res.status(409).json({ code: "setup_completed", error: "Setup has already been completed." });
        return;
      }

      const username = String(req.body.username || "").trim();
      const password = String(req.body.password || "");
      const validationError = validateCredentials(username, password);
      if (validationError) {
        res.status(400).json({ code: validationError.code, error: validationError.message });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await store.addUser({ username, passwordHash });
      await saveSession(req, user);
      res.json({ user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      const username = String(req.body.username || "").trim();
      const password = String(req.body.password || "");
      const user = store.getUserByUsername(username);

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        res.status(401).json({ code: "invalid_credentials", error: "Invalid username or password." });
        return;
      }

      await saveSession(req, user);
      res.json({ user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }
      res.clearCookie("openforge.sid");
      res.json({ ok: true });
    });
  });
}

module.exports = {
  attachAuthRoutes,
  publicUser,
  requireAuth
};
