# astrogators-shared-ui refactor plan

Living document. Each item is a discrete change shipped as its own RC version,
tested in consumers, then promoted to a clean release. Update **Status** and
**Version landed** as we go. Do not delete completed items — the history is
the record.

## Iteration loop (non-negotiable)

1. Claude edits `src/`
2. Claude runs `npm run build` + `npm version prerelease --preid=rc` + `npm publish`
3. User bumps version in consumer `package.json`(s) **with `--save-exact`** —
   semver caret ranges (`^0.7.0`) do **NOT** match prerelease tags
   (`0.7.0-rc.1`), so subsequent `npm install` runs revert to the last
   non-prerelease version. Use `npm install astrogators-shared-ui@0.7.0-rc.1
   --save-exact` so `package.json` records the exact RC and stays pinned.
4. User runs `npm install` in consumer(s)
5. User tests in browser
6. Decision: keep (cut clean release, e.g. `0.7.0`) or roll back (consumer
   pins back to prior version)

**No workspaces, no symlinks, no `npm link`.** The publish friction is the
safety mechanism — see `MEMORY.md` feedback entry.

## Consumers to bump on each release

- `astrogators-hub`
- `mod-ledger-ui`
- `nightwatcher-ui`

(Workspace `CLAUDE.md` currently lists `nightwatcher` as a consumer — that's
the Discord bot, not a UI. The actual UI consumer is `nightwatcher-ui`.
Fixing this doc drift is item 12 below.)

---

## Changes

### High-impact (visual identity)

#### 1. Typography overhaul — **REJECTED**
- **Status:** rejected, will not redo
- **Versions tried:** `0.7.0-rc.0` (option A: Chakra Petch + JetBrains Mono),
  `0.7.0-rc.1` (option B: Michroma + Inter Tight). Both tested in
  `astrogators-hub`, both rejected. RCs reverted via `git reset --hard`;
  baseline fonts restored.
- **Outcome:** Keep the 0.6.0 baseline — Orbitron for `--font-heading`,
  system stack for `--font-primary`, Fira Code/Courier for `--font-mono`. The
  user explicitly likes this pairing.
- **Lessons learned:**
  1. The user prefers the existing Orbitron + system pairing — my critique
     that Orbitron is "overplayed" was mine, not theirs. Aesthetic taste
     overrides aesthetic theory.
  2. The hub looks "off" not because of the fonts but because the hub's
     pages don't use a tactical mono accent layer the way `nightwatcher-ui`
     does. The fix lives in the **hub submodule's page CSS**, not in
     `astrogators-shared-ui`. Out of scope here.

#### 2. Color palette commit
- **Status:** not started
- **Version landed:** —
- **What:** Move off Google Material defaults (`#1a73e8`, `#34a853`). Lean
  into the existing tier palette as the design DNA.
- **Files:** `src/styles/variables.css`
- **Breaking?** No (token names unchanged, values shift)

#### 3. Chamfer vs border-radius reconciliation
- **Status:** not started
- **Version landed:** —
- **What:** Pick one design language for chrome. Either chamfer
  Button/Input/Card or remove the radius scale from them. Currently both
  fight.
- **Files:** `src/components/forms/Button.module.css`, `Input.module.css`,
  `src/components/display/Card.module.css`, possibly
  `src/styles/variables.css`
- **Breaking?** Visual change only; no API change

#### 4. Utility classes cleanup
- **Status:** not started
- **Version landed:** —
- **What:** `.flex`, `.grid-cols-3`, `.mt-md`, etc. in `global.css` leak into
  consumers' global namespace. Move to opt-in subpath
  (`astrogators-shared-ui/utilities`) or prefix (`.atui-*`).
- **Files:** `src/styles/global.css`, `src/index.ts` (or new `utilities`
  entry)
- **Breaking?** **Yes** if any consumer uses them — grep all three consumers
  first. If used, do prefix migration with deprecation notes.

### Medium-impact (system completeness)

#### 5. Motion primitives
- **Status:** not started
- **Version landed:** —
- **What:** Add `--ease-out-expo`, `--ease-spring`, etc. and a `motion.css`
  with named keyframes (`pulse-glow`, `scan-line`, `hud-flicker`).
  Consolidate Button spinner with Loader.
- **Files:** new `src/styles/motion.css`, `src/styles/variables.css`,
  `src/components/forms/Button.module.css`,
  `src/components/feedback/Loader.module.css`
- **Breaking?** No

