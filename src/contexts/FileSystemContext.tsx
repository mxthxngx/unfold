import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Node } from '../types/sidebar';
import { v4 as uuidv4 } from 'uuid';
import { INITIAL_DATA } from '../data/initial-filesystem';

type Space = {
  id: string;
  name: string;
  fileTree: Node[];
};

interface FileSystemContextType {
  fileTree: Node[];
  spaceName: string;
  spaces: Space[];
  activeSpaceId: string;
  setActiveSpace: (id: string) => void;
  addSpace: (name?: string) => string;
  renameSpace: (id: string, name: string) => void;
  deleteSpace: (id: string) => void;
  addNode: (parentId: string | null) => string;
  updateNodeContent: (id: string, content: string) => void;
  getNode: (id: string) => Node | null;
  toggleFolder: (id: string) => void;
  getNodePath: (id: string) => Node[];
  deleteNode: (id: string) => void;
  getPreviousVisibleNode: (id: string) => string | null;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

const sortNodes = (nodes: Node[]): Node[] => {
  return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
};

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
  const initialSpaceId = useMemo(() => uuidv4(), []);

  const [spaces, setSpaces] = useState<Space[]>([
    {
      id: initialSpaceId,
      name: 'System Design',
      fileTree: INITIAL_DATA,
    },
  ]);
  const [activeSpaceId, setActiveSpaceId] = useState<string>(initialSpaceId);

  const activeSpace = useMemo(() => {
    return spaces.find((space) => space.id === activeSpaceId) ?? spaces[0] ?? null;
  }, [activeSpaceId, spaces]);

  const fileTree = activeSpace?.fileTree ?? [];
  const spaceName = activeSpace?.name ?? 'Untitled Space';

  const setActiveSpace = useCallback(
    (id: string) => {
      const exists = spaces.some((space) => space.id === id);
      if (exists) {
        setActiveSpaceId(id);
      } else if (spaces.length > 0) {
        setActiveSpaceId(spaces[0].id);
      } else {
        setActiveSpaceId('');
      }
    },
    [spaces]
  );

  const addSpace = useCallback((name?: string) => {
    const newSpace: Space = {
      id: uuidv4(),
      name: name?.trim() && name.trim().length > 0 ? name.trim() : 'Untitled Space',
      fileTree: [],
    };
    setSpaces((prev) => [...prev, newSpace]);
    setActiveSpaceId(newSpace.id);
    return newSpace.id;
  }, []);

  const renameSpace = useCallback((id: string, name: string) => {
    setSpaces((prev) =>
      prev.map((space) =>
        space.id === id
          ? { ...space, name: name.trim().length > 0 ? name.trim() : space.name }
          : space
      )
    );
  }, []);

  const deleteSpace = useCallback(
    (id: string) => {
      setSpaces((prev) => {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter((space) => space.id !== id);
        if (activeSpaceId === id) {
          const fallback = filtered[0]?.id ?? '';
          setActiveSpaceId(fallback);
        }
        return filtered;
      });
    },
    [activeSpaceId]
  );

  const updateActiveSpaceTree = useCallback(
    (updater: (nodes: Node[]) => Node[]) => {
      setSpaces((prev) =>
        prev.map((space) =>
          space.id === (activeSpace?.id ?? '')
            ? { ...space, fileTree: updater(space.fileTree) }
            : space
        )
      );
    },
    [activeSpace?.id]
  );

