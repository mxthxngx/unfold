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
import { cn } from '@/lib/tiptap-utils';

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
      <Breadcrumb className="w-full">
        <div className="inline-flex items-center gap-2 rounded-xl bg-sidebar-item-hover-bg/70 px-3 py-1.5 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.75)] backdrop-blur-lg text-sidebar-foreground">
          <BreadcrumbList className="text-sidebar-foreground flex items-center gap-2 text-[12px] font-normal leading-tight whitespace-nowrap">
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white/75 font-normal tracking-tight">
                {spaceName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </div>
      </Breadcrumb>
    );
  }

  const shouldCollapse = path.length > MAX_VISIBLE_ITEMS;

  return (
    <Breadcrumb className="w-full">
      <div className="inline-flex items-center gap-2 rounded-xl bg-sidebar-item-hover-bg/70 px-3 py-1.5 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.75)] backdrop-blur-lg text-sidebar-foreground">
        <BreadcrumbList className="text-sidebar-foreground flex items-center gap-2 text-[12px] font-normal leading-tight whitespace-nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <span className="text-sidebar-foreground/70 hover:text-white/85 transition-colors font-normal tracking-tight text-[12px] cursor-default">
                {spaceName}
              </span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {shouldCollapse ? (
            <>
              <React.Fragment key={path[0].id}>
                <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to="/files/$fileId"
                      params={{ fileId: path[0].id }}
                      className="text-sidebar-foreground/65 hover:text-white/85 transition-colors text-[12px] font-normal"
                    >
                      {path[0].name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
              
              <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
              <BreadcrumbItem>
                <button
                  onClick={handleEllipsisClick}
                  className={cn(
                    'inline-flex items-center justify-center gap-1 rounded-md px-1 py-0 transition-colors text-[12px] leading-tight',
                    'bg-transparent hover:bg-sidebar-item-hover-bg/40',
                    'text-sidebar-foreground/70 hover:text-white',
                    'outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/15'
                  )}
                >
                  <BreadcrumbEllipsis className="!size-3.5 shrink-0" />
                  <span className="sr-only">Toggle menu</span>
                </button>
              </BreadcrumbItem>
              
              <React.Fragment key={path[path.length - 1].id}>
                <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white/80 text-[12px] font-normal tracking-tight">
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
                    <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
                      {isLast ? (
                        <BreadcrumbItem>
                          <BreadcrumbPage className="text-white/90 text-[12px] font-normal tracking-tight">
                            {node.name}
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      ) : (
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link
                            to="/files/$fileId"
                            params={{ fileId: node.id }}
                            className="text-sidebar-foreground/65 hover:text-white/90 transition-colors text-[12px] font-normal"
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
      </div>
    </Breadcrumb>
  );
});

