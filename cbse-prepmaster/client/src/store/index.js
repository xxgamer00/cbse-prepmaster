import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './slices/authSlice';

// Create the store
const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here as we create them:
    // tests: testsReducer,
    // questions: questionsReducer,
    // results: resultsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state
        ignoredActions: ['auth/login/fulfilled', 'auth/register/fulfilled'],
        ignoredPaths: ['auth.user'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Export the store and its dispatch/state types
export const getState = store.getState;
export const dispatch = store.dispatch;

export default store;
