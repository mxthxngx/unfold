import { Extension } from '@tiptap/core';
import { createTableEdgeHandlesPlugin } from './table-edge-handles';

export const TableEdgeHandles = Extension.create({
  name: 'tableEdgeHandles',
  
  addProseMirrorPlugins() {
    return [createTableEdgeHandlesPlugin()];
  },
});
