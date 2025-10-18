# TanStack Query + TypeScript - Complete Guide

## Table of Contents
1. [What is TanStack Query?](#what-is-tanstack-query)
2. [How TanStack Query Works Internally](#how-it-works-internally)
3. [TypeScript Integration & Best Practices](#typescript-integration)
4. [Architecture Overview](#architecture-overview)
5. [Complete Example Walkthrough](#example-walkthrough)
6. [Best Practices & Patterns](#best-practices)

---

## What is TanStack Query?

**TanStack Query** (formerly React Query) is a powerful data-fetching and state management library for React applications. It eliminates the need to write manual data fetching logic and provides:

### Core Features
- **Automatic Caching** - Stores API responses and reuses them
- **Background Refetching** - Keeps data fresh automatically
- **Request Deduplication** - Prevents duplicate API calls
- **Optimistic Updates** - Updates UI before server responds
- **DevTools** - Visual debugging of cache and queries
- **TypeScript First** - Built with TypeScript for type safety

### Why Use It?
```typescript
// ❌ Without TanStack Query - Manual Management
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/users')
    .then(res => res.json())
    .then(data => {
      setUsers(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
}, []);

// ✅ With TanStack Query - Automatic Management
const { data: users, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => userService.getUsers(),
});
```

---

## How It Works Internally

### 1. Query Cache Architecture

TanStack Query maintains an internal cache that stores query results:

```
QueryClient
├── Query Cache
│   ├── ['users'] → { data: [...], status: 'success', ... }
│   ├── ['users', 'detail', '1'] → { data: {...}, status: 'success', ... }
│   └── ['products'] → { data: [...], status: 'loading', ... }
└── Mutation Cache
    ├── createUser → { status: 'success', ... }
    └── updateUser → { status: 'pending', ... }
```

### 2. Query Lifecycle

```
1. Component Mount
   ↓
2. Check Cache (by queryKey)
   ├─→ Cache Hit (fresh) → Return cached data
   ├─→ Cache Hit (stale) → Return cached data + Refetch in background
   └─→ Cache Miss → Fetch from server
   ↓
3. Store in Cache
   ↓
4. Re-render Component
   ↓
5. Background Refetching (if configured)
```

### 3. Query States

Every query goes through these states:

```typescript
type QueryStatus = 'pending' | 'error' | 'success';

interface QueryState {
  status: QueryStatus;
  isPending: boolean;    // Initial loading
  isLoading: boolean;    // Loading (no cached data)
  isFetching: boolean;   // Fetching (may have cached data)
  isError: boolean;      // Request failed
  isSuccess: boolean;    // Request succeeded
  data?: T;              // Response data
  error?: Error;         // Error object
}
```

### 4. Stale Time vs Cache Time

```typescript
// Stale Time: How long data is considered "fresh"
staleTime: 5 * 60 * 1000  // 5 minutes
// → Data won't refetch for 5 minutes

// Cache Time (gcTime): How long unused data stays in memory
gcTime: 10 * 60 * 1000    // 10 minutes
// → Data removed from cache after 10 minutes of non-use
```

**Timeline Example:**
```
0s    → Query runs, data cached (fresh)
5min  → Data becomes stale (will refetch on next use)
10min → Last component using this data unmounts
20min → Data removed from cache (gcTime elapsed)
```

### 5. Query Keys - The Heart of Caching

Query keys are **unique identifiers** for cached data:

```typescript
// Simple key
queryKey: ['users']

// Key with parameters (creates separate cache entries)
queryKey: ['users', { page: 1 }]
queryKey: ['users', { page: 2 }]  // Different cache entry!

// Hierarchical keys (best practice)
queryKey: ['users', 'detail', userId]
queryKey: ['users', 'list', filters]
```

**Key Matching for Invalidation:**
```typescript
// Invalidate ALL user-related queries
queryClient.invalidateQueries({ queryKey: ['users'] });

// Only invalidates:
// ['users']
// ['users', 'detail', '1']
// ['users', 'list', {...}]
```

---

## TypeScript Integration

### 1. Typed Query Hooks

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// ✅ Proper typing
const { data, isLoading, error } = useQuery<User[], Error>({
  queryKey: ['users'],
  queryFn: async (): Promise<User[]> => {
    const response = await httpService.get<User[]>('/users');
    return response.data;
  },
});

// data is automatically typed as User[] | undefined
// error is typed as Error | null
```

### 2. Generic HTTP Service

```typescript
export const httpService = {
  async get<T>(endpoint: string): Promise<AxiosResponse<T>> {
    //                                              ↑
    //                                    Generic type parameter
    return axiosInstance.get<T>(endpoint);
  },
};

// Usage - Type flows through
const response = await httpService.get<User[]>('/users');
// response.data is typed as User[]
```

### 3. Type-Safe Custom Hooks

```typescript
// Generic hook with proper typing
export function useGet<TData = unknown, TError = AxiosError>(
  queryKey: readonly unknown[],
  endpoint: string,
  options?: UseQueryOptions<TData, TError>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      const response = await httpService.get<TData>(endpoint);
      return response.data;
    },
    ...options,
  });
}

// Usage with auto-inference
const { data } = useGet<User[]>(['users'], '/users');
//     ↑ data is User[] | undefined
```

### 4. Type-Only Imports (verbatimModuleSyntax)

When TypeScript's `verbatimModuleSyntax` is enabled, separate type imports:

```typescript
// ❌ Wrong - Type and value imports mixed
import { UseQueryOptions, useQuery } from '@tanstack/react-query';

// ✅ Correct - Separated
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
```

**Why?** TypeScript needs to know what to remove at compile time (types) vs what to keep (runtime code).

### 5. Mutation Typing

```typescript
interface CreateUserInput {
  name: string;
  email: string;
}

interface CreateUserResponse {
  id: number;
  name: string;
  email: string;
}

const createUser = useMutation<
  CreateUserResponse,  // Success data type
  AxiosError,          // Error type
  CreateUserInput      // Variables (input) type
>({
  mutationFn: (input: CreateUserInput) => userService.createUser(input),
  onSuccess: (data) => {
    // data is typed as CreateUserResponse
    console.log(`Created user with ID: ${data.id}`);
  },
  onError: (error) => {
    // error is typed as AxiosError
    console.error(error.message);
  },
});

// Usage
await createUser.mutateAsync({
  name: 'John',
  email: 'john@example.com',
});
```

---

## Architecture Overview

### Project Structure

```
src/
├── lib/
│   └── api/
│       ├── axios.config.ts          # Axios instance + interceptors
│       ├── http.service.ts          # HTTP methods wrapper
│       └── query-client.config.ts   # TanStack Query setup
├── hooks/
│   ├── useApi.ts                    # Generic API hooks
│   └── useUsers.ts                  # Feature-specific hooks
├── services/
│   └── userService.ts               # API endpoint definitions
└── components/
    └── UsersDemo.tsx                # UI component using hooks
```

### Data Flow

```
1. Component calls hook
   ↓
2. Hook checks cache (by queryKey)
   ↓
3. If needed, calls API service
   ↓
4. Service uses httpService
   ↓
5. httpService uses axios instance
   ↓
6. Interceptors handle auth/errors
   ↓
7. Response cached by TanStack Query
   ↓
8. Component re-renders with data
```

### Layer Responsibilities

#### 1. **axios.config.ts** - HTTP Client Setup
```typescript
// Responsibilities:
// - Create axios instance with base config
// - Add request interceptor (auth tokens)
// - Add response interceptor (error handling)
// - Configure retry logic

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

axiosInstance.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### 2. **http.service.ts** - HTTP Methods
```typescript
// Responsibilities:
// - Provide clean HTTP method APIs
// - Handle TypeScript generics
// - Consistent error handling

export const httpService = {
  async get<T>(endpoint: string): Promise<AxiosResponse<T>> {
    return axiosInstance.get<T>(endpoint);
  },
  // ... post, put, patch, delete
};
```

#### 3. **query-client.config.ts** - Query Setup
```typescript
// Responsibilities:
// - Configure cache behavior
// - Set default options
// - Define query keys structure

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
});

export const queryKeys = {
  user: {
    all: ['users'] as const,
    byId: (id: string) => [...queryKeys.user.all, 'detail', id] as const,
  },
};
```

#### 4. **userService.ts** - API Endpoints
```typescript
// Responsibilities:
// - Define API endpoints
// - Type API responses
// - Business logic layer

export const userService = {
  async getUsers() {
    const response = await httpService.get<User[]>(`${API_BASE}/users`);
    return response.data;
  },
};
```

#### 5. **useUsers.ts** - Feature Hooks
```typescript
// Responsibilities:
// - Wrap TanStack Query hooks
// - Handle cache invalidation
// - Show toast notifications
// - Business logic for data operations

export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.user.all,
    queryFn: userService.getUsers,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      toast.success('User created!');
    },
  });
};
```

#### 6. **UsersDemo.tsx** - UI Component
```typescript
// Responsibilities:
// - Use hooks to fetch/mutate data
// - Handle loading/error states
// - Render UI

export default function UsersDemo() {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();

  if (isLoading) return <Spinner />;

  return (
    <div>
      {users.map(user => <UserCard key={user.id} user={user} />)}
      <button onClick={() => createUser.mutate({...})}>
        Create User
      </button>
    </div>
  );
}
```

---

## Example Walkthrough

### GET Request - Fetching Data

```typescript
// 1. Define the hook
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.user.all,  // ['users']
    queryFn: userService.getUsers,
    staleTime: 5 * 60 * 1000,
  });
};

// 2. Use in component
function UsersList() {
  const { data: users, isLoading, isError, error } = useUsers();

  if (isLoading) return <Spinner />;
  if (isError) return <Error message={error.message} />;

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

**What happens internally:**
1. Component renders → `useQuery` checks cache for `['users']`
2. Cache miss → Calls `userService.getUsers()`
3. Service calls `httpService.get('/users')`
4. Axios makes HTTP request with auth token (interceptor)
5. Response intercepted → logged in dev mode
6. Data cached with key `['users']`
7. Component re-renders with `data`
8. After 5 min, data becomes stale
9. Next render → Returns cached data + refetches in background

### POST Request - Creating Data

```typescript
// 1. Define the mutation hook
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: Omit<User, 'id'>) =>
      userService.createUser(userData),
    onSuccess: (newUser) => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      toast.success(`User "${newUser.name}" created!`);
    },
    onError: (error: AxiosError) => {
      toast.error(`Failed: ${error.message}`);
    },
  });
};

