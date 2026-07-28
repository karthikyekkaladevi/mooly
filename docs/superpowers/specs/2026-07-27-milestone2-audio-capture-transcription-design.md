# Milestone 2: Real Audio Capture + Local Transcription — Design

## Context

Milestone 1 built Mooly's full scaffold — overlay, Settings, and the stub pipeline (capture → context → provider → overlay → storage) — with every capture/context/provider/personalization layer as a clean interface backed by a stub implementation. This milestone replaces the audio half of the capture layer with a real implementation: actual microphone and system-audio capture, transcribed locally via whisper.cpp, feeding the same pipeline that already works end-to-end with canned data.

Screen capture and the LLM provider remain stubbed — this milestone is scoped to audio capture and transcription only, so it can be designed, built, and verified in isolation before the next milestone tackles screen capture or a real provider.

The project was decomposed into a rough milestone roadmap during Milestone 1's brainstorming (real screen capture, real audio capture, a real LLM provider, personalization import, OAuth connectors, privacy/kill-switch finishing, packaging). This spec covers only the audio-capture milestone; each subsequent milestone gets its own brainstorm and spec when its turn comes.

Key decisions from brainstorming, already confirmed with the user:
- Capture **both** microphone and system audio, as two separately-labeled sources (not mixed into one stream) — this matches the `TranscriptChunk.source: 'mic' | 'system' | 'stub'` field Milestone 1 already defined for exactly this purpose.
- Reference the open-source [OpenWhispr](https://github.com/OpenWhispr/openwhispr) project's *approach* (local whisper.cpp transcription, mic+system audio capture) as inspiration only — it is a full standalone Electron app (MIT licensed), not a library, so Mooly builds its own Windows-focused implementation rather than depending on it directly.
- Transcription is **local whisper.cpp only** in this milestone (no cloud transcription option, no `TranscriptionProvider` abstraction layer yet — YAGNI until a second implementation is actually needed).
- whisper.cpp runs as a **subprocess** (`child_process.execFile`), not an in-process native (N-API) binding, specifically to avoid repeating Milestone 1's `better-sqlite3` Node-vs-Electron ABI conflict. A subprocess has no ABI to conflict — it's just an external `.exe`.
- Bundle the **`base`** GGML model (~140MB) — the accuracy/speed middle ground for real-time-ish transcription on a typical CPU.
- The whisper.cpp binary and model are **bundled into the app** (vendored into a fixed resources folder for this milestone), not downloaded on first run. Wiring that folder into a real installer via `electron-builder`'s `extraResources` is a packaging concern for a later milestone — out of scope here.
- Device selection defaults to the OS default mic/output automatically, but Settings also exposes a picker (per source) so the user can override the default if they want.
- Windows only, consistent with Milestone 1's platform constraint.
- The existing `AudioCapture` interface (`start`/`stop`/`pullTranscript`) is unchanged — `pipeline.ts` requires no changes. Only a new implementation is substituted in for `StubAudioCapture`.

## Architecture

```
Hidden capture BrowserWindow (renderer)          Main process
┌─────────────────────────────────┐              ┌───────────────────────────────┐
│ getUserMedia(mic)                │  IPC (audio  │ ffmpeg-static: webm → WAV      │
│ desktopCapturer + getUserMedia   │──chunk blob─▶│ whisper.cpp subprocess (CLI)   │
│   (system audio loopback)        │  + source +  │   → text                       │
│ MediaRecorder, ~6s rolling chunks│  timestamp    │ RealAudioCapture.pullTranscript│
└─────────────────────────────────┘              │   returns labeled TranscriptChunk│
                                                   └───────────────────────────────┘
```

### Why a hidden window

Node's main process has no `getUserMedia`/`MediaStream`/`desktopCapturer`-consuming APIs — those are Chromium/browser APIs, only reachable from a renderer. A second, permanently hidden `BrowserWindow` (never shown, no taskbar entry, closed only when capture stops) is the bridge: its tiny renderer script is the only place mic/system audio is actually captured. On Windows, both `getUserMedia({audio: true})` (mic) and `desktopCapturer`-sourced `getUserMedia` (system-audio loopback) work without a native permission-dialog prompt, unlike macOS.

### Package/file layout

- `packages/capture/src/index.ts` — existing `AudioCapture` interface, unchanged. Adds a new exported class alongside `StubAudioCapture` (e.g. `RealAudioCapture`) implementing the same interface. Since this class needs `BrowserWindow`/`ipcMain`/`desktopCapturer`, `@mooly/capture` gains a runtime dependency on `electron` — consistent with how `@mooly/storage` already depends on the runtime-specific `better-sqlite3`.
- `packages/capture/src/whisper.ts` — pure-ish wrapper around the whisper.cpp subprocess: builds the CLI argument list given a WAV path + model path, invokes it, parses its text output. Testable with fixture inputs/outputs — no real binary needed for the unit tests.
- `packages/capture/src/audioConvert.ts` — wraps `ffmpeg-static` to convert a recorded blob (webm/opus, whatever `MediaRecorder` produces) to 16kHz mono WAV. The argument-building is testable the same way as `whisper.ts`.
- `apps/desktop/src/renderer/capture-audio/` — a new, tiny renderer entry (own `index.html` + script, new `electron.vite.config.ts` renderer input) that does the actual `getUserMedia`/`MediaRecorder` work and posts finished chunks back over IPC. Never shown to the user.
- `apps/desktop/resources/whisper/` — vendored whisper.cpp Windows binary (a prebuilt release from the official [ggerganov/whisper.cpp](https://github.com/ggerganov/whisper.cpp) GitHub releases, not self-compiled) + the `ggml-base.bin` model file (downloaded from whisper.cpp's published model mirror). Both are fetched into this gitignored folder by a one-time setup script (`scripts/setup-whisper.js`, run manually or via a workspace `postinstall`-adjacent step) rather than committed to git — committing a 140MB binary blob to the repo isn't warranted. Referenced via a repo-relative path in dev; wiring this folder into a real installer via `electron-builder`'s `extraResources` is a later packaging milestone's job.
- `apps/desktop/src/main/settingsStore.ts` / `renderer/settings/App.tsx` — `AppSettings` gains optional `micDeviceId`/`systemAudioDeviceId` fields; Settings gets a dropdown per source, populated via `navigator.mediaDevices.enumerateDevices()`, defaulting to "System Default" when unset.

## Data flow

1. `RealAudioCapture.start()` creates the hidden capture window (if not already created) and tells its renderer to start recording both sources (using the configured device IDs, or "default").
2. The renderer records rolling ~6-second chunks independently per source via two separate `MediaRecorder` instances (mic and system audio are not synchronized to the same chunk boundary — each simply emits its own chunk every ~6 seconds on its own clock). When a chunk completes, it's sent over IPC to the main process as `{ blob, source: 'mic' | 'system', timestamp }`.
3. Main process runs `audioConvert` (ffmpeg) to produce a 16kHz mono WAV temp file, then `whisper.ts` to invoke the whisper.cpp subprocess against that WAV + the bundled `base` model, producing text.
4. The resulting text becomes a `TranscriptChunk { timestamp, text, source }`, pushed onto `RealAudioCapture`'s internal buffer.
5. `pullTranscript()` drains that buffer, exactly as `StubAudioCapture.pullTranscript()` already does — `pipeline.ts` and everything downstream (`assembleContext`, storage) needs no changes at all.
6. `stop()` tears down the hidden window and any in-flight recorders/subprocesses.

## Error handling

- No mic or system-audio device available, or `getUserMedia` permission denied: log a warning and continue producing zero chunks from that source. Never crash the pipeline — consistent with Milestone 1's final-review error-containment fixes (the pipeline tick already tolerates a failed capture cycle).
- The whisper.cpp binary or model file missing/corrupt at startup: fail loudly with an error dialog (same pattern as Milestone 1's SQLite-open failure) — silent failure here would mean the app looks like it's running while transcribing nothing, which is worse than an obvious crash.
- A single chunk's ffmpeg conversion or whisper.cpp invocation failing: skip that one chunk, log it, and keep going. One bad chunk should never end a session.
- The hidden capture window crashing/being destroyed unexpectedly: `RealAudioCapture` detects this (window's `closed`/`destroyed` event) and recreates it on the next `start()` rather than silently capturing nothing forever.

## Testing

The capture bridge itself (hidden window, real `getUserMedia`, real hardware) is not unit-testable — same limitation Milestone 1 already accepted for the overlay/Settings windows. Verification here is manual: run the app, speak into the mic and play audio from another source, confirm both show up as separately-labeled transcript entries in the SQLite `transcript_entries` table (the same verification technique Milestone 1 used for the stub pipeline).

What IS unit-testable, with real Vitest tests against fixture data (no real binary/hardware invocation):
- `whisper.ts`: given a WAV path + model path, produces the exact expected CLI argument list; given a fixture stdout string in whisper.cpp's real output format, parses out the expected transcript text.
- `audioConvert.ts`: given input/output paths, produces the expected `ffmpeg` argument list.
- The `AppSettings` device-ID fields and their default-to-`undefined`-means-"use system default" behavior, at the `settingsStore.ts` level (already-established package, extending its existing test surface).

## Out of Scope for This Milestone

Cloud/optional transcription providers and a `TranscriptionProvider` abstraction (YAGNI until a second implementation is needed); real screen capture; a real LLM provider (still `StubProvider`); packaging the whisper binary/model into a real installer via `electron-builder` (vendored resources folder only, for now); voice-activity-detection-based chunk segmentation (fixed rolling windows only); noise suppression/echo cancellation between simultaneously-captured mic and system audio.

## Verification

1. `pnpm test` from the workspace root passes, including new tests for `whisper.ts`'s argument-building/output-parsing and `audioConvert.ts`'s argument-building.
2. `pnpm --filter desktop dev` launches the app; speaking into the microphone produces `mic`-sourced transcript entries, and playing audio through the system's default output (e.g. a YouTube video) produces `system`-sourced transcript entries — both visible in the overlay's streamed suggestions (once fed through the still-stubbed provider) and in the SQLite `transcript_entries` table.
3. Settings shows a mic and a system-audio device dropdown, both defaulting to "System Default"; changing either and restarting capture uses the newly selected device.
4. Unplugging/disabling a mic (or denying permission) does not crash the app — the pipeline continues running with zero `mic`-sourced chunks.
5. Deleting or renaming the bundled whisper.cpp binary/model and relaunching the app shows a clear startup error dialog rather than a silent failure.
