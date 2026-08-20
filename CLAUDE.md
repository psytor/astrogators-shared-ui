# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this submodule is

`astrogators-shared-ui` is a **publishable React component + auth library**, not an
application. It is built with Vite in library mode and published as the
unscoped package `astrogators-shared-ui` on the public **npmjs.org** registry
(the git repo is hosted on GitHub, but the package is *not* on GitHub
Packages). It is consumed by the workspace's frontends (`astrogators-hub`,
`mod-ledger-ui`, `nightwatcher-ui`, `navicharts-ui`) — there is no app shell,
no router, and no `index.html` runtime here. Current published version is 0.10.4 — every
consumer is bumped to it together, never left on a mismatched version.

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

1. Edit `src/` (Claude)
2. `npm run build` (Claude)
3. `npm version patch|minor|major` — bumps `package.json` (Claude)
4. `npm login` + `npm publish` against npmjs.org — **must be run by the
   user**; publishing requires interactive npm auth (OTP / browser SSO) that
   Claude cannot complete
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
`./styles` export — consumers must `import 'astrogators-shared-ui/styles'`
once at their entry. Per-component styles are CSS Modules; global tokens and
the chamfered-box utility classes live in `src/styles/`.

### Subsystems

- **Components** (`src/components/{layout,forms,display,feedback}`) — presentational
  React components. The "chamfered box" sci-fi cut-corner effect is a design
  system primitive (`.chamfered-box[-sm|-lg]` and `Card chamfered`). `Card`
  with `showDiagonalBorders` + `diagonalBorderColor` now also draws a real
  1px border around the whole card in that color for free (`--card-edge-color`,
  falls back to transparent) — consumers no longer need a local
  `border: 1px solid ...` rule to get a visible edge on an accented card.
- **`NavBar`** (`src/components/layout/NavBar.tsx`, built on the dumb `TopBar`
  primitive) — the suite-wide top bar standard; see `../CLAUDE.md`'s NavBar
  note. Router-agnostic (no react-router dep): consumers pass `NavItem[]`
  with their own `active` state and an optional `render` prop for a router
  `<Link>`; without `render` a tab is a plain `<a href>`. Bakes the
  username/login/register/logout cluster via `useAuth` (`showAuth`, default
  true) and the shared `AllyCodeDropdown` (`showAllyCode`, default false) —
  apps consume `NavBar`, they don't hand-compose `TopBar` themselves. Auth
  links (`/login`, `/register`, `/profile`) are plain anchors to the hub
  origin since auth UI lives in the hub and everything is single-origin.
- **Auth** (`src/contexts/AuthContext.tsx`, `src/services/auth.ts`) — JWT access
  + refresh tokens stored in `localStorage`, exposed through `AuthProvider` /
  `useAuth`. This is the canonical auth surface for the whole frontend mesh; do
  not fork it per-app. `AuthProvider` calls `initializeApiClient` synchronously
  during render (not in a `useEffect`) — effects fire bottom-up, so a child's
  own `authedFetch` call could otherwise race ahead of the provider's own
  effect and hit an unconfigured auth base URL. The call is idempotent, so
  this is safe on every render.
- **API client** (`src/services/api.ts` + `src/services/tokenRefresh.ts`) —
  `api.ts`'s `ApiClient` is a thin base-URL/JSON/error-parsing convenience
  layer; actual token injection and refresh-and-retry live in the shared
  `authedFetch` / `configureAuthRefresh` primitive in `tokenRefresh.ts`, so
  there is one refresh implementation reused by every service-specific
  client. `authedFetch` refreshes on two triggers: reactively on a 401 from
  the resource server, AND proactively by decoding the access token's `exp`
  client-side (30s skew) before the request goes out. The proactive path
  exists because some endpoints (e.g. navicharts' optional-auth star-chart
  GET) silently degrade an expired/rejected token to "anonymous" instead of
  ever 401ing, so 401-only refresh never fired for them and an expired token
  could permanently misbehave (e.g. a private resource 404ing as "not
  found") instead of transparently re-authenticating. Consumers wire it up
  once with `initializeApiClient({ baseURL, onUnauthorized })`. The `baseURL`
  is the **prefixed** backend URL (e.g.
  `http://localhost:8000/astrogators-table`) per the workspace
  `SERVICE_PREFIX` convention — this library should never assume a bare host.
- **Ally-code storage** (`src/services/allyCodeStorage.ts`,
  `AllyCodeDropdown`, `formatAllyCode`) — SWGOH-specific 9-digit player ID
  management persisted in `localStorage`. `AllyCodeDropdown` always renders
  its trigger button even with zero saved codes (labeled "+ Add ally code"
  instead of "Manage") — only the `Select` itself is conditional on having
  codes — so a user with no codes can still reach the add form instead of
  the whole control disappearing.
- **Types** (`src/types/`) — request/response DTOs that mirror the backend
  contracts (`astrogators-table` for auth, `mod-ledger` for mods). `User`
  includes a `role` field (mirrors the backend, which has always returned
  it) so consumers can gate admin-only actions client-side, e.g. navicharts'
  Publish-to-Curated. When a backend DTO changes, update the matching type
  here and bump a minor version, since every consumer sees the change at
  once.
