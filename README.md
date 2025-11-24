# @psytor/astrogators-shared-ui

Shared UI components and utilities for Astrogator's Table applications.

## Installation

```bash
npm install @psytor/astrogators-shared-ui
```

## Setup

### 1. Initialize API Client

In your application's entry point (e.g., `main.tsx` or `App.tsx`):

```tsx
import { initializeApiClient } from '@psytor/astrogators-shared-ui';

initializeApiClient({
  baseURL: 'http://localhost:8000', // Your backend API URL
  onUnauthorized: () => {
    // Handle unauthorized (e.g., redirect to login)
    window.location.href = '/login';
  },
});
```

### 2. Wrap Application with AuthProvider

```tsx
import { AuthProvider } from '@psytor/astrogators-shared-ui';

function App() {
  return (
    <AuthProvider>
      {/* Your app content */}
    </AuthProvider>
  );
}
```

### 3. Import Global Styles

```tsx
import '@psytor/astrogators-shared-ui/styles';
```

## Components

### Layout Components

#### TopBar

```tsx
import { TopBar } from '@psytor/astrogators-shared-ui';

<TopBar
  logo={<div>Astrogator's Table</div>}
  rightContent={<button>Login</button>}
/>
```

#### Container

```tsx
import { Container } from '@psytor/astrogators-shared-ui';

<Container maxWidth="lg" padding>
  {/* Content */}
</Container>
```

#### Footer

```tsx
import { Footer } from '@psytor/astrogators-shared-ui';

<Footer />
```

### Form Components

#### Button

```tsx
import { Button } from '@psytor/astrogators-shared-ui';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="outline" loading>
  Loading...
</Button>
```

#### Input

```tsx
import { Input } from '@psytor/astrogators-shared-ui';

<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  required
  error={errors.email}
/>
```

#### Select

```tsx
import { Select } from '@psytor/astrogators-shared-ui';

<Select
  label="Choose Profile"
  options={[
    { value: 'standard', label: 'Standard' },
    { value: 'speed', label: 'Speed Focus' },
  ]}
  placeholder="Select a profile"
/>
```

### Display Components

#### Card

```tsx
import { Card } from '@psytor/astrogators-shared-ui';

<Card variant="elevated" chamfered chamferSize="md" padding="lg" hoverable>
  <h3>The Mod Ledger</h3>
  <p>Analyze your mods</p>
</Card>
```

#### Badge

```tsx
import { Badge } from '@psytor/astrogators-shared-ui';

<Badge variant="success">Active</Badge>
<Badge variant="warning" size="sm">Beta</Badge>
```

#### Modal

```tsx
import { Modal } from '@psytor/astrogators-shared-ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Login"
  size="md"
>
  {/* Modal content */}
</Modal>
```

### Feedback Components

#### Loader

```tsx
import { Loader } from '@psytor/astrogators-shared-ui';

<Loader size="md" variant="spinner" />
<Loader size="lg" variant="dots" />
```

## Authentication

### useAuth Hook

```tsx
import { useAuth } from '@psytor/astrogators-shared-ui';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      await login({
        email: 'user@example.com',
        password: 'password',
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.username}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## API Client

### Using the API Client

```tsx
import { apiClient } from '@psytor/astrogators-shared-ui';

// GET request
const data = await apiClient.get('/api/v1/game-data/characters');

// POST request
const result = await apiClient.post('/api/v1/mod-ledger/evaluate/123456789', {
  profile_name: 'standard',
});
```

The API client automatically:
- Injects JWT access token in Authorization header
- Refreshes expired tokens
- Retries failed requests after token refresh
- Calls `onUnauthorized` callback on auth failure

## TypeScript Types

All TypeScript types are exported:

```tsx
import type {
  User,
  LoginRequest,
  LoginResponse,
  ParsedMod,
  ModEvaluation,
  ApiError,
} from '@psytor/astrogators-shared-ui';
```

## CSS Variables

Customize the design system by overriding CSS variables:

```css
:root {
  --color-primary: #1a73e8;
  --color-secondary: #34a853;
  --font-primary: 'Your Font', sans-serif;
  --spacing-md: 1rem;
  --chamfer-size: 8px;
}
```

## Chamfered Boxes

Use the chamfered box effect on any element:

```tsx
<div className="chamfered-box">
  {/* Content with cut corners */}
</div>

<div className="chamfered-box-lg">
  {/* Large chamfered corners */}
</div>

<div className="chamfered-box-sm">
  {/* Small chamfered corners */}
</div>
```

Or use the Card component:

```tsx
<Card chamfered chamferSize="lg">
  {/* Content */}
</Card>
```

## Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Type check
npm run type-check
```

## Publishing

```bash
# Bump version
npm version patch  # or minor, or major

# Build
npm run build

# Publish to GitHub Packages
npm publish
```

## License

MIT
