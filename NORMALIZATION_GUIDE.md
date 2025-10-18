# Data Normalization Guide - TanStack Query vs RTK Query

## 📖 **What is Normalization?**

**Normalization** is storing each unique piece of data **once** and referencing it by ID, like a database.

### **Database Analogy**

```sql
-- Normalized Database Tables
Users Table:
| id | name    | email              |
|----|---------|-------------------|
| 1  | Alice   | alice@example.com |
| 2  | Bob     | bob@example.com   |

Orders Table:
| id  | userId | total |
|-----|--------|-------|
| 101 | 1      | 250   |  ← References user by ID
| 102 | 2      | 100   |
```

Same concept in frontend caching!

---

## ❌ **Problem: Without Normalization**

### **Scenario: Social Media App**

```typescript
// API: Fetch posts with user info
[
  {
    id: 1,
    content: "Hello World",
    author: { id: 5, name: "Alice", avatar: "alice.jpg" }  // ← User data embedded
  },
  {
    id: 2,
    content: "React is awesome",
    author: { id: 5, name: "Alice", avatar: "alice.jpg" }  // ← DUPLICATE!
  },
  {
    id: 3,
    content: "Love coding",
    author: { id: 5, name: "Alice", avatar: "alice.jpg" }  // ← DUPLICATE!
  }
]

// API: Fetch user profile
{
  id: 5,
  name: "Alice",
  avatar: "alice.jpg",  // ← SAME DATA, 4th copy!
  bio: "Developer"
}
```

### **Issues:**

1. **Memory Waste** - Alice's data stored 4 times
2. **Update Complexity** - Change avatar → update 4 places
3. **Consistency Bugs** - Easy to have mismatched data
4. **Network Waste** - Refetch entire posts list to update one user

---

## ✅ **Solution: Normalized Cache**

```typescript
// Normalized State
{
  entities: {
    users: {
      5: { id: 5, name: "Alice", avatar: "alice.jpg", bio: "Developer" }  // ← Stored ONCE
    },
    posts: {
      1: { id: 1, content: "Hello World", authorId: 5 },  // ← Just ID reference
      2: { id: 2, content: "React is awesome", authorId: 5 },
      3: { id: 3, content: "Love coding", authorId: 5 }
    }
  }
}

// Component reads:
const post = entities.posts[1];
const author = entities.users[post.authorId];  // ← Lookup by ID
```

### **Benefits:**

✅ **Single Source of Truth** - One place to update
✅ **Memory Efficient** - No duplicates
✅ **Easy Updates** - Change user once, reflects everywhere
✅ **Consistent Data** - Impossible to have stale copies
✅ **Less Refetching** - Update in place, no network calls

---

## 🎯 **When to Normalize**

### **✅ Use Normalization When:**

| Scenario | Example |
|----------|---------|
| **Shared Entities Across Queries** | User appears in posts, comments, orders |
| **Frequent Updates** | Real-time chat, collaborative editing |
| **Large Datasets** | 1000+ items with relationships |
| **Complex Relationships** | Posts → Users → Comments → Likes |
| **Write-Heavy Apps** | Social media, dashboards, admin panels |

### **❌ Skip Normalization When:**

| Scenario | Example |
|----------|---------|
| **Simple CRUD** | Basic forms, independent resources |
| **Read-Only Data** | Documentation, static content |
| **No Relationships** | Flat lists without nested data |
| **Small Scale** | <100 items, simple app |
| **Rare Updates** | Historical data, reports |

---

## 📊 **Normalization in TanStack Query**

TanStack Query **does NOT have built-in normalization**. You must implement it manually.

### **Approach: Custom Normalization Layer**

#### **Step 1: Create Normalization Utilities**

```typescript
// src/lib/normalization/schema.ts
import { schema, normalize, denormalize } from 'normalizr';

// Define schemas
const userSchema = new schema.Entity('users');
const postSchema = new schema.Entity('posts', {
  author: userSchema,  // Nested user
});

export const postListSchema = [postSchema];
```

#### **Step 2: Normalize API Responses**

```typescript
// src/services/postService.ts
import { normalize } from 'normalizr';
import { postListSchema } from '../lib/normalization/schema';

export const postService = {
  async getPosts() {
    const response = await httpService.get('/posts');

    // Normalize response
    const normalized = normalize(response.data, postListSchema);

    // Returns:
    // {
    //   entities: {
    //     users: { 5: { id: 5, name: 'Alice', ... } },
    //     posts: { 1: { id: 1, authorId: 5, ... }, ... }
    //   },
    //   result: [1, 2, 3]  // Post IDs
    // }

    return normalized;
  }
};
```

#### **Step 3: Store in Global State**

