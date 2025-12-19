import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';

interface EdgeHandleState {
  selectedRow: number | null;
  selectedCol: number | null;
  isDragging: boolean;
}

const tableEdgeHandlesKey = new PluginKey<EdgeHandleState>('tableEdgeHandles');

export function createTableEdgeHandlesPlugin() {
  return new Plugin<EdgeHandleState>({
    key: tableEdgeHandlesKey,
    state: {
      init() {
        return {
          selectedRow: null,
          selectedCol: null,
          isDragging: false,
        };
      },
      apply(tr, value) {
        return value;
      },
    },
    props: {
      handleDOMEvents: {
        mousedown(view: EditorView, event: MouseEvent) {
          const target = event.target as HTMLElement;
          
          // Check if clicking on edge grip
          if (target.closest('.edge-grip')) {
            const grip = target.closest('.edge-grip') as HTMLElement;
            const isRowGrip = grip.classList.contains('edge-row');
            const isColGrip = grip.classList.contains('edge-col');
            
            if (isRowGrip || isColGrip) {
              event.preventDefault();
              event.stopPropagation();
              
              // Find the table cell
              const cell = grip.closest('th, td') as HTMLElement;
              if (!cell) return false;
              
              // Find row and column indices
              const row = cell.parentElement as HTMLTableRowElement;
              const table = row.closest('table');
              if (!table) return false;
              
              const rowIndex = Array.from(table.rows).indexOf(row);
              const colIndex = Array.from(row.cells).indexOf(cell);
              
              // Select row or column
              if (isRowGrip) {
                selectRow(table, rowIndex);
              } else if (isColGrip) {
                selectColumn(table, colIndex);
              }
              
              return true;
            }
          }
          
          return false;
        },
      },
    },
    view(editorView: EditorView) {
      // Initialize grips on first load
      setTimeout(() => {
        addEdgeGripsToTables(editorView);
      }, 0);
      
      return {
        update(view: EditorView, prevState) {
          // Add edge grips to table cells after updates
          setTimeout(() => {
            addEdgeGripsToTables(view);
          }, 0);
        },
        destroy() {
          // Cleanup - remove all grips
          const tables = editorView.dom.querySelectorAll('table');
          tables.forEach((table) => {
            table.querySelectorAll('.edge-grip').forEach((grip) => {
              grip.remove();
            });
          });
        },
      };
    },
  });
}

function addEdgeGripsToTables(view: EditorView) {
  const tables = view.dom.querySelectorAll('table');
  
  tables.forEach((table) => {
    const rows = table.rows;
    
    // Add column grips to top row
    if (rows.length > 0) {
      const topRow = rows[0];
      Array.from(topRow.cells).forEach((cell, colIndex) => {
        if (!cell.querySelector('.edge-grip.edge-col')) {
          const grip = createEdgeGrip('col', colIndex);
          (cell as HTMLElement).appendChild(grip);
        }
      });
    }
    
    // Add row grips to first column
    Array.from(rows).forEach((row, rowIndex) => {
      const firstCell = row.cells[0];
      if (firstCell && !firstCell.querySelector('.edge-grip.edge-row')) {
        const grip = createEdgeGrip('row', rowIndex);
        (firstCell as HTMLElement).appendChild(grip);
      }
    });
  });
}

function createEdgeGrip(type: 'row' | 'col', index: number): HTMLElement {
  const grip = document.createElement('div');
  grip.className = `edge-grip edge-${type}`;
  grip.setAttribute('data-index', index.toString());
  
  const dots = document.createElement('div');
  dots.className = 'edge-dots';
  
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dots.appendChild(dot);
  }
  
  grip.appendChild(dots);
  
  return grip;
}

function selectRow(table: HTMLTableElement, rowIndex: number) {
  // Remove previous selections
  table.querySelectorAll('.edge-selected-row').forEach((el) => {
    el.classList.remove('edge-selected-row');
  });
  
  // Add selection to row
  const row = table.rows[rowIndex];
  if (row) {
    Array.from(row.cells).forEach((cell) => {
      (cell as HTMLElement).classList.add('edge-selected-row');
    });
  }
}

function selectColumn(table: HTMLTableElement, colIndex: number) {
  // Remove previous selections
  table.querySelectorAll('.edge-selected-col').forEach((el) => {
    el.classList.remove('edge-selected-col');
  });
  
  // Add selection to column
  Array.from(table.rows).forEach((row) => {
    const cell = row.cells[colIndex];
    if (cell) {
      (cell as HTMLElement).classList.add('edge-selected-col');
    }
  });
}

