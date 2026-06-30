const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function realpathIfExists(target) {
  return fs.realpathSync.native(target);
}

function getSystemRoots() {
  if (process.platform !== "win32") {
    return ["/"];
  }

  const roots = [];
  for (let code = 65; code <= 90; code += 1) {
    const root = `${String.fromCharCode(code)}:\\`;
    if (fs.existsSync(root)) roots.push(root);
  }
  return roots.length ? roots : [path.parse(process.cwd()).root];
}

function displayName(fullPath) {
  const parsed = path.parse(fullPath);
  if (fullPath === parsed.root) return parsed.root;
  return path.basename(fullPath) || fullPath;
}

class FilesystemBrowser {
  constructor({ defaultCwd, workspaceRoot }) {
    this.defaultCwd = path.resolve(defaultCwd || process.cwd());
    this.workspaceRoot = workspaceRoot ? path.resolve(workspaceRoot) : null;
  }

  getBoundary() {
    if (!this.workspaceRoot) return null;
    return realpathIfExists(this.workspaceRoot);
  }

  resolveRequestedPath(requestedPath) {
    const initialPath = requestedPath ? String(requestedPath) : this.defaultCwd;
    return realpathIfExists(path.resolve(initialPath));
  }

  assertAllowed(target) {
    const boundary = this.getBoundary();
    if (boundary && !isInside(boundary, target)) {
      const error = new Error(`Path must be inside ${boundary}`);
      error.code = "path_outside_workspace";
      throw error;
    }
  }

  async list(requestedPath) {
    const boundary = this.getBoundary();
    const current = boundary && !requestedPath ? boundary : this.resolveRequestedPath(requestedPath);
    this.assertAllowed(current);

    const stat = await fsp.stat(current);
    if (!stat.isDirectory()) {
      const error = new Error(`Path is not a directory: ${current}`);
      error.code = "path_not_directory";
      throw error;
    }

    const entries = await fsp.readdir(current, { withFileTypes: true });
    const directories = [];
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

      const fullPath = path.join(current, entry.name);
      try {
        const realPath = realpathIfExists(fullPath);
        const childStat = await fsp.stat(realPath);
        if (!childStat.isDirectory()) continue;
        if (boundary && !isInside(boundary, realPath)) continue;
        directories.push({
          name: entry.name,
          path: realPath
        });
      } catch {
        // Ignore inaccessible directories so browsing stays smooth.
      }
    }

    directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    const parent = path.dirname(current);
    const canGoUp = parent !== current && (!boundary || isInside(boundary, parent));
    const roots = boundary
      ? [{ name: displayName(boundary), path: boundary }]
      : getSystemRoots().map((root) => ({ name: displayName(root), path: root }));

    return {
      current,
      parent: canGoUp ? parent : null,
      home: os.homedir(),
      workspaceRoot: boundary,
      roots,
      entries: directories
    };
  }
}

module.exports = {
  FilesystemBrowser
};