```typescript
// src/store/entitiesStore.ts (Zustand example)
import { create } from 'zustand';

interface EntitiesState {
  users: Record<number, User>;
  posts: Record<number, Post>;
  mergeEntities: (entities: any) => void;
}

export const useEntitiesStore = create<EntitiesState>((set) => ({
  users: {},
  posts: {},

  mergeEntities: (entities) => set((state) => ({
    users: { ...state.users, ...entities.users },
    posts: { ...state.posts, ...entities.posts },
  })),
}));
```

#### **Step 4: Use in TanStack Query**

```typescript
// src/hooks/usePosts.ts
import { useQuery } from '@tanstack/react-query';
import { postService } from '../services/postService';
import { useEntitiesStore } from '../store/entitiesStore';

export const usePosts = () => {
  const mergeEntities = useEntitiesStore((state) => state.mergeEntities);

  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const normalized = await postService.getPosts();

      // Store normalized entities globally
      mergeEntities(normalized.entities);

      // Return just IDs for this query
      return normalized.result;
    },
  });
};
```

#### **Step 5: Read Normalized Data**

```typescript
// src/components/PostList.tsx
import { usePosts } from '../hooks/usePosts';
import { useEntitiesStore } from '../store/entitiesStore';

export default function PostList() {
  const { data: postIds } = usePosts();  // [1, 2, 3]
  const posts = useEntitiesStore((state) => state.posts);
  const users = useEntitiesStore((state) => state.users);

  return (
    <div>
      {postIds?.map((id) => {
        const post = posts[id];
        const author = users[post.authorId];

        return (
          <div key={id}>
            <p>{post.content}</p>
            <span>by {author.name}</span>
          </div>
        );
      })}
    </div>
  );
}
```

### **TanStack Query Normalization Summary**

| Aspect | Implementation |
|--------|----------------|
| **Built-in Support** | ❌ No |
| **Complexity** | High (manual setup) |
| **Libraries Needed** | `normalizr`, `zustand`/`redux` |
| **Cache Updates** | Manual `mergeEntities()` |
| **Best For** | Advanced use cases only |

---

## 🔥 **Normalization in RTK Query**

RTK Query has **semi-built-in normalization** via `createEntityAdapter`.

### **Approach: Entity Adapter Pattern**

#### **Step 1: Create Entity Adapter**

```typescript
// src/store/api/endpoints/posts.api.ts
import { createEntityAdapter } from '@reduxjs/toolkit';
import { baseApi } from '../baseApi';

// Create adapter for normalized storage
const postsAdapter = createEntityAdapter<Post>({
  selectId: (post) => post.id,
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

const usersAdapter = createEntityAdapter<User>();
```

#### **Step 2: Define Normalized Endpoints**

```typescript
export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => '/posts',

      // Transform response to normalized structure
      transformResponse: (response: PostWithAuthor[]) => {
        // Extract users from posts
        const users = response.map((post) => post.author);
        const posts = response.map((post) => ({
          ...post,
          authorId: post.author.id,  // Replace nested object with ID
          author: undefined,  // Remove nested object
        }));

        return {
          posts: postsAdapter.setAll(
            postsAdapter.getInitialState(),
            posts
          ),
          users: usersAdapter.setAll(
            usersAdapter.getInitialState(),
            users
          ),
        };
      },

      providesTags: (result) => [
        { type: 'Posts', id: 'LIST' },
        ...(result?.posts.ids.map((id) => ({ type: 'Posts' as const, id })) || []),
      ],
    }),

    updatePost: builder.mutation({
      query: ({ id, data }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: data,
      }),

      // Optimistic update with normalization
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
            // Update using adapter methods
            postsAdapter.updateOne(draft.posts, {
              id,
              changes: data,
            });
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },

      invalidatesTags: (result, error, { id }) => [
        { type: 'Posts', id },
      ],
    }),
  }),
});
```

#### **Step 3: Create Selectors**

```typescript
// src/store/api/endpoints/posts.api.ts (continued)

// Get selectors from adapter
const postsSelectors = postsAdapter.getSelectors();
const usersSelectors = usersAdapter.getSelectors();

// Custom hook to read normalized data
export const usePost = (postId: number) => {
  const { data } = useGetPostsQuery();

  if (!data) return null;

  const post = postsSelectors.selectById(data.posts, postId);
  const author = post ? usersSelectors.selectById(data.users, post.authorId) : null;

  return post && author ? { ...post, author } : null;
};
```

#### **Step 4: Use in Components**

```typescript
// src/components/PostList.tsx
import { useGetPostsQuery, useUpdatePostMutation } from '../store/api/endpoints/posts.api';

export default function PostList() {
  const { data, isLoading } = useGetPostsQuery();
  const [updatePost] = useUpdatePostMutation();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.posts.ids.map((id) => {
        const post = data.posts.entities[id];
        const author = data.users.entities[post.authorId];

        return (
          <div key={id}>
            <p>{post.content}</p>
            <span>by {author.name}</span>
            <button onClick={() => updatePost({ id, data: { content: 'Updated!' } })}>
              Edit
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

### **Advanced: Full Normalization with Denormalization**

```typescript
// src/store/slices/entitiesSlice.ts
import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import { postsApi } from '../api/endpoints/posts.api';

