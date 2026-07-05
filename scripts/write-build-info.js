#!/usr/bin/env node
/**
 * Writes src/buildInfo.json with the app version and build timestamp.
 * Runs on prestart/prebuild so the value shown in the UI always reflects the
 * bundle that is actually running — useful for confirming a fresh `cap sync`.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));

const info = {
  version: pkg.version,
  builtAt: new Date().toISOString(),
};

const outPath = path.join(root, 'src', 'buildInfo.json');
fs.writeFileSync(outPath, `${JSON.stringify(info, null, 2)}\n`);
