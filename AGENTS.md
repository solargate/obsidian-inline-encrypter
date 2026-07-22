# AGENTS.md

Instructions for AI coding agents working on **Inline Encrypter** — an [Obsidian](https://obsidian.md/) plugin for inline encryption of secrets in Markdown notes.

## Project overview

- **Purpose:** Encrypt selected text in notes and store it as inline code or fenced code blocks. Encrypted content renders as a clickable lock button in Reading mode and Live Preview.
- **Language:** TypeScript (strict null checks, no implicit any).
- **Runtime:** Obsidian/Electron; crypto via Web Crypto API (`crypto.subtle`).
- **Bundle:** esbuild → `main.js` (gitignored; shipped via GitHub releases).
- **Tests:** None. Verify changes manually in Obsidian or with `npm run build` (type-check + bundle).

## Commands

```bash
# Development build with watch mode
npm run dev

# Production build (tsc type-check, then esbuild bundle)
npm run build

# Bump version (syncs manifest.json and versions.json from package.json)
npm version <semver>
```

After code changes, always run `npm run build` to confirm the project type-checks and bundles.

## Repository layout

```
src/                  # All TypeScript source (edit here, not main.js)
  main.ts             # Plugin entry point
  CryptoFactory.ts    # Encrypt/decrypt (AES-256-GCM + PBKDF2)
  LivePreviewExtension.ts  # CodeMirror 6 ViewPlugin
  InlineWidget.ts     # CodeMirror WidgetType for Live Preview button
  UiHelper.ts         # Shared decrypt flow, context menu, clipboard
  ModalPassword.ts    # Password input modal
  ModalDecrypt.ts     # Decrypted secret display modal
  Settings.ts         # Plugin settings tab
  Globals.ts          # In-memory session password state
  Constants.ts        # Prefix, SVG, enums
styles.css            # Plugin styles (Obsidian loads from plugin root)
manifest.json         # Obsidian plugin manifest
tools/decrypt.html    # Standalone browser decryptor (must stay crypto-compatible)
esbuild.config.mjs    # Bundler config; entry point is main.ts → src/main.ts
```

**Do not edit `main.js` directly** — it is generated and excluded from git.

## Architecture

### Encrypted format

Secrets are identified by the prefix `secret` (`Constants.ts` → `ENCRYPTED_CODE_PREFIX`).

| Storage form | Markdown syntax |
|---|---|
| Inline | `` `secret <base64>` `` |
| Fenced block | ` ```secret\n<base64>\n``` ` |

Base64 payload layout: **IV (16 bytes) + Salt (16 bytes) + AES-256-GCM ciphertext**.

Key derivation: PBKDF2, SHA-512, 262,144 iterations (`CryptoFactory.ts`).

### Three rendering contexts

Each context has its own implementation — changes to button behavior often need updates in more than one place:

1. **Reading mode** — `main.ts`
   - `registerMarkdownPostProcessor` for inline `` `secret …` `` codes
   - `registerMarkdownCodeBlockProcessor('secret', …)` for fenced blocks
   - Replaces `<code>` content with `<a class="inline-encrypter-code">`

2. **Live Preview** — `LivePreviewExtension.ts` + `InlineWidget.ts`
   - CodeMirror 6 `ViewPlugin` walks syntax tree for `inline-code` nodes
   - When cursor/selection does not overlap the secret, replaces it with an `InlineWidget` decoration
   - Fenced `secret` blocks are **not** widgetized in Live Preview (only inline codes)

3. **Source mode** — raw markdown; no special rendering

### Encrypt / decrypt flows

**Encrypt (editor commands in `main.ts`):**
- `Encrypt selected text` → inline code block
- `Encrypt selected text as code block` → fenced block
- `Insert pre-encrypted text` → modal asks for both password and plaintext

**Decrypt (in-note replacement):**
- Command `Decrypt selected text`, or cursor inside encrypted block without selection
- `findEncryptedBlockAtCursor()` detects inline or fenced blocks

**Decrypt (view-only, no note modification):**
- Click button → `UiHelper.handleDecryptClick()` → `ModalPassword` → `CryptoFactory.decryptFromBase64()`
- Ctrl+click (or context menu "Decrypt and copy") copies to clipboard without showing `ModalDecrypt`
- Failed decryption clears remembered password via `saveStatePasswordGlobal('')`

### Session password state

`Globals.ts` holds module-level `State.passwordGlobal` and `State.passwordRemember`. When "remember password" is enabled in settings, a successful password is kept in memory for the Obsidian session and pre-filled in `ModalPassword`. Passwords are never persisted to disk.

### Settings

| Setting | Default | Effect |
|---|---|---|
| `autoCopy` | `false` | Auto-copy decrypted secret to clipboard in `ModalDecrypt` |
| `rememberPassword` | `false` | Keep last successful password in memory until restart |

## Code conventions

### Imports

`tsconfig.json` sets `"baseUrl": "src"`. Use bare module names, not relative paths:

```typescript
import { CryptoFactory } from 'CryptoFactory';
import InlineEncrypterPlugin from 'main';
```

### Circular dependency pattern

Several modules import the default export from `main.ts` (`InlineEncrypterPlugin`). This is an established pattern — preserve it unless doing a deliberate refactor.

### Obsidian / CodeMirror externals

esbuild marks `obsidian`, `electron`, and all `@codemirror/*` / `@lezer/*` packages as external. They are provided by Obsidian at runtime. Only `@codemirror/language` is a direct dependency (for `syntaxTree`).

### UI patterns

- Modals extend Obsidian's `Modal`; set `onClose` callbacks before `open()` to handle results.
- User feedback via `new Notice('…')` with emoji prefixes (✅, ❌, ⚠️) — match existing style.
- CSS classes: `inline-encrypter-code`, `inline-encrypter-lp-code`, `inline-encrypter-decrypt-modal`, `inline-encrypter-encrypt-text-modal`.

### Scope of changes

- Keep diffs minimal and focused on the requested task.
- Do not refactor unrelated code.
- Do not add tests unless explicitly requested (project has no test infrastructure).
- Do not add comments unless explaining non-obvious logic.

## Security constraints

When modifying crypto or password handling:

- **Never** persist passwords or decrypted secrets to disk (except when user explicitly runs "Decrypt selected text" to replace ciphertext in the note).
- **Never** weaken crypto parameters (algorithm, iterations, IV/salt sizes) without explicit user request — this breaks compatibility with existing notes and `tools/decrypt.html`.
- Decryption failures return `null` from `CryptoFactory`; callers must handle this and clear remembered password on failure.
- If changing the encrypted payload format, update both `CryptoFactory.ts` and `tools/decrypt.html`.

## Releasing

1. `npm version <semver>` — updates `package.json`, runs `version-bump.mjs` (syncs `manifest.json` + `versions.json`).
2. `npm run build` — produces `main.js`.
3. Commit, tag, and push. GitHub Actions (`.github/workflows/release.yml`) builds on tag push and creates a draft release with `main.js`, `manifest.json`, `styles.css`, `tools/decrypt.html`, and a zip bundle.

Release artifacts: `main.js`, `manifest.json`, `styles.css`, `tools/decrypt.html`.

## Common agent tasks

| Task | Where to look |
|---|---|
| Add a plugin command | `main.ts` → `addCommand()` |
| Change button appearance | `Constants.ts` (SVG), `styles.css` |
| Fix Reading mode rendering | `main.ts` post-processors |
| Fix Live Preview rendering | `LivePreviewExtension.ts`, `InlineWidget.ts` |
| Change decrypt UX (modal, clipboard) | `UiHelper.ts`, `ModalDecrypt.ts` |
| Add a setting | `Settings.ts` interface + setting tab + wire in `main.ts` |
| Change encryption algorithm/format | `CryptoFactory.ts` + `tools/decrypt.html` |

## Manual verification checklist

There is no CI test suite. After substantive changes, verify in Obsidian:

1. Encrypt selection as inline code and as fenced block.
2. Decrypt via command palette (with and without prior selection).
3. Click decrypt button in Reading mode.
4. Click decrypt button in Live Preview (cursor outside the secret).
5. Ctrl+click and context menu "Decrypt and copy".
6. "Remember password" setting: password pre-fills on second decrypt.
7. Wrong password shows failure notice and clears remembered password.
8. `tools/decrypt.html` still decrypts notes encrypted by the plugin.
