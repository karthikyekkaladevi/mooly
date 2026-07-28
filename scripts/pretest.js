#!/usr/bin/env node
// Ensures better-sqlite3's native binding matches the ABI of the Node.js binary
// that runs Vitest, before the test suite runs.
//
// scripts/postinstall.js rebuilds better-sqlite3 for Electron's ABI once
// apps/desktop/node_modules/electron exists (starting with Task 7). Because pnpm
// dedupes better-sqlite3 into a single physical copy shared by packages/storage
// and apps/desktop (confirmed via `pnpm why better-sqlite3 -r`), that
// Electron-targeted rebuild leaves the native binding incompatible with
// `vitest run`, which always executes under plain Node.js:
//
//   The module '.../better-sqlite3/build/Release/better_sqlite3.node'
//   was compiled against a different Node.js version using
//   NODE_MODULE_VERSION 128. This version of Node.js requires
//   NODE_MODULE_VERSION 137.
//
// Rather than removing the Electron rebuild (which the Electron main process
// needs in order to require('better-sqlite3') without crashing), this script
// runs immediately before `vitest run` and rebuilds back to the current
// Node.js ABI only if a mismatch is actually detected, so `pnpm test` is never
// at the mercy of whichever ABI the last `pnpm install` left the binary in.
const { execFileSync } = require('child_process');
const { createRequire } = require('module');
const fs = require('fs');
const path = require('path');

const requireFromStorage = createRequire(
  path.join(__dirname, '..', 'packages', 'storage', 'package.json')
);

try {
  // require() alone only loads the JS wrapper; the native .node binary is
  // loaded lazily inside the Database constructor, so we must actually
  // instantiate one to detect an ABI mismatch.
  const Database = requireFromStorage('better-sqlite3');
  new Database(':memory:').close();
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  if (!/NODE_MODULE_VERSION/.test(message)) {
    throw error;
  }

  console.log(
    '[pretest] better-sqlite3 native binding ABI mismatch detected (likely rebuilt for ' +
      "Electron by postinstall) - recompiling for Node.js's ABI before running tests..."
  );

  const betterSqlite3Dir = path.dirname(
    requireFromStorage.resolve('better-sqlite3/package.json')
  );
  const requireFromBetterSqlite3 = createRequire(
    path.join(betterSqlite3Dir, 'package.json')
  );
  const nodeGypBin = requireFromBetterSqlite3.resolve('node-gyp/bin/node-gyp.js');

  // The `build/` directory left behind (including build/config.gypi) was
  // generated for the *Electron* rebuild. On Windows that rebuild picks the
  // ClangCL MSBuild toolset (clang=1); reusing that stale config here fails
  // with "The build tools for ClangCL ... cannot be found" unless ClangCL
  // build tools happen to be installed. Wipe it so node-gyp regenerates a
  // fresh config, and pass --clang=0 explicitly so it targets plain MSVC.
  fs.rmSync(path.join(betterSqlite3Dir, 'build'), { recursive: true, force: true });

  execFileSync(
    process.execPath,
    [nodeGypBin, 'rebuild', '--release', '--clang=0'],
    { stdio: 'inherit', cwd: betterSqlite3Dir }
  );

  // Verify the rebuild actually produced a Node-ABI-compatible binary.
  delete require.cache[requireFromStorage.resolve('better-sqlite3')];
  const RebuiltDatabase = requireFromStorage('better-sqlite3');
  new RebuiltDatabase(':memory:').close();
  console.log('[pretest] better-sqlite3 rebuilt successfully for the current Node.js ABI.');
}
