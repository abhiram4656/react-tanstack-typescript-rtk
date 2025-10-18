# RTK Query Implementation - MNC Best Practices

## Overview

This document details the **enterprise-grade RTK Query implementation** following MNC (Multi-National Corporation) standards and industry best practices for large-scale React applications.

---

## 📊 TanStack Query Analysis - Grade: 8.5/10

### ✅ Strengths (What You Did Right)

1. **Query Keys Factory Pattern** (`query-client.config.ts:47-86`)
   - Centralized, hierarchical query keys
   - TypeScript `as const` for type safety
   - Easy cache invalidation management

2. **Excellent Separation of Concerns**
   - Custom hooks (`hooks/useUsers.ts`)
   - Service layer (`services/userService.ts`)
   - HTTP abstraction (`lib/api/http.service.ts`)

3. **Proper Cache Invalidation** (`hooks/useUsers.ts:44-48`)
   - `invalidateQueries()` after mutations
   - `removeQueries()` for deletions
   - Targeted cache updates

4. **Strong TypeScript Integration**
   - Generic types throughout
   - Type inference from services
   - `Omit<User, 'id'>` for create operations

5. **Sensible Global Configuration**
   - 5-minute stale time
   - 10-minute garbage collection
   - Retry logic configured

6. **Conditional Queries**
   - `enabled: !!id` prevents unnecessary requests

### ⚠️ Areas for Improvement

1. **Missing Optimistic Updates**
   - No `onMutate` with rollback
   - UI waits for server response

2. **Basic Error Handling**
   - Errors not transformed
   - No custom error types

3. **No Request Cancellation**
   - Missing `signal` support
   - Potential memory leaks on unmount

4. **Stale Time Inconsistency**
   - Redundant overrides in hooks
   - Should rely on global config

5. **Missing Advanced Patterns**
   - No `useInfiniteQuery` for pagination
   - No prefetching strategies

---

## 🚀 RTK Query Implementation - Enterprise Standards

### Architecture Highlights

```
┌─────────────────────────────────────────────────────┐
│                 Application Layer                   │
│  (Components: UsersDemoRTK.tsx)                     │
└──────────────────┬──────────────────────────────────┘
                   │ Uses hooks
┌──────────────────▼──────────────────────────────────┐
│              RTK Query Hooks Layer                  │
│  (Auto-generated: useGetUsersQuery, etc.)           │
└──────────────────┬──────────────────────────────────┘
                   │ Calls endpoints
┌──────────────────▼──────────────────────────────────┐
│           API Endpoints (Code Splitting)            │
│  (users.api.ts - injected into baseApi)             │
└──────────────────┬──────────────────────────────────┘
                   │ Uses baseQuery
┌──────────────────▼──────────────────────────────────┐
│          Axios Base Query Adapter                   │
│  (axiosBaseQuery.ts - Axios integration)            │
└──────────────────┬──────────────────────────────────┘
                   │ Leverages
┌──────────────────▼──────────────────────────────────┐
│        Existing Axios Infrastructure                │
│  (Interceptors, Retry Logic, Auth Tokens)           │
└─────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/
├── store/
│   ├── store.ts                      # Redux store configuration
│   ├── hooks.ts                      # Typed Redux hooks
│   └── api/
│       ├── baseApi.ts                # Base RTK Query API slice
│       ├── axiosBaseQuery.ts         # Axios adapter for RTK Query
│       └── endpoints/
│           └── users.api.ts          # User endpoints (code splitting)
│
├── components/
│   ├── UsersDemo.tsx                 # TanStack Query demo
│   └── UsersDemoRTK.tsx              # RTK Query demo (NEW)
│
├── lib/api/
│   ├── axios.config.ts               # Axios instance + interceptors
│   └── http.service.ts               # HTTP method wrappers
│
└── main.tsx                          # App entry with Redux Provider
```

---

## 🎯 Enterprise Best Practices Implemented

### 1. **Code Splitting Pattern**

**Why:** In large applications with 100+ endpoints, defining all endpoints in one file is unmaintainable.

**Implementation:**
```typescript
// baseApi.ts - Empty base API
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({ baseUrl: 'https://api.example.com' }),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: () => ({}), // Empty - endpoints injected elsewhere
});

// users.api.ts - Injected endpoints
export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({ /* ... */ }),
    // ... more endpoints
  }),
});
```

**Benefits:**
- Lazy loading of endpoints
- Better code organization
- Reduced bundle size (if using code splitting)
- Team can work on different endpoint files without conflicts

---

### 2. **Tag-Based Cache Invalidation**

**Why:** Automatic cache updates without manual `refetch()` calls.

