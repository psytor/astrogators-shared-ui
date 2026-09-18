# Changelog

All notable changes to `astrogators-shared-ui` are recorded here.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/),
and the project uses [SemVer](https://semver.org/). Entries are backfilled
from git history starting with 0.1.x; older pre-changelog details may be
imprecise.

## [Unreleased]

## [0.16.3] — 2026-09-18

### Changed
- `TopBar`'s `.logo` font-weight: `var(--font-weight-bold)` (700) →
  `var(--font-weight-medium)` (500). Found via a cross-app font audit that
  mod-ledger-ui's NavBar logo was rendering at 500 (not the intended 700)
  because of a leftover global `a { font-weight: 500 }` rule in that app
  predating its adoption of this component — the suite standardized on
  that lighter look deliberately here, rather than leaving it dependent on
  one consumer's stray CSS.

## [0.16.2] — 2026-09-17

### Added
- `SuiteNavGroup`: a `SuiteNavApp`'s `sections` array can now mix flat
  `SuiteNavSection`s with `SuiteNavGroup`s (a labelled entry with its own
  `href` plus nested `items`) — `NavMenu`/`MobileNavPanel` render a group's
  own link followed by its items, indented, in both the desktop dropdown and
  the mobile accordion. `NavBarProps.onNavigate` (and `AllyCodeDropdown`-
  adjacent internals) now type against the shared `SuiteNavLink` base
  (`{id, label, href, requiresAuth?, roles?}`) instead of `SuiteNavSection`
  specifically, since a group's own link fires through the same callback.
  New `isSuiteNavGroup()` type guard exported alongside the new types.
- `SUITE_NAV`: Mod Ledger gains a top-level `overview` entry (was `grid` —
  renamed, the page itself is unchanged) and its `evaluations` entries
  (`my-evaluations`/`official`/`moderation`) now nest under a single
  "Evaluations" group instead of sitting flat alongside `overview`.
  Navicharts equivalently gains a top-level `overview` entry and nests
  `mine`/`guild`/`official`/`bookmarked`/`moderation` under a "Star Charts"
  group — hrefs move from the bare `/navicharts/` root to a new
  `/navicharts/starcharts` page (see the navicharts-ui `0.x` release notes
  for the routing change this depends on).

## [0.16.1] — 2026-09-17

### Changed
- `SUITE_NAV`: `grid` renamed to **Inventory** (Mod Ledger). Mod Ledger's
  `evaluations` entry gains a second, same-page entry — `my-evaluations`
  (bare `/mod-ledger/evaluations`) and `official` (`#official`) — both
  landing on the same `EvaluationsPage`, which stacks both collections as
  it always did; the two entries are anchors to jump between them, not
  separate destinations. "Protocols" is renamed **Official** on-page too.
  Navicharts' single `library` entry gains four same-page anchor entries —
  `mine` (bare `/navicharts/`), `official` (`#official`, was "Curated"),
  `guild` (`#guild`), `bookmarked` (`#bookmarked`) — plus a `moderation`
  entry (`#moderation`, `roles: ['admin', 'mod']`) pointing at the same
  page's existing "All Shared" section, which stays embedded there (it was
  never a separate route, unlike Mod Ledger's genuinely-separate
  `/moderation`). No `NavBar`/`NavMenu`/`MobileNavPanel` code changes —
  content-only manifest update; both apps' pages handle the anchor
  scrolling themselves.

## [0.16.0] — 2026-09-17

### Changed
- **Breaking:** `NavBar` no longer takes `appName`, `appHref`, `navItems`,
  `hubUrl`, or `showAllyCode` — the bar's contents now come from one place,
  the new `SUITE_NAV` manifest (`src/navigation/suiteNav.ts`, exported from
  the package root), so every app renders the identical bar with only the
  active trigger/section differing. New props: `currentApp`,
  `activeSectionId`, `onNavigate`. The logo always targets `/`. The
  ally-code dropdown is now always shown (no more opt-out). `NavItem` is
  removed; `TopBar` (the dumb primitive underneath) drops its max-width so
  the bar is full-bleed edge-to-edge in every consumer.
- `NavBar` gains a mobile burger + full-panel accordion menu below the
  existing 768px breakpoint (previously mobile just reflowed the desktop
  tab strip).
- `AllyCodeDropdown` gains `isOpen`/`onOpenChange` (controlled, so `NavBar`
  can enforce "only one popover open at a time" across the whole bar) and a
  `variant: 'floating' | 'inline'` prop for nesting inside the new mobile
  panel without a clipped floating popover. Both are optional; omitting them
  keeps the previous self-managed behavior.
