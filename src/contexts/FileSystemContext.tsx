import React, { createContext, useContext, useState, useCallback } from 'react';
import { Node } from '../types/sidebar';
import { v4 as uuidv4 } from 'uuid';
import { INITIAL_DATA } from '../data/initial-filesystem';

interface FileSystemContextType {
  fileTree: Node[];
  spaceName: string;
  addNode: (parentId: string | null) => string;
  updateNodeContent: (id: string, content: string) => void;
  getNode: (id: string) => Node | null;
  toggleFolder: (id: string) => void;
  getNodePath: (id: string) => Node[];
  deleteNode: (id: string) => void;
  getPreviousVisibleNode: (id: string) => string | null;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
  const [fileTree, setFileTree] = useState<Node[]>(INITIAL_DATA);
  const [spaceName] = useState("System Design");

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

  const getNode = useCallback((id: string) => {
    return findNode(fileTree, id);
  }, [fileTree, findNode]);

  const sortNodes = (nodes: Node[]): Node[] => {
    return [...nodes].sort((a, b) => a.name.localeCompare(b.name));
  };

  const addNode = useCallback((parentId: string | null) => {
    const newNode: Node = {
      id: uuidv4(),
      name: "Untitled",
      parentId: parentId || undefined,
      nodes: [],
      content: '',
      isOpen: false
    };

    setFileTree(prev => {
      const updateNodes = (nodes: Node[]): Node[] => {
        if (!parentId) {
           // If adding to root (though typically we add to a parent in this UI)
           return sortNodes([...nodes, newNode]);
        }

        return nodes.map(node => {
          if (node.id === parentId) {
            return {
              ...node,
              nodes: sortNodes([...(node.nodes || []), newNode]),
              isOpen: true
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
  }, []);

  const extractNameFromContent = (content: string): string => {
    if (!content || content.trim() === '') {
      // Preserve existing name if content is empty
      return "Untitled";
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
        const truncatedExtractedName = extractedName?.slice(0,50 );
        if (truncatedExtractedName && truncatedExtractedName.length > 0) {
          return truncatedExtractedName;
        }
     
    }
    return "Untitled";
  };

  const updateNodeContent = useCallback((id: string, content: string) => {
    setFileTree(prev => {
      const updateNodes = (nodes: Node[]): Node[] => {
        return nodes.map(node => {
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
          return sortNodes(nodes.map(node => {
              if (node.nodes) {
                  return { ...node, nodes: recursiveSort(node.nodes) };
              }
              return node;
          }));
      };

      return recursiveSort(updateNodes(prev));
    });
  }, []);

  const toggleFolder = useCallback((id: string) => {
    setFileTree(prev => {
      const updateNodes = (nodes: Node[]): Node[] => {
        return nodes.map(node => {
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
  }, []);

  const deleteNode = useCallback((id: string) => {
    setFileTree(prev => {
      const removeNode = (nodes: Node[]): Node[] => {
        return nodes.filter(node => {
          if (node.id === id) {
            // This node should be deleted
            return false;
          }
          if (node.nodes) {
            // Recursively remove from children
            node.nodes = removeNode(node.nodes);
          }
          return true;
        });
      };
      return removeNode(prev);
    });
  }, []);

  const getNodePath = useCallback((id: string): Node[] => {
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
  }, [fileTree]);

  const getPreviousVisibleNode = useCallback((id: string): string | null => {
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
    const index = flatList.findIndex(node => node.id === id);

    if (index > 0) {
      return flatList[index - 1].id;
    }
    
    // If it's the first node, return null (or maybe parent if we want to go up?)
    // Logic: if index > 0 return previous. If index === 0, return null.
    // If we want to support selecting parent when first child is deleted, that's handled by the flat list order 
    // (parent comes before children).
    // BUT if we are deleting the first child, the previous node IS the parent.
    // So this logic holds.
    
    return null;
  }, [fileTree]);

  return (
    <FileSystemContext.Provider value={{ fileTree, spaceName, addNode, updateNodeContent, getNode, toggleFolder, getNodePath, deleteNode, getPreviousVisibleNode }}>
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
