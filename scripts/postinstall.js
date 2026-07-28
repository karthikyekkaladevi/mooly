#!/usr/bin/env node
// Postinstall script that conditionally rebuilds better-sqlite3 for Electron's ABI
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if electron is installed in the desktop app (where it will be added in Task 7)
const electronPath = path.join(__dirname, '..', 'apps', 'desktop', 'node_modules', 'electron');

// Only run electron-rebuild if electron is installed in the desktop app
if (fs.existsSync(electronPath)) {
  // Electron is present - rebuild better-sqlite3 for Electron's ABI
  // This command will fail if electron-rebuild can't run, which is the correct behavior
  execSync('electron-rebuild -f -w better-sqlite3 --module-dir apps/desktop', {
    stdio: 'inherit'
  });
} else {
  // Electron not installed yet in apps/desktop (expected during early setup)
  // Skip rebuild and exit cleanly
  process.exit(0);
}
