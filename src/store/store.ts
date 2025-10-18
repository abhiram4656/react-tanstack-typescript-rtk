/**
 * Redux Store Configuration
 *
 * Enterprise Best Practices:
 * - Centralized state management
 * - RTK Query middleware for caching and invalidation
 * - DevTools integration for debugging
 * - Type-safe hooks
 * - Performance optimizations
 *
 * MNC Standards:
 * - Scalable architecture
 * - Environment-based configurations
 * - Middleware chain organization
 * - Hot module replacement support
 */

import { configureStore } from '@reduxjs/toolkit';
import type { ConfigureStoreOptions } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './api/baseApi';

/**
 * Configure Redux Store
 *
 * Features:
 * - RTK Query reducer and middleware
 * - Redux DevTools (development only)
 * - Automatic serialization checks (development)
 * - Immutability checks (development)
 */
export const store = configureStore({
  reducer: {
    /**
     * RTK Query API reducer
     * This manages all API state, caching, and loading states
     */
    [baseApi.reducerPath]: baseApi.reducer,

    /**
     * Add other reducers here as your app grows
     * Example:
     * auth: authReducer,
     * ui: uiReducer,
     * settings: settingsReducer,
     */
  },

  /**
   * Middleware Configuration
   *
   * RTK Query middleware enables:
   * - Caching behavior
   * - Automatic refetching
   * - Polling
   * - Request deduplication
   */
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      /**
       * Serialization check - warns about non-serializable values
       * Keep enabled in development for debugging
       */
      serializableCheck: {
        // Ignore these action types for serialization check
        ignoredActions: [
          // RTK Query actions often contain non-serializable values
          'api/executeQuery/fulfilled',
          'api/executeMutation/fulfilled',
        ],
        // Ignore these paths in the state
        ignoredPaths: ['api.queries', 'api.mutations'],
      },

      /**
       * Immutability check - ensures state isn't mutated directly
       * Disable in production for performance
       */
      immutableCheck: import.meta.env.DEV,
    }).concat(baseApi.middleware),
    // Add more custom middleware here if needed
    // Example: .concat(logger, analytics, etc.)

  /**
   * Redux DevTools Configuration
   * Enable in development, disable in production
   */
  devTools: import.meta.env.DEV && {
    name: 'React HTTP App - RTK Query',
    trace: true, // Enable trace for better debugging
    traceLimit: 25,
  },

  /**
   * Enhance store with additional capabilities
   * Example: Redux Persist, Redux Observable, etc.
   */
} as ConfigureStoreOptions);

/**
 * Setup RTK Query listeners
 *
 * This enables:
 * - refetchOnFocus behavior
 * - refetchOnReconnect behavior
 * - Automatic cleanup of listeners
 */
setupListeners(store.dispatch);

/**
 * Infer types from the store itself
 * This provides type safety throughout the application
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * Export for use in main.tsx
 */
export default store;
