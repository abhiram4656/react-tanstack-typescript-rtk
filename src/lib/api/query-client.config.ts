/**
 * TanStack Query (React Query) Configuration
 *
 * Centralized configuration for data fetching, caching, and state management
 */

import { QueryClient } from '@tanstack/react-query';
import type { DefaultOptions } from '@tanstack/react-query';

/**
 * Default query options for all queries
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Refetch on window focus (useful for keeping data fresh)
    refetchOnWindowFocus: false,

    // Refetch on reconnect
    refetchOnReconnect: true,

    // Retry failed requests
    retry: 1,

    // Stale time - how long data is considered fresh (5 minutes)
    staleTime: 5 * 60 * 1000,

    // Cache time - how long unused data stays in cache (10 minutes)
    gcTime: 10 * 60 * 1000,
  },
  mutations: {
    // Retry failed mutations
    retry: 1,
  },
};

/**
 * Create and export QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

/**
 * Query Keys Factory
 * Centralized query keys for better organization and type safety
 */
export const queryKeys = {
  // User related queries
  user: {
    all: ['users'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    byId: (id: string) => [...queryKeys.user.all, 'detail', id] as const,
  },

  // Property related queries
  property: {
    all: ['properties'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.property.all, 'list', filters] as const,
    byId: (id: string) => [...queryKeys.property.all, 'detail', id] as const,
    explore: (params?: Record<string, any>) =>
      [...queryKeys.property.all, 'explore', params] as const,
  },

  // Favorites
  favorites: {
    all: ['favorites'] as const,
    list: () => [...queryKeys.favorites.all, 'list'] as const,
  },

  // Tours
  tours: {
    all: ['tours'] as const,
    list: () => [...queryKeys.tours.all, 'list'] as const,
    byListing: (listingId: string) =>
      [...queryKeys.tours.all, 'listing', listingId] as const,
  },

  // Geo/Map queries
  geo: {
    all: ['geo'] as const,
    search: (query: string) => [...queryKeys.geo.all, 'search', query] as const,
    cluster: (bounds?: Record<string, any>) =>
      [...queryKeys.geo.all, 'cluster', bounds] as const,
  },
};

export default queryClient;
