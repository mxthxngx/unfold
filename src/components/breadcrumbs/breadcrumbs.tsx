import React, { useMemo, memo } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFileSystem } from '@/contexts/FileSystemContext';

const MAX_VISIBLE_ITEMS = 3; 

export const FileBreadcrumbs = memo(function FileBreadcrumbs() {
  const { fileId } = useParams({ strict: false });
  const { spaceName, getNodePath } = useFileSystem();

  const path = useMemo(() => {
    if (!fileId) return [];
    return getNodePath(fileId);
  }, [fileId, getNodePath]);

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
  
  const collapsedItems = shouldCollapse
    ? path.slice(1, path.length - 1)
    : [];

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
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors cursor-pointer outline-none rounded-md px-1 py-0.5">
                  <BreadcrumbEllipsis className="size-4" />
                  <span className="sr-only">Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {collapsedItems.map((node) => (
                    <DropdownMenuItem key={node.id} asChild>
                      <Link
                        to="/files/$fileId"
                        params={{ fileId: node.id }}
                        className="w-full cursor-pointer text-xs text-sidebar-foreground/80 hover:text-sidebar-foreground-active"
                      >
                        {node.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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