- New `--z-nav-mobile-panel: 250` design token, between `--z-sticky: 200`
  and `--z-modal: 300`, for the portalled mobile panel.

### Fixed
- `AllyCodeDropdown`'s manage panel now uses `var(--z-dropdown)` instead of
  a hardcoded `z-index: 1000`.

_Note: this changelog had drifted — 0.11.0 through 0.15.0 shipped without
entries here. Not backfilled; this entry starts current tracking again._

## [0.10.4] — 2026-08-19

### Fixed
- `authedFetch` now decodes the access token's `exp` client-side and
  refreshes proactively (30s skew) instead of only reacting to a 401 from
  the resource server. Optional-auth endpoints (e.g. navicharts' star-chart
  GET) silently degrade an expired/rejected token to "anonymous" rather
  than ever returning 401, so the old reactive-only refresh never fired for
  them — a private chart reopened after the access token's 30-minute expiry
  would permanently 404 as "not found" instead of transparently
  re-authenticating.
- `AuthProvider` now calls `initializeApiClient` synchronously during
  render instead of inside a `useEffect`. Effects fire bottom-up (a child's
  before its parent's), so a child component's own `authedFetch` call could
  previously race ahead of `AuthProvider`'s effect and see the refresh
  module's default (unconfigured) auth base URL.

## [0.6.1] — 2026-05-01

This release covers everything between 0.3.1 and 0.6.1; no 0.4.x or 0.5.x
versions were published.

### Added
- Submodule `CLAUDE.md` documenting the publish flow, public surface contract
  (`src/index.ts` as the barrel), and bundled-vs-external split.

### Changed
- Toolchain bumped to **Node 24 / Vite 8 / React 19 / TypeScript 6**. React
  18 is still supported via peer dependency range.
- README rewritten for the workspace template (single-origin rule, prefixed
  `VITE_API_BASE_URL`, ally-code DB↔localStorage hybrid).
- `AuthContext` callback identities stabilized (effect-dependency fixes).
- Login surface gained `disabled` / `enabled` states wired to the backend
  `auth_enabled` feature flag.

### Fixed
- Chamfered-corner rendering glitches at certain sizes.
- `npm run build` failures introduced during the toolchain bump.

## [0.3.1] — 2025-12-05

### Added
- Tier colors, 6-dot mod visual effects, and background overlays for mod
  displays.

## [0.3.0] — 2025-12-03

### Added
- `apiBaseUrl` prop on `AuthProvider` so each consumer points the API client
  at its own backend (`VITE_API_BASE_URL`) without re-initializing
  imperatively.

## [0.2.3] — 2025-11-30

### Changed
- `Select` component refresh and tightened exports.

## [0.2.2] — 2025-11-27

### Added
- `formatAllyCode` utility (`123456789` → `123-456-789`) and its inverse.

## [0.2.1] — 2025-11-26

### Added
- Inline ally-code input inside `AllyCodeDropdown`'s manage panel.

## [0.2.0] — 2025-11-26

### Added
- Comprehensive ally-code management: `AllyCodeDropdown` component,
  `useAuth` ally-code surface, `localStorage` helpers, and DB-backed storage
  when authenticated.

## [0.1.5] — 2025-11-25

### Fixed
- Exported the `ResendVerification` types (they were defined but not surfaced
  through the barrel).

## [0.1.4] and earlier — 2025-11-24 (initial commit) through 2025-11-25

Initial library scaffold: components (TopBar, Container, Footer, Button,
Input, Select, Card, Badge, Modal, Loader), `AuthProvider` / `useAuth`
(login, register, logout, password reset, resend verification), `apiClient`
with transparent 401 refresh, shared CSS tokens and chamfered-box
primitives. Pre-changelog; consult `git log` for finer detail.

[Unreleased]: https://github.com/psytor/astrogators-shared-ui/compare/v0.16.2...HEAD
[0.16.2]: https://github.com/psytor/astrogators-shared-ui/compare/v0.16.1...v0.16.2
[0.16.1]: https://github.com/psytor/astrogators-shared-ui/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/psytor/astrogators-shared-ui/compare/v0.10.4...v0.16.0
[0.10.4]: https://github.com/psytor/astrogators-shared-ui/compare/v0.10.1...v0.10.4
[0.6.1]: https://github.com/psytor/astrogators-shared-ui/compare/v0.3.1...v0.6.1
[0.3.1]: https://github.com/psytor/astrogators-shared-ui/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/psytor/astrogators-shared-ui/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/psytor/astrogators-shared-ui/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/psytor/astrogators-shared-ui/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/psytor/astrogators-shared-ui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/psytor/astrogators-shared-ui/releases/tag/v0.2.0
