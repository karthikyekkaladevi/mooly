# Mooly

A real-time, on-screen AI assistant desktop app. This is Milestone 1: a working scaffold with a transparent overlay window, a Settings window, and every architectural layer (capture, context, providers, personalization, storage) present as a stub, wired end-to-end with fake data.

See `CAPTURE.md` for exactly what is captured/stored and how to delete it.

## Prerequisites

Node.js and pnpm are required to build and run this project. A working native C++ build toolchain is also required: the `better-sqlite3` native module is automatically rebuilt between Node's ABI (for tests via `pnpm test`) and Electron's ABI (for the app via `pnpm --filter desktop dev` or `build`). On Windows, install Visual Studio Build Tools with the C++ workload; on macOS/Linux, ensure Python with `distutils`/`setuptools` and a C++ compiler (e.g., Xcode, gcc) are installed.

## Getting started

```bash
pnpm install
pnpm test        # run all package unit tests
pnpm --filter desktop dev   # launch the Electron app
```

## Layout

- `apps/desktop` — the Electron app (main process, preload, React renderer for the overlay and settings windows).
- `packages/shared-types` — cross-package TypeScript types.
- `packages/capture` — screen/audio capture interfaces (stub implementations in this milestone).
- `packages/context` — combines transcript + screen + style profile into a compact LLM prompt.
- `packages/providers` — the `Provider` interface and a `StubProvider` (real Anthropic/OpenAI/local-model providers land in a later milestone).
- `packages/personalization` — builds a `StyleProfile` from sample text (real chat-export import lands in a later milestone).
- `packages/storage` — local SQLite persistence for sessions, transcripts, suggestions, and settings.
