# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development build (watch mode)
npm run dev

# Production build (type-checks first, then bundles)
npm run build

# Bump version (updates manifest.json and versions.json to match package.json)
npm version <new-version>
```

There are no automated tests in this project.

## Architecture

This is an [Obsidian](https://obsidian.md/) plugin written in TypeScript. All source files are in `src/`. esbuild bundles everything into `main.js` at the repo root (the file Obsidian loads). The tsconfig `baseUrl` is set to `src/`, so all imports use bare module names (e.g. `import { CryptoFactory } from 'CryptoFactory'`).

### Encrypted format

Encrypted secrets are stored in notes as:
- **Inline code block**: `` `secret <base64>` ``
- **Common code block**: ` ```secret\n<base64>\n``` `

The prefix `secret` (from `Constants.ts:ENCRYPTED_CODE_PREFIX`) is what identifies encrypted content. The base64 payload encodes: `IV (16 bytes) + Salt (16 bytes) + AES-256-GCM ciphertext`.

Key derivation uses PBKDF2 with SHA-512, 262,144 iterations (`CryptoFactory.ts`).

### Rendering pipeline

There are **three rendering contexts**, each handled separately:

1. **Reading mode** — `main.ts` registers `registerMarkdownPostProcessor` (for inline codes) and `registerMarkdownCodeBlockProcessor` (for fenced blocks). Both replace the code element with a clickable `<a class="inline-encrypter-code">` button.

2. **Live Preview mode** — `LivePreviewExtension.ts` is a CodeMirror 6 `ViewPlugin` that walks the syntax tree for `inline-code` nodes. When cursor/selection doesn't overlap the secret, it replaces it with an `InlineWidget`.

3. **InlineWidget** (`InlineWidget.ts`) — A CodeMirror `WidgetType` that renders the clickable button in Live Preview.

### Decrypt flow

Clicking a button (in any context) calls `UiHelper.handleDecryptClick()` → opens `ModalPassword` for the password → decrypts via `CryptoFactory` → either shows `ModalDecrypt` (which displays the plaintext in a read-only textarea) or copies directly to clipboard if Ctrl was held.

### In-memory password state

`Globals.ts` holds a module-level singleton `State` with `passwordGlobal` and `passwordRemember`. When "remember password" is enabled, a successfully used password is stored there for the session and pre-filled in subsequent `ModalPassword` opens.

### Key files

| File | Role |
|---|---|
| `src/main.ts` | Plugin entry point; registers commands, post-processors, and the CM6 extension |
| `src/CryptoFactory.ts` | All encrypt/decrypt logic using Web Crypto API |
| `src/LivePreviewExtension.ts` | CodeMirror 6 ViewPlugin for Live Preview rendering |
| `src/InlineWidget.ts` | CodeMirror WidgetType for the in-editor button |
| `src/UiHelper.ts` | Shared decrypt flow, context menu, clipboard logic |
| `src/ModalPassword.ts` | Password input modal (also handles pre-encrypted text input) |
| `src/ModalDecrypt.ts` | Displays decrypted secret; optional auto-copy |
| `src/Settings.ts` | Plugin settings interface and settings tab |
| `src/Globals.ts` | In-memory session state for remembered password |
| `src/Constants.ts` | Shared constants and enums |

## Releasing

1. Update version: `npm version <semver>` — this runs `version-bump.mjs` to sync `manifest.json` and `versions.json`.
2. Build: `npm run build` — produces `main.js`.
3. Commit and tag.
