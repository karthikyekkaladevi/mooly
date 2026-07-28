# Mooly Milestone 1: Scaffold + Overlay + Stubbed Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold Mooly as a pnpm workspace (Electron + React + TypeScript + Tailwind), with a working transparent always-on-top overlay window and a Settings window, and every architectural layer (capture, context, providers, personalization, storage) implemented as a clean interface with a stub implementation, wired end-to-end with canned data through real local SQLite persistence.

**Architecture:** A pnpm workspace with `apps/desktop` (the Electron app: main/preload/renderer) and independently-testable `packages/*` libraries (`shared-types`, `capture`, `context`, `providers`, `personalization`, `storage`). The desktop app's main process wires the stub capture → context assembly → stub provider streaming → overlay IPC → SQLite persistence pipeline on a timer, simulating a live session with fake data.

**Tech Stack:** pnpm workspaces, TypeScript 5, electron-vite, Electron, React 18, Tailwind CSS, Vitest, better-sqlite3.

## Global Constraints

- Package manager is **pnpm**; workspace defined via `pnpm-workspace.yaml` with `apps/*` and `packages/*`.
- No API key is ever hardcoded or shared by the developer — users supply their own key in Settings, stored only in the local SQLite DB. This milestone's provider is a **stub only**; no network/API calls occur anywhere in this milestone.
- Overlay click-through behavior is **hover-to-activate** (click-through by default, interactive on mouseenter, reverts on mouseleave) — no global hotkey in this milestone.
- Storage is **real SQLite** via `better-sqlite3`, persisting stub-pipeline data — not mocked/in-memory in the running app (tests use `:memory:` databases).
- Target platform for this milestone is **Windows only**.
- App-icon customization is explicitly **out of scope** for this milestone.
- All packages are TypeScript, `strict: true`, ESM (`"type": "module"`).
- Test runner is **Vitest**, run from the workspace root (`pnpm test`), discovering `packages/*/src/**/*.test.ts`.

---

