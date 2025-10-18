/**
 * Redux Typed Hooks
 *
 * Enterprise Best Practice:
 * - Pre-typed hooks for better TypeScript support
 * - Prevents repetitive type assertions
 * - Single source of truth for hook types
 *
 * MNC Standard:
 * - Type safety throughout the application
 * - Consistent hook usage patterns
 * - Better IDE autocomplete and error checking
 */

import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Pre-typed useDispatch hook
 *
 * Use throughout the app instead of plain `useDispatch`
 * This ensures dispatch has the correct type and TypeScript knows
 * about all available actions
 *
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(someAction());
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Pre-typed useSelector hook
 *
 * Use throughout the app instead of plain `useSelector`
 * This provides autocomplete for the state shape and catches type errors
 *
 * @example
 * const users = useAppSelector((state) => state.api.queries['getUsers(undefined)']?.data);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Export for convenience
 * Allows importing both hooks from one place
 */
export default {
  useAppDispatch,
  useAppSelector,
};
