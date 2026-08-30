# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this submodule is

`astrogators-shared-ui` is a **publishable React component + auth library**, not an
application. It is built with Vite in library mode and published as the
unscoped package `astrogators-shared-ui` on the public **npmjs.org** registry
(the git repo is hosted on GitHub, but the package is *not* on GitHub
Packages). It is consumed by the workspace's frontends (`astrogators-hub`,
`mod-ledger-ui`, `nightwatcher-ui`, `navicharts-ui`) — there is no app shell,
no router, and no `index.html` runtime here. Current version is 0.13.0 (a
chamfered `Card` now draws its corner lines by default — publish pending) —
every consumer is bumped to it together, never left on a mismatched version.

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
  system primitive (`.chamfered-box[-sm|-lg]` and `Card chamfered`). A
  chamfered `Card` owns its **entire** outline from **one** prop, `edgeColor`
  (0.12.0, renamed from `diagonalBorderColor`): the straight-side border and
  the diagonal corner lines both read that single value via
  `--card-edge-color`, so corners and sides can never render different colours.
  `edgeColor` is independent of `showDiagonalBorders`, which as of 0.13.0
  **defaults to `true`** for a chamfered card — the cut corners are always
  finished with a line, so `chamfered` alone gives you clipped corners + corner
  lines + a border, all one colour. Pass `showDiagonalBorders={false}` only to
  leave a deliberately bare cut. A chamfered card with no `edgeColor` still gets
  a visible closed edge by defaulting to `var(--color-border)`. Consumers must
  NOT re-declare a local `border` rule on a chamfered Card — that reintroduces
  the two-colour drift this primitive exists to prevent. `--card-edge-color` is
  registered `@property inherits: false` (`src/styles/effects.css`) so a nested
  card never inherits an ancestor's edge colour.
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

## Using `Card` (the chamfered box) — read before adding one

`Card` (`src/components/display/Card.tsx`) is the design-system panel. The
chamfered variant is a **self-contained primitive**: one prop owns the whole
outline, and there is exactly one right way to use it. This section exists
because getting it wrong recurred ~10 times and cost a 0.12.0 + 0.13.0.

### The rules

1. **A chamfered card = `<Card chamfered>`.** That alone gives you clipped
   corners **+** the 45° corner lines **+** a straight border, all in **one
   colour**. You do not opt into the lines or the border separately.

2. **Colour comes from the `edgeColor` prop, nothing else.**
   - `<Card chamfered edgeColor="var(--color-primary)">` → whole outline is
     primary.
   - `<Card chamfered>` with no `edgeColor` → whole outline is
     `var(--color-border)` (the default; never transparent, never invisible).
   - `edgeColor` takes any CSS colour string (token, hex, `rgba()`).

3. **Never re-declare `border`, `border-color`, or `--card-edge-color` in the
   card's own CSS.** This is *the* bug. The moment a local rule paints the
   sides, it drifts from the corner lines. The `edgeColor` prop is the single
   source of truth — feed it, don't fight it. (If you catch yourself writing
   `.myCard { border: 1px solid ... }` on a chamfered card, stop.)

4. **State-driven colour → change the `edgeColor` *prop value* from React**,
   e.g. `edgeColor={active ? 'var(--color-primary)' : 'var(--color-border)'}`
   or from hover state held in `useState`. **Do not** try to drive it from a
   CSS `:hover` rule or a stylesheet custom property — the corner lines update
   but `border-color` reading the value through `var()` goes stale in the
   bundled build, and the card goes two-tone on hover. Colour changes must be
   a prop change (a React re-render), full stop.

5. **`chamferSize`**: `"sm"` (4px) | `"md"` (8px, default) | `"lg"` (12px) |
   `"asymmetric"` (12px / 24px bottom-right). At `"sm"` the corner lines are
   short — that's correct (they trace a 4px cut), just subtle.

6. **Rare opt-outs:**
   - deliberately edgeless chamfered card → `edgeColor="transparent"`.
   - keep the border but no corner lines → `showDiagonalBorders={false}`.
   These are unusual; the default (lines + border, matched) is almost always
   what you want.

### Not using `<Card>` (raw chamfer in a canvas, etc.)

Add the `.chamfered-box` / `.chamfered-box-sm` / `-lg` class for the clip, hand-
place four `<div class="chamfered-diagonal-border chamfered-diagonal-{tl,tr,bl,br}">`
children, set their colour with an inline `style={{ color: X }}`, and add your
own matching `border` in CSS. You own keeping the two in sync — there's no
primitive doing it for you. Only do this when `<Card>` genuinely can't be used
(e.g. React Flow nodes).

### Internals (for when you need to change the primitive)

- `edgeColor` → the component sets `--card-edge-color` inline on the card
  (drives `border` via `.card { border: 1px solid var(--card-edge-color) }`)
  **and** `color` inline on each line div (they're `background-color:
  currentColor`). One value, two channels, same render pass — can't disagree.
- `--card-edge-color` is registered `@property { inherits: false }` in
  `src/styles/effects.css` — stops a nested card inheriting an ancestor's edge
  colour (consumers used to scatter `--card-edge-color: transparent` resets to
  fight that).
- Line divs render on `chamfered && showDiagonalBorders`; `showDiagonalBorders`
  defaults to `true` (since 0.13.0).
