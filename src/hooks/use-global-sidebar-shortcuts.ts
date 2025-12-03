import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { KEYBOARD_SHORTCUTS } from '@/config/keyboard-shortcuts';

/**
 * Parse accelerator string to key event properties
 */
const parseAccelerator = (accelerator: string) => {
  const parts = accelerator.split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  
  return {
    key: key.toLowerCase(),
    requiresCmdOrCtrl: modifiers.includes('CmdOrCtrl') || modifiers.includes('Cmd') || modifiers.includes('Ctrl'),
    requiresAlt: modifiers.includes('Alt'),
    requiresShift: modifiers.includes('Shift'),
  };
};

/**
 * Global keyboard shortcuts for sidebar operations
 */
export function useGlobalSidebarShortcuts() {
  const { fileId } = useParams({ strict: false });
  const { addNode, deleteNode } = useFileSystem();
  const navigate = useNavigate();

  useEffect(() => {
    const createChildShortcut = parseAccelerator(KEYBOARD_SHORTCUTS.CREATE_CHILD_NOTE);
    const deleteShortcut = parseAccelerator(KEYBOARD_SHORTCUTS.DELETE_NOTE);

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isAlt = event.altKey;
      const isShift = event.shiftKey;

      // Create child note shortcut
      if (
        event.key.toLowerCase() === createChildShortcut.key &&
        (!createChildShortcut.requiresCmdOrCtrl || isCmdOrCtrl) &&
        (!createChildShortcut.requiresAlt || isAlt) &&
        (!createChildShortcut.requiresShift || isShift)
      ) {
        event.preventDefault();
        // If there's a current file, add as child; otherwise add to root
        const newId = addNode(fileId || null);
        navigate({ to: '/files/$fileId', params: { fileId: newId } });
        return;
      }

      // Delete note shortcut
      if (
        fileId &&
        event.key.toLowerCase() === deleteShortcut.key.toLowerCase() &&
        (!deleteShortcut.requiresCmdOrCtrl || isCmdOrCtrl) &&
        (!deleteShortcut.requiresAlt || isAlt) &&
        (!deleteShortcut.requiresShift || isShift)
      ) {
        event.preventDefault();
        deleteNode(fileId);
        navigate({ to: '/' });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileId, addNode, deleteNode, navigate]);
}
