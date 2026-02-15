import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemePreference, getStoredThemePreference } from '@/store/theme';

const ACTIVE_SPACE_STORAGE_KEY = 'activeSpaceId';

function getStoredActiveSpaceId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return window.localStorage.getItem(ACTIVE_SPACE_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export interface UiState {
  themePreference: ThemePreference;
  activeSpaceId: string;
  activeFileId: string | null;
}

const initialState: UiState = {
  themePreference: getStoredThemePreference(),
  activeSpaceId: getStoredActiveSpaceId(),
  activeFileId: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setThemePreference(state, action: PayloadAction<ThemePreference>) {
      state.themePreference = action.payload;
    },
    setActiveSpaceId(state, action: PayloadAction<string>) {
      state.activeSpaceId = action.payload;
    },
    setActiveFileId(state, action: PayloadAction<string | null>) {
      state.activeFileId = action.payload;
    },
  },
});

export const { setThemePreference, setActiveSpaceId, setActiveFileId } = uiSlice.actions;

export { ACTIVE_SPACE_STORAGE_KEY };
export default uiSlice.reducer;
