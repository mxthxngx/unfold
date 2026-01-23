import { Node } from '@/types/sidebar';

/**
 * Returns the first "file-like" node id in the tree, preferring nodes with
 * content and falling back to the first leaf node. This helps us pick a
 * sensible default selection when a space already has files.
 */
export function findFirstFileId(nodes: Node[]): string | null {
  for (const node of nodes) {
    const hasChildren = Boolean(node.nodes && node.nodes.length > 0);
    const hasContent = typeof node.content === 'string' && node.content.trim().length > 0;

    if (hasContent || !hasChildren) {
      return node.id;
    }

    if (hasChildren) {
      const childId = findFirstFileId(node.nodes || []);
      if (childId) {
        return childId;
      }
    }
  }

  return null;
}

/**
 * Checks if a node with the given ID exists in the tree
 * @param nodes The tree of nodes to search
 * @param id The ID to search for
 * @returns true if the node exists, false otherwise
 */
export function findNodeById(nodes: Node[], id: string): boolean {
  for (const node of nodes) {
    if (node.id === id) return true;
    if (node.nodes && findNodeById(node.nodes, id)) return true;
  }
  return false;
}









