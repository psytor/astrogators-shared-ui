# @psytor/astrogators-shared-ui

Shared React components, auth, and API client for the Astrogator's Table
frontends (`astrogators-hub`, `mod-ledger-ui`). Published to GitHub Packages.

This is a library — there is no app shell here. See `PUBLISHING.md` for the
release flow and `CLAUDE.md` for architecture notes.

## Installation

The package is hosted on GitHub Packages, so consumers need an `.npmrc`
pointing the `@psytor` scope at the right registry:

```
@psytor:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PAT}
```

The PAT needs `read:packages` scope. Then:

```bash
npm install @psytor/astrogators-shared-ui
```

Peer dependencies: `react` and `react-dom` (18 or 19).

## Setup

### 1. Wrap the app in `AuthProvider`

`AuthProvider` initializes the API client with the given `apiBaseUrl` and
manages auth, feature flags, and ally codes for the whole app. Pass the
**prefixed** backend URL — workspace backends mount their routes under
`/<service-name>` (see the workspace `CLAUDE.md`).

```tsx
import { AuthProvider } from '@psytor/astrogators-shared-ui';
import '@psytor/astrogators-shared-ui/styles';

function App() {
  return (
    <AuthProvider apiBaseUrl={import.meta.env.VITE_API_BASE_URL}>
      {/* your app */}
    </AuthProvider>
  );
}
```

`VITE_API_BASE_URL` looks like `http://localhost:8000/astrogators-table` in
dev.

### 2. (Optional) Reconfigure the API client

`AuthProvider` already calls `initializeApiClient`. Call it yourself only if
you need a custom `onUnauthorized` handler (e.g. router-driven redirects):

```tsx
import { initializeApiClient } from '@psytor/astrogators-shared-ui';

initializeApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  onUnauthorized: () => navigate('/login'),
});
```

## Components

All components are styled via CSS Modules and the global design tokens in
`./styles`. Override the design system by redefining CSS variables on `:root`
(see "Theming").

### Layout

```tsx
import { TopBar, Container, Footer } from '@psytor/astrogators-shared-ui';

<TopBar logo={<Logo />} rightContent={<UserMenu />} />
<Container maxWidth="lg" padding>{children}</Container>
<Footer />
```

### Forms

```tsx
import { Button, Input, Select, AllyCodeDropdown } from '@psytor/astrogators-shared-ui';

<Button variant="primary" size="md" loading={submitting}>Save</Button>
<Input label="Email" type="email" required error={errors.email} />
<Select label="Profile" options={profiles} placeholder="Choose…" />

// Wired into useAuth — manages the user's ally codes (DB-backed when
// authenticated, localStorage when anonymous):
<AllyCodeDropdown />
```

`Button` variants: `primary | secondary | outline | ghost | danger`.

### Display

```tsx
import { Card, Badge, Modal } from '@psytor/astrogators-shared-ui';

<Card variant="elevated" chamfered chamferSize="md" padding="lg" hoverable>
  …
</Card>

<Badge variant="success">Active</Badge>
<Badge variant="warning" size="sm">Beta</Badge>

<Modal isOpen={open} onClose={close} title="Login" size="md">…</Modal>
```

### Feedback

```tsx
import { Loader } from '@psytor/astrogators-shared-ui';

<Loader size="md" variant="spinner" />
<Loader size="lg" variant="dots" />
```

## Authentication

`useAuth` returns the full auth + ally-code surface. The hook must be called
inside `AuthProvider`.

```tsx
import { useAuth } from '@psytor/astrogators-shared-ui';

const {
  // session
  user, isAuthenticated, isLoading,
  login, register, logout, refreshUser,
  forgotPassword, resetPassword, resendVerification,

  // backend feature flags (e.g. auth_enabled)
  authEnabled, isLoadingFeatures,

  // ally codes — DB-backed when logged in, localStorage when anonymous
  allyCodes, selectedAllyCode, isLoadingAllyCodes,
  fetchAllyCodes, addAllyCode, removeAllyCode,
  selectAllyCode, updateAllyCodeLastUsed,

  // localStorage → DB migration prompt for users who sign up after
  // adding ally codes anonymously
  migrationPrompt, dismissMigrationPrompt, migrateLocalStorageCodes,
} = useAuth();
```

Tokens are stored in `localStorage`. Registration does **not** auto-login —
it requires email verification.

## API client

```tsx
import { apiClient } from '@psytor/astrogators-shared-ui';

const characters = await apiClient.get('/api/v1/game-data/characters');
const result = await apiClient.post('/api/v1/mod-ledger/evaluate/123456789', {
  profile_name: 'standard',
});
```

The client:
- injects the access token into `Authorization`
- on `401`, transparently refreshes via `/api/v1/auth/refresh-token` and
  retries the original request once
- calls `onUnauthorized` if refresh fails

Endpoints are written **without** the service prefix — the prefix lives in
the configured `baseURL`.

## Ally code utilities

For UI that needs to format/validate the 9-digit SWGOH player IDs outside the
context of `useAuth`:

```tsx
import {
  formatAllyCode,        // "123456789" → "123-456-789"
  unformatAllyCode,      // "123-456-789" → "123456789"
  getAllyCodesFromStorage,
  saveAllyCodeToStorage,
  removeAllyCodeFromStorage,
  getSelectedAllyCode,
  setSelectedAllyCode,
  clearAllyCodes,
} from '@psytor/astrogators-shared-ui';
```

Prefer `useAuth` when you can — it keeps DB and localStorage in sync.

## TypeScript

All public types are re-exported from the package root, including:

```tsx
import type {
  User, LoginRequest, LoginResponse,
  RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest,
  AllyCode, AllyCodeCreate, AllyCodeListResponse, StoredAllyCode,
  ApiResponse, ApiError, PaginatedResponse,
  ParsedMod, ModStat, ModEvaluation, EvaluationRequest, EvaluationResponse,
} from '@psytor/astrogators-shared-ui';
```

Consumers should set `"moduleResolution": "bundler"` (or `"node16"`) in
`tsconfig.json` so the bundled `.d.ts` files resolve.

## Theming

Design tokens are CSS variables on `:root`. Override anything you need in
your own stylesheet, loaded after the library styles:

```css
:root {
  --color-primary: #1a73e8;
  --color-secondary: #34a853;
  --font-primary: 'Your Font', sans-serif;
  --spacing-md: 1rem;
  --chamfer-size: 8px;
}
```

### Chamfered boxes

Sci-fi cut-corner effect, available as utility classes or via `Card`:

```tsx
<div className="chamfered-box">…</div>
<div className="chamfered-box-sm">…</div>
<div className="chamfered-box-lg">…</div>

<Card chamfered chamferSize="lg">…</Card>
```

## Development

```bash
npm install
npm run build        # tsc && vite build → dist/
npm run type-check   # tsc --noEmit
```

There is no `dev` server worth running (this is a library, not an app).
Iterate by rebuilding and reinstalling in a consumer, or `npm link`.

See `PUBLISHING.md` for the release procedure. The non-negotiable rule:
**always `npm run build` before `npm publish`** — `dist/` is gitignored but
is the only thing shipped, so skipping the build re-publishes stale code.

## License

MIT
