# Publishing Workflow

This document outlines the correct procedure for publishing the `astrogators-shared-ui` package to ensure that changes are correctly built and versioned.

## Development

1.  Make your code changes in the `src` directory.

## Pre-Publishing Checklist

Before publishing a new version, you must ensure your changes are correctly built and the package version is updated.

### 1. Install Dependencies

If you haven't already, or if you've updated dependencies, run:

```bash
npm install
```

This ensures that all `devDependencies` (like `typescript` and `vite`) are available for the build step.

### 2. Build the Package

Compile the TypeScript source code and bundle the assets into the `dist` directory. This is the directory that gets published.

```bash
npm run build
```

**CRITICAL:** You must run this command after making any code changes. Publishing without building will result in the old, stale code being published again.

### 3. Increment the Version

Update the version number in `package.json` according to the [Semantic Versioning](https://semver.org/) standard (e.g., `0.2.5` -> `0.2.6`). You can do this manually or with:

```bash
npm version patch # Or minor, or major
```

## 4. Publish to NPM

Publish the new version to the npm registry. You must be logged in to npm for this to work (`npm login`).

```bash
npm publish
```

## 5. Update Consumer Packages

After the new version is published, go to any applications that consume this package (e.g., `mod-ledger-ui`) and update the version number in their respective `package.json` files.

Then, reinstall the dependencies in those projects (e.g., by rebuilding the relevant Docker image or running `npm install`).