#### 6. Per-app theming hook
- **Status:** not started
- **Version landed:** —
- **What:** `data-theme="hub|nightwatcher|ledger"` attribute selector in
  `variables.css` that nudges accent tokens per app. Each consumer sets the
  attribute on `<html>` or `<body>` once.
- **Files:** `src/styles/variables.css`
- **Breaking?** No (additive)

#### 7. Split barrel: generic UI vs SWGOH domain
- **Status:** not started
- **Version landed:** —
- **What:** Subpath exports — `astrogators-shared-ui/ui` (Button, Card,
  Modal…) vs `astrogators-shared-ui/swgoh` (AllyCodeDropdown,
  formatAllyCode, ModEvaluation types). Top-level barrel kept as deprecated
  alias for one major version.
- **Files:** `src/index.ts`, new `src/ui.ts` and `src/swgoh.ts`,
  `package.json` `exports` field, `vite.config.ts` build entries
- **Breaking?** Soft (alias keeps old imports working); cut at a `1.0.0`

#### 8. Promote `<ProtectedRoute>` to library
- **Status:** not started
- **Version landed:** —
- **What:** `astrogators-hub/src/App.tsx` defines `ProtectedRoute` inline;
  same logic likely duplicated in other consumers. Move to lib.
- **Files:** new `src/components/auth/ProtectedRoute.tsx`, `src/index.ts`
- **Breaking?** No (additive). Consumers can adopt incrementally.
- **Peer dep note:** May require adding `react-router-dom` as peerDep.

#### 9. `:focus-visible` system
- **Status:** not started
- **Version landed:** —
- **What:** Define `--focus-ring` token, apply via `:focus-visible` in
  `reset.css` so all interactive elements get consistent on-brand focus.
- **Files:** `src/styles/variables.css`, `src/styles/reset.css`
- **Breaking?** No (visual only, accessibility win)

### Workflow / infra

#### 10. npm workspaces — **REJECTED**
- **Status:** will not do
- **Reason:** User concern: dev/prod divergence risk; future session forgets
  workspace is active and ships unpublished code. Documented in
  `MEMORY.md → feedback_no_workspaces_publish_only.md`.

#### 11. Component preview surface (Histoire or Ladle)
- **Status:** not started
- **Version landed:** —
- **What:** Lightweight visual playground so the lib is reviewable in
  isolation. Currently `CLAUDE.md` admits there's no `dev` server worth
  running.
- **Files:** new `histoire.config.ts` or `.ladle/`, story files alongside
  components
- **Breaking?** No (dev tooling only, not shipped in `dist/`)

#### 12. Doc drift fix
- **Status:** not started
- **Version landed:** — (no publish needed, doc-only)
- **What:**
  - `astrogators-shared-ui/CLAUDE.md`: list `nightwatcher-ui` as a consumer.
  - `astrogators-shared-ui/CLAUDE.md` & `PUBLISHING.md`: state "GitHub
    Packages" / "`@psytor/astrogators-shared-ui`" but reality is the public
    npmjs registry / unscoped `astrogators-shared-ui` (`0.6.0` is published
    there). Fix the docs to match reality, OR migrate the package to
    GitHub Packages and rename — pick one.
  - Workspace root `CLAUDE.md`: add `nightwatcher-ui/` row to the submodule
    table.
- **Files:** two `CLAUDE.md` files, `PUBLISHING.md`
- **Breaking?** No

#### 13. Verify TS / Vite version pins
- **Status:** not started
- **Version landed:** — (investigation only)
- **What:** All four `package.json`s pin `typescript: ^6.0.3` and
  `vite: ^8.0.9`. Confirm these are intentional vs. a pin error that's
  silently resolving to something older.
- **Files:** all four `package.json`s (no edits unless investigation finds
  an issue)
- **Breaking?** TBD

---

## Release log

| Version | Items landed | Notes |
|---------|--------------|-------|
| 0.6.0   | (baseline) | Current state at plan creation |
| 0.7.0-rc.0 | (rejected) | Item #1 option A — Chakra Petch + JetBrains Mono. User: monospace body too "squared". |
| 0.7.0-rc.1 | (rejected) | Item #1 option B — Michroma + Inter Tight. User: also not it. |
| —       | reset       | Both RCs reverted via `git reset --hard`; tags `v0.7.0-rc.0` and `v0.7.0-rc.1` deleted locally. RCs remain published on npmjs as orphan versions; consumers all on 0.6.0. |
