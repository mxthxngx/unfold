/**
 * Centralized keyboard shortcuts configuration
 * All keyboard shortcuts should be defined here to maintain consistency
 */

export const KEYBOARD_SHORTCUTS = {
  // File operations
  CREATE_FILE: "CmdOrCtrl+N",
  DELETE_NOTE: "CmdOrCtrl+Backspace",
  
  // Navigation / search
  FIND_IN_PAGE: "CmdOrCtrl+F",
  TOGGLE_SIDEBAR: "CmdOrCtrl+B",
  
  // Add more shortcuts as needed
  // SAVE: "CmdOrCtrl+S",
} as const;

/**
 * Display format for keyboard shortcuts (for tooltips/UI)
 */
export const getShortcutDisplay = (shortcut: string): string => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  return shortcut
    .replace(/CmdOrCtrl/g, isMac ? '⌘' : 'Ctrl')
    .replace(/Cmd/g, '⌘')
    .replace(/Ctrl/g, 'Ctrl')
    .replace(/Alt/g, isMac ? '⌥' : 'Alt')
    .replace(/Shift/g, isMac ? '⇧' : 'Shift')
    .replace(/\+/g, isMac ? '' : '+');
};
