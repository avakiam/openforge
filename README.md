# OpenForge

OpenForge is a small web panel for running multiple long-lived [OpenCode](https://opencode.ai/docs/) terminals from a browser.

It creates a first-run admin account, checks whether `opencode` is installed, can install it automatically, and keeps terminal sessions alive on the server when browser tabs disconnect.

The web UI automatically uses English, Spanish, or Catalan based on the browser language, with English as the fallback.

## Local Test

```bash
npm install
npm start
```

Then open [http://localhost:8734](http://localhost:8734), create the first username/password, and press **New** to start an OpenCode terminal.

The New Terminal dialog lets you type a working directory or browse server folders with the built-in folder picker.

## Agents

OpenForge has two work areas:

- **Terminals**: interactive long-running OpenCode PTYs.
- **Agents**: saved background jobs that run OpenCode on a schedule.

Agents store a name, description, working directory, prompt, model, effort/variant, enabled flag, weekly run days, and run time. The default new-agent schedule is Monday, Wednesday, and Friday at 09:00, which fits a "three articles a week" SEO workflow.

The Model dropdown is populated from `opencode models`, so it only lists providers/models you've actually linked in OpenCode. The Effort dropdown maps to OpenCode's `--variant` flag (provider-specific reasoning effort) and updates to show only the options that model actually supports, sourced from the [models.dev](https://models.dev) catalog. Both are optional — leave them on "Use OpenCode default" to skip the flag entirely.

By default, an agent run executes:

```bash
opencode run --auto --dir "<agent working directory>" "<agent prompt>"
```

Run history is stored in `OPENFORGE_DATA_DIR`, including status, timestamps, stdout, stderr, and the command used. Agents run in the background while the OpenForge server is running, even if no browser tab is open.

A running agent can be cancelled from the UI with the **Stop** button. Runs are also killed automatically if they exceed `OPENFORGE_AGENT_TIMEOUT_MS`. If the server restarts while a run is in progress, that run is marked as interrupted on the next startup instead of staying stuck as "running" forever.

You can override the agent command:

```bash
OPENFORGE_AGENT_COMMAND=opencode
OPENFORGE_AGENT_ARGS='run --auto --dir {cwd} {prompt}'
```

Placeholders:

- `{cwd}` becomes the agent working directory.
- `{prompt}` becomes the agent prompt.

For app-only development without installing OpenCode:

```bash
# Linux/macOS
OPENFORGE_SKIP_OPENCODE_INSTALL=1 npm start

# Windows PowerShell
$env:OPENFORGE_SKIP_OPENCODE_INSTALL="1"; npm start
```

## Ubuntu Server Test

After publishing this repository to GitHub, a fresh server can install it like this:

```bash
sudo apt-get update
sudo apt-get install -y git curl
git clone https://github.com/avakiam/openforge.git
cd openforge
bash scripts/install-ubuntu.sh
HOST=0.0.0.0 PORT=8734 npm start
```

For a service that restarts automatically:

```bash
bash scripts/install-ubuntu.sh --with-service
sudo systemctl status openforge
```

Then open `http://SERVER_IP:8734`.

Manual setup is also fine:

Install Node.js 20+ and runtime basics:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs curl bash
node --version
npm --version
```

Copy this project to the server, then:

```bash
cd /opt/openforge
npm install
HOST=0.0.0.0 PORT=8734 npm start
```

Open `http://SERVER_IP:8734`, create the first admin account, and create terminals from the left panel.

## Windows Test

After publishing this repository to GitHub:

```powershell
git clone https://github.com/avakiam/openforge.git
cd openforge
powershell -ExecutionPolicy Bypass -File .\scripts\install-windows.ps1
npm start
```

Then open [http://localhost:8734](http://localhost:8734).

## Updating An Existing Install

Ubuntu clone started manually:

```bash
cd /path/to/openforge
bash scripts/update-ubuntu.sh --no-restart
npm start
```

Ubuntu systemd service install:

```bash
cd /path/to/openforge
bash scripts/update-ubuntu.sh
sudo systemctl status openforge
```

Windows:

```powershell
cd C:\path\to\openforge
powershell -ExecutionPolicy Bypass -File .\scripts\update-windows.ps1
npm start
```

The update scripts keep `data/` and service data intact. They use `git pull --ff-only`, so they stop safely if the server has local code changes that need manual review first.

OpenForge uses the official OpenCode install script on Linux/macOS:

```bash
curl -fsSL https://opencode.ai/install | bash
```

On Windows it uses the documented npm package when npm is available:

```powershell
npm install -g opencode-ai
```

You can also install OpenCode manually before starting OpenForge. If `opencode` is already on `PATH`, OpenForge will use it.

## Run Forever With systemd

Create a dedicated directory and user if you want a production-like test:

```bash
sudo mkdir -p /opt/openforge /var/lib/openforge /srv/openforge-workspaces
sudo chown -R "$USER":"$USER" /opt/openforge /var/lib/openforge /srv/openforge-workspaces
```

You can let the installer write the service with:

```bash
bash scripts/install-ubuntu.sh --with-service
```

Or create `/etc/systemd/system/openforge.service` manually:

```ini
[Unit]
Description=OpenForge OpenCode web terminals
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/openforge
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=HOST=0.0.0.0
Environment=PORT=8734
Environment=OPENFORGE_DATA_DIR=/var/lib/openforge
Environment=OPENFORGE_DEFAULT_CWD=/srv/openforge-workspaces

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openforge
sudo systemctl status openforge
```

Terminal sessions survive browser disconnects and page refreshes. Saved terminal entries are also restored after an OpenForge restart or host reboot, as long as OpenForge is started again.

## Session Persistence

OpenForge keeps live terminal processes as server-owned PTYs, and stores each open terminal's name and working directory on disk.

- Browser refresh or disconnect: live terminal processes keep running.
- OpenForge process restart: saved terminal entries are recreated automatically.
- Host reboot: saved terminal entries are recreated automatically after OpenForge starts again.
- User accounts, login/session data, and terminal restore records remain on disk in `OPENFORGE_DATA_DIR`.
- Terminal process memory and unsaved interactive output cannot survive an OS reboot; OpenForge starts a fresh OpenCode process in the same working directory.
- Closing a terminal from the UI removes its restore record.
- With `bash scripts/install-ubuntu.sh --with-service`, systemd enables OpenForge to start again automatically after reboot.

If you do not install the systemd service, start OpenForge manually after reboot with `npm start`.

## Reverse Proxy

If you expose this beyond a private network, put it behind HTTPS. Socket.IO needs WebSocket upgrade headers:

```nginx
server {
    listen 443 ssl;
    server_name openforge.example.com;

    location / {
        proxy_pass http://127.0.0.1:8734;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

When running behind HTTPS:

```bash
OPENFORGE_TRUST_PROXY=1 OPENFORGE_COOKIE_SECURE=1 npm start
```

## Configuration

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `0.0.0.0` | Server bind address. |
| `PORT` | `8734` | Server port. |
| `OPENFORGE_DATA_DIR` | `./data` | Stores users, session cookies, and app state. |
| `OPENFORGE_DEFAULT_CWD` | project directory | Working directory for new terminals. |
| `OPENFORGE_WORKSPACE_ROOT` | unset | Optional directory boundary for terminal working directories. |
| `OPENFORGE_OPENCODE_COMMAND` | `opencode` | Command used when creating OpenCode terminals. |
| `OPENFORGE_OPENCODE_ARGS` | empty | Extra arguments appended to OpenCode. |
| `OPENFORGE_AGENT_COMMAND` | same as `OPENFORGE_OPENCODE_COMMAND` | Command used when running an agent. |
| `OPENFORGE_AGENT_ARGS` | `run --auto --dir {cwd} {prompt}` | Overrides the full argument list for agent runs; supports `{cwd}`, `{prompt}`, `{model}`, and `{variant}` placeholders. |
| `OPENFORGE_AUTO_INSTALL` | `1` | Set to `0` to disable startup install checks. |
| `OPENFORGE_SKIP_OPENCODE_INSTALL` | unset | Set to `1` to skip installing during development. |
| `OPENFORGE_OPENCODE_INSTALL_COMMAND` | unset | Custom install command. |
| `OPENFORGE_COOKIE_SECURE` | auto | Set to `1` when served only over HTTPS. |
| `OPENFORGE_TRUST_PROXY` | unset | Set to `1` behind a reverse proxy. |
| `OPENFORGE_AGENT_TIMEOUT_MS` | `1200000` (20 min) | Kills an agent run that exceeds this duration. |

## Login Security (Captcha)

Once you're signed in, the **Seguridad / Security** button at the bottom of the sidebar opens login security settings. From there you can require a captcha on the sign-in form:

- **None** (default) — no captcha, no external requests.
- **reCAPTCHA v2** — visible "I'm not a robot" checkbox.
- **reCAPTCHA v3** — invisible, scores the request and lets you set a minimum score (0-1).
- **Cloudflare Turnstile** — visible or invisible depending on how the site key was created.

You'll need a site key and secret key from the provider's own console ([Google reCAPTCHA admin](https://www.google.com/recaptcha/admin), [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)). The secret key never leaves the server; only the site key is sent to the browser. This only protects `/api/login` — the very first admin account creation (`/api/setup`) is not gated, since it happens before any security settings can exist.

If you get locked out (wrong keys, or the verification endpoint is unreachable from your server), edit `security.captchaProvider` back to `"none"` in `state.json` inside your `OPENFORGE_DATA_DIR` and restart OpenForge.

## Security Notes

This app gives authenticated users browser access to real shell processes on the host. Use a strong password, HTTPS, a firewall, and a non-root service user. Do not expose it publicly without those controls.