// 2. Use in component
function CreateUserForm() {
  const createUser = useCreateUser();

  const handleSubmit = async (data) => {
    await createUser.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <input name="email" />
      <button disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

**What happens internally:**
1. User clicks "Create User"
2. `mutateAsync` called → `mutationFn` executes
3. `userService.createUser()` → `httpService.post()`
4. Axios POST request with auth token
5. Response interceptor shows success toast
6. `onSuccess` callback fires:
   - Invalidates `['users']` cache
   - Shows custom success toast
7. All components using `useUsers()` refetch automatically
8. UI updates with new user

### PUT/PATCH Request - Updating Data

```typescript
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      userService.updateUser(id, data),
    onSuccess: (updatedUser) => {
      // Invalidate both list and detail caches
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.byId(String(updatedUser.id))
      });
      toast.success('User updated!');
    },
  });
};
```

### DELETE Request - Removing Data

```typescript
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: (_, deletedId) => {
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      // Remove detail from cache
      queryClient.removeQueries({
        queryKey: queryKeys.user.byId(String(deletedId))
      });
      toast.success('User deleted!');
    },
  });
};
```

---

## Best Practices

### 1. Query Key Organization

```typescript
// ✅ Good - Hierarchical structure
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
// ['users', 'list', { status: 'active' }]

// Invalidate all lists
queryClient.invalidateQueries({ queryKey: queryKeys.user.lists() });
```

### 2. TypeScript Generics

```typescript
// ✅ Always specify types
const { data } = useQuery<User[], AxiosError>({
  queryKey: ['users'],
  queryFn: fetchUsers,
});

// ✅ Infer from service function
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: userService.getUsers, // Returns Promise<User[]>
});
```

### 3. Error Handling

```typescript
// ✅ Handle errors at multiple levels

// 1. Global interceptor (axios.config.ts)
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle auth errors globally
      logout();
    }
    return Promise.reject(error);
  }
);

// 2. Hook level
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
    onError: (error) => {
      console.error('Failed to fetch users:', error);
    },
  });
};

// 3. Component level
const { data, error } = useUsers();
if (error) return <ErrorComponent error={error} />;
```

### 4. Loading States

```typescript
const { data, isLoading, isFetching, isPending } = useQuery({...});

// isPending: Initial load (no cached data)
// isLoading: Currently loading and no cached data
// isFetching: Fetching (may have stale cached data)

if (isPending) return <Skeleton />;         // First load
if (isFetching && data) return <Spinner />; // Background refetch
return <Data data={data} />;
```

### 5. Mutation Feedback

```typescript
const createUser = useMutation({
  mutationFn: userService.createUser,
  onMutate: () => {
    // Show loading state immediately
    toast.loading('Creating user...');
  },
  onSuccess: () => {
    toast.dismiss();
    toast.success('User created!');
  },
  onError: () => {
    toast.dismiss();
    toast.error('Failed to create user');
  },
});
```

### 6. Optimistic Updates

```typescript
const updateUser = useMutation({
  mutationFn: userService.updateUser,
  onMutate: async (newUser) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['users'] });

    // Snapshot current data
    const previousUsers = queryClient.getQueryData(['users']);

    // Optimistically update cache
    queryClient.setQueryData(['users'], (old: User[]) =>
      old.map(user => user.id === newUser.id ? newUser : user)
    );

    // Return rollback function
    return { previousUsers };
  },
  onError: (err, newUser, context) => {
    // Rollback on error
    queryClient.setQueryData(['users'], context.previousUsers);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

### 7. Dependent Queries

```typescript
// Fetch user first, then user's posts
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => userService.getUserById(userId),
});

