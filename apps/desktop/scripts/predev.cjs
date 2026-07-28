#!/usr/bin/env node
// Ensures better-sqlite3's native binding is compiled for Electron's ABI
// before `electron-vite dev` or `electron-vite build` starts.
//
// See root scripts/pretest.js for the full explanation of the underlying
// conflict: pnpm dedupes better-sqlite3 into a single physical native binary
// shared by packages/storage and apps/desktop (confirmed via
// `pnpm why better-sqlite3 -r`). Running `pnpm test` rebuilds that binary
// for the current Node.js ABI via pretest.js, which leaves it incompatible
// with Electron's ABI - so the Electron main process would crash with a
// NODE_MODULE_VERSION mismatch the moment it requires('better-sqlite3')
// (once storage is wired into the main process in a later task) if dev/build
// runs right after a test run.
//
// Rather than reinventing pretest.js's mismatch-detection dance in reverse
// (rebuilding for Electron's ABI via node-gyp directly would require
// duplicating @electron/rebuild's knowledge of Electron's headers/ABI number
// per Electron version), this just re-runs the exact same electron-rebuild
// command scripts/postinstall.js already uses, unconditionally, every time
// before dev/build. electron-rebuild is fast when the ABI already matches
// (it detects there's nothing to do and skips recompiling), so doing this
// unconditionally is simpler than detecting the mismatch first and just as
// correct.
const { execFileSync } = require('child_process');
const { createRequire } = require('module');
const path = require('path');

const repoRoot = path.join(__dirname, '..', '..', '..');
const requireFromRoot = createRequire(path.join(repoRoot, 'package.json'));
const electronRebuildCli = requireFromRoot.resolve('@electron/rebuild/lib/cli.js');

execFileSync(
  process.execPath,
  [electronRebuildCli, '-f', '-w', 'better-sqlite3', '--module-dir', 'apps/desktop'],
  { stdio: 'inherit', cwd: repoRoot }
);
