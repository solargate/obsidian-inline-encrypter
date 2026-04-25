# AGENTS.md

## Commands

```bash
npm run dev      # dev build (watch mode)
npm run build    # production build (runs tsc -noEmit first, then bundles)
npm version <semver>  # bumps version + syncs manifest.json / versions.json via version-bump.mjs
```

No automated tests.

## Architecture

Obsidian plugin (TypeScript). All sources in `src/`. esbuild bundles to `main.js` at repo root. `tsconfig` `baseUrl` is `src/` — imports use bare module names (`import { CryptoFactory } from 'CryptoFactory'`).

### Key files

| File | Role |
|---|---|
| `src/main.ts` | Entry; registers commands, post-processors, CM6 extension |
| `src/CryptoFactory.ts` | All crypto (Web Crypto API, PBKDF2-SHA-512, AES-256-GCM) |
| `src/LivePreviewExtension.ts` | CodeMirror 6 ViewPlugin for Live Preview |
| `src/InlineWidget.ts` | CodeMirror WidgetType for in-editor button |
| `src/UiHelper.ts` | Shared decrypt flow, context menu, clipboard |
| `src/ModalPassword.ts` | Password input modal |
| `src/ModalDecrypt.ts` | Plaintext display modal |
| `src/Globals.ts` | In-memory session state (remembered password) |
| `src/Constants.ts` | Shared constants/enums |

### Encrypted format

Stored as `` `secret <base64>` `` or fenced `` ```secret `` blocks. Base64 decodes to: `IV (16B) + Salt (16B) + AES-256-GCM ciphertext`.

### Three rendering contexts

Reading mode uses markdown post-processor; Live Preview uses CM6 ViewPlugin; both produce an `InlineWidget` button.

### Releasing

`npm version <semver>` (runs `version-bump.mjs`) → `npm run build` → commit + tag. CI creates a draft GitHub release from the tag.
