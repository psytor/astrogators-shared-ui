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

### 2. Build

```bash
npm run build
```

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
npm version patch
```

### 5. Publish (user-run)

> Claude stops here. The user runs:

```bash
npm login        # one-time per session, against registry.npmjs.org
npm publish
```

### 6. Update consumers

Bump `astrogators-shared-ui` in each consumer's `package.json`
(`astrogators-hub`, `mod-ledger-ui`, `nightwatcher-ui`) and reinstall.
