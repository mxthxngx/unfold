import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { getCurrentWindow } from "@tauri-apps/api/window";
import React, { useEffect, useRef } from "react";

const GlobalContextMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const menuPromiseRef = useRef<Promise<Menu> | null>(null);

  useEffect(() => {
    const initMenu = async () => {
      try {
        console.log("Initializing global context menu");
        
        // Create menu items with actions
        const option1 = await MenuItem.new({
          id: "ctx_option1",
          text: "Option 1",
          action: () => {
            console.log("Option 1 clicked");
          }
        });

        const option2 = await MenuItem.new({
          id: "ctx_option2",
          text: "Option 2",
          action: () => {
            console.log("Option 2 clicked");
          }
        });

        // Create the menu with items
        menuPromiseRef.current = Menu.new({
          items: [option1, option2]
        });
        
        console.log("Global context menu created");
      } catch (error) {
        console.error("Error creating global context menu:", error);
      }
    };

    initMenu();
  }, []);

  async function clickHandler(event: React.MouseEvent) {
    event.preventDefault();
    console.log("Global context menu triggered");
    
    try {
      if (menuPromiseRef.current) {
        const menu = await menuPromiseRef.current;
        const window = getCurrentWindow();
        await menu.popup(undefined, window);
      }
    } catch (error) {
      console.error("Error showing global context menu:", error);
    }
  }

  return (
    <div onContextMenu={clickHandler} style={{ width: "100%", height: "100%" }}>
      {children}
    </div>
  );
};

export default GlobalContextMenu;