**Implementation:**
```typescript
// users.api.ts
getUsers: builder.query<User[], void>({
  // Provides tags - marks what this query affects
  providesTags: (result) =>
    result
      ? [
          ...result.map(({ id }) => ({ type: 'Users', id })),
          { type: 'Users', id: 'LIST' },
        ]
      : [{ type: 'Users', id: 'LIST' }],
}),

createUser: builder.mutation<User, CreateUserRequest>({
  // Invalidates tags - tells RTK Query to refetch
  invalidatesTags: [{ type: 'Users', id: 'LIST' }],
}),
```

**Benefits:**
- Zero manual cache management
- Automatic refetch after mutations
- Prevents stale data
- Scales to complex relationships

**Tag Strategy:**
```
Users:LIST      → All users list
Users:{id}      → Specific user
User:{id}       → Same user, different view
```

---

### 3. **Optimistic Updates with Rollback**

**Why:** Instant UI feedback, better UX, automatic error recovery.

**Implementation:**
```typescript
updateUser: builder.mutation<User, { id: number; data: UpdateUserRequest }>({
  async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
    // 1. Update cache immediately (optimistic)
    const patchResult = dispatch(
      usersApi.util.updateQueryData('getUser', id, (draft) => {
        Object.assign(draft, data);
      })
    );

    try {
      // 2. Wait for server response
      await queryFulfilled;
    } catch {
      // 3. Rollback on error
      patchResult.undo();
    }
  },
}),
```

**User Experience:**
```
User clicks "Update" → UI updates instantly → Request sent in background
  ✅ Success: Keep optimistic update
  ❌ Failure: Revert to original state + show error toast
```

---

### 4. **Axios Integration via Custom Base Query**

**Why:** Reuse existing Axios interceptors, retry logic, and auth tokens.

**Implementation:**
```typescript
// axiosBaseQuery.ts
export const axiosBaseQuery = ({ baseUrl = '' } = {}): BaseQueryFn => {
  return async ({ url, method, body, params, meta }) => {
    try {
      const result = await axiosInstance.request({
        url: baseUrl + url,
        method,
        data: body,
        params,
        meta, // Custom meta for toast control
      });
      return { data: result.data };
    } catch (axiosError) {
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data,
          message: err.response?.data?.message || 'Error occurred',
        },
      };
    }
  };
};
```

**Benefits:**
- Single HTTP configuration for both TanStack Query and RTK Query
- Consistent error handling
- Existing interceptors work automatically
- Auth token management reused

---

### 5. **TypeScript Type Safety**

**Implementation:**
```typescript
// Typed hooks from store
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Typed endpoints with generics
getUsers: builder.query<User[], GetUsersParams | void>({ /* ... */ }),
createUser: builder.mutation<User, CreateUserRequest>({ /* ... */ }),

// Usage in components - full autocomplete
const { data: users } = useGetUsersQuery(); // users: User[] | undefined
const [createUser] = useCreateUserMutation();
await createUser({ name: 'John', email: 'john@example.com' }).unwrap();
```

**Benefits:**
- Catch errors at compile time
- IDE autocomplete for all fields
- Refactoring safety
- Better code documentation

---

### 6. **Conditional Fetching & Skip Pattern**

**Implementation:**
```typescript
const { data: selectedUser } = useGetUserQuery(selectedUserId!, {
  skip: !selectedUserId, // Don't fetch if ID is null
});
```

**Benefits:**
- Prevent unnecessary API calls
- Better performance
- Cleaner loading states

---

### 7. **Redux DevTools Integration**

**Features:**
- View all cached queries in real-time
- Inspect query/mutation states
- Time-travel debugging
- Track cache invalidations

**Open DevTools to see:**
```
State → api → queries → {
  'getUsers(undefined)': {
    status: 'fulfilled',
    data: [...users],
    fulfilledTimeStamp: 1234567890,
  }
}
```

---

## 🔥 Advanced Features

### Polling (Real-time Data)

```typescript
const { data } = useGetUsersQuery(undefined, {
  pollingInterval: 30000, // Refetch every 30 seconds
});
```

### Prefetching (Performance Optimization)

```typescript
// In component
const dispatch = useAppDispatch();

<button
  onMouseEnter={() => {
    dispatch(usersApi.endpoints.prefetchUser.initiate(userId));
  }}
>
  Hover to prefetch
</button>
```

### Lazy Queries (Manual Trigger)

```typescript
const [trigger, result] = useLazyGetUserQuery();

<button onClick={() => trigger(123)}>Load User</button>
```

### Manual Cache Manipulation

```typescript
// Update cache manually
dispatch(
  usersApi.util.updateQueryData('getUsers', undefined, (draft) => {
    draft.push(newUser);
  })
);

// Invalidate cache manually
dispatch(usersApi.util.invalidateTags(['Users']));
```

---

## 📊 Comparison: TanStack Query vs RTK Query

