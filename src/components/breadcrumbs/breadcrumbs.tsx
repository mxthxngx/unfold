import React, { useMemo, memo, useCallback } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { getCurrentWindow } from "@tauri-apps/api/window";

const MAX_VISIBLE_ITEMS = 3; 

export const FileBreadcrumbs = memo(function FileBreadcrumbs() {
  const { fileId } = useParams({ strict: false });
  const { spaceName, getNodePath } = useFileSystem();
  const navigate = useNavigate();

  const path = useMemo(() => {
    if (!fileId) return [];
    return getNodePath(fileId);
  }, [fileId, getNodePath]);

  const handleEllipsisClick = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      console.log("Creating breadcrumb dropdown menu");
      
      // Create menu items for collapsed paths
      const collapsedItems = path.slice(1, path.length - 1);
      const menuItems = await Promise.all(
        collapsedItems.map(async (node) => {
          return MenuItem.new({
            id: `breadcrumb_${node.id}`,
            text: node.name,
            action: () => {
              console.log("Navigating to:", node.id);
              navigate({ to: '/files/$fileId', params: { fileId: node.id } });
            }
          });
        })
      );

      // Create and show menu
      const menu = await Menu.new({
        items: menuItems
      });
      
      const window = getCurrentWindow();
      await menu.popup(undefined, window);
      
      console.log("Breadcrumb menu shown");
    } catch (error) {
      console.error("Error showing breadcrumb menu:", error);
    }
  }, [path, navigate]);

  if (!fileId || path.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sidebar-foreground">
              {spaceName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const shouldCollapse = path.length > MAX_VISIBLE_ITEMS;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <span className="text-sidebar-foreground/70 hover:text-sidebar-foreground text-xs font-light cursor-default">
              {spaceName}
            </span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {shouldCollapse ? (
          <>
            {/* First item */}
            <React.Fragment key={path[0].id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/files/$fileId"
                    params={{ fileId: path[0].id }}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors text-xs font-light"
                  >
                    {path[0].name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
            
            {/* Ellipsis dropdown */}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <button
                onClick={handleEllipsisClick}
                className="flex items-center gap-1 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors cursor-pointer outline-none rounded-md px-1 py-0.5"
              >
                <BreadcrumbEllipsis className="size-4" />
                <span className="sr-only">Toggle menu</span>
              </button>
            </BreadcrumbItem>
            
            {/* Last item */}
            <React.Fragment key={path[path.length - 1].id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-toolbar-foreground-active text-xs font-light">
                  {path[path.length - 1].name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </React.Fragment>
          </>
        ) : (
          <>
            {path.map((node, index) => {
              const isLast = index === path.length - 1;
              
              return (
                <React.Fragment key={node.id}>
                  <BreadcrumbSeparator />
                  {isLast ? (
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-toolbar-foreground-active text-xs font-light">
                        {node.name}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link
                          to="/files/$fileId"
                          params={{ fileId: node.id }}
                          className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors text-xs font-light"
                        >
                          {node.name}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  )}
                </React.Fragment>
              );
            })}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
});