const { data: posts } = useQuery({
  queryKey: ['posts', userId],
  queryFn: () => postService.getUserPosts(userId),
  enabled: !!user, // Only run when user exists
});
```

### 8. Pagination

```typescript
const [page, setPage] = useState(1);

const { data, isPending } = useQuery({
  queryKey: ['users', { page }],
  queryFn: () => userService.getUsers({ page }),
  placeholderData: (previousData) => previousData, // Keep old data while fetching
});
```

### 9. Prefetching

```typescript
const queryClient = useQueryClient();

// Prefetch on hover
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUserById(userId),
  });
};

<button onMouseEnter={handleMouseEnter}>
  View User
</button>
```

### 10. DevTools Usage

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**DevTools Features:**
- View all queries and their states
- Inspect cached data
- Manually trigger refetch
- See query dependencies
- Monitor network requests

---

## Performance Optimization

### 1. Select - Transform Data

```typescript
const { data: userNames } = useQuery({
  queryKey: ['users'],
  queryFn: userService.getUsers,
  select: (users) => users.map(user => user.name), // Only re-render if names change
});
```

### 2. Structural Sharing

TanStack Query uses structural sharing by default:

```typescript
// Old data: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
// New data: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
// Result: Old reference returned → No re-render!
```

### 3. Query Cancellation

```typescript
const { data } = useQuery({
  queryKey: ['search', query],
  queryFn: async ({ signal }) => {
    const response = await axios.get('/search', {
      params: { q: query },
      signal, // Pass AbortSignal
    });
    return response.data;
  },
});
// Query auto-cancelled if queryKey changes
```

---

## Common Patterns

### Pattern 1: List + Detail

```typescript
// List query
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: userService.getUsers,
});

