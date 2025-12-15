import { useEffect, useState } from 'react';
import { getKeybindings, saveKeybindings, DEFAULT_SETTINGS, Keybindings } from '@/services/settings-store';

export type { Keybindings } from '@/services/settings-store';

export interface Settings {
  keybindings: Keybindings;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    keybindings: DEFAULT_SETTINGS.keybindings,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const keybindings = await getKeybindings();
        setSettings({ keybindings });
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Fall back to default settings
        setSettings({ keybindings: DEFAULT_SETTINGS.keybindings });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Settings) => {
    try {
      await saveKeybindings(newSettings.keybindings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  return {
    settings,
    saveSettings: updateSettings,
    isLoading,
  };
}
