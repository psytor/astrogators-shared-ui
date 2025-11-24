# astrogators-shared-ui Setup Complete

## What Was Created

The shared UI component library for all Astrogator's Table frontend applications.

## Project Structure

```
astrogators-shared-ui/
├── src/
│   ├── components/
│   │   ├── layout/          # TopBar, Footer, Container
│   │   ├── forms/           # Button, Input, Select
│   │   ├── display/         # Card, Badge, Modal
│   │   └── feedback/        # Loader
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── services/
│   │   ├── api.ts           # API client with JWT injection
│   │   └── auth.ts          # Token management utilities
│   ├── types/               # TypeScript definitions
│   │   ├── user.ts
│   │   ├── api.ts
│   │   └── mod.ts
│   ├── styles/              # CSS system
│   │   ├── variables.css    # Design tokens
│   │   ├── reset.css        # CSS reset
│   │   ├── effects.css      # Chamfered boxes, animations
│   │   └── global.css       # Global styles & utilities
│   └── index.ts             # Main export
├── dist/                    # Built library (after npm run build)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Features Implemented

### Components
- ✅ **TopBar** - Global navigation with logo and content slots
- ✅ **Footer** - Global footer with default copyright
- ✅ **Container** - Responsive content container
- ✅ **Button** - 5 variants (primary, secondary, outline, ghost, danger), 3 sizes, loading state
- ✅ **Input** - Text input with label, error, helper text
- ✅ **Select** - Dropdown with label, error, helper text
- ✅ **Card** - Content container with chamfered box support
- ✅ **Badge** - Status labels with 7 variants
- ✅ **Modal** - Dialog overlay with escape key support
- ✅ **Loader** - Spinner and dots variants

### Authentication System
- ✅ **AuthContext** - React Context for auth state
- ✅ **useAuth Hook** - Access auth state and methods (login, logout, register)
- ✅ **Token Management** - localStorage for JWT tokens
- ✅ **API Client** - Automatic token injection and refresh

### Styles
- ✅ **CSS Variables** - Complete design token system
- ✅ **Chamfered Boxes** - Sci-fi cut-corner effect (sm, md, lg)
- ✅ **Global Utilities** - Flex, grid, spacing, text utilities
- ✅ **Animations** - Fade in, slide up/down, spin

### TypeScript
- ✅ **User Types** - Login, register, tokens
- ✅ **API Types** - Generic response structures
- ✅ **Mod Types** - Parsed mods, evaluations

## Build Status

✅ **TypeScript compilation**: PASSED
✅ **Vite build**: PASSED
✅ **Output size**: 15.24 KB (JS) + 20.43 KB (CSS)

## Next Steps

### 1. Create GitHub Repository

```bash
# Create repository on GitHub first (psytor/astrogators-shared-ui)
# Then:
git remote add origin https://github.com/psytor/astrogators-shared-ui.git
git add .
git commit -m "Initial commit: Shared UI library"
git branch -M main
git push -u origin main
```

### 2. Configure GitHub Packages Authentication

Create a Personal Access Token (PAT) on GitHub:
- Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate new token with `write:packages` scope
- Save the token

Create `.npmrc` in project root (DON'T COMMIT):
```
//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE
@psytor:registry=https://npm.pkg.github.com
```

### 3. Publish to GitHub Packages

```bash
# First time publishing
npm run build
npm publish

# Future updates
npm version patch  # or minor, or major
npm run build
npm publish
```

### 4. Use in Other Projects

In astrogators-hub or mod-ledger-ui:

```bash
# Create .npmrc in project
echo "@psytor:registry=https://npm.pkg.github.com" > .npmrc

# Install
npm install @psytor/astrogators-shared-ui
```

Then in your app:

```tsx
import {
  TopBar,
  Button,
  Card,
  AuthProvider,
  useAuth,
  initializeApiClient,
} from '@psytor/astrogators-shared-ui';
import '@psytor/astrogators-shared-ui/styles';

// Initialize API client
initializeApiClient({
  baseURL: 'http://localhost:8000',
  onUnauthorized: () => window.location.href = '/login',
});

function App() {
  return (
    <AuthProvider>
      <TopBar logo={<div>Astrogator's Table</div>} />
      {/* Your app */}
    </AuthProvider>
  );
}
```

## Important Notes

- **Package name**: `@psytor/astrogators-shared-ui` (GitHub scoped package)
- **Version**: 0.1.0 (semantic versioning)
- **Distribution**: GitHub Packages (private npm registry)
- **Build output**: `dist/` directory (not committed to git)
- **Peer dependencies**: React 18+ (must be installed by consuming apps)

## Maintenance

### Adding New Components

1. Create component in `src/components/[category]/`
2. Create corresponding CSS module
3. Export from category `index.ts`
4. Export from main `src/index.ts`
5. Update README.md with usage example
6. Run `npm run build` to verify
7. Bump version and publish

### Updating Styles

1. Edit CSS variables in `src/styles/variables.css`
2. Run `npm run build`
3. Test in consuming applications
4. Bump version and publish

## Troubleshooting

### Build Fails
- Check TypeScript errors: `npm run type-check`
- Verify all imports are correct
- Ensure CSS modules are properly typed

### Can't Install in Other Projects
- Verify GitHub Packages authentication (.npmrc)
- Check package name matches exactly: `@psytor/astrogators-shared-ui`
- Ensure PAT has `read:packages` scope

### Types Not Working
- Ensure consuming project has `"moduleResolution": "bundler"` in tsconfig.json
- Verify `dist/index.d.ts` exists after build

---

**Status**: ✅ COMPLETE - Ready for Phase 2 (astrogators-hub)
