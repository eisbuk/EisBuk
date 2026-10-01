#!/usr/bin/env node

// Functions predeploy hook (see firebase.json): Cloud Functions installs the
// dependencies in packages/functions/package.json with npm, which does not
// understand pnpm's "workspace:" protocol. The workspace packages are bundled into
// dist/ by esbuild, so we drop them from the package.json that gets uploaded.
// deploy-firebase.expect (and the postdeploy hook, on success) put the file back.

const fs = require("fs");

const file = process.argv[2];
if (!file) {
  console.error("usage: strip-workspace-deps.js <path/to/package.json>");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
for (const field of dependencyFields) {
  for (const [name, spec] of Object.entries(pkg[field] || {})) {
    if (spec.startsWith("workspace:")) {
      console.log(`Removing ${field}.${name} (${spec}) from ${file}`);
      delete pkg[field][name];
    }
  }
}
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
