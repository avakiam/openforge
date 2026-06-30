const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const files = [
  ...fs.readdirSync(path.join(root, "src")).filter((file) => file.endsWith(".js")).map((file) => path.join("src", file)),
  path.join("public", "app.js")
];

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, file)], {
    stdio: "inherit"
  });
  if (result.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
