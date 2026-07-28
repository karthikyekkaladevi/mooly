#!/usr/bin/env node
// Postinstall script that gracefully handles missing dependencies
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron');

// Only run electron-rebuild if electron is installed
if (fs.existsSync(electronPath)) {
  try {
    execSync('electron-rebuild -f -w better-sqlite3 --module-dir apps/desktop', {
      stdio: 'inherit'
    });
  } catch (error) {
    // Fail silently - might be missing better-sqlite3 or other issues
    process.exit(0);
  }
} else {
  // Electron not installed yet, skip rebuild
  process.exit(0);
}
