import { useCallback } from 'react';

import { DEFAULT_SETTINGS, Keybindings } from '@/core/services/settings-store';
import {
  useGetKeybindingsQuery,
  useUpdateKeybindingsMutation,
} from '@/core/store/api/app-api';

export type { Keybindings } from '@/core/services/settings-store';

export interface Settings {
  keybindings: Keybindings;
}

export function useSettings() {
  const {
    data: keybindings = DEFAULT_SETTINGS.keybindings,
    isLoading,
  } = useGetKeybindingsQuery();

  const [updateKeybindingsMutation] = useUpdateKeybindingsMutation();

  const saveSettings = useCallback(
    async (newSettings: Settings) => {
      await updateKeybindingsMutation(newSettings.keybindings).unwrap();
    },
    [updateKeybindingsMutation],
  );

  return {
    settings: { keybindings },
    saveSettings,
    isLoading,
  };
}
