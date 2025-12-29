import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Node } from '../types/sidebar';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../services/database';

type Space = {
  id: string;
  name: string;
  fileTree: Node[];
  pinnedNodes: Node[];
};

interface FileSystemContextType {
  fileTree: Node[];
  pinnedNodes: Node[];
  spaceName: string;
  spaces: Space[];
  activeSpaceId: string;
  isLoading: boolean;
  setActiveSpace: (id: string) => void;
  addSpace: (name?: string) => Promise<string>;
  renameSpace: (id: string, name: string) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  addNode: (parentId: string | null) => Promise<string>;
  updateNodeContent: (id: string, content: string) => Promise<void>;
  renameNode: (id: string, name: string) => Promise<void>;
  getNode: (id: string) => Node | null;
  toggleFolder: (id: string) => Promise<void>;
  togglePinNode: (id: string) => Promise<void>;
  isNodePinned: (id: string) => boolean;
  getNodePath: (id: string) => Node[];
  deleteNode: (id: string) => Promise<void>;
  getPreviousVisibleNode: (id: string) => string | null;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

const sortNodes = (nodes: Node[]): Node[] => {
  return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
};

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load initial data from database
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized) {
      return;
    }

    let mounted = true;

    const loadData = async () => {
      try {
        const spaceRows = await db.getSpaces();
        
        if (!mounted) return;
        
        const loadedSpaces = await Promise.all(
          spaceRows.map(async (spaceRow) => {
            const nodeRows = await db.getNodesBySpace(spaceRow.id);
            const fileTree = db.buildNodeTree(nodeRows);
            // Extract pinned nodes from all nodes (flattened)
            const pinnedNodes = nodeRows
              .filter(row => row.is_pinned === 1)
              .map(row => ({
                id: row.id,
                name: row.name,
                content: row.content || undefined,
                isPinned: true,
              }));
            return {
              id: spaceRow.id,
              name: spaceRow.name,
              fileTree,
              pinnedNodes,
            };
          })
        );
        
        if (!mounted) return;
        setSpaces(loadedSpaces);
        
        // Try to restore last active space from localStorage
        const savedSpaceId = localStorage.getItem('activeSpaceId');
        const savedSpaceExists = savedSpaceId && loadedSpaces.some(s => s.id === savedSpaceId);
        
        // Priority: saved space > "mine" space > first space
        const mineSpace = loadedSpaces.find(s => s.name === 'mine');
        const activeId = savedSpaceExists ? savedSpaceId : (mineSpace?.id ?? loadedSpaces[0]?.id ?? '');
                
        // Clear invalid saved space ID
        if (!savedSpaceExists && savedSpaceId) {
          localStorage.removeItem('activeSpaceId');
        }
        
        setActiveSpaceId(activeId);
        if (activeId) {
          localStorage.setItem('activeSpaceId', activeId);
        }
        setHasInitialized(true);
      } catch (error) {
        if (!mounted) return;
        console.error('[FileSystemContext] Failed to load data from database:', error);
        setHasInitialized(true); // Mark as initialized even on error to prevent infinite retries
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();

    return () => {
      mounted = false;
    };
  }, [hasInitialized]);

  const activeSpace = useMemo(() => {
    return spaces.find((space) => space.id === activeSpaceId) ?? spaces[0] ?? null;
  }, [activeSpaceId, spaces]);

  const fileTree = activeSpace?.fileTree ?? [];
  const pinnedNodes = activeSpace?.pinnedNodes ?? [];
  const spaceName = activeSpace?.name ?? '';
  
  
  // Helper to find a node in the tree
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
  
  // Reload active space tree from database
  const reloadActiveSpaceTree = useCallback(async () => {
    if (!activeSpaceId) return;
    
    const currentSpaceId = activeSpaceId;
    
    try {
      const nodeRows = await db.getNodesBySpace(currentSpaceId);
      const fileTree = db.buildNodeTree(nodeRows);
      // Extract pinned nodes
      const pinnedNodes = nodeRows
        .filter(row => row.is_pinned === 1)
        .map(row => ({
          id: row.id,
          name: row.name,
          content: row.content || undefined,
          isPinned: true,
        }));
      
      setSpaces((prev) =>
        prev.map((space) =>
          space.id === currentSpaceId ? { ...space, fileTree, pinnedNodes } : space
        )
      );
    } catch (error) {
      console.error('Failed to reload space tree:', error);
    }
  }, [activeSpaceId]);

  const setActiveSpace = useCallback(
    (id: string) => {
      const exists = spaces.some((space) => space.id === id);
      if (exists) {
        setActiveSpaceId(id);
        localStorage.setItem('activeSpaceId', id);
      } else if (spaces.length > 0) {
        setActiveSpaceId(spaces[0].id);
        localStorage.setItem('activeSpaceId', spaces[0].id);
      } else {
        setActiveSpaceId('');
        localStorage.removeItem('activeSpaceId');
      }
    },
    [spaces]
  );

  const addSpace = useCallback(async (name?: string) => {
    const newSpaceId = uuidv4();
    const spaceName = name?.trim() && name.trim().length > 0 ? name.trim() : 'new Space';
    
    try {
      await db.createSpace({
        id: newSpaceId,
        name: spaceName,
        sort_order: spaces.length,
      });
      
      setSpaces((prev) => [...prev, { id: newSpaceId, name: spaceName, fileTree: [], pinnedNodes: [] }]);
      setActiveSpaceId(newSpaceId);
      localStorage.setItem('activeSpaceId', newSpaceId);
      return newSpaceId;
    } catch (error) {
      console.error('Failed to create space:', error);
      throw error;
    }
  }, [spaces.length]);

  const renameSpace = useCallback(async (id: string, name: string) => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) return;
    
    try {
      await db.updateSpace(id,  trimmedName );
      setSpaces((prev) =>
        prev.map((space) =>
          space.id === id ? { ...space, name: trimmedName } : space
        )
      );
    } catch (error) {
      console.error('Failed to rename space:', error);
      throw error;
    }
  }, []);

  const deleteSpace = useCallback(
    async (id: string) => {
      if (spaces.length <= 1) return;
      
      try {
        await db.deleteSpace(id);
        
        setSpaces((prev) => {
          const filtered = prev.filter((space) => space.id !== id);
          if (activeSpaceId === id) {
            const fallback = filtered[0]?.id ?? '';
            setActiveSpaceId(fallback);
          }
          return filtered;
        });
      } catch (error) {
        console.error('Failed to delete space:', error);
        throw error;
      }
    },
    [activeSpaceId, spaces.length]
  );

  const addNode = useCallback(
    async (parentId: string | null) => {
      if (!activeSpaceId) return '';
      
      const newNodeId = uuidv4();
      
      try {
        await db.createNode({
          id: newNodeId,
          space_id: activeSpaceId,
          parent_id: parentId,
          name: '',
          content: '',
          is_open: 0,
        });
        
        // Reload tree from database
        await reloadActiveSpaceTree();
        
        return newNodeId;
      } catch (error) {
        console.error('Failed to add node:', error);
        throw error;
      }
    },
    [activeSpaceId, reloadActiveSpaceTree]
  );

  const updateNodeContent = useCallback(
    async (id: string, content: string) => {
      try {
        await db.updateNodeContent(id, content);
        
        // Update local state optimistically (will be synced on reload)
        setSpaces((prev) =>
          prev.map((space) => {
            if (space.id !== activeSpaceId) return space;
            
            const updateNodesInPlace = (nodes: Node[]): Node[] => {
              return nodes.map((node) => {
                if (node.id === id) {
                  return { ...node, content };
                }
                if (node.nodes) {
                  return { ...node, nodes: updateNodesInPlace(node.nodes) };
                }
                return node;
              });
            };
            
            return { ...space, fileTree: updateNodesInPlace(space.fileTree) };
          })
        );
      } catch (error) {
        console.error('Failed to update node content:', error);
        throw error;
      }
    },
    [activeSpaceId]
  );

  const renameNode = useCallback(
    async (id: string, name: string) => {
      const trimmedName = name.trim();
      try {
        await db.updateNode(id, { name: trimmedName });
        
        // Update local state optimistically
        setSpaces((prev) =>
          prev.map((space) => {
            if (space.id !== activeSpaceId) return space;
            
            const updateNodesInPlace = (nodes: Node[]): Node[] => {
              return nodes.map((node) => {
                if (node.id === id) {
                  return { ...node, name: trimmedName };
                }
                if (node.nodes) {
                  return { ...node, nodes: updateNodesInPlace(node.nodes) };
                }
                return node;
              });
            };
            
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
            
            // Also update pinned nodes if necessary
            const updatePinnedNodes = (pinnedNodes: Node[]): Node[] => {
              return pinnedNodes.map((node) => {
                if (node.id === id) {
                  return { ...node, name: trimmedName };
                }
                return node;
              });
            };
            
            return {
              ...space,
              fileTree: recursiveSort(updateNodesInPlace(space.fileTree)),
              pinnedNodes: updatePinnedNodes(space.pinnedNodes),
            };
          })
        );
      } catch (error) {
        console.error('Failed to rename node:', error);
        throw error;
      }
    },
    [activeSpaceId]
  );

  const toggleFolder = useCallback(
    async (id: string) => {
      const node = getNode(id);
      if (!node) return;
      
      const newOpenState = !node.isOpen;
      
      try {
        await db.toggleNodeOpen(id, newOpenState);
        
        // Update local state immediately for responsiveness
        setSpaces((prev) =>
          prev.map((space) => {
            if (space.id !== activeSpaceId) return space;
            
            const updateNodes = (nodes: Node[]): Node[] => {
              return nodes.map((node) => {
                if (node.id === id) {
                  return { ...node, isOpen: newOpenState };
                }
                if (node.nodes) {
                  return { ...node, nodes: updateNodes(node.nodes) };
                }
                return node;
              });
            };
            
            return { ...space, fileTree: updateNodes(space.fileTree) };
          })
        );
      } catch (error) {
        console.error('Failed to toggle folder:', error);
        throw error;
      }
    },
    [activeSpaceId, getNode]
  );

  const togglePinNode = useCallback(
    async (id: string) => {
      const node = getNode(id);
      if (!node) return;
      
      const newPinnedState = !node.isPinned;
      
      try {
        await db.toggleNodePinned(id, newPinnedState);
        
        // Reload tree from database to get updated pinned state
        await reloadActiveSpaceTree();
      } catch (error) {
        console.error('Failed to toggle pin:', error);
        throw error;
      }
    },
    [getNode, reloadActiveSpaceTree]
  );

  const isNodePinned = useCallback(
    (id: string): boolean => {
      return pinnedNodes.some(node => node.id === id);
    },
    [pinnedNodes]
  );

  const deleteNode = useCallback(
    async (id: string) => {
      try {
        await db.deleteNode(id);
        
        // Reload tree from database (deletion cascades to children)
        await reloadActiveSpaceTree();
      } catch (error) {
        console.error('Failed to delete node:', error);
        throw error;
      }
    },
    [reloadActiveSpaceTree]
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
      pinnedNodes,
      spaceName,
      spaces,
      activeSpaceId,
      isLoading,
      setActiveSpace,
      addSpace,
      renameSpace,
      deleteSpace,
      addNode,
      updateNodeContent,
      renameNode,
      getNode,
      toggleFolder,
      togglePinNode,
      isNodePinned,
      getNodePath,
      deleteNode,
      getPreviousVisibleNode,
    }),
    [
      fileTree,
      pinnedNodes,
      spaceName,
      spaces,
      activeSpaceId,
      isLoading,
      setActiveSpace,
      addSpace,
      renameSpace,
      deleteSpace,
      addNode,
      updateNodeContent,
      renameNode,
      getNode,
      toggleFolder,
      togglePinNode,
      isNodePinned,
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
