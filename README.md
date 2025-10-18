# React HTTP Utilities - Best Practices 2025

Modern HTTP utility setup for React applications using **Axios**, **TanStack Query** (React Query), and **TypeScript**.

## Features

- **Type-safe API calls** with TypeScript generics
- **Centralized axios configuration** with interceptors
- **Automatic retry logic** for network failures
- **Auth token management** from localStorage
- **Toast notifications** for success/error states
- **TanStack Query integration** for caching and state management
- **Query key factory** for organized cache management
- **Custom React hooks** for all HTTP methods
- **Model transformation** support (replaces old EffectUtility)
- **Optimistic updates** capability
- **Development logging** and DevTools

## Project Structure

```
src/
├── lib/
│   └── api/
│       ├── axios.config.ts          # Axios instance & interceptors
│       ├── http.service.ts          # HTTP service layer
│       └── query-client.config.ts   # React Query setup
├── hooks/
│   └── useApi.ts                    # Custom API hooks
└── examples/
    ├── UserService.example.ts       # Example service
    └── UserComponent.example.tsx    # Example component
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Run Development Server

```bash
npm run dev
```

## Usage

### Basic HTTP Calls

```typescript
import httpService from './lib/api/http.service';

// GET request
const response = await httpService.get('/users', { page: 1 });

// POST request
const response = await httpService.post('/users', { name: 'John' });

// PUT request
const response = await httpService.put('/users/1', { name: 'Jane' });

// DELETE request
const response = await httpService.delete('/users/1');
```

### With React Query Hooks

```typescript
import { useGet, usePost } from './hooks/useApi';
import { queryKeys } from './lib/api/query-client.config';

function UsersComponent() {
  // Fetch users with caching
  const { data, isLoading } = useGet(
    queryKeys.user.all,
    '/users',
    { page: 1 }
  );

  // Create user mutation
  const createUser = usePost('/users', {
    meta: { showToast: true }
  });

  const handleCreate = async () => {
    await createUser.mutateAsync({ name: 'John' });
  };

  return <div>...</div>;
}
```

### Model Transformation

```typescript
import { ModelService } from './lib/api/http.service';

class UserModel {
  id: string;
  fullName: string;

  constructor(data: any) {
    this.id = data.id;
    this.fullName = `${data.firstName} ${data.lastName}`;
  }
}

// Fetch and transform to model
const user = await ModelService.getToModel(
  UserModel,
  '/users/profile'
);

console.log(user.fullName); // Typed property access
```

### Custom Configuration

```typescript
// Suppress toast notifications
await httpService.post('/data', payload, undefined, {
  meta: { silent: true }
});

// Skip authentication header
await httpService.get('/public', undefined, {
  meta: { skipAuth: true }
});

// Show success toast
await httpService.post('/data', payload, undefined, {
  meta: { showToast: true }
});
```

## Key Improvements from Old Approach

### Before (Class-based)

```javascript
// HttpUtility.js
class HttpUtility extends React.Component {
  static async get(endpoint, params, requestConfig) {
    // ...implementation
  }
}

// EffectUtility.js
class EffectUtility {
  static async getToModel(Model, endpoint, params) {
    const response = await HttpUtility.get(endpoint, params);
    return new Model(response.data);
  }
}
```

### After (Functional + TypeScript)

```typescript
// Functional approach with generics
const httpService = {
  async get<T>(endpoint: string, params?: Record<string, any>) {
    return axiosInstance.get<T>(endpoint, { params });
  }
};

// Model transformation with type safety
class ModelService {
  static transform<T, M>(
    data: T | T[],
    ModelClass: new (data: T) => M
  ): M | M[] {
    // ...implementation
  }
}
```

## Benefits

1. **Type Safety** - Full TypeScript support catches errors at compile time
2. **Better DX** - Autocomplete and IntelliSense in VSCode
3. **Caching** - TanStack Query handles data caching automatically
4. **Less Boilerplate** - Custom hooks reduce repetitive code
5. **Better Error Handling** - Centralized via interceptors
6. **Optimistic Updates** - Built-in support for better UX
7. **DevTools** - React Query DevTools for debugging
8. **Modern Patterns** - Follows 2025 best practices

## Configuration Options

### Axios Instance (`axios.config.ts`)

- **Base URL** - Set via environment variable
- **Timeout** - Default 30 seconds
- **Retry Logic** - 3 attempts with exponential backoff
- **Auth Token** - Auto-injected from localStorage
- **Request/Response Logging** - Development mode only

### React Query (`query-client.config.ts`)

- **Stale Time** - 5 minutes (data freshness)
- **Cache Time** - 10 minutes (cache retention)
- **Retry** - 1 attempt for failed queries
- **Refetch on Window Focus** - Disabled by default
- **Refetch on Reconnect** - Enabled

## Query Keys Organization

Centralized query keys prevent cache collisions:

```typescript
export const queryKeys = {
  user: {
    all: ['users'],
    profile: () => [...queryKeys.user.all, 'profile'],
    byId: (id: string) => [...queryKeys.user.all, 'detail', id],
  },
  property: {
    all: ['properties'],
    list: (filters?: Record<string, any>) =>
      [...queryKeys.property.all, 'list', filters],
  },
};
```

## Error Handling

Errors are handled globally via interceptors:

- **401 Unauthorized** - Auto logout + redirect
- **Network Errors** - User-friendly messages
- **Server Errors** - Error toasts with messages
- **Silent Mode** - Suppress toasts when needed

## Development Tools

- **React Query DevTools** - Visual query inspector
- **Console Logging** - Request/response details (dev only)
- **Toast Notifications** - react-hot-toast integration

## Migration Guide

If migrating from the old Redux + HttpUtility approach:

1. Replace `HttpUtility.get()` with `httpService.get()`
2. Replace `EffectUtility.getToModel()` with `ModelService.getToModel()`
3. Replace Redux actions with React Query hooks
4. Update components to use `useGet`, `usePost`, etc.
5. Remove Redux boilerplate (actions, reducers, middleware)

## License

MIT

## Author

Refactored with 2025 best practices based on:
- TanStack Query documentation
- Axios best practices
- TypeScript patterns
- React community standards
