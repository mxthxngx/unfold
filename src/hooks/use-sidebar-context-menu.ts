import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useCallback } from "react";
import { KEYBOARD_SHORTCUTS } from "@/config/keyboard-shortcuts";

interface SidebarContextMenuProps {
  nodeId: string;
  isPinned: boolean;
  onCreateChild: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onTogglePin: (nodeId: string) => void;
}

export function useSidebarContextMenu({ 
  nodeId,
  isPinned,
  onCreateChild, 
  onDelete,
  onTogglePin,
}: SidebarContextMenuProps) {
  const menuPromiseRef = useRef<Promise<Menu> | null>(null);

  useEffect(() => {
    const initMenu = async () => {
      try {        
        // Create menu items
        const createChildItem = await MenuItem.new({
          id: `sidebar_create_child_${nodeId}`,
          text: "create child note",
          accelerator: KEYBOARD_SHORTCUTS.CREATE_FILE,
          action: () => {
            onCreateChild(nodeId);
          }
        });

        const pinItem = await MenuItem.new({
          id: `sidebar_pin_${nodeId}`,
          text: isPinned ? "unpin" : "pin",
          accelerator: KEYBOARD_SHORTCUTS.PIN_NOTE,
          action: () => {
            onTogglePin(nodeId);
          }
        });

        const deleteItem = await MenuItem.new({
          id: `sidebar_delete_${nodeId}`,
          text: "delete",
          accelerator: KEYBOARD_SHORTCUTS.DELETE_NOTE,
          action: () => {
            onDelete(nodeId);
          }
        });

        // Create the menu with items
        menuPromiseRef.current = Menu.new({
          items: [createChildItem, pinItem, deleteItem]
        });
        
      } catch (error) {
        console.error("Error creating menu:", error);
      }
    };

    initMenu();
  }, [nodeId, isPinned, onCreateChild, onDelete, onTogglePin]);

  const handleContextMenu = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    
    try {
      if (menuPromiseRef.current) {
        const menu = await menuPromiseRef.current;
        const window = getCurrentWindow();
        await menu.popup(undefined, window);
      } else {
        console.error("Menu not initialized");
      }
    } catch (error) {
      console.error("Error showing menu:", error);
    }
  }, []);

  return { handleContextMenu };
}