| Feature | TanStack Query | RTK Query |
|---------|----------------|-----------|
| **Cache Management** | Manual invalidation | Tag-based auto invalidation |
| **Optimistic Updates** | Manual via `onMutate` | Built-in with `onQueryStarted` |
| **DevTools** | React Query DevTools | Redux DevTools |
| **State Management** | Standalone | Integrated with Redux |
| **Bundle Size** | ~13 KB | ~20 KB (with Redux Toolkit) |
| **Learning Curve** | Lower | Higher (Redux knowledge needed) |
| **Code Splitting** | Manual | Built-in `injectEndpoints` |
| **TypeScript** | Excellent | Excellent |
| **Enterprise Scale** | Good | Better (centralized state) |
| **Normalization** | Manual | Built-in via tags |

---

## 🎓 When to Use Each

### Use **TanStack Query** When:
- Building small to medium apps
- Don't need Redux for other state
- Want lighter bundle size
- Rapid prototyping
- Team unfamiliar with Redux

### Use **RTK Query** When:
- Building large enterprise apps
- Already using Redux Toolkit
- Need centralized state management
- Complex cache relationships
- Multiple teams working on same codebase
- Need strict patterns enforcement

---

## 🚀 Running the Application

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# Open browser
http://localhost:5173

# Switch between TanStack Query and RTK Query tabs
```

---

## 📚 Key Files to Study

### RTK Query Implementation
1. **`src/store/api/baseApi.ts`** - Base API setup
2. **`src/store/api/axiosBaseQuery.ts`** - Axios integration
3. **`src/store/api/endpoints/users.api.ts`** - Endpoint definitions
4. **`src/store/store.ts`** - Redux store configuration
5. **`src/components/UsersDemoRTK.tsx`** - Component usage

### TanStack Query (Original)
1. **`src/lib/api/query-client.config.ts`** - Query client setup
2. **`src/hooks/useUsers.ts`** - Custom hooks
3. **`src/components/UsersDemo.tsx`** - Component usage

---

## 🔐 Security Best Practices

### 1. **Token Management**
```typescript
// Automatic from axios.config.ts
const token = getAuthToken();
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### 2. **Error Handling**
```typescript
// Don't expose sensitive errors to users
catch (error) {
  console.error('[Internal Error]', error); // Log for developers
  toast.error('Something went wrong'); // Generic message for users
}
```

### 3. **Input Validation**
```typescript
// Validate on both client and server
createUser: builder.mutation<User, CreateUserRequest>({
  query: (userData) => {
    // Client-side validation
    if (!userData.email.includes('@')) {
      throw new Error('Invalid email');
    }
    return { url: '/users', method: 'POST', body: userData };
  },
}),
```

---

## 🎨 Performance Optimizations

### 1. **Request Deduplication**
RTK Query automatically deduplicates identical requests:
```typescript
// Multiple components call same query - only 1 request sent
const Component1 = () => useGetUsersQuery();
const Component2 = () => useGetUsersQuery();
// → Single API call, shared cache
```

### 2. **Normalized Cache**
```typescript
// Each user cached individually by ID
providesTags: (result) =>
  result.map(({ id }) => ({ type: 'Users', id }))

// Update only affects specific user cache
invalidatesTags: [{ type: 'Users', id: 123 }]
```

### 3. **Selective Refetching**
```typescript
// Only refetch when specific tags invalidated
createUser: { invalidatesTags: [{ type: 'Users', id: 'LIST' }] }
// → Only getUsers refetches, not getUser(123)
```

---

## 📖 Additional Resources

### Official Documentation
- [RTK Query Overview](https://redux-toolkit.js.org/rtk-query/overview)
- [RTK Query Best Practices](https://redux-toolkit.js.org/rtk-query/usage/usage-guide)
- [Code Splitting](https://redux-toolkit.js.org/rtk-query/usage/code-splitting)

### Advanced Topics
- [Streaming Updates (WebSockets)](https://redux-toolkit.js.org/rtk-query/usage/streaming-updates)
- [Server-Side Rendering](https://redux-toolkit.js.org/rtk-query/usage/server-side-rendering)
- [Customizing Queries](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries)

---

## 🏆 Summary

This implementation demonstrates:

✅ **MNC-Grade Architecture** - Scalable for 1000+ endpoints
✅ **Enterprise Patterns** - Code splitting, tag invalidation, optimistic updates
✅ **TypeScript Excellence** - Full type safety end-to-end
✅ **Performance** - Request deduplication, normalized cache, selective refetch
✅ **Developer Experience** - Redux DevTools, auto-generated hooks, clear patterns
✅ **Production Ready** - Error handling, retry logic, auth integration

**Your TanStack Query implementation is already solid (8.5/10). RTK Query adds enterprise-grade features for larger teams and applications.**

---

**Questions or Issues?** Review the code comments in each file - they contain detailed explanations of every pattern used.
