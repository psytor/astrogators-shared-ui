# Publishing Workflow

Procedure for cutting a new release of `astrogators-shared-ui`. The package
is unscoped and published to the public **npmjs.org** registry — there is no
GitHub Packages step despite the repo being hosted on GitHub.

## Roles

- **Claude** can edit `src/`, run `npm install`, `npm run build`, and
  `npm version`.
- **The user must run `npm login` and `npm publish`.** Publishing requires
  interactive npm authentication (OTP / browser SSO), which Claude cannot
  complete from the CLI sandbox. Claude will stop at the publish step and
  hand off.

## Steps

### 1. Install dependencies (if needed)

```bash
npm install
```

### 2. Test and build

```bash
npm test
npm run build
```

`npm publish` also runs type-check + tests itself (`prepublishOnly`), so a
failing test blocks the release even if this step is skipped. It does **not**
build — that rule below still stands.

**CRITICAL:** Always build before publishing. `dist/` is gitignored but is
the only thing shipped (`files: ["dist"]` in `package.json`), so skipping
the build re-publishes stale code.

### 3. Update CHANGELOG

Before bumping the version, move the entries you're about to ship from
`[Unreleased]` into a new versioned section in `CHANGELOG.md`. Date the
section with today's date. Update the compare-link footer.

### 4. Bump the version

Pick `patch` / `minor` / `major` per [SemVer](https://semver.org/):

```bash
npm version patch --no-git-tag-version
```

`--no-git-tag-version` matters: releases go through a PR, and a tag made here
would sit on a branch commit that never reaches `main`. Commit the bump on the
release branch, open the PR, and merge it **before** publishing — the version
on npm should always be a commit that exists on `main`.

### 5. Publish (user-run)

> Claude stops here. The user runs, from `main` after the release PR has
> merged (`git pull`, then `nvm use` so Node matches `.nvmrc`, then
> `npm ci && npm run build`):

```bash
npm login        # one-time per session, against registry.npmjs.org
npm publish
```

### 6. Tag the release

Only after `npm publish` succeeds (so a failed publish never leaves a tag for a
version that isn't on npm). Tag the merge commit on `main` that was published:

```bash
git tag -a vX.Y.Z -m "astrogators-shared-ui X.Y.Z (published to npm)"
git push origin vX.Y.Z
```

The compare links at the bottom of `CHANGELOG.md` point at these tags, so a
missing tag means a dead link. (Versions 0.2.3–0.16.4 were backfilled from git
history; 0.2.4, 0.4.0, 0.4.1 and the 0.7.0 release candidates were published
without their version bump ever being committed, so they have no tag.)

### 7. Update consumers

Bump `astrogators-shared-ui` in each consumer's `package.json`
(`astrogators-hub`, `mod-ledger-ui`, `nightwatcher-ui`, `navicharts-ui`) and
reinstall. Bump all four together — never leave one consumer on a different
version than the rest.
