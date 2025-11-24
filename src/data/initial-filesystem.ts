import { Node } from '../types/sidebar';

const sortNodes = (nodes: Node[]): Node[] => {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  // Sort the current level of nodes
  const sortedCurrentLevel = [...nodes].sort((a, b) => a.name.localeCompare(b.name));

  // Recursively sort children nodes
  return sortedCurrentLevel.map(node => ({
    ...node,
    nodes: node.nodes ? sortNodes(node.nodes) : undefined,
  }));
};

export const INITIAL_DATA: Node[] = sortNodes([
  {
    id: 'root-1',
    name: "System Design",
    nodes: [
      {
        id: 'node-1',
        name: "Hashmaps",
        parentId: 'root-1',
        content: '<h1>Hashmaps</h1><p>Introduction to hashmaps...</p>',
        nodes: [
          { id: 'node-2', name: "Hash Functions", parentId: 'node-1', content: '<h1>Hash Functions</h1><p>Details...</p>' },
          { id: 'node-3', name: "Collision Resolution", parentId: 'node-1', content: '<h1>Collision Resolution</h1><p>Details...</p>' }
        ]
      },
      {
        id: 'node-4',
        name: "Databases",
        parentId: 'root-1',
        content: '<h1>Databases</h1><p>Intro to DBs...</p>',
        nodes: [
          { id: 'node-5', name: "SQL Basics", parentId: 'node-4', content: '<h1>SQL Basics</h1><p>Select *...</p>' },
          { id: 'node-6', name: "NoSQL", parentId: 'node-4', content: '<h1>NoSQL</h1><p>Mongo...</p>' }
        ]
      },
    ]
  }
]);