### Task 1: Workspace scaffold + `shared-types` package

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `vitest.config.ts` (root)
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/index.ts`
- Test: `packages/shared-types/src/index.test.ts`

**Interfaces:**
- Produces (used by every later task): `TranscriptChunk`, `TranscriptEntry`, `ScreenSnapshot`, `StyleProfile`, `CompactPrompt`, `Suggestion`, `Session`, `ProviderConfig`, `AppSettings` — all exported from `@mooly/shared-types`.

- [ ] **Step 1: Create root workspace config files**

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

`package.json`:
```json
{
  "name": "mooly",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "pnpm --filter desktop dev",
    "build": "pnpm --filter desktop build",
    "test": "vitest run",
    "postinstall": "electron-rebuild -f -w better-sqlite3 --module-dir apps/desktop"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "@types/node": "^22.5.0",
    "@electron/rebuild": "^3.6.0"
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": false
  }
}
```

`.gitignore`:
```
node_modules
dist
out
*.log
.DS_Store
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    environment: 'node'
  }
});
```

- [ ] **Step 2: Create the `shared-types` package skeleton**

`packages/shared-types/package.json`:
```json
{
  "name": "@mooly/shared-types",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

`packages/shared-types/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

- [ ] **Step 3: Write the failing test for the shared types**

`packages/shared-types/src/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import type {
  TranscriptChunk,
  TranscriptEntry,
  ScreenSnapshot,
  StyleProfile,
  CompactPrompt,
  Suggestion,
  Session,
  ProviderConfig,
  AppSettings
} from './index';

describe('shared-types shapes', () => {
  it('accepts a well-formed TranscriptEntry built from a TranscriptChunk', () => {
    const chunk: TranscriptChunk = { timestamp: 1, text: 'hello', source: 'stub' };
    const entry: TranscriptEntry = { ...chunk, sessionId: 1 };
    expect(entry.sessionId).toBe(1);
    expect(entry.text).toBe('hello');
  });

  it('accepts well-formed values for every exported type', () => {
    const screen: ScreenSnapshot = { timestamp: 1, summary: 'x' };
    const profile: StyleProfile = { avgSentenceLength: 10, topPhrases: ['a'], formality: 'neutral' };
    const prompt: CompactPrompt = { transcriptExcerpt: 'x', screenSummary: 'y', styleNotes: 'z' };
    const suggestion: Suggestion = { sessionId: 1, timestamp: 1, text: 'x' };
    const session: Session = { startedAt: 1 };
    const providerConfig: ProviderConfig = { providerId: 'stub' };
    const settings: AppSettings = {
      overlayOpacity: 1,
      overlayX: 0,
      overlayY: 0,
      activeProvider: 'stub',
      apiKeys: {}
    };

    expect(screen.summary).toBe('x');
    expect(profile.formality).toBe('neutral');
    expect(prompt.transcriptExcerpt).toBe('x');
    expect(suggestion.text).toBe('x');
    expect(session.startedAt).toBe(1);
    expect(providerConfig.providerId).toBe('stub');
    expect(settings.activeProvider).toBe('stub');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm install && pnpm test -- shared-types`
Expected: FAIL — `Cannot find module './index'` (it doesn't exist yet).

- [ ] **Step 5: Implement the shared types**

`packages/shared-types/src/index.ts`:
```ts
export interface TranscriptChunk {
  timestamp: number;
  text: string;
  source: 'mic' | 'system' | 'stub';
}

export interface TranscriptEntry extends TranscriptChunk {
  id?: number;
  sessionId: number;
}

export interface ScreenSnapshot {
  timestamp: number;
  summary: string;
}

export interface StyleProfile {
  avgSentenceLength: number;
  topPhrases: string[];
  formality: 'casual' | 'neutral' | 'formal';
}

export interface CompactPrompt {
  transcriptExcerpt: string;
  screenSummary: string;
  styleNotes: string;
}

export interface Suggestion {
  id?: number;
  sessionId: number;
  timestamp: number;
  text: string;
}

export interface Session {
  id?: number;
  startedAt: number;
  endedAt?: number;
}

export interface ProviderConfig {
  providerId: string;
  model?: string;
  apiKey?: string;
}

export interface AppSettings {
  overlayOpacity: number;
  overlayX: number;
  overlayY: number;
  activeProvider: string;
  apiKeys: Record<string, string>;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test -- shared-types`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.base.json .gitignore vitest.config.ts packages/shared-types
git commit -m "chore: scaffold pnpm workspace and add shared-types package"
```

---

### Task 2: `personalization` package — `buildStyleProfile`

**Files:**
- Create: `packages/personalization/package.json`
- Create: `packages/personalization/tsconfig.json`
- Create: `packages/personalization/src/index.ts`
- Test: `packages/personalization/src/index.test.ts`

**Interfaces:**
- Consumes: `StyleProfile` from `@mooly/shared-types`.
- Produces: `buildStyleProfile(samples: string[]): StyleProfile`, used by Task 5 (`context`) and Task 10 (pipeline wiring).

- [ ] **Step 1: Create package skeleton**

`packages/personalization/package.json`:
```json
{
  "name": "@mooly/personalization",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@mooly/shared-types": "workspace:*"
  }
}
```

`packages/personalization/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"],
  "references": [{ "path": "../shared-types" }]
}
```

- [ ] **Step 2: Write the failing tests**

`packages/personalization/src/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildStyleProfile } from './index';

describe('buildStyleProfile', () => {
  it('computes average sentence length in words', () => {
    const profile = buildStyleProfile([
      'This is four words. This one has five words here.'
    ]);
    // sentence 1: "This is four words" -> 4 words
    // sentence 2: "This one has five words here" -> 6 words
    expect(profile.avgSentenceLength).toBeCloseTo(5, 5);
  });

  it('extracts top phrases, excluding short/stop words', () => {
    const profile = buildStyleProfile([
      'roadmap roadmap roadmap onboarding onboarding the a to is'
    ]);
    expect(profile.topPhrases[0]).toBe('roadmap');
    expect(profile.topPhrases).toContain('onboarding');
    expect(profile.topPhrases).not.toContain('the');
    expect(profile.topPhrases).not.toContain('is');
  });

  it('classifies casual tone from casual markers', () => {
    const profile = buildStyleProfile(["Hey, we're gonna wanna revisit this, yeah?"]);
    expect(profile.formality).toBe('casual');
  });

  it('classifies formal tone from formal markers', () => {
    const profile = buildStyleProfile(['Furthermore, the committee shall proceed regarding this matter.']);
    expect(profile.formality).toBe('formal');
  });

  it('classifies neutral tone when no markers are present', () => {
    const profile = buildStyleProfile(['The meeting starts at three.']);
    expect(profile.formality).toBe('neutral');
  });

  it('returns zero average length for empty input', () => {
    const profile = buildStyleProfile([]);
    expect(profile.avgSentenceLength).toBe(0);
    expect(profile.topPhrases).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- personalization`
Expected: FAIL — `Cannot find module './index'`.

- [ ] **Step 4: Implement `buildStyleProfile`**

`packages/personalization/src/index.ts`:
```ts
import type { StyleProfile } from '@mooly/shared-types';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'it', 'to', 'and', 'of', 'in', 'on', 'for',
  'that', 'this', 'i', 'you', 'we', 'here', 'has'
]);

const CASUAL_MARKERS = /\b(gonna|wanna|yeah|lol|hey|kinda|sorta)\b|'(re|ll|ve|d|t)\b/i;
const FORMAL_MARKERS = /\b(furthermore|therefore|regarding|pursuant|shall|committee)\b/i;

export function buildStyleProfile(samples: string[]): StyleProfile {
  const text = samples.join(' ').trim();

  if (text.length === 0) {
    return { avgSentenceLength: 0, topPhrases: [], formality: 'neutral' };
  }

  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const totalWords = sentences.reduce(
    (sum, s) => sum + s.split(/\s+/).filter(Boolean).length,
    0
  );
  const avgSentenceLength = sentences.length > 0 ? totalWords / sentences.length : 0;

  const wordCounts = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[a-z']+/g) ?? []) {
    if (STOPWORDS.has(word) || word.length < 3) continue;
    wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
  }
  const topPhrases = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  let formality: StyleProfile['formality'] = 'neutral';
  if (FORMAL_MARKERS.test(text)) {
    formality = 'formal';
  } else if (CASUAL_MARKERS.test(text)) {
    formality = 'casual';
  }

  return { avgSentenceLength, topPhrases, formality };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- personalization`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/personalization
git commit -m "feat: add personalization package with buildStyleProfile"
```

---

### Task 3: `providers` package — `Provider` interface + `StubProvider`

**Files:**
- Create: `packages/providers/package.json`
- Create: `packages/providers/tsconfig.json`
- Create: `packages/providers/src/index.ts`
- Test: `packages/providers/src/index.test.ts`

**Interfaces:**
- Consumes: `CompactPrompt` from `@mooly/shared-types`.
- Produces: `Provider` interface (`id`, `listModels`, `sendMessage`, `streamMessage`) and `StubProvider` class, used by Task 10 (pipeline wiring).

- [ ] **Step 1: Create package skeleton**

`packages/providers/package.json`:
```json
{
  "name": "@mooly/providers",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@mooly/shared-types": "workspace:*"
  }
}
```

`packages/providers/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"],
  "references": [{ "path": "../shared-types" }]
}
```

- [ ] **Step 2: Write the failing tests**

`packages/providers/src/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { StubProvider } from './index';
import type { CompactPrompt } from '@mooly/shared-types';

const prompt: CompactPrompt = {
  transcriptExcerpt: 'test transcript',
  screenSummary: 'test screen',
  styleNotes: 'test style'
};

describe('StubProvider', () => {
  it('has a stable id', () => {
    const provider = new StubProvider();
    expect(provider.id).toBe('stub');
  });

  it('listModels returns a non-empty list', async () => {
    const provider = new StubProvider();
    const models = await provider.listModels();
    expect(models.length).toBeGreaterThan(0);
  });

  it('sendMessage returns the canned response', async () => {
    const provider = new StubProvider({ cannedResponse: 'hello world' });
    const result = await provider.sendMessage(prompt);
    expect(result).toBe('hello world');
  });

  it('streamMessage yields chunks that concatenate to the same response', async () => {
    const provider = new StubProvider({ cannedResponse: 'hello there world', chunkDelayMs: 0 });
    let joined = '';
    for await (const chunk of provider.streamMessage(prompt)) {
      joined += chunk;
    }
    expect(joined.trim()).toBe('hello there world');
  });

  it('streamMessage yields more than one chunk for a multi-word response', async () => {
    const provider = new StubProvider({ cannedResponse: 'a b c d', chunkDelayMs: 0 });
    const chunks: string[] = [];
    for await (const chunk of provider.streamMessage(prompt)) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBe(4);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- providers`
Expected: FAIL — `Cannot find module './index'`.

- [ ] **Step 4: Implement the `Provider` interface and `StubProvider`**

`packages/providers/src/index.ts`:
```ts
import type { CompactPrompt } from '@mooly/shared-types';

export interface Provider {
  id: string;
  listModels(): Promise<string[]>;
  sendMessage(prompt: CompactPrompt): Promise<string>;
  streamMessage(prompt: CompactPrompt): AsyncGenerator<string, void, unknown>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface StubProviderOptions {
  cannedResponse?: string;
  chunkDelayMs?: number;
}

export class StubProvider implements Provider {
  id = 'stub';
  private cannedResponse: string;
  private chunkDelayMs: number;

  constructor(opts: StubProviderOptions = {}) {
    this.cannedResponse =
      opts.cannedResponse ??
      "Here's a thought: try summarizing the last point before moving to the next agenda item.";
    this.chunkDelayMs = opts.chunkDelayMs ?? 120;
  }

  async listModels(): Promise<string[]> {
    return ['stub-v1'];
  }

  async sendMessage(_prompt: CompactPrompt): Promise<string> {
    return this.cannedResponse;
  }

  async *streamMessage(_prompt: CompactPrompt): AsyncGenerator<string, void, unknown> {
    const words = this.cannedResponse.split(' ');
    for (const word of words) {
      if (this.chunkDelayMs > 0) {
        await delay(this.chunkDelayMs);
      }
      yield word + ' ';
    }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- providers`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/providers
git commit -m "feat: add providers package with Provider interface and StubProvider"
```

---

### Task 4: `capture` package — `AudioCapture` / `ScreenCapture` interfaces + stubs

**Files:**
- Create: `packages/capture/package.json`
- Create: `packages/capture/tsconfig.json`
- Create: `packages/capture/src/index.ts`
- Test: `packages/capture/src/index.test.ts`

**Interfaces:**
- Consumes: `TranscriptChunk`, `ScreenSnapshot` from `@mooly/shared-types`.
- Produces: `AudioCapture` interface (`start`, `stop`, `pullTranscript`), `ScreenCapture` interface (`captureSnapshot`), `StubAudioCapture`, `StubScreenCapture` classes — used by Task 10 (pipeline wiring).

- [ ] **Step 1: Create package skeleton**

`packages/capture/package.json`:
```json
{
  "name": "@mooly/capture",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@mooly/shared-types": "workspace:*"
  }
}
```

`packages/capture/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"],
  "references": [{ "path": "../shared-types" }]
}
```

- [ ] **Step 2: Write the failing tests**

`packages/capture/src/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { StubAudioCapture, StubScreenCapture } from './index';

describe('StubAudioCapture', () => {
  it('returns no transcript before start() is called', () => {
    const capture = new StubAudioCapture();
    expect(capture.pullTranscript()).toEqual([]);
  });

  it('returns one canned chunk per pull after start(), cycling through lines', () => {
    const capture = new StubAudioCapture();
    capture.start();
    const first = capture.pullTranscript();
    const second = capture.pullTranscript();
    expect(first.length).toBe(1);
    expect(second.length).toBe(1);
    expect(first[0].text).not.toBe('');
    expect(first[0].source).toBe('stub');
    expect(second[0].text).not.toBe(first[0].text);
  });

  it('returns no transcript after stop()', () => {
    const capture = new StubAudioCapture();
    capture.start();
    capture.pullTranscript();
    capture.stop();
    expect(capture.pullTranscript()).toEqual([]);
  });
});

describe('StubScreenCapture', () => {
  it('returns a snapshot with a non-empty summary and numeric timestamp', async () => {
    const capture = new StubScreenCapture();
    const snapshot = await capture.captureSnapshot();
    expect(typeof snapshot.summary).toBe('string');
    expect(snapshot.summary.length).toBeGreaterThan(0);
    expect(typeof snapshot.timestamp).toBe('number');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- capture`
Expected: FAIL — `Cannot find module './index'`.

- [ ] **Step 4: Implement the capture interfaces and stubs**

`packages/capture/src/index.ts`:
```ts
import type { TranscriptChunk, ScreenSnapshot } from '@mooly/shared-types';

export interface AudioCapture {
  start(): void;
  stop(): void;
  pullTranscript(): TranscriptChunk[];
}

export interface ScreenCapture {
  captureSnapshot(): Promise<ScreenSnapshot>;
}

const CANNED_LINES = [
  "Let's walk through the Q3 roadmap.",
  'I think we should prioritize the onboarding flow first.',
  'Can you share the doc after this call?',
  "Sounds good, let's follow up on Thursday."
];

export class StubAudioCapture implements AudioCapture {
  private started = false;
  private index = 0;

  start(): void {
    this.started = true;
  }

  stop(): void {
    this.started = false;
  }

  pullTranscript(): TranscriptChunk[] {
    if (!this.started) return [];
    const text = CANNED_LINES[this.index % CANNED_LINES.length];
    this.index += 1;
    return [{ timestamp: Date.now(), text, source: 'stub' }];
  }
}

export class StubScreenCapture implements ScreenCapture {
  async captureSnapshot(): Promise<ScreenSnapshot> {
    return {
      timestamp: Date.now(),
      summary:
        'Active window: Zoom meeting "Q3 Planning" with a shared slide titled "Roadmap Overview".'
    };
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- capture`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/capture
git commit -m "feat: add capture package with AudioCapture/ScreenCapture stubs"
```

---

### Task 5: `context` package — `assembleContext`

**Files:**
- Create: `packages/context/package.json`
- Create: `packages/context/tsconfig.json`
- Create: `packages/context/src/index.ts`
- Test: `packages/context/src/index.test.ts`

**Interfaces:**
- Consumes: `TranscriptChunk`, `ScreenSnapshot`, `StyleProfile`, `CompactPrompt` from `@mooly/shared-types`.
- Produces: `assembleContext(transcript: TranscriptChunk[], screen: ScreenSnapshot, profile: StyleProfile, opts?: { maxTranscriptChars?: number }): CompactPrompt`, used by Task 10 (pipeline wiring).

- [ ] **Step 1: Create package skeleton**

`packages/context/package.json`:
```json
{
  "name": "@mooly/context",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@mooly/shared-types": "workspace:*"
  }
}
```

`packages/context/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"],
  "references": [{ "path": "../shared-types" }]
}
```

- [ ] **Step 2: Write the failing tests**

`packages/context/src/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { assembleContext } from './index';
import type { TranscriptChunk, ScreenSnapshot, StyleProfile } from '@mooly/shared-types';

const screen: ScreenSnapshot = { timestamp: 1, summary: 'Zoom call: Q3 Planning' };
const profile: StyleProfile = {
  avgSentenceLength: 8,
  topPhrases: ['roadmap', 'onboarding'],
  formality: 'neutral'
};

describe('assembleContext', () => {
  it('joins transcript chunks in order into the excerpt', () => {
    const transcript: TranscriptChunk[] = [
      { timestamp: 1, text: 'First line.', source: 'stub' },
      { timestamp: 2, text: 'Second line.', source: 'stub' }
    ];
    const prompt = assembleContext(transcript, screen, profile);
    expect(prompt.transcriptExcerpt).toBe('First line. Second line.');
    expect(prompt.screenSummary).toBe('Zoom call: Q3 Planning');
  });

  it('includes formality and top phrases in styleNotes', () => {
    const prompt = assembleContext([], screen, profile);
    expect(prompt.styleNotes).toContain('neutral');
    expect(prompt.styleNotes).toContain('roadmap');
    expect(prompt.styleNotes).toContain('onboarding');
  });

  it('truncates the transcript excerpt to maxTranscriptChars, keeping the most recent text', () => {
    const transcript: TranscriptChunk[] = [
      { timestamp: 1, text: 'A'.repeat(20), source: 'stub' },
      { timestamp: 2, text: 'B'.repeat(20), source: 'stub' }
    ];
    const prompt = assembleContext(transcript, screen, profile, { maxTranscriptChars: 15 });
    expect(prompt.transcriptExcerpt.length).toBeLessThanOrEqual(15);
    expect(prompt.transcriptExcerpt).toBe('B'.repeat(15));
  });

  it('returns an empty excerpt for an empty transcript', () => {
    const prompt = assembleContext([], screen, profile);
    expect(prompt.transcriptExcerpt).toBe('');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- context`
Expected: FAIL — `Cannot find module './index'`.

- [ ] **Step 4: Implement `assembleContext`**

`packages/context/src/index.ts`:
```ts
import type { TranscriptChunk, ScreenSnapshot, StyleProfile, CompactPrompt } from '@mooly/shared-types';

export interface AssembleContextOptions {
  maxTranscriptChars?: number;
}

export function assembleContext(
  transcript: TranscriptChunk[],
  screen: ScreenSnapshot,
  profile: StyleProfile,
  opts: AssembleContextOptions = {}
): CompactPrompt {
  const maxChars = opts.maxTranscriptChars ?? 500;
  const fullExcerpt = transcript.map((entry) => entry.text).join(' ');
  const transcriptExcerpt =
    fullExcerpt.length > maxChars ? fullExcerpt.slice(fullExcerpt.length - maxChars) : fullExcerpt;

  const styleNotes = `Write in a ${profile.formality} tone, averaging about ${Math.round(
    profile.avgSentenceLength
  )} words per sentence. Favor phrasing like: ${profile.topPhrases.join(', ')}.`;

  return {
    transcriptExcerpt,
    screenSummary: screen.summary,
    styleNotes
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- context`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/context
git commit -m "feat: add context package with assembleContext"
```

---

### Task 6: `storage` package — SQLite wrapper

**Files:**
- Create: `packages/storage/package.json`
- Create: `packages/storage/tsconfig.json`
- Create: `packages/storage/src/schema.ts`
- Create: `packages/storage/src/index.ts`
- Test: `packages/storage/src/index.test.ts`

**Interfaces:**
- Consumes: `Session`, `TranscriptEntry`, `Suggestion` from `@mooly/shared-types`; `better-sqlite3`'s `Database` type.
- Produces: `openDatabase(path: string): Database.Database`, `initSchema(db)`, `createSession(db, startedAt): number`, `endSession(db, sessionId, endedAt): void`, `insertTranscriptEntry(db, entry): number`, `insertSuggestion(db, s): number`, `getSessions(db): Session[]`, `getTranscriptForSession(db, sessionId): TranscriptEntry[]`, `getSuggestionsForSession(db, sessionId): Suggestion[]`, `getSetting(db, key): string | undefined`, `setSetting(db, key, value): void`, `clearAll(db): void` — used by Task 10 (pipeline wiring) and Task 9 (settings persistence).

- [ ] **Step 1: Create package skeleton and install `better-sqlite3`**

`packages/storage/package.json`:
```json
{
  "name": "@mooly/storage",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@mooly/shared-types": "workspace:*",
    "better-sqlite3": "^11.3.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11"
  }
}
```

`packages/storage/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"],
  "references": [{ "path": "../shared-types" }]
}
```

Run: `pnpm install`

- [ ] **Step 2: Write the schema module**

`packages/storage/src/schema.ts`:
```ts
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER
);

CREATE TABLE IF NOT EXISTS transcript_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  timestamp INTEGER NOT NULL,
  text TEXT NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  timestamp INTEGER NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
```

- [ ] **Step 3: Write the failing tests**

`packages/storage/src/index.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import {
  openDatabase,
  initSchema,
  createSession,
  endSession,
  insertTranscriptEntry,
  insertSuggestion,
  getSessions,
  getTranscriptForSession,
  getSuggestionsForSession,
  getSetting,
  setSetting,
  clearAll
} from './index';

let db: Database.Database;

beforeEach(() => {
  db = openDatabase(':memory:');
  initSchema(db);
});

describe('storage', () => {
  it('creates and retrieves a session', () => {
    const id = createSession(db, 1000);
    const sessions = getSessions(db);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(id);
    expect(sessions[0].startedAt).toBe(1000);
    expect(sessions[0].endedAt).toBeUndefined();
  });

  it('ends a session', () => {
    const id = createSession(db, 1000);
    endSession(db, id, 2000);
    const sessions = getSessions(db);
    expect(sessions[0].endedAt).toBe(2000);
  });

  it('inserts and retrieves transcript entries for a session', () => {
    const sessionId = createSession(db, 1000);
    insertTranscriptEntry(db, { sessionId, timestamp: 1001, text: 'hello', source: 'stub' });
    insertTranscriptEntry(db, { sessionId, timestamp: 1002, text: 'world', source: 'stub' });
    const entries = getTranscriptForSession(db, sessionId);
    expect(entries).toHaveLength(2);
    expect(entries[0].text).toBe('hello');
    expect(entries[1].text).toBe('world');
  });

  it('inserts and retrieves suggestions for a session', () => {
    const sessionId = createSession(db, 1000);
    insertSuggestion(db, { sessionId, timestamp: 1005, text: 'try this' });
    const suggestions = getSuggestionsForSession(db, sessionId);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].text).toBe('try this');
  });

  it('round-trips settings key/value pairs', () => {
    expect(getSetting(db, 'apiKey')).toBeUndefined();
    setSetting(db, 'apiKey', 'abc123');
    expect(getSetting(db, 'apiKey')).toBe('abc123');
    setSetting(db, 'apiKey', 'xyz789');
    expect(getSetting(db, 'apiKey')).toBe('xyz789');
  });

  it('clearAll removes all session, transcript, suggestion, and setting rows', () => {
    const sessionId = createSession(db, 1000);
    insertTranscriptEntry(db, { sessionId, timestamp: 1001, text: 'hi', source: 'stub' });
    insertSuggestion(db, { sessionId, timestamp: 1002, text: 'sugg' });
    setSetting(db, 'k', 'v');

    clearAll(db);

    expect(getSessions(db)).toHaveLength(0);
    expect(getTranscriptForSession(db, sessionId)).toHaveLength(0);
    expect(getSuggestionsForSession(db, sessionId)).toHaveLength(0);
    expect(getSetting(db, 'k')).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm test -- storage`
Expected: FAIL — `Cannot find module './index'`.

- [ ] **Step 5: Implement the storage wrapper**

`packages/storage/src/index.ts`:
```ts
import Database from 'better-sqlite3';
import type { Session, TranscriptEntry, Suggestion } from '@mooly/shared-types';
import { SCHEMA_SQL } from './schema';

export function openDatabase(path: string): Database.Database {
  return new Database(path);
}

export function initSchema(db: Database.Database): void {
  db.exec(SCHEMA_SQL);
}

export function createSession(db: Database.Database, startedAt: number): number {
  const result = db.prepare('INSERT INTO sessions (started_at) VALUES (?)').run(startedAt);
  return Number(result.lastInsertRowid);
}

export function endSession(db: Database.Database, sessionId: number, endedAt: number): void {
  db.prepare('UPDATE sessions SET ended_at = ? WHERE id = ?').run(endedAt, sessionId);
}

export function insertTranscriptEntry(
  db: Database.Database,
  entry: Omit<TranscriptEntry, 'id'>
): number {
  const result = db
    .prepare(
      'INSERT INTO transcript_entries (session_id, timestamp, text, source) VALUES (?, ?, ?, ?)'
    )
    .run(entry.sessionId, entry.timestamp, entry.text, entry.source);
  return Number(result.lastInsertRowid);
}

export function insertSuggestion(db: Database.Database, s: Omit<Suggestion, 'id'>): number {
  const result = db
    .prepare('INSERT INTO suggestions (session_id, timestamp, text) VALUES (?, ?, ?)')
    .run(s.sessionId, s.timestamp, s.text);
  return Number(result.lastInsertRowid);
}

export function getSessions(db: Database.Database): Session[] {
  const rows = db
    .prepare('SELECT id, started_at as startedAt, ended_at as endedAt FROM sessions ORDER BY id')
    .all() as Array<{ id: number; startedAt: number; endedAt: number | null }>;
  return rows.map((row) => ({
    id: row.id,
    startedAt: row.startedAt,
    endedAt: row.endedAt ?? undefined
  }));
}

export function getTranscriptForSession(db: Database.Database, sessionId: number): TranscriptEntry[] {
  const rows = db
    .prepare(
      'SELECT id, session_id as sessionId, timestamp, text, source FROM transcript_entries WHERE session_id = ? ORDER BY id'
    )
    .all(sessionId) as TranscriptEntry[];
  return rows;
}

export function getSuggestionsForSession(db: Database.Database, sessionId: number): Suggestion[] {
  const rows = db
    .prepare(
      'SELECT id, session_id as sessionId, timestamp, text FROM suggestions WHERE session_id = ? ORDER BY id'
    )
    .all(sessionId) as Suggestion[];
  return rows;
}

export function getSetting(db: Database.Database, key: string): string | undefined {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

export function setSetting(db: Database.Database, key: string, value: string): void {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value);
}

export function clearAll(db: Database.Database): void {
  db.exec(
    'DELETE FROM suggestions; DELETE FROM transcript_entries; DELETE FROM sessions; DELETE FROM settings;'
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test -- storage`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
git add packages/storage
git commit -m "feat: add storage package with SQLite session/transcript/suggestion persistence"
```

---

### Task 7: `apps/desktop` scaffold — electron-vite + Tailwind + blank windows

**Files:**
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/tsconfig.json`
- Create: `apps/desktop/tsconfig.node.json`
- Create: `apps/desktop/electron.vite.config.ts`
- Create: `apps/desktop/tailwind.config.js`
- Create: `apps/desktop/postcss.config.js`
- Create: `apps/desktop/src/main/index.ts`
- Create: `apps/desktop/src/preload/index.ts`
- Create: `apps/desktop/src/preload/index.d.ts`
- Create: `apps/desktop/src/renderer/overlay/index.html`
- Create: `apps/desktop/src/renderer/overlay/main.tsx`
- Create: `apps/desktop/src/renderer/overlay/App.tsx`
- Create: `apps/desktop/src/renderer/settings/index.html`
- Create: `apps/desktop/src/renderer/settings/main.tsx`
- Create: `apps/desktop/src/renderer/settings/App.tsx`
- Create: `apps/desktop/src/renderer/shared/globals.css`

**Interfaces:**
- Consumes: nothing from other packages yet (this task only proves the shell boots).
- Produces: a running Electron app with two blank React windows, that Task 8/9/10 will fill in.

- [ ] **Step 1: Create `apps/desktop` package and install Electron/Vite/React/Tailwind deps**

`apps/desktop/package.json`:
```json
{
  "name": "desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "start": "electron-vite preview"
  },
  "dependencies": {
    "@mooly/shared-types": "workspace:*",
    "@mooly/capture": "workspace:*",
    "@mooly/context": "workspace:*",
    "@mooly/providers": "workspace:*",
    "@mooly/personalization": "workspace:*",
    "@mooly/storage": "workspace:*",
    "better-sqlite3": "^11.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "electron": "^32.0.0",
    "electron-vite": "^2.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.10",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20",
    "typescript": "^5.6.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/better-sqlite3": "^7.6.11"
  }
}
```

Run: `pnpm install`

- [ ] **Step 2: Configure TypeScript for the desktop app**

`apps/desktop/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vite/client"]
  },
  "include": ["src/renderer", "src/preload"],
  "references": [
    { "path": "../../packages/shared-types" },
    { "path": "../../packages/capture" },
    { "path": "../../packages/context" },
    { "path": "../../packages/providers" },
    { "path": "../../packages/personalization" },
    { "path": "../../packages/storage" }
  ]
}
```

`apps/desktop/tsconfig.node.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/main", "electron.vite.config.ts"]
}
```

- [ ] **Step 3: Configure electron-vite for two renderer entry points**

`apps/desktop/electron.vite.config.ts`:
```ts
import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: {
          overlay: resolve(__dirname, 'src/renderer/overlay/index.html'),
          settings: resolve(__dirname, 'src/renderer/settings/index.html')
        }
      }
    },
    plugins: [react()]
  }
});
```

- [ ] **Step 4: Configure Tailwind**

`apps/desktop/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,ts,tsx}'],
  theme: { extend: {} },
  plugins: []
};
```

`apps/desktop/postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

`apps/desktop/src/renderer/shared/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
  background: transparent;
}
```

- [ ] **Step 5: Create a minimal main process that opens two blank windows**

`apps/desktop/src/main/index.ts`:
```ts
import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';

function createWindow(entry: 'overlay' | 'settings', options: Electron.BrowserWindowConstructorOptions) {
  const win = new BrowserWindow({
    ...options,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${entry}/index.html`);
  } else {
    win.loadFile(join(__dirname, `../renderer/${entry}/index.html`));
  }

  return win;
}

app.whenReady().then(() => {
  createWindow('overlay', {
    width: 360,
    height: 160,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true
  });

  createWindow('settings', {
    width: 480,
    height: 520,
    title: 'Mooly Settings'
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

- [ ] **Step 6: Create a minimal preload script**

`apps/desktop/src/preload/index.ts`:
```ts
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('mooly', {});
```

`apps/desktop/src/preload/index.d.ts`:
```ts
export {};

declare global {
  interface Window {
    mooly: Record<string, never>;
  }
}
```

- [ ] **Step 7: Create the two blank renderer entries**

`apps/desktop/src/renderer/overlay/index.html`:
```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Mooly Overlay</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

`apps/desktop/src/renderer/overlay/main.tsx`:
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../shared/globals.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`apps/desktop/src/renderer/overlay/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="text-white text-sm p-2">Mooly overlay — hello world</div>
  );
}
```

`apps/desktop/src/renderer/settings/index.html`:
```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Mooly Settings</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

`apps/desktop/src/renderer/settings/main.tsx`:
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../shared/globals.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`apps/desktop/src/renderer/settings/App.tsx`:
```tsx
export default function App() {
  return <div className="p-4">Mooly settings — hello world</div>;
}
```

- [ ] **Step 8: Manually verify the scaffold boots**

Run: `pnpm --filter desktop dev`
Expected: A transparent frameless overlay window reading "Mooly overlay — hello world" appears always-on-top, and a normal "Mooly Settings" window reading "Mooly settings — hello world" appears alongside it.

- [ ] **Step 9: Commit**

```bash
git add apps/desktop
git commit -m "chore: scaffold Electron+React+Tailwind desktop app with blank overlay and settings windows"
```

---

### Task 8: Overlay hover-to-activate click-through + drag + recording indicator

**Files:**
- Modify: `apps/desktop/src/main/index.ts`
- Modify: `apps/desktop/src/preload/index.ts`
- Modify: `apps/desktop/src/preload/index.d.ts`
- Modify: `apps/desktop/src/renderer/overlay/App.tsx`

**Interfaces:**
- Produces: IPC channel `overlay:hover` (renderer → main, boolean payload); `window.mooly.reportOverlayHover(hovering: boolean): void` exposed to the overlay renderer. Consumed by Task 9/10 only insofar as the overlay window reference (`overlayWindow`) becomes a named export usable by `pipeline.ts`.

- [ ] **Step 1: Track the overlay window reference and add the hover IPC handler in main**

Replace the contents of `apps/desktop/src/main/index.ts` with:
```ts
import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';

export let overlayWindow: BrowserWindow | null = null;
export let settingsWindow: BrowserWindow | null = null;

function createWindow(entry: 'overlay' | 'settings', options: Electron.BrowserWindowConstructorOptions) {
  const win = new BrowserWindow({
    ...options,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${entry}/index.html`);
  } else {
    win.loadFile(join(__dirname, `../renderer/${entry}/index.html`));
  }

  return win;
}

app.whenReady().then(() => {
  overlayWindow = createWindow('overlay', {
    width: 360,
    height: 160,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true
  });
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  settingsWindow = createWindow('settings', {
    width: 480,
    height: 520,
    title: 'Mooly Settings'
  });

  ipcMain.on('overlay:hover', (_event, hovering: boolean) => {
    overlayWindow?.setIgnoreMouseEvents(!hovering, { forward: true });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

- [ ] **Step 2: Expose the hover reporter from preload**

`apps/desktop/src/preload/index.ts`:
```ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('mooly', {
  reportOverlayHover: (hovering: boolean) => ipcRenderer.send('overlay:hover', hovering)
});
```

`apps/desktop/src/preload/index.d.ts`:
```ts
export {};

declare global {
  interface Window {
    mooly: {
      reportOverlayHover: (hovering: boolean) => void;
    };
  }
}
```

- [ ] **Step 3: Wire hover-to-activate, a drag strip, and the recording indicator into the overlay UI**

`apps/desktop/src/renderer/overlay/App.tsx`:
```tsx
export default function App() {
  return (
    <div
      className="w-full h-full rounded-xl bg-black/70 text-white text-sm flex flex-col"
      onMouseEnter={() => window.mooly.reportOverlayHover(true)}
      onMouseLeave={() => window.mooly.reportOverlayHover(false)}
    >
      <div
        className="h-6 flex items-center gap-2 px-2 text-xs text-red-400 shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        Recording (stub)
      </div>
      <div className="px-2 pb-2 flex-1 overflow-hidden">Mooly overlay — hello world</div>
    </div>
  );
}
```

- [ ] **Step 4: Manually verify hover-to-activate behavior**

Run: `pnpm --filter desktop dev`
Expected: The overlay is click-through by default (clicks pass through to windows underneath it). Moving the mouse over the overlay makes it interactive (the drag strip can be dragged to move the window); moving the mouse away restores click-through.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop
git commit -m "feat: add hover-to-activate click-through, drag strip, and recording indicator to overlay"
```

---

### Task 9: Settings window — persisted `AppSettings` + live opacity/position

**Files:**
- Modify: `apps/desktop/src/main/index.ts`
- Modify: `apps/desktop/src/preload/index.ts`
- Modify: `apps/desktop/src/preload/index.d.ts`
- Create: `apps/desktop/src/main/settingsStore.ts`
- Modify: `apps/desktop/src/renderer/settings/App.tsx`

**Interfaces:**
- Consumes: `openDatabase`, `initSchema`, `getSetting`, `setSetting` from `@mooly/storage`; `AppSettings` from `@mooly/shared-types`.
- Produces: `getAppSettings(db): AppSettings`, `setAppSettings(db, partial: Partial<AppSettings>): AppSettings` in `settingsStore.ts`; IPC channels `settings:get` / `settings:set` (invoke); `window.mooly.getSettings()` / `window.mooly.setSettings(partial)` — consumed by Task 10's pipeline for reading `activeProvider`/`apiKeys`, and reused as-is (no changes) by that task.

- [ ] **Step 1: Write `settingsStore.ts` to (de)serialize `AppSettings` as one JSON blob under a single settings key**

`apps/desktop/src/main/settingsStore.ts`:
```ts
import type Database from 'better-sqlite3';
import { getSetting, setSetting } from '@mooly/storage';
import type { AppSettings } from '@mooly/shared-types';

const SETTINGS_KEY = 'app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  overlayOpacity: 0.9,
  overlayX: 100,
  overlayY: 100,
  activeProvider: 'stub',
  apiKeys: {}
};

export function getAppSettings(db: Database.Database): AppSettings {
  const raw = getSetting(db, SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as AppSettings;
}

export function setAppSettings(db: Database.Database, partial: Partial<AppSettings>): AppSettings {
  const merged = { ...getAppSettings(db), ...partial };
  setSetting(db, SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}
```

- [ ] **Step 2: Wire the SQLite database, and `settings:get`/`settings:set` IPC handlers, into main**

Replace the contents of `apps/desktop/src/main/index.ts` with:
```ts
import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { openDatabase, initSchema } from '@mooly/storage';
import { getAppSettings, setAppSettings } from './settingsStore';
import type { AppSettings } from '@mooly/shared-types';

export let overlayWindow: BrowserWindow | null = null;
export let settingsWindow: BrowserWindow | null = null;

const db = openDatabase(join(app.getPath('userData'), 'mooly.db'));
initSchema(db);

function createWindow(entry: 'overlay' | 'settings', options: Electron.BrowserWindowConstructorOptions) {
  const win = new BrowserWindow({
    ...options,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${entry}/index.html`);
  } else {
    win.loadFile(join(__dirname, `../renderer/${entry}/index.html`));
  }

  return win;
}

function applySettingsToOverlay(settings: AppSettings) {
  if (!overlayWindow) return;
  overlayWindow.setOpacity(settings.overlayOpacity);
  overlayWindow.setPosition(Math.round(settings.overlayX), Math.round(settings.overlayY));
}

app.whenReady().then(() => {
  const settings = getAppSettings(db);

  overlayWindow = createWindow('overlay', {
    width: 360,
    height: 160,
    x: Math.round(settings.overlayX),
    y: Math.round(settings.overlayY),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true
  });
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setOpacity(settings.overlayOpacity);

  settingsWindow = createWindow('settings', {
    width: 480,
    height: 520,
    title: 'Mooly Settings'
  });

  ipcMain.on('overlay:hover', (_event, hovering: boolean) => {
    overlayWindow?.setIgnoreMouseEvents(!hovering, { forward: true });
  });

  ipcMain.handle('settings:get', () => getAppSettings(db));

  ipcMain.handle('settings:set', (_event, partial: Partial<AppSettings>) => {
    const merged = setAppSettings(db, partial);
    applySettingsToOverlay(merged);
    return merged;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

- [ ] **Step 3: Expose `getSettings`/`setSettings` from preload**

`apps/desktop/src/preload/index.ts`:
```ts
import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings } from '@mooly/shared-types';

contextBridge.exposeInMainWorld('mooly', {
  reportOverlayHover: (hovering: boolean) => ipcRenderer.send('overlay:hover', hovering),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  setSettings: (partial: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:set', partial)
});
```

`apps/desktop/src/preload/index.d.ts`:
```ts
import type { AppSettings } from '@mooly/shared-types';

export {};

declare global {
  interface Window {
    mooly: {
      reportOverlayHover: (hovering: boolean) => void;
      getSettings: () => Promise<AppSettings>;
      setSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
    };
  }
}
```

- [ ] **Step 4: Build the Settings form**

`apps/desktop/src/renderer/settings/App.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { AppSettings } from '@mooly/shared-types';

export default function App() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    window.mooly.getSettings().then(setSettings);
  }, []);

  if (!settings) return <div className="p-4">Loading…</div>;

  async function update(partial: Partial<AppSettings>) {
    const merged = await window.mooly.setSettings(partial);
    setSettings(merged);
  }

  return (
    <div className="p-4 space-y-4 text-sm">
      <h1 className="text-lg font-semibold">Mooly Settings</h1>

      <section className="space-y-1">
        <label className="block font-medium">Provider</label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={settings.activeProvider}
          onChange={(e) => update({ activeProvider: e.target.value })}
        >
          <option value="stub">Stub Provider</option>
        </select>
      </section>

      <section className="space-y-1">
        <label className="block font-medium">API Key (unused by Stub Provider)</label>
        <input
          type="password"
          className="border rounded px-2 py-1 w-full"
          value={settings.apiKeys[settings.activeProvider] ?? ''}
          onChange={(e) =>
            update({ apiKeys: { ...settings.apiKeys, [settings.activeProvider]: e.target.value } })
          }
        />
      </section>

      <section className="space-y-1">
        <label className="block font-medium">Overlay Opacity ({settings.overlayOpacity.toFixed(2)})</label>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={settings.overlayOpacity}
          onChange={(e) => update({ overlayOpacity: Number(e.target.value) })}
          className="w-full"
        />
      </section>

      <section className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium">Overlay X</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            value={settings.overlayX}
            onChange={(e) => update({ overlayX: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block font-medium">Overlay Y</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            value={settings.overlayY}
            onChange={(e) => update({ overlayY: Number(e.target.value) })}
          />
        </div>
      </section>

      <section className="space-y-1 opacity-50">
        <label className="block font-medium">Capture (coming in a later milestone)</label>
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled /> Screen capture
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled /> Audio capture
        </label>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Manually verify settings persistence and live overlay updates**

Run: `pnpm --filter desktop dev`
Expected: Dragging the opacity slider visibly changes the overlay's opacity in real time; changing Overlay X/Y moves the overlay window; quitting and relaunching the app shows the same settings values (confirming SQLite persistence) and the overlay reopens at the saved position/opacity.

- [ ] **Step 6: Commit**

```bash
git add apps/desktop
git commit -m "feat: persist AppSettings in SQLite and apply opacity/position live to the overlay"
```

---

### Task 10: Pipeline wiring — stub capture → context → stub provider → overlay → storage

**Files:**
- Create: `apps/desktop/src/main/pipeline.ts`
- Modify: `apps/desktop/src/main/index.ts`
- Modify: `apps/desktop/src/preload/index.ts`
- Modify: `apps/desktop/src/preload/index.d.ts`
- Modify: `apps/desktop/src/renderer/overlay/App.tsx`

**Interfaces:**
- Consumes: `StubAudioCapture`, `StubScreenCapture` from `@mooly/capture`; `assembleContext` from `@mooly/context`; `StubProvider` from `@mooly/providers`; `buildStyleProfile` from `@mooly/personalization`; `createSession`, `insertTranscriptEntry`, `insertSuggestion` from `@mooly/storage`.
- Produces: `startPipeline(db, sessionId, overlayWindow): () => void` (returns a stop function) in `pipeline.ts`; IPC channel `suggestion:chunk` (main → renderer, `{ text: string; done: boolean }`); `window.mooly.onSuggestionChunk(cb)` exposed to the overlay renderer.

- [ ] **Step 1: Write `pipeline.ts`**

`apps/desktop/src/main/pipeline.ts`:
```ts
import type { BrowserWindow } from 'electron';
import type Database from 'better-sqlite3';
import { StubAudioCapture, StubScreenCapture } from '@mooly/capture';
import { assembleContext } from '@mooly/context';
import { StubProvider } from '@mooly/providers';
import { buildStyleProfile } from '@mooly/personalization';
import { insertTranscriptEntry, insertSuggestion } from '@mooly/storage';
import type { TranscriptChunk } from '@mooly/shared-types';

const TICK_INTERVAL_MS = 4000;

const SAMPLE_TONE_TEXT = [
  "Yeah I think we're gonna wanna ship the smaller version first, honestly.",
  "Let's circle back on the roadmap doc after this."
];

export function startPipeline(
  db: Database.Database,
  sessionId: number,
  overlayWindow: BrowserWindow
): () => void {
  const audioCapture = new StubAudioCapture();
  const screenCapture = new StubScreenCapture();
  const provider = new StubProvider();
  const styleProfile = buildStyleProfile(SAMPLE_TONE_TEXT);

  audioCapture.start();
  const transcriptBuffer: TranscriptChunk[] = [];

  const interval = setInterval(async () => {
    const newChunks = audioCapture.pullTranscript();
    for (const chunk of newChunks) {
      transcriptBuffer.push(chunk);
      insertTranscriptEntry(db, { sessionId, ...chunk });
    }

    const screenSnapshot = await screenCapture.captureSnapshot();
    const prompt = assembleContext(transcriptBuffer, screenSnapshot, styleProfile);

    let fullText = '';
    for await (const textChunk of provider.streamMessage(prompt)) {
      fullText += textChunk;
      overlayWindow.webContents.send('suggestion:chunk', { text: textChunk, done: false });
    }
    overlayWindow.webContents.send('suggestion:chunk', { text: '', done: true });

    insertSuggestion(db, { sessionId, timestamp: Date.now(), text: fullText.trim() });
  }, TICK_INTERVAL_MS);

  return () => {
    clearInterval(interval);
    audioCapture.stop();
  };
}
```

- [ ] **Step 2: Start a session and the pipeline from main, and forward suggestion chunks over IPC**

In `apps/desktop/src/main/index.ts`, add the import and wire pipeline startup inside `app.whenReady().then(...)`, after `overlayWindow` is created and its opacity/mouse-events are set (before the closing of the `.then()` block):

```ts
import { createSession, endSession } from '@mooly/storage';
import { startPipeline } from './pipeline';
```

```ts
  const sessionId = createSession(db, Date.now());
  const stopPipeline = startPipeline(db, sessionId, overlayWindow);

  app.on('before-quit', () => {
    stopPipeline();
    endSession(db, sessionId, Date.now());
  });
```

(Place the `import` lines at the top of the file with the other imports, and the `sessionId`/`stopPipeline`/`before-quit` block right after `settingsWindow = createWindow(...)` inside the existing `app.whenReady().then(() => { ... })` callback.)

- [ ] **Step 3: Expose `onSuggestionChunk` from preload**

`apps/desktop/src/preload/index.ts`:
```ts
import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings } from '@mooly/shared-types';

export interface SuggestionChunkPayload {
  text: string;
  done: boolean;
}

contextBridge.exposeInMainWorld('mooly', {
  reportOverlayHover: (hovering: boolean) => ipcRenderer.send('overlay:hover', hovering),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  setSettings: (partial: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:set', partial),
  onSuggestionChunk: (callback: (payload: SuggestionChunkPayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: SuggestionChunkPayload) =>
      callback(payload);
    ipcRenderer.on('suggestion:chunk', listener);
    return () => ipcRenderer.removeListener('suggestion:chunk', listener);
  }
});
```

`apps/desktop/src/preload/index.d.ts`:
```ts
import type { AppSettings } from '@mooly/shared-types';

export interface SuggestionChunkPayload {
  text: string;
  done: boolean;
}

export {};

declare global {
  interface Window {
    mooly: {
      reportOverlayHover: (hovering: boolean) => void;
      getSettings: () => Promise<AppSettings>;
      setSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
      onSuggestionChunk: (callback: (payload: SuggestionChunkPayload) => void) => () => void;
    };
  }
}
```

- [ ] **Step 4: Render streamed suggestion text in the overlay**

`apps/desktop/src/renderer/overlay/App.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';

export default function App() {
  const [suggestion, setSuggestion] = useState('Waiting for the first suggestion…');
  const streaming = useRef(false);

  useEffect(() => {
    const unsubscribe = window.mooly.onSuggestionChunk(({ text, done }) => {
      if (done) {
        streaming.current = false;
        return;
      }
      setSuggestion((prev) => (streaming.current ? prev + text : text));
      streaming.current = true;
    });
    return unsubscribe;
  }, []);

  return (
    <div
      className="w-full h-full rounded-xl bg-black/70 text-white text-sm flex flex-col"
      onMouseEnter={() => window.mooly.reportOverlayHover(true)}
      onMouseLeave={() => window.mooly.reportOverlayHover(false)}
    >
      <div
        className="h-6 flex items-center gap-2 px-2 text-xs text-red-400 shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        Recording (stub)
      </div>
      <div className="px-2 pb-2 flex-1 overflow-y-auto">{suggestion}</div>
    </div>
  );
}
```

- [ ] **Step 5: Manually verify the end-to-end pipeline**

Run: `pnpm --filter desktop dev`
Expected: A few seconds after launch, and then every ~4 seconds, the overlay's suggestion text updates progressively (word-by-word, not all at once). After quitting the app, open the SQLite file at `%APPDATA%/desktop/mooly.db` (or the path logged by `app.getPath('userData')`) with any SQLite tool and confirm `sessions`, `transcript_entries`, and `suggestions` tables have rows.

- [ ] **Step 6: Commit**

```bash
git add apps/desktop
git commit -m "feat: wire stub capture, context assembly, and stub provider streaming into the overlay with SQLite persistence"
```

---

### Task 11: `CAPTURE.md` and root `README.md`

**Files:**
- Create: `CAPTURE.md`
- Create: `README.md`

**Interfaces:**
- None (documentation only).

- [ ] **Step 1: Write `CAPTURE.md`**

`CAPTURE.md`:
```markdown
# What Mooly Captures (Milestone 1 status)

This document describes exactly what the current build of Mooly captures, imports, or stores, and how to disable or delete it. It will be updated as real capture/import features land in later milestones.

## Current state: no real capture yet

As of this milestone, Mooly does **not** capture your real screen or audio. The "capture" and "provider" layers are stub implementations that generate canned/fake transcript lines, a canned screen summary, and a canned suggestion — this exists to prove the architecture works end-to-end before wiring in real capture.

The overlay's "Recording (stub)" indicator is always on in this milestone, reflecting that the *stub pipeline* is running, not that your microphone or screen are being read.

## What is stored locally

A local SQLite database is created at your OS user-data directory (Electron's `app.getPath('userData')`, typically `%APPDATA%/desktop/mooly.db` on Windows) containing:
- `sessions` — one row per app run, with start/end timestamps.
- `transcript_entries` — the canned "transcript" lines generated by the stub audio capture during that session.
- `suggestions` — the canned suggestion text streamed to the overlay during that session.
- `settings` — your local app settings (overlay opacity/position, selected provider, and any API key you enter). API keys are never transmitted anywhere by this build; the active provider is a stub that makes no network calls.

Nothing leaves your machine. There are no network calls in this milestone.

## How to delete stored data

- Delete the SQLite file directly (path above), or
- Use the `clearAll` function exposed by the `@mooly/storage` package (a Settings UI action for this will be added in a later milestone).

## What's coming later (not yet implemented)

- Real screen capture (via Electron's `desktopCapturer`) and optional OCR.
- Real system/microphone audio capture and streaming transcription.
- A visible, real recording indicator tied to actual capture state, plus a global kill-switch hotkey that instantly stops all capture.
- Local import of chat exports (Slack/Gmail/Notion/plain text) to build your style profile, and later, optional OAuth-based live connectors — all opt-in, deletable, and never wired to a mode that hides the assistant's involvement from other call participants.
```

- [ ] **Step 2: Write the root `README.md`**

`README.md`:
```markdown
# Mooly

A real-time, on-screen AI assistant desktop app. This is Milestone 1: a working scaffold with a transparent overlay window, a Settings window, and every architectural layer (capture, context, providers, personalization, storage) present as a stub, wired end-to-end with fake data.

See `CAPTURE.md` for exactly what is captured/stored and how to delete it.

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
```

- [ ] **Step 3: Commit**

```bash
git add CAPTURE.md README.md
git commit -m "docs: add CAPTURE.md and project README"
```

---

### Task 12: Final full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite from a clean install**

Run: `pnpm install && pnpm test`
Expected: All tests across `shared-types`, `personalization`, `providers`, `capture`, `context`, and `storage` pass (27 tests total).

- [ ] **Step 2: Launch the app and walk the full manual verification checklist**

Run: `pnpm --filter desktop dev`

Confirm:
- Overlay appears transparent, frameless, always-on-top, with a pulsing "Recording (stub)" indicator.
- Overlay is click-through until hovered, then becomes draggable via its top strip; releasing the mouse outside restores click-through.
- Suggestion text streams in progressively every ~4 seconds.
- Settings window's opacity slider and X/Y fields visibly move/fade the overlay live.
- Provider dropdown shows only "Stub Provider"; entering an API key and restarting the app shows it was retained.
- Quit the app, reopen the SQLite DB file (path from `CAPTURE.md`), and confirm `sessions`, `transcript_entries`, and `suggestions` all have rows from the run.

- [ ] **Step 3: Commit any final fixups found during verification**

```bash
git add -A
git commit -m "fix: address issues found in milestone 1 end-to-end verification"
```

(Skip this commit if no fixups were needed.)
