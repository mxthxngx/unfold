import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditorContext } from '@/contexts/EditorContext';
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
export function  useGlobalSidebarShortcuts() {
  const { fileId } = useParams({ strict: false });
  const { addNode, deleteNode, togglePinNode } = useFileSystem();
  const { pageEditorRef, titleEditorRef } = useEditorContext();
  const navigate = useNavigate();

  /**
   * Check if user is currently editing/focused on an input element or editor
   * Returns true if actively typing in an input/textarea or if TipTap editors are focused
   */
  const isEditingContent = (): boolean => {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) return false;
    
    const tagName = activeElement.tagName.toLowerCase();
    const isEditableInput = tagName === 'input' || tagName === 'textarea';
    
    // Check if active element is contentEditable
    const isContentEditable = activeElement.isContentEditable;
    
    // Check if TipTap editors are focused
    const isPageEditorFocused = pageEditorRef.current?.isFocused ?? false;
    const isTitleEditorFocused = titleEditorRef.current?.isFocused ?? false;
    
    return isEditableInput || isContentEditable || isPageEditorFocused || isTitleEditorFocused;
  };

  useEffect(() => {
    const createFileShortcut = parseAccelerator(KEYBOARD_SHORTCUTS.CREATE_FILE);
    const deleteShortcut = parseAccelerator(KEYBOARD_SHORTCUTS.DELETE_NOTE);
    const pinShortcut = parseAccelerator(KEYBOARD_SHORTCUTS.PIN_NOTE);

    const handleKeyDown = async (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isAlt = event.altKey;
      const isShift = event.shiftKey;

      // Create child note shortcut
      // Allow this shortcut even when editor is focused (but not when typing in input/textarea)
      if (
        event.key.toLowerCase() === createFileShortcut.key &&
        (!createFileShortcut.requiresCmdOrCtrl || isCmdOrCtrl) &&
        (!createFileShortcut.requiresAlt || isAlt) &&
        (!createFileShortcut.requiresShift || isShift) &&
        !isEditingContent()
      ) {
        event.preventDefault();
        const newId = await addNode(fileId || null);
        navigate({ to: '/files/$fileId', params: { fileId: newId } });
        return;
      }

      // Delete note shortcut (only when not editing content)
      if (
        fileId &&
        !isEditingContent() &&
        event.key.toLowerCase() === deleteShortcut.key.toLowerCase() &&
        (!deleteShortcut.requiresCmdOrCtrl || isCmdOrCtrl) &&
        (!deleteShortcut.requiresAlt || isAlt) &&
        (!deleteShortcut.requiresShift || isShift)
      ) {
        event.preventDefault();
        window.dispatchEvent(
          new CustomEvent('sidebar:delete-node', { detail: { nodeId: fileId } })
        );
        return;
      }

      if (
        fileId &&
        event.key.toLowerCase() === pinShortcut.key.toLowerCase() &&
        (!pinShortcut.requiresCmdOrCtrl || isCmdOrCtrl) &&
        (!pinShortcut.requiresAlt || isAlt) &&
        (!pinShortcut.requiresShift || isShift)
      ) {
        event.preventDefault();
        await togglePinNode(fileId);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fileId, addNode, deleteNode, togglePinNode, navigate, pageEditorRef, titleEditorRef]);
}
