import { configureStore, Middleware } from '@reduxjs/toolkit';

import { appApi } from '@/store/api/app-api';
import uiReducer, {
  ACTIVE_SPACE_STORAGE_KEY,
  setActiveSpaceId,
  setThemePreference,
} from '@/store/slices/ui-slice';
import { THEME_STORAGE_KEY } from '@/store/theme';

const persistenceMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);

  if (typeof window === 'undefined') {
    return result;
  }

  if (setThemePreference.match(action)) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, action.payload);
    } catch {
      // Ignore storage write failures.
    }
  }

  if (setActiveSpaceId.match(action)) {
    try {
      if (action.payload) {
        window.localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, action.payload);
      } else {
        window.localStorage.removeItem(ACTIVE_SPACE_STORAGE_KEY);
      }
    } catch {
      // Ignore storage write failures.
    }
  }

  return result;
};

export const store = configureStore({
  reducer: {
    [appApi.reducerPath]: appApi.reducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(appApi.middleware, persistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
