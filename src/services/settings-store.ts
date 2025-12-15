import { LazyStore } from '@tauri-apps/plugin-store';
import { Layout, SidebarPosition } from '@/types/layout';

// Store file names
const SETTINGS_STORE_PATH = 'settings.json';

// Create a lazy-loaded store instance
const settingsStore = new LazyStore(SETTINGS_STORE_PATH);
console.log('Settings store initialized at', SETTINGS_STORE_PATH);

// Default settings values
export const DEFAULT_SETTINGS = {
  layout: {
    sidebar_position: 'left' as SidebarPosition,
  } as Layout,
  keybindings: {
    toggleSidebar: 'Mod-b',
    selectAll: 'Mod-a',
  },
};

// Settings keys
export const SETTINGS_KEYS = {
  LAYOUT: 'layout',
  KEYBINDINGS: 'keybindings',
} as const;

// Types
export interface Keybindings {
  toggleSidebar: string;
  selectAll: string;
}

export interface AppSettings {
  layout: Layout;
  keybindings: Keybindings;
}

// Layout settings functions
export async function getLayoutSettings(): Promise<Layout> {
  try {
    const layout = await settingsStore.get<Layout>(SETTINGS_KEYS.LAYOUT);
    console.log('Retrieved layout settings:', layout);
    return layout ?? DEFAULT_SETTINGS.layout;
  } catch (error) {
    console.error('Failed to get layout settings:', error);
    return DEFAULT_SETTINGS.layout;
  }
}

export async function saveLayoutSettings(layout: Layout): Promise<void> {
  try {
    await settingsStore.set(SETTINGS_KEYS.LAYOUT, layout);
    await settingsStore.save();
  } catch (error) {
    console.error('Failed to save layout settings:', error);
    throw error;
  }
}

export async function updateLayoutSettings(updates: Partial<Layout>): Promise<Layout> {
  const currentLayout = await getLayoutSettings();
  const updatedLayout = { ...currentLayout, ...updates };
  await saveLayoutSettings(updatedLayout);
  return updatedLayout;
}

// Keybindings functions
export async function getKeybindings(): Promise<Keybindings> {
  try {
    const keybindings = await settingsStore.get<Keybindings>(SETTINGS_KEYS.KEYBINDINGS);
    return keybindings ?? DEFAULT_SETTINGS.keybindings;
  } catch (error) {
    console.error('Failed to get keybindings:', error);
    return DEFAULT_SETTINGS.keybindings;
  }
}

export async function saveKeybindings(keybindings: Keybindings): Promise<void> {
  try {
    await settingsStore.set(SETTINGS_KEYS.KEYBINDINGS, keybindings);
    await settingsStore.save();
  } catch (error) {
    console.error('Failed to save keybindings:', error);
    throw error;
  }
}

// Get all settings
export async function getAllSettings(): Promise<AppSettings> {
  const [layout, keybindings] = await Promise.all([
    getLayoutSettings(),
    getKeybindings(),
  ]);
  return { layout, keybindings };
}

// Reset settings to defaults
export async function resetSettings(): Promise<void> {
  try {
    await settingsStore.set(SETTINGS_KEYS.LAYOUT, DEFAULT_SETTINGS.layout);
    await settingsStore.set(SETTINGS_KEYS.KEYBINDINGS, DEFAULT_SETTINGS.keybindings);
    await settingsStore.save();
  } catch (error) {
    console.error('Failed to reset settings:', error);
    throw error;
  }
}

// Export the store instance for advanced usage
export { settingsStore };
