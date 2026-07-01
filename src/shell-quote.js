const { execFile } = require("child_process");

function windowsQuote(value) {
  const text = String(value);
  if (!/[ \t"&|<>^]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

// Node's spawn/execFile resolve a bare command name (no path separators) via PATH on
// POSIX directly, but on Windows that lookup does not apply PATHEXT, so npm-installed
// .cmd shims (like opencode.cmd) fail with ENOENT unless invoked through a shell.
function resolveSpawnTarget(command, args) {
  if (process.platform !== "win32") {
    return { file: command, args };
  }
  const invocation = [command, ...args].map(windowsQuote).join(" ");
  return { file: process.env.ComSpec || "cmd.exe", args: ["/d", "/s", "/c", invocation] };
}

// When resolveSpawnTarget wraps a command in cmd.exe, the process we hold a handle to
// is the shell, not the real program underneath it. Killing just that handle leaves the
// actual child running orphaned on Windows, so terminate the whole process tree instead.
function killTree(child) {
  if (process.platform === "win32") {
    execFile("taskkill", ["/pid", String(child.pid), "/t", "/f"], () => {});
    return;
  }
  child.kill("SIGTERM");
  const timer = setTimeout(() => child.kill("SIGKILL"), 5_000);
  timer.unref();
}

module.exports = { windowsQuote, resolveSpawnTarget, killTree };
