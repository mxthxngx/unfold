import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useCallback } from "react";
import { KEYBOARD_SHORTCUTS } from "@/config/keyboard-shortcuts";

interface SidebarContextMenuProps {
  nodeId: string;
  onCreateChild: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}

export function useSidebarContextMenu({ 
  nodeId, 
  onCreateChild, 
  onDelete 
}: SidebarContextMenuProps) {
  const menuPromiseRef = useRef<Promise<Menu> | null>(null);

  useEffect(() => {
    const initMenu = async () => {
      try {        
        // Create menu items
        const createChildItem = await MenuItem.new({
          id: `sidebar_create_child_${nodeId}`,
          text: "Create Child Note",
          accelerator: KEYBOARD_SHORTCUTS.CREATE_FILE,
          action: () => {
            onCreateChild(nodeId);
          }
        });

        const deleteItem = await MenuItem.new({
          id: `sidebar_delete_${nodeId}`,
          text: "Delete",
          accelerator: KEYBOARD_SHORTCUTS.DELETE_NOTE,
          action: () => {
            onDelete(nodeId);
          }
        });

        // Create the menu with items
        menuPromiseRef.current = Menu.new({
          items: [createChildItem, deleteItem]
        });
        
      } catch (error) {
        console.error("Error creating menu:", error);
      }
    };

    initMenu();
  }, [nodeId, onCreateChild, onDelete]);

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