// Detail query
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => userService.getUserById(userId),
  // Use list data as initial data
  initialData: () =>
    users?.find(u => u.id === userId),
});
```

### Pattern 2: Infinite Scroll

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['users'],
  queryFn: ({ pageParam = 1 }) =>
    userService.getUsers({ page: pageParam }),
  getNextPageParam: (lastPage, pages) =>
    lastPage.hasMore ? pages.length + 1 : undefined,
  initialPageParam: 1,
});
```

### Pattern 3: Polling

```typescript
const { data } = useQuery({
  queryKey: ['status'],
  queryFn: statusService.getStatus,
  refetchInterval: 5000, // Poll every 5 seconds
  refetchIntervalInBackground: true,
});
```

---

## Debugging Tips

### 1. Enable Query Logs

```typescript
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => console.error('Query Error:', error),
      onSuccess: (data) => console.log('Query Success:', data),
    },
  },
});
```

### 2. Inspect Cache

```typescript
// Get all queries
const queries = queryClient.getQueryCache().getAll();
console.log('All queries:', queries);

// Get specific query data
const data = queryClient.getQueryData(['users']);
console.log('Users data:', data);

// Get query state
const state = queryClient.getQueryState(['users']);
console.log('Query state:', state);
```

### 3. Common Issues

**Issue: Data not refetching**
```typescript
// Check staleTime
staleTime: 0 // Always refetch
staleTime: Infinity // Never refetch
```

**Issue: Too many refetches**
```typescript
// Disable aggressive refetching
refetchOnWindowFocus: false
refetchOnReconnect: false
refetchOnMount: false
```

**Issue: Type errors with mutations**
```typescript
// Always specify all 3 generic parameters
useMutation<TData, TError, TVariables>({...})
```

---

## Conclusion

TanStack Query with TypeScript provides:
- **Type Safety** - Catch errors at compile time
- **Better DX** - Autocomplete and IntelliSense
- **Less Boilerplate** - No manual state management
- **Better Performance** - Automatic caching and deduplication
- **Better UX** - Loading states, optimistic updates, background refetching

This architecture scales from small projects to enterprise applications while maintaining type safety and developer experience.

For more information:
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Axios Documentation](https://axios-http.com/)