const usersAdapter = createEntityAdapter<User>();
const postsAdapter = createEntityAdapter<Post>();

const entitiesSlice = createSlice({
  name: 'entities',
  initialState: {
    users: usersAdapter.getInitialState(),
    posts: postsAdapter.getInitialState(),
  },
  reducers: {},
  extraReducers: (builder) => {
    // Listen to API responses and merge into entities
    builder.addMatcher(
      postsApi.endpoints.getPosts.matchFulfilled,
      (state, action) => {
        usersAdapter.upsertMany(state.users, action.payload.users);
        postsAdapter.setAll(state.posts, action.payload.posts);
      }
    );
  },
});

export default entitiesSlice.reducer;
```

### **RTK Query Normalization Summary**

| Aspect | Implementation |
|--------|----------------|
| **Built-in Support** | ✅ Yes (via `createEntityAdapter`) |
| **Complexity** | Medium |
| **Libraries Needed** | None (built into RTK) |
| **Cache Updates** | Auto via adapter methods |
| **Best For** | Large-scale apps with relationships |

---

## 📊 **Comparison Table**

| Feature | TanStack Query | RTK Query |
|---------|----------------|-----------|
| **Built-in Normalization** | ❌ No | ✅ Yes (`createEntityAdapter`) |
| **Setup Complexity** | High (manual) | Medium (semi-automatic) |
| **External Libraries** | `normalizr`, state manager | None needed |
| **Performance** | Fast (if done right) | Fast (optimized by RTK) |
| **Type Safety** | Manual typing | Auto-inferred types |
| **Update Logic** | Manual merge | Adapter methods (`upsertMany`, `updateOne`) |
| **Best Use Case** | Simple apps (skip it) | Complex apps with relationships |

---

## 🎯 **Real-World Example: E-commerce App**

### **Without Normalization**

```typescript
// Product list includes seller info
products = [
  { id: 1, name: 'Laptop', price: 1000, seller: { id: 5, name: 'TechStore', rating: 4.5 } },
  { id: 2, name: 'Mouse', price: 50, seller: { id: 5, name: 'TechStore', rating: 4.5 } },
  { id: 3, name: 'Keyboard', price: 100, seller: { id: 5, name: 'TechStore', rating: 4.5 } },
]

// Seller page shows same data
seller = { id: 5, name: 'TechStore', rating: 4.5, products: [...] }

// Problem: Seller data duplicated 4 times!
// If rating changes → need to refetch products AND seller page
```

### **With Normalization**

```typescript
// Normalized state
{
  entities: {
    sellers: {
      5: { id: 5, name: 'TechStore', rating: 4.5 }  // ← Stored ONCE
    },
    products: {
      1: { id: 1, name: 'Laptop', price: 1000, sellerId: 5 },
      2: { id: 2, name: 'Mouse', price: 50, sellerId: 5 },
      3: { id: 3, name: 'Keyboard', price: 100, sellerId: 5 }
    }
  }
}

// Update seller rating
entities.sellers[5].rating = 5.0;

// ✅ Product list shows new rating (same reference)
// ✅ Seller page shows new rating (same reference)
// ❌ NO refetch needed!
```

---

## 🚀 **Implementation Recommendation**

### **For Your Current Project:**

**TanStack Query:**
- ❌ **Don't normalize** unless you have 500+ related entities
- ✅ Current tag-based invalidation is sufficient
- ✅ Keep it simple and maintainable

**RTK Query:**
- ⚠️ **Consider normalization** if you add:
  - Posts with authors
  - Orders with products and sellers
  - Comments with users
  - Any deeply nested relationships
- ✅ Use `createEntityAdapter` for clean implementation
- ✅ Worth it for apps with 10+ related entity types

---

## 📚 **Further Reading**

### **Libraries:**
- [normalizr](https://github.com/paularmstrong/normalizr) - Normalization utility
- [RTK Entity Adapters](https://redux-toolkit.js.org/api/createEntityAdapter) - Official RTK normalization

### **Articles:**
- [Redux Normalization Patterns](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape)
- [When to Normalize](https://kentcdodds.com/blog/application-state-management-with-react)

---

## 💡 **Key Takeaways**

1. **Normalization = Database-like cache** - Store data once by ID
2. **Problem it solves:** Data duplication, update complexity, consistency bugs
3. **TanStack Query:** Manual normalization (rarely worth it)
4. **RTK Query:** Semi-automatic via `createEntityAdapter` (easier)
5. **When to use:** Large apps with relationships, frequent updates
6. **When to skip:** Simple CRUD, independent resources, small scale
7. **Your code:** Already excellent without normalization for 95% of use cases

**Don't normalize unless you need it - premature optimization is the root of all evil!** 🎓
