# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this submodule is

`astrogators-shared-ui` is a **publishable React component + auth library**, not an
application. It is built with Vite in library mode and shipped as
`@psytor/astrogators-shared-ui` on GitHub Packages. It is consumed by the
workspace's frontends (`astrogators-hub`, `mod-ledger-ui`) — there is no app
shell, no router, and no `index.html` runtime here.

For workspace-level context (submodule layout, shared infra, the
`SERVICE_PREFIX` convention that consumers must reach via `VITE_API_BASE_URL`),
see `../CLAUDE.md`.

## Common commands

```bash
npm install            # one-time / after dep changes
npm run build          # tsc && vite build → dist/  (REQUIRED before publish)
npm run type-check     # tsc --noEmit
```

There is no test runner, no linter, and no `dev` server worth running — `vite`
in lib mode has no entry HTML. Iterate by `npm run build` here and reinstalling
in a consumer (or `npm link`).

Node is pinned to 24.x via `.nvmrc` and `engines`.

## Publish flow (read `PUBLISHING.md` before releasing)

The single most load-bearing rule: **`npm run build` BEFORE `npm publish`** —
only `dist/` is shipped (`files: ["dist"]`), and `dist/` is gitignored, so
skipping the build re-publishes stale code. The flow is:

1. Edit `src/`
2. `npm run build`
3. `npm version patch|minor|major` (bumps `package.json`)
4. `npm publish` (requires `npm login` against GitHub Packages)
5. Bump the version in each consumer's `package.json` and reinstall

## Architecture

The public surface is a single barrel — **`src/index.ts` is the contract**.
Anything not re-exported there is internal. When adding a component, hook,
service, or type, always wire it through `src/index.ts` (and the relevant
category `index.ts`) or consumers can't see it.

### What's bundled vs. external

`vite.config.ts` marks `react`, `react-dom`, and `react/jsx-runtime` as
external — they come from the consumer's React install via `peerDependencies`
(React 18 || 19). Do not add runtime `dependencies` casually; every one will
ship into every consumer. The library currently has zero runtime deps and uses
the platform `fetch` directly in `services/api.ts` rather than pulling in axios.

CSS is bundled as a single file (`cssCodeSplit: false`) and exposed via the
`./styles` export — consumers must `import '@psytor/astrogators-shared-ui/styles'`
once at their entry. Per-component styles are CSS Modules; global tokens and
the chamfered-box utility classes live in `src/styles/`.

### Subsystems

- **Components** (`src/components/{layout,forms,display,feedback}`) — presentational
  React components. The "chamfered box" sci-fi cut-corner effect is a design
  system primitive (`.chamfered-box[-sm|-lg]` and `Card chamfered`).
- **Auth** (`src/contexts/AuthContext.tsx`, `src/services/auth.ts`) — JWT access
  + refresh tokens stored in `localStorage`, exposed through `AuthProvider` /
  `useAuth`. This is the canonical auth surface for the whole frontend mesh; do
  not fork it per-app.
- **API client** (`src/services/api.ts`) — `fetch` wrapper that injects the
  access token, transparently refreshes on 401 via
  `/api/v1/auth/refresh-token`, retries the original request, and calls a
  consumer-provided `onUnauthorized` on terminal failure. Consumers wire it up
  once with `initializeApiClient({ baseURL, onUnauthorized })`. The `baseURL`
  is the **prefixed** backend URL (e.g.
  `http://localhost:8000/astrogators-table`) per the workspace
  `SERVICE_PREFIX` convention — this library should never assume a bare host.
- **Ally-code storage** (`src/services/allyCodeStorage.ts`,
  `AllyCodeDropdown`, `formatAllyCode`) — SWGOH-specific 9-digit player ID
  management persisted in `localStorage`.
- **Types** (`src/types/`) — request/response DTOs that mirror the backend
  contracts (`astrogators-table` for auth, `mod-ledger` for mods). When a
  backend DTO changes, update the matching type here and bump a minor
  version, since every consumer sees the change at once.
