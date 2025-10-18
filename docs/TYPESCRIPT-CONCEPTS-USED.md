# TypeScript Concepts Used in This Project

This document provides a comprehensive overview of all TypeScript concepts used throughout the application, with detailed explanations and real-world examples from the codebase.

---

## Table of Contents

1. [Type Annotations](#1-type-annotations)
2. [Interface Declarations](#2-interface-declarations)
3. [Type Aliases](#3-type-aliases)
4. [Generic Types](#4-generic-types)
5. [Union Types](#5-union-types)
6. [Literal Types](#6-literal-types)
7. [Type Inference](#7-type-inference)
8. [Utility Types](#8-utility-types)
9. [Const Assertions](#9-const-assertions)
10. [Type Guards](#10-type-guards)
11. [Intersection Types](#11-intersection-types)
12. [Indexed Access Types](#12-indexed-access-types)
13. [Mapped Types](#13-mapped-types)
14. [Conditional Types](#14-conditional-types)
15. [Template Literal Types](#15-template-literal-types)
16. [Type Assertions](#16-type-assertions)
17. [Optional Properties](#17-optional-properties)
18. [Readonly Properties](#18-readonly-properties)
19. [Function Overloads](#19-function-overloads)
20. [Async/Promise Types](#20-asyncpromise-types)

---

## 1. Type Annotations

**What it is:** Explicitly declaring the type of variables, parameters, and return values.

**Where used:** Throughout the application

### Examples from codebase:

#### Basic Type Annotations

```typescript
// userService.ts
const API_BASE = "https://jsonplaceholder.typicode.com"; // Type inferred as string

// UsersDemo.tsx - line 11
const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
```

#### Function Parameter Type Annotations

```typescript
// userService.ts - line 59
async getUserById(id: number) {
  // id parameter explicitly typed as number
}

// http.service.ts - line 158
export function buildEndpoint(
  template: string,
  pathParams?: Record<string, string | number>
): string {
  // template: string - required string parameter
  // pathParams: optional object with string/number values
  // returns: string
}
```

#### Variable Type Annotations

```typescript
// axios.config.ts - line 19-21
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const API_TIMEOUT = 30000; // Type inferred as number
const RETRY_ATTEMPTS = 3; // Type inferred as number
```

**Why it's useful:**

- Catches errors at compile time instead of runtime
- Provides better IDE autocomplete and documentation
- Makes code self-documenting

---

## 2. Interface Declarations

**What it is:** Defining the shape/structure of objects with named types.

**Where used:** Data models, configuration objects, API responses

### Examples from codebase:

#### Complex Interface with Nested Objects

```typescript
// userService.ts - lines 13-35
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string; // Optional property
  website?: string;
  address?: {
    // Nested object
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      // Deeply nested object
      lat: string;
      lng: string;
    };
  };
  company?: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}
```

#### Interface Extension

```typescript
// http.service.ts - lines 19-24
export interface RequestOptions extends CustomAxiosRequestConfig {
  // Extends existing interface and adds new properties
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}
```

#### API Response Interfaces

```typescript
// users.api.ts - lines 26-34
interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface CreateUserRequest extends Omit<User, "id"> {}
interface UpdateUserRequest extends Partial<User> {}
interface PatchUserRequest extends Partial<User> {}
```

**Why interfaces are important:**

- Enforce consistent data structures across the application
- Enable IDE autocompletion for object properties
- Document the expected shape of data
- Can be extended and merged

---

## 3. Type Aliases

**What it is:** Creating a new name for a type (similar to interfaces but more flexible).

**Where used:** Union types, complex type definitions, tag systems

### Examples from codebase:

#### Type Alias with Indexed Access

```typescript
// baseApi.ts - lines 39
export type TagType = (typeof TAG_TYPES)[keyof typeof TAG_TYPES];
// Creates union type: 'Users' | 'User' | 'Posts' | 'Post' | 'Comments' | 'Todos'
```

#### Type Alias from Store Types

```typescript
// store.ts - lines 114-115
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Differences between Type Aliases and Interfaces:**

- Types can represent primitives, unions, tuples (interfaces cannot)
- Interfaces can be extended and merged (types cannot be merged)
- Types are generally more flexible, interfaces are better for object shapes

---

## 4. Generic Types

**What it is:** Types that work with multiple data types while maintaining type safety (like templates).

**Where used:** API functions, hooks, utility functions

### Examples from codebase:

#### Generic Functions with Multiple Type Parameters

```typescript
// http.service.ts - lines 36-52
async get<TResponse = unknown>(
  endpoint: string,
  options?: {
    params?: Record<string, any>;
    config?: RequestOptions;
  }
): Promise<AxiosResponse<TResponse>> {
  // TResponse is a generic type parameter
  // Default value is 'unknown'
}

// Usage:
const response = await httpService.get<User[]>(`${API_BASE}/users`);
// TypeScript knows response.data is User[]
```

#### Generic Function with Two Type Parameters

```typescript
// http.service.ts - lines 59-76
async post<TResponse = unknown, TBody = unknown>(
  endpoint: string,
  options?: {
    body?: TBody;      // Generic request body type
    params?: Record<string, any>;
    config?: RequestOptions;
  }
): Promise<AxiosResponse<TResponse>> {  // Generic response type
  // Can specify both request and response types
}

// Usage:
const response = await httpService.post<User, CreateUserDto>(
  '/users',
  { body: newUserData }
);
```

#### Generic RTK Query Endpoints

```typescript
// users.api.ts - lines 53
getUsers: builder.query<User[], GetUsersParams | void>({
  // Generic<ResponseType, ArgumentType>
  // Returns User[], accepts GetUsersParams or void
});

// users.api.ts - line 100
getUser: builder.query<User, number>({
  // Returns User, accepts number (id)
});
```

**Why generics are powerful:**

- Write reusable code that works with multiple types
- Maintain type safety without duplicating code
- Infer types automatically based on usage
- Essential for library and utility functions

---

## 5. Union Types

**What it is:** A type that can be one of several types (Type A OR Type B).

**Where used:** State variables, error handling, flexible parameters

### Examples from codebase:

#### Union with null

```typescript
// UsersDemo.tsx - line 11
const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
// Can be number OR null
```

#### Union in buildEndpoint function

```typescript
// http.service.ts - line 160
pathParams?: Record<string, string | number>
// Values can be string OR number
```

#### Complex Union Type

```typescript
// users.api.ts - line 53
builder.query<User[], GetUsersParams | void>;
// Second generic can be GetUsersParams OR void
```

**Practical usage:**

- Handling optional or nullable values
- Functions that accept multiple input types
- State management with multiple possible states

---

## 6. Literal Types

**What it is:** Exact values as types (not just the general type).

**Where used:** HTTP methods, tag types, configuration constants

### Examples from codebase:

#### String Literal Types in Constants

```typescript
// baseApi.ts - lines 29-37
export const TAG_TYPES = {
  USERS: "Users", // Type: 'Users' (not just string)
  USER: "User", // Type: 'User'
  POSTS: "Posts", // Type: 'Posts'
  POST: "Post", // Type: 'Post'
  COMMENTS: "Comments",
  TODOS: "Todos",
} as const; // Makes all values literal types
```

#### HTTP Method Literals

```typescript
// users.api.ts - line 56
query: (params) => ({
  url: "/users",
  method: "GET", // Literal type 'GET', not general string
});
```

**Benefits:**

- More precise type checking
- Autocomplete shows exact possible values
- Prevents typos and invalid values

---

## 7. Type Inference

**What it is:** TypeScript automatically determines types without explicit annotations.

**Where used:** Everywhere - TypeScript's smart type detection

### Examples from codebase:

#### Inferred from Function Return

```typescript
// store.ts - line 114
export type RootState = ReturnType<typeof store.getState>;
// TypeScript infers the exact state shape automatically
```

#### Inferred Generic Types

```typescript
// useUsers.ts - line 43
mutationFn: (userData: Omit<User, "id">) => userService.createUser(userData);
// TypeScript infers the return type from userService.createUser
```

#### Inferred from Default Values

```typescript
const API_TIMEOUT = 30000; // Inferred as number
const showForm = false; // Inferred as boolean
```

**Why inference matters:**

- Less verbose code
- Still maintains type safety
- Reduces boilerplate

---

## 8. Utility Types

**What it is:** Built-in TypeScript types that transform existing types.

**Where used:** Data transformation, API request/response types

### Examples from codebase:

#### `Omit<Type, Keys>` - Remove properties

```typescript
// useUsers.ts - line 43
mutationFn: (userData: Omit<User, "id">) => userService.createUser(userData);
// Creates new type from User but WITHOUT the 'id' property
// Useful for create operations where ID is auto-generated
```

#### `Partial<Type>` - Make all properties optional

```typescript
// users.api.ts - lines 33-34
interface UpdateUserRequest extends Partial<User> {}
interface PatchUserRequest extends Partial<User> {}
// All User properties become optional
// Perfect for update operations where you only send changed fields
```

#### `ReturnType<Type>` - Extract function return type

```typescript
// store.ts - lines 114-115
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
// Automatically extracts the return type of store.getState()
```

#### `Record<Keys, Type>` - Create object type with specific keys/values

```typescript
// http.service.ts - line 39
params?: Record<string, any>;
// Object with string keys and any values
// Equivalent to: { [key: string]: any }

// http.service.ts - line 160
pathParams?: Record<string, string | number>
// Object where values must be string or number
```

#### `Pick<Type, Keys>` - Select specific properties (Not directly used but similar pattern)

```typescript
// If we wanted only id and name from User:
type UserPreview = Pick<User, "id" | "name">;
```

**Common Utility Types:**

- `Partial<T>` - All properties optional
- `Required<T>` - All properties required
- `Readonly<T>` - All properties readonly
- `Pick<T, K>` - Select properties
- `Omit<T, K>` - Exclude properties
- `Record<K, T>` - Object type
- `ReturnType<T>` - Function return type
- `Parameters<T>` - Function parameters type

---

## 9. Const Assertions

**What it is:** `as const` tells TypeScript to infer the most specific type possible.

**Where used:** Constants, configuration objects, query keys

### Examples from codebase:

#### Const Assertion on Object

```typescript
// baseApi.ts - line 37
export const TAG_TYPES = {
  USERS: "Users",
  USER: "User",
  POSTS: "Posts",
  // ...
} as const;

// Without 'as const':
// Type would be { USERS: string, USER: string, ... }

// With 'as const':
// Type is { USERS: 'Users', USER: 'User', ... }
// More specific - actual literal values
```

#### Const Assertion on Query Keys

```typescript
// query-client.config.ts - lines 50-52
user: {
  all: ['users'] as const,  // Type: readonly ['users']
  profile: () => [...queryKeys.user.all, 'profile'] as const,
  byId: (id: string) => [...queryKeys.user.all, 'detail', id] as const,
}
// Ensures query keys are exact tuples, not generic arrays
```

**Benefits:**

- Creates readonly, immutable types
- Literal types instead of widened types
- Better type checking for constants
- Prevents accidental mutations

---

## 10. Type Guards

**What it is:** Functions or checks that narrow down types at runtime.

**Where used:** Error handling, conditional rendering, API response validation

### Examples from codebase:

#### Custom Type Guard Function

```typescript
// axiosBaseQuery.ts - lines 164-170
export const isApiError = (error: any): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    ("status" in error || "message" in error)
  );
};

// Usage:
if (isApiError(error)) {
  // TypeScript knows error is ApiError here
  console.log(error.status);
  console.log(error.message);
}
```

#### Built-in Type Guards

```typescript
// axios.config.ts - lines 66-74
const authData = localStorage.getItem("Auth");
if (!authData) return null; // null check

const parsed = JSON.parse(authData);
// Type narrowing through conditional checks
```

**Why type guards are essential:**

- Safe runtime type checking
- Better error handling
- TypeScript understands type narrowing
- Prevents runtime errors

---

## 11. Intersection Types

**What it is:** Combining multiple types into one (Type A AND Type B).

**Where used:** Extending types, combining configurations

### Examples from codebase:

#### Intersection in Type Assertion

```typescript
// axios.config.ts - line 84
const customConfig = config as InternalAxiosRequestConfig &
  CustomAxiosRequestConfig;
// Combines InternalAxiosRequestConfig AND CustomAxiosRequestConfig
// Has all properties from both types
```

**Difference from Union:**

- Union (`A | B`): Value can be A **OR** B
- Intersection (`A & B`): Value must have properties from A **AND** B

---

## 12. Indexed Access Types

**What it is:** Accessing a property type from another type using bracket notation.

**Where used:** Extracting types from objects, deriving types

### Examples from codebase:

```typescript
// baseApi.ts - line 39
export type TagType = (typeof TAG_TYPES)[keyof typeof TAG_TYPES];

// Breaking it down:
// 1. typeof TAG_TYPES - Get the type of the object
// 2. keyof typeof TAG_TYPES - Get union of all keys: 'USERS' | 'USER' | 'POSTS' | ...
// 3. [keyof typeof TAG_TYPES] - Get all property values: 'Users' | 'User' | 'Posts' | ...
```

**Real-world example:**

```typescript
interface Person {
  name: string;
  age: number;
  email: string;
}

type PersonName = Person["name"]; // Type: string
type PersonAge = Person["age"]; // Type: number
type PersonKeys = Person["name" | "age"]; // Type: string | number
```

---

## 13. Mapped Types

**What it is:** Creating new types by transforming properties of existing types.

**Where used:** Generic transformations, utility type implementations

### Examples from codebase:

#### Implicit Mapped Type (through utility types)

```typescript
// users.api.ts - line 33
interface UpdateUserRequest extends Partial<User> {}

// Partial is defined as:
type Partial<T> = {
  [P in keyof T]?: T[P]; // This is a mapped type
};
// Iterates over all keys of T and makes them optional
```

**Custom mapped type example:**

```typescript
// Convert all properties to string
type StringifyUser = {
  [K in keyof User]: string;
};

// Make all properties readonly
type ReadonlyUser = {
  readonly [K in keyof User]: User[K];
};
```

---

## 14. Conditional Types

**What it is:** Types that depend on a condition (like ternary operators for types).

**Where used:** Complex type transformations, utility types

### Examples from codebase:

#### Conditional Type in Generic Defaults

```typescript
// http.service.ts - line 36
async get<TResponse = unknown>(...)

// BaseQueryFn uses conditional types internally
type BaseQueryFn<Args, Result, Error> =
  Args extends void
    ? () => Promise<Result>
    : (args: Args) => Promise<Result>;
```

**Custom conditional type example:**

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // Type: true
type B = IsString<number>; // Type: false
```

---

## 15. Template Literal Types

**What it is:** Creating string literal types using template strings.

**Where used:** Creating dynamic string types, API endpoints

### Examples from codebase:

While not heavily used in current code, template literals are powerful for:

```typescript
// Example: Creating HTTP method types
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
type APIEndpoint = `/api/${string}`;

type APICall = `${HTTPMethod} ${APIEndpoint}`;
// Results in: 'GET /api/...' | 'POST /api/...' | etc.

// Real use case: Query key types
type UserQueryKey = `users/${number}`; // 'users/1', 'users/2', etc.
```

---

## 16. Type Assertions

**What it is:** Telling TypeScript to treat a value as a specific type.

**Where used:** When you know more about a type than TypeScript does

### Examples from codebase:

#### `as` Assertion

```typescript
// UsersDemo.tsx - line 70
<p className="text-red-800">Error: {(error as Error).message}</p>;
// Asserting error is of type Error

// UsersDemoRTK.tsx - line 194
{
  (error as any)?.message || "Failed to fetch users";
}
// Asserting as 'any' to access any property (use sparingly!)
```

#### Type Assertion in Config

```typescript
// http.service.ts - line 51
meta: {
  showToast: options?.config?.showSuccessToast ?? false,
  silent: options?.config?.showErrorToast === false,
  ...options?.config?.meta,
},
} as CustomAxiosRequestConfig);
```

**When to use:**

- DOM manipulation (e.g., `document.getElementById('btn') as HTMLButtonElement`)
- API responses where you know the shape
- Library integration with incomplete types

**Caution:**

- Use sparingly - bypasses type checking
- Prefer type guards when possible
- `as any` should be last resort

---

## 17. Optional Properties

**What it is:** Properties that may or may not exist on an object.

**Where used:** Data models, API responses, configuration objects

### Examples from codebase:

#### Optional Properties in Interface

```typescript
// userService.ts - lines 18-35
export interface User {
  id: number; // Required
  name: string; // Required
  username: string; // Required
  email: string; // Required
  phone?: string; // Optional - may be undefined
  website?: string; // Optional
  address?: {
    // Optional nested object
    street: string;
    suite: string;
    // ...
  };
  company?: {
    name: string;
    // ...
  };
}
```

#### Optional Function Parameters

```typescript
// userService.ts - line 44
async getUsers(params?: { page?: number; limit?: number; search?: string }) {
  // params is optional
  // if provided, page, limit, and search are also optional
}

// http.service.ts - line 160
pathParams?: Record<string, string | number>
// pathParams parameter is optional
```

#### Optional Chaining in Code

```typescript
// UsersDemo.tsx - line 80
Users Management ({users?.length || 0} users)
// Uses optional chaining - safe even if users is undefined

// UsersDemoRTK.tsx - line 194
{(error as any)?.message || 'Failed to fetch users'}
// Safe property access with fallback
```

---

## 18. Readonly Properties

**What it is:** Properties that cannot be modified after initialization.

**Where used:** Immutable data, constants, configuration

### Examples from codebase:

#### Readonly through const assertion

```typescript
// query-client.config.ts - line 50
all: ['users'] as const,
// Creates readonly array: readonly ['users']
// Cannot modify: queryKeys.user.all[0] = 'posts' ❌

// baseApi.ts - line 37
export const TAG_TYPES = {
  USERS: 'Users',
  USER: 'User',
} as const;
// All properties become readonly
```

#### Explicit readonly in types

```typescript
// While not explicitly used, readonly can be:
interface ReadonlyUser {
  readonly id: number;
  readonly email: string;
  name: string; // Can be modified
}

const user: ReadonlyUser = { id: 1, email: "test@test.com", name: "John" };
user.name = "Jane"; // ✅ OK
user.id = 2; // ❌ Error: Cannot assign to 'id' because it is read-only
```

**Benefits:**

- Prevents accidental mutations
- Makes intent clear
- Helps with immutability patterns (important in React/Redux)

---

## 19. Function Overloads

**What it is:** Multiple function signatures for the same function.

**Where used:** While not explicitly used in this codebase, it's a valuable TypeScript feature

### Example of what could be added:

```typescript
// Example: buildEndpoint with overloads
function buildEndpoint(template: string): string;
function buildEndpoint(
  template: string,
  params: Record<string, string | number>
): string;
function buildEndpoint(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  // ... implementation
}

// Usage with different signatures:
const endpoint1 = buildEndpoint("/users"); // Uses first overload
const endpoint2 = buildEndpoint("/users/:id", { id: 123 }); // Uses second overload
```

---

## 20. Async/Promise Types

**What it is:** Typing asynchronous operations and promises.

**Where used:** All API calls, async functions

### Examples from codebase:

#### Async Function Return Types

```typescript
// userService.ts - line 44-52
async getUsers(params?: { page?: number; limit?: number; search?: string }) {
  const response = await httpService.get<User[]>(`${API_BASE}/users`, {
    params,
    // ...
  });
  return response.data;  // Returns Promise<User[]>
}
// TypeScript infers return type as Promise<User[]>
```

#### Explicit Promise Types

```typescript
// http.service.ts - line 42
): Promise<AxiosResponse<TResponse>> {
  // Explicit Promise return type
}

// axiosBaseQuery.ts - line 67
): BaseQueryFn<ExtendedAxiosRequestConfig, unknown, ApiError> => {
  return async ({ url, method = 'GET', body, params, meta, ...rest }) => {
    // Returns Promise implicitly
  };
}
```

#### Promise Unwrapping in Mutations

```typescript
// useUsers.ts - line 43
mutationFn: (userData: Omit<User, 'id'>) => userService.createUser(userData),
// createUser returns Promise<User>
// mutationFn automatically handles the Promise

// UsersDemoRTK.tsx - line 101-106
const newUser = await createUser({
  name: 'John Doe',
  username: 'johndoe',
  email: 'john@example.com',
}).unwrap();  // unwrap() gets data from Promise
```

#### Generic Promise Types

```typescript
// All HTTP methods return Promise<AxiosResponse<TResponse>>
async get<TResponse = unknown>(): Promise<AxiosResponse<TResponse>>
async post<TResponse = unknown, TBody = unknown>(): Promise<AxiosResponse<TResponse>>
async put<TResponse = unknown, TBody = unknown>(): Promise<AxiosResponse<TResponse>>
```

---

## Advanced TypeScript Patterns Used

### 1. **Type-Safe Query Keys**

```typescript
// query-client.config.ts - lines 47-85
export const queryKeys = {
  user: {
    all: ["users"] as const,
    byId: (id: string) => [...queryKeys.user.all, "detail", id] as const,
  },
};
// Ensures query keys are consistent and type-safe
```

### 2. **Discriminated Unions** (Potential usage)

```typescript
// Not currently used but could be for error handling:
type ApiResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: string };

function handleResponse<T>(response: ApiResponse<T>) {
  if (response.status === "success") {
    // TypeScript knows response.data exists
  } else {
    // TypeScript knows response.error exists
  }
}
```

### 3. **Strict Null Checks**

```typescript
// Throughout the codebase with optional chaining and nullish coalescing
users?.length || 0;
options?.config?.showSuccessToast ?? false;
```

### 4. **Module Augmentation** (Axios)

```typescript
// axios.config.ts - lines 26-33
export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  meta?: {
    showToast?: boolean;
    silent?: boolean;
    skipAuth?: boolean;
    successMessage?: string;
  };
}
// Extends existing Axios types with custom properties
```

---

## Summary of TypeScript Proficiency Demonstrated

This codebase demonstrates **advanced TypeScript usage** with:

1. **Type Safety**: Strong typing throughout (minimal use of `any`)
2. **Generic Programming**: Reusable type-safe functions and hooks
3. **Advanced Type Manipulation**: Utility types, mapped types, indexed access types
4. **Type Inference**: Leverages TypeScript's inference to reduce boilerplate
5. **Type Guards**: Runtime type checking with type predicates
6. **Module System**: Proper import/export with type-only imports
7. **Integration**: TypeScript integrated with React Query, RTK Query, Axios
8. **Best Practices**: Const assertions, readonly types, strict null checks
9. **Enterprise Patterns**: Centralized types, type factories, reusable generics

---

## References and Further Learning

- **Official TypeScript Documentation**: https://www.typescriptlang.org/docs/
- **TypeScript Deep Dive**: https://basarat.gitbook.io/typescript/
- **React TypeScript Cheatsheet**: https://react-typescript-cheatsheet.netlify.app/
- **Utility Types Reference**: https://www.typescriptlang.org/docs/handbook/utility-types.html
- **Advanced Types**: https://www.typescriptlang.org/docs/handbook/2/types-from-types.html

---

## Project-Specific TypeScript Configuration

See `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json` for compiler options and strictness settings used in this project.

## IGNORE THIS

---

TypeScript Proficiency Rating: ADVANCED (4.5/5)

Detailed Assessment:

Your TypeScript usage demonstrates ADVANCED level proficiency. Here's the breakdown:

Strengths:

1. Advanced Generic Programming (Advanced Level)


    - Multi-parameter generics (<TResponse, TBody>)
    - Generic constraints and defaults
    - Proper use in HTTP service layer and RTK Query

2. Utility Types Mastery (Advanced Level)


    - Excellent use of Omit, Partial, Record, ReturnType
    - Proper application for API request/response types
    - Type transformations for different use cases

3. Type Inference (Advanced Level)


    - Smart use of type inference to reduce boilerplate
    - Let TypeScript do the work while maintaining safety
    - Proper use of ReturnType for derived types

4. Module Integration (Advanced Level)


    - Seamless TypeScript integration with RTK Query, TanStack Query, Axios
    - Custom type extensions (CustomAxiosRequestConfig)
    - Type-safe hooks and store configuration

5. Advanced Type Patterns (Advanced Level)


    - Const assertions for literal types
    - Indexed access types with typeof and keyof
    - Type guards with type predicates
    - Interface extension patterns

6. Type Safety (Advanced Level)


    - Minimal use of any (only where necessary)
    - Optional chaining and nullish coalescing
    - Strict typing throughout the application

Areas for Further Growth (to reach Expert 5/5):

1. Discriminated Unions


    - Could use tagged unions for API response handling
    - Would improve error state management

2. Template Literal Types


    - Could use for route typing and query key generation
    - More advanced string manipulation at type level

3. Conditional Types


    - Could create more sophisticated type transformations
    - Useful for complex utility type creation

4. Branded Types


    - For creating distinct types from primitives (e.g., UserId, Email)
    - Prevents mixing different ID types

5. Variance Annotations (TypeScript 4.7+)


    - Using in and out for better generic type variance

What Places You at Advanced Level:

1. You're using generics with multiple parameters effectively
2. You extend and transform types using utility types correctly
3. You implement type-safe patterns across complex integrations (Redux, React Query, Axios)
4. You use advanced type manipulation (indexed access, const assertions)
5. You create reusable, type-safe abstractions (http service, base query)
6. You demonstrate understanding of type inference and when to be explicit
7. You implement enterprise patterns with proper typing

Comparison by Level:

- Beginner: Basic types, interfaces, simple generics
- Intermediate: Good use of utility types, unions, type guards
- Above Intermediate: Generics with constraints, mapped types, conditional types
- Advanced (You are here): Multi-parameter generics, type transformations, complex type patterns, minimal any usage
- Expert: Custom advanced utility types, heavy use of conditional types, branded types, complete type safety without any any
