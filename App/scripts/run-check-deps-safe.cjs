#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const script = path.join(__dirname, 'check-deps.cjs');
const res = spawnSync(process.execPath, [script], { stdio: 'inherit' });

if (res.error) {
  console.error('Error running check-deps:', res.error);
}

// Always exit 0 so postinstall does not block CI or local installs
process.exit(0);
