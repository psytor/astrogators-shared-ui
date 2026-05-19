# Changelog

All notable changes to `astrogators-shared-ui` are recorded here.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/),
and the project uses [SemVer](https://semver.org/). Entries are backfilled
from git history starting with 0.1.x; older pre-changelog details may be
imprecise.

## [Unreleased]

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

[Unreleased]: https://github.com/psytor/astrogators-shared-ui/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/psytor/astrogators-shared-ui/compare/v0.3.1...v0.6.1
[0.3.1]: https://github.com/psytor/astrogators-shared-ui/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/psytor/astrogators-shared-ui/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/psytor/astrogators-shared-ui/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/psytor/astrogators-shared-ui/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/psytor/astrogators-shared-ui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/psytor/astrogators-shared-ui/releases/tag/v0.2.0
