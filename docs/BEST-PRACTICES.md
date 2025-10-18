# Best Practices Implemented

## Architecture & Organization

### 1. **Layered Architecture**
```
Component Layer (UI)
    ↓
Hooks Layer (TanStack Query)
    ↓
Service Layer (Business Logic + API Endpoints)
    ↓
HTTP Service Layer (Axios Wrapper)
    ↓
Axios Instance (Interceptors + Config)
```

**Benefits:**
- Clear separation of concerns
- Easy to test each layer independently
- Scalable for large applications
- Changes in one layer don't affect others

### 2. **File Organization**
```
src/
├── lib/api/          # Core infrastructure
├── services/         # API endpoints (one per domain)
├── hooks/            # TanStack Query hooks (one per domain)
├── components/       # UI components
└── types/            # Shared TypeScript types (future)
```

---

## API Calling Patterns

### Clean Separation of Concerns

```typescript
// ✅ GOOD - Clear separation of body, params, config
httpService.post<User>('/users', {
  body: { name: 'John', email: 'john@example.com' },
  params: { notify: true },
  config: {
    showSuccessToast: true,
    successMessage: 'User created!',
  },
});

// ❌ BAD - Mixed parameters
httpService.post('/users', userData, { notify: true });
```

### Path Parameters Handling

```typescript
// Method 1: Direct interpolation (simple cases)
`/users/${id}`

// Method 2: buildEndpoint helper (complex URLs)
buildEndpoint('/users/:id/posts/:postId', { id: 123, postId: 456 })
// Result: '/users/123/posts/456'
```

### Toast Control

```typescript
// GET requests - no success toast by default
showSuccessToast: false

// POST/PUT/PATCH/DELETE - success toast by default
showSuccessToast: true

// Silent mode - no toasts at all
showSuccessToast: false,
showErrorToast: false

// Custom message
successMessage: 'User created successfully!'
```

---

## Toast Notification Strategy

### Global Configuration (axios.config.ts)

**Interceptor handles:**
- Success toasts (opt-in via `showSuccessToast`)
- Error toasts (opt-out via `showErrorToast: false`)
- 401 errors → auto-logout
- Network errors → user-friendly messages

**Service Layer Controls:**
```typescript
// Service defines default behavior
async createUser(userData) {
  const response = await httpService.post('/users', {
    body: userData,
    config: {
      showSuccessToast: true,  // Service decides default
      successMessage: `User "${userData.name}" created!`,
    },
  });
}
```

**Benefits:**
- Consistent toast behavior across app
- Service layer owns business logic
- Easy to override per request
- No duplication in hooks or components

---

## TypeScript Best Practices

### 1. **Type-Only Imports**
```typescript
// ✅ Correct
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';

// ❌ Incorrect (verbatimModuleSyntax error)
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
```

### 2. **Generic Type Parameters**
```typescript
// Always specify response type
httpService.get<User[]>('/users')

// Specify body and response types
httpService.post<UserResponse, CreateUserRequest>('/users', {
  body: userData
})
```

### 3. **Service Method Signatures**
```typescript
// ✅ Good - Clear parameter types
async getUsers(params?: { page?: number; limit?: number })

// ✅ Good - Explicit return type
async getUserById(id: number): Promise<User>

// ❌ Bad - No types
async getUsers(params)
```

---

## Scalability Patterns

### 1. **Feature-Based Organization**
```
services/
  ├── userService.ts      # User domain
  ├── productService.ts   # Product domain
  └── orderService.ts     # Order domain

hooks/
  ├── useUsers.ts         # User hooks
  ├── useProducts.ts      # Product hooks
  └── useOrders.ts        # Order hooks
```

### 2. **Query Key Factory**
```typescript
// Centralized query keys
export const queryKeys = {
  user: {
    all: ['users'] as const,
    lists: () => [...queryKeys.user.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.user.lists(), filters] as const,
    details: () => [...queryKeys.user.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.user.details(), id] as const,
  },
};

// Usage
queryKey: queryKeys.user.list({ status: 'active' })

// Invalidate all lists
queryClient.invalidateQueries({ queryKey: queryKeys.user.lists() });
```

### 3. **Service Layer Pattern**
```typescript
// Each domain gets its own service
export const userService = {
  getUsers: (params?) => httpService.get(...),
  getUserById: (id) => httpService.get(...),
  createUser: (data) => httpService.post(...),
  updateUser: (id, data) => httpService.put(...),
  deleteUser: (id) => httpService.delete(...),
};
```

**Benefits:**
- Easy to add new domains
- Clear API surface
- Simple to mock for testing
- Type-safe with autocomplete

---

## Maintainability

### 1. **Single Responsibility**

