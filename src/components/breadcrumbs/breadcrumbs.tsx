import React, { useMemo, memo } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useFileSystem } from '@/contexts/FileSystemContext';

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
            <BreadcrumbPage className="text-foreground-muted">
              {spaceName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <span className="text-foreground-muted">{spaceName}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {path.map((node, index) => {
          const isLast = index === path.length - 1;
          
          return (
            <React.Fragment key={node.id}>
              <BreadcrumbSeparator />
              {isLast ? (
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground">
                    {node.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to="/files/$fileId"
                      params={{ fileId: node.id }}
                      className="text-foreground-muted hover:text-foreground transition-colors"
                    >
                      {node.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
});

