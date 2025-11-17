/**
 * Generate update manifest (latest.json) for Tauri updater
 * This file tells the app where to find the latest version and download URLs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
);

const version = packageJson.version;
const repo = 'leothefleo49/Solar-Panel-Calculator';
const baseUrl = `https://github.com/${repo}/releases/download/v${version}`;

// Generate the update manifest
const manifest = {
  version: `v${version}`,
  notes: `Solar Panel Calculator v${version} - Check release notes on GitHub`,
  pub_date: new Date().toISOString(),
  platforms: {
    'windows-x86_64': {
      signature: '',
      url: `${baseUrl}/Solar-Panel-Calculator-Windows.exe`,
    },
    'darwin-x86_64': {
      signature: '',
      url: `${baseUrl}/Solar-Panel-Calculator-macOS.dmg`,
    },
    'darwin-aarch64': {
      signature: '',
      url: `${baseUrl}/Solar-Panel-Calculator-macOS.dmg`,
    },
    'linux-x86_64': {
      signature: '',
      url: `${baseUrl}/Solar-Panel-Calculator-Linux.AppImage`,
    },
  },
};

// Write to file
const outputPath = path.join(__dirname, '..', 'latest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

console.log('✅ Generated latest.json for version', version);
console.log('📝 Manifest:', outputPath);