**HTTP Service:** HTTP calls only
```typescript
export const httpService = {
  get: (...) => axiosInstance.get(...),
  post: (...) => axiosInstance.post(...),
  // ... other methods
};
```

**Service Layer:** Business logic + endpoint definitions
```typescript
export const userService = {
  createUser: (data) => {
    return httpService.post(...);
  },
};
```

**Hooks:** TanStack Query integration + cache management
```typescript
export const useCreateUser = () => {
  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => queryClient.invalidateQueries(...),
  });
};
```

**Components:** UI only
```typescript
export default function UsersDemo() {
  const { data, isLoading } = useUsers();
  const createUser = useCreateUser();

  return <UI />;
}
```

### 2. **Consistent Error Handling**

**Level 1: Axios Interceptor (Global)**
```typescript
// Handles all HTTP errors globally
// - 401 → logout
// - Network errors → user-friendly messages
```

**Level 2: Service Layer (Optional)**
```typescript
async createUser(data) {
  try {
    return await httpService.post(...);
  } catch (error) {
    // Domain-specific error handling if needed
    throw error;
  }
}
```

**Level 3: Hook Layer (Optional)**
```typescript
useMutation({
  mutationFn: userService.createUser,
  onError: (error) => {
    // Hook-specific error handling
    console.error('Failed to create user:', error);
  },
});
```

**Level 4: Component Layer (UI)**
```typescript
if (error) return <ErrorComponent error={error} />;
```

### 3. **Configuration Management**

**Environment Variables:**
```typescript
// .env
VITE_API_BASE_URL=https://api.example.com

// axios.config.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

**Centralized Constants:**
```typescript
// axios.config.ts
const API_TIMEOUT = 30000;
const RETRY_ATTEMPTS = 3;
```

---

## Performance Optimizations

### 1. **Stale-While-Revalidate**
```typescript
staleTime: 5 * 60 * 1000,  // 5 minutes
gcTime: 10 * 60 * 1000,     // 10 minutes
```

### 2. **Request Deduplication**
```typescript
// Multiple components calling same query → 1 HTTP request
useQuery({ queryKey: ['users'] })
useQuery({ queryKey: ['users'] })  // Deduped!
```

### 3. **Optimistic Updates**
```typescript
onMutate: async (newData) => {
  // Update cache immediately
  queryClient.setQueryData(['users'], newData);
},
onError: (err, variables, context) => {
  // Rollback on error
  queryClient.setQueryData(['users'], context.previousData);
},
```

---

## Testing Strategy

### Unit Tests

**Service Layer:**
```typescript
// Mock httpService
jest.mock('../lib/api/http.service');

test('userService.createUser', async () => {
  const mockUser = { name: 'John' };
  httpService.post.mockResolvedValue({ data: mockUser });

  const result = await userService.createUser(mockUser);
  expect(result).toEqual(mockUser);
});
```

**Hooks:**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

test('useUsers', async () => {
  const { result } = renderHook(() => useUsers(), {
    wrapper: QueryClientProvider,
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

---

## Security Best Practices

### 1. **Token Management**
```typescript
// Automatic token injection
if (!config.meta?.skipAuth) {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
}
```

### 2. **Sensitive Data**
```typescript
// Never log sensitive data in production
if (import.meta.env.DEV) {
  console.log('[API Request]', config);
}
```

### 3. **401 Handling**
```typescript
if (status === 401) {
  localStorage.clear();  // Clear all auth data
  window.location.href = '/login';
}
```

---

## Code Examples

### Adding a New Feature

**1. Create Service:**
```typescript
// services/productService.ts
export const productService = {
  getProducts: () => httpService.get<Product[]>('/products'),
  // ... other methods
};
```

**2. Add Query Keys:**
```typescript
// query-client.config.ts
queryKeys: {
  product: {
    all: ['products'] as const,
    detail: (id: string) => [...queryKeys.product.all, id] as const,
  },
}
```

**3. Create Hooks:**
```typescript
// hooks/useProducts.ts
export const useProducts = () => {
  return useQuery({
    queryKey: queryKeys.product.all,
    queryFn: productService.getProducts,
  });
};
```

**4. Use in Component:**
```typescript
// components/ProductList.tsx
const { data: products } = useProducts();
```

---

## Summary

This architecture provides:

✅ **Maintainability** - Clear separation of concerns
✅ **Scalability** - Easy to add new features
✅ **Type Safety** - Full TypeScript coverage
✅ **Developer Experience** - Autocomplete, IntelliSense
✅ **Performance** - Automatic caching and optimization
✅ **Consistency** - Standardized patterns everywhere
✅ **Testability** - Each layer can be tested independently

All while following industry best practices from top tech companies.