  const findNode = useCallback((nodes: Node[], id: string): Node | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.nodes) {
        const found = findNode(node.nodes, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const getNode = useCallback(
    (id: string) => {
      return findNode(fileTree, id);
    },
    [fileTree, findNode]
  );

  const addNode = useCallback(
    (parentId: string | null) => {
      const newNode: Node = {
        id: uuidv4(),
        name: 'Untitled',
        parentId: parentId || undefined,
        nodes: [],
        content: '',
        isOpen: false,
      };

      updateActiveSpaceTree((prev) => {
        const updateNodes = (nodes: Node[]): Node[] => {
          if (!parentId) {
            return sortNodes([...nodes, newNode]);
          }

          return nodes.map((node) => {
            if (node.id === parentId) {
              return {
                ...node,
                nodes: sortNodes([...(node.nodes || []), newNode]),
                isOpen: true,
              };
            }
            if (node.nodes) {
              return { ...node, nodes: updateNodes(node.nodes) };
            }
            return node;
          });
        };

        if (!parentId) {
          return sortNodes([...prev, newNode]);
        }
        return updateNodes(prev);
      });
      return newNode.id;
    },
    [updateActiveSpaceTree]
  );

  const extractNameFromContent = (content: string): string => {
    if (!content || content.trim() === '') {
      // Preserve existing name if content is empty
      return 'Untitled';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    let firstBlock = null;
    for (const el of Array.from(doc.body.children)) {
      if (el.textContent && el.textContent.trim().length > 0) {
        firstBlock = el;
        break;
      }
    }
    if (firstBlock) {
      const extractedName = firstBlock.textContent?.trim();
      const truncatedExtractedName = extractedName?.slice(0, 50);
      if (truncatedExtractedName && truncatedExtractedName.length > 0) {
        return truncatedExtractedName;
      }
    }
    return 'Untitled';
  };

  const updateNodeContent = useCallback(
    (id: string, content: string) => {
      updateActiveSpaceTree((prev) => {
        const updateNodes = (nodes: Node[]): Node[] => {
          return nodes.map((node) => {
            if (node.id === id) {
              const newName = extractNameFromContent(content);
              return { ...node, content, name: newName };
            }
            if (node.nodes) {
              return { ...node, nodes: updateNodes(node.nodes) };
            }
            return node;
          });
        };

        // We need to re-sort after name change
        const recursiveSort = (nodes: Node[]): Node[] => {
          return sortNodes(
            nodes.map((node) => {
              if (node.nodes) {
                return { ...node, nodes: recursiveSort(node.nodes) };
              }
              return node;
            })
          );
        };

        return recursiveSort(updateNodes(prev));
      });
    },
    [updateActiveSpaceTree]
  );

  const toggleFolder = useCallback(
    (id: string) => {
      updateActiveSpaceTree((prev) => {
        const updateNodes = (nodes: Node[]): Node[] => {
          return nodes.map((node) => {
            if (node.id === id) {
              return { ...node, isOpen: !node.isOpen };
            }
            if (node.nodes) {
              return { ...node, nodes: updateNodes(node.nodes) };
            }
            return node;
          });
        };
        return updateNodes(prev);
      });
    },
    [updateActiveSpaceTree]
  );

  const deleteNode = useCallback(
    (id: string) => {
      updateActiveSpaceTree((prev) => {
        const removeNode = (nodes: Node[]): Node[] => {
          return nodes
            .map((node) => {
              if (node.nodes) {
                return { ...node, nodes: removeNode(node.nodes) };
              }
              return node;
            })
            .filter((node) => node.id !== id);
        };
        return removeNode(prev);
      });
    },
    [updateActiveSpaceTree]
  );

  const getNodePath = useCallback(
    (id: string): Node[] => {
      const path: Node[] = [];

      const findPath = (nodes: Node[], targetId: string, currentPath: Node[]): boolean => {
        for (const node of nodes) {
          const newPath = [...currentPath, node];

          if (node.id === targetId) {
            path.push(...newPath);
            return true;
          }

          if (node.nodes && node.nodes.length > 0) {
            if (findPath(node.nodes, targetId, newPath)) {
              return true;
            }
          }
        }
        return false;
      };

      findPath(fileTree, id, []);
      return path;
    },
    [fileTree]
  );

  const getPreviousVisibleNode = useCallback(
    (id: string): string | null => {
      const flattenNodes = (nodes: Node[]): Node[] => {
        let flat: Node[] = [];
        for (const node of nodes) {
          flat.push(node);
          if (node.isOpen && node.nodes) {
            flat = [...flat, ...flattenNodes(node.nodes)];
          }
        }
        return flat;
      };

      const flatList = flattenNodes(fileTree);
      const index = flatList.findIndex((node) => node.id === id);

      if (index > 0) {
        return flatList[index - 1].id;
      }

      return null;
    },
    [fileTree]
  );

  const contextValue = useMemo(
    () => ({
      fileTree,
      spaceName,
      spaces,
      activeSpaceId,
      setActiveSpace,
      addSpace,
      renameSpace,
      deleteSpace,
      addNode,
      updateNodeContent,
      getNode,
      toggleFolder,
      getNodePath,
      deleteNode,
      getPreviousVisibleNode,
    }),
    [
      fileTree,
      spaceName,
      spaces,
      activeSpaceId,
      setActiveSpace,
      addSpace,
      renameSpace,
      deleteSpace,
      addNode,
      updateNodeContent,
      getNode,
      toggleFolder,
      getNodePath,
      deleteNode,
      getPreviousVisibleNode,
    ]
  );

  return (
    <FileSystemContext.Provider value={contextValue}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
}
