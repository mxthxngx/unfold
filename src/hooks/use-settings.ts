import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

export interface Keybindings {
  toggleSidebar: string;
  selectAll: string;
}

export interface Settings {
  keybindings: Keybindings;
}

const defaultSettings: Settings = {
  keybindings: {
    toggleSidebar: 'Mod-b',
    selectAll: 'Mod-a',
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await invoke<Settings>('get_settings');
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Fall back to default settings
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async (newSettings: Settings) => {
    try {
      await invoke('save_settings', { settings: newSettings });
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  return {
    settings,
    saveSettings,
    isLoading,
  };
}
