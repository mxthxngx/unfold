import type { Editor } from '@tiptap/core'
import { getSelectionRanges, NodeRangeSelection } from '@tiptap/extension-node-range'
import type { SelectionRange } from '@tiptap/pm/state'
import { NodeSelection } from '@tiptap/pm/state'
import { findElementNextToCoords } from './find-next-element-from-cursor'
import { cloneElement } from './clone-element'
import { removeNode } from './remove-node'
import {getInnerCoords} from "./get-inner-coords";

function getDragHandleRanges(event: DragEvent, editor: Editor): SelectionRange[] {
  const { doc } = editor.view.state

  const result = findElementNextToCoords({
    editor,
    x: event.clientX,
    y: event.clientY,
    direction: 'right',
  })

  if (!result.resultNode || result.pos === null) {
    return []
  }

  const x = event.clientX

  // @ts-ignore
  const coords = getInnerCoords(editor.view, x, event.clientY)
  const posAtCoords = editor.view.posAtCoords(coords)

  if (!posAtCoords) {
    return []
  }

  const { pos } = posAtCoords
  const nodeAt = doc.resolve(pos).parent

  if (!nodeAt) {
    return []
  }

  const $from = doc.resolve(result.pos)
  const $to = doc.resolve(result.pos + 1)

  return getSelectionRanges($from, $to, 0)
}

export function dragHandler(event: DragEvent, editor: Editor) {
  const { view } = editor

  if (!event.dataTransfer) {
    return
  }

  const { empty, $from, $to } = view.state.selection

  const dragHandleRanges = getDragHandleRanges(event, editor)

  const selectionRanges = getSelectionRanges($from, $to, 0)
  const isDragHandleWithinSelection = selectionRanges.some(range => {
    return dragHandleRanges.find(dragHandleRange => {
      return dragHandleRange.$from === range.$from && dragHandleRange.$to === range.$to
    })
  })

  let ranges = empty || !isDragHandleWithinSelection ? dragHandleRanges : selectionRanges

  // Fallback for atomic nodes (e.g., horizontal rule) where getSelectionRanges may return empty
  if (!ranges.length && view.state.selection instanceof NodeSelection) {
    ranges = [{ $from: view.state.selection.$from, $to: view.state.selection.$to } as SelectionRange]
  }

  if (!ranges.length) {
    return
  }

  const { tr } = view.state
  const wrapper = document.createElement('div')
  const from = ranges[0].$from.pos
  const to = ranges[ranges.length - 1].$to.pos

  const selection = NodeRangeSelection.create(view.state.doc, from, to)
  const slice = selection.content()

  ranges.forEach(range => {
    const element = view.nodeDOM(range.$from.pos) as HTMLElement
    const clonedElement = cloneElement(element)

    wrapper.append(clonedElement)
  })

  wrapper.style.position = 'absolute'
  wrapper.style.top = '-10000px'
  document.body.append(wrapper)

  event.dataTransfer.clearData()
  event.dataTransfer.setDragImage(wrapper, 0, 0)

  // tell ProseMirror the dragged content
  view.dragging = { slice, move: true }

  // Add dragging class to editor to show highlight
  view.dom.classList.add('dragging')

  tr.setSelection(selection)

  view.dispatch(tr)

  // Helper to remove drop cursor
  const removeDropCursor = () => {
    const el = document.querySelector(".ProseMirror-dropcursor") as HTMLElement;
    if (el) {
      el.style.transition = "opacity 0.5s ease";
      requestAnimationFrame(() => {
        el.style.opacity = "0";
      });
      setTimeout(() => {
        el.remove();
      }, 500);
    }
  }

  // Clean up dragging class and wrapper on drop
  const cleanup = () => {
    view.dom.classList.remove('dragging')
    removeDropCursor()
    removeNode(wrapper)
  }
  
  document.addEventListener('drop', cleanup, { once: true })
  document.addEventListener('dragend', cleanup, { once: true })
}
