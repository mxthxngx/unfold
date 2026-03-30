import { produce } from 'immer';

export type MaybePromise<T> = T | Promise<T>;

type Entry = {
  groupId?: number;
  undo: () => MaybePromise<void>;
  redo: () => MaybePromise<void>;
};

export type UndoRedoStackState = {
  canUndo: boolean;
  canRedo: boolean;
};

/**
 * If this shape is added, `execute` runs after the entry is pushed; `redo` is the same as `execute`.
 */
export type ExecuteUndo = {
  execute: () => MaybePromise<void>;
  undo: () => MaybePromise<void>;
};

export type UndoRedo = {
  undo: () => MaybePromise<void>;
  redo: () => MaybePromise<void>;
};

export type AddOptions = UndoRedo | ExecuteUndo;

type InternalState = {
  entries: Entry[];
  index: number;
  isGrouping: boolean;
  lastGroupId: number;
};

const DEFAULT_MAX_SIZE = 10_000;

function trimToMaxSize(draft: InternalState, maxSize: number) {
  while (draft.entries.length > maxSize) {
    draft.entries.shift();
    draft.index -= 1;
  }
}

/**
 * Single-stack undo/redo with optional grouping (one Cmd+Z collapses a group).
 * `add` matches the classic pattern: push entry, then run `execute` when using {@link ExecuteUndo}.
 */
export class UndoManager {
  private state: InternalState = {
    entries: [],
    index: -1,
    isGrouping: false,
    lastGroupId: 0,
  };

  private readonly maxSize: number;
  private readonly listeners = new Set<(s: UndoRedoStackState) => void>();
  private prevEmitted: UndoRedoStackState = {
    canUndo: false,
    canRedo: false,
  };

  constructor(
    options: {
      maxSize?: number;
      onChange?: (s: UndoRedoStackState) => void;
    } = {},
  ) {
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    if (options.onChange) {
      this.listeners.add(options.onChange);
    }
  }

  get canUndo(): boolean {
    return this.state.index >= 0;
  }

  get canRedo(): boolean {
    return this.state.index < this.state.entries.length - 1;
  }

  subscribe(listener: (s: UndoRedoStackState) => void): () => void {
    listener(this.getStackState());
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Cmd/Ctrl+Z undoes; Cmd+Shift+Z / Cmd+Y redoes when focus is inside `getContainer()` (not INPUT/TEXTAREA).
   * Returns cleanup to remove the window listener.
   */
  attachKeyboardShortcuts(getContainer: () => HTMLElement | null): () => void {
    const onKey = (e: KeyboardEvent) => {
      const el = getContainer();
      if (!el) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (!el.contains(t)) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        void this.undo();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        void this.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }

  private getStackState(): UndoRedoStackState {
    return { canUndo: this.canUndo, canRedo: this.canRedo };
  }

  private emit() {
    const curr = this.getStackState();
    if (
      curr.canRedo !== this.prevEmitted.canRedo ||
      curr.canUndo !== this.prevEmitted.canUndo
    ) {
      this.prevEmitted = curr;
      for (const l of this.listeners) {
        l(curr);
      }
    }
  }

  /**
   * Pushes an undo/redo pair. If `execute` is present ({@link ExecuteUndo}), `redo` is `execute`
   * and `execute` is awaited after the push.
   */
  async add(options: AddOptions): Promise<void> {
    const undo = options.undo;
    const execute =
      'execute' in options ? (options as ExecuteUndo).execute : undefined;
    const redo = 'redo' in options ? (options as UndoRedo).redo : execute;

    if (!redo) return;

    this.state = produce(this.state, (draft) => {
      draft.entries.splice(draft.index + 1);
      draft.entries.push({
        groupId: draft.isGrouping ? draft.lastGroupId : undefined,
        undo,
        redo,
      });
      draft.index += 1;
      trimToMaxSize(draft, this.maxSize);
    });
    this.emit();

    if (execute) {
      await execute();
    }
  }

  async undo(): Promise<void> {
    if (!this.canUndo) return;

    const run = async () => {
      const entry = this.state.entries[this.state.index];
      this.state = produce(this.state, (draft) => {
        draft.index -= 1;
      });
      this.emit();
      const nextEntry = this.state.entries[this.state.index];
      await entry.undo();
      if (
        entry.groupId !== undefined &&
        nextEntry &&
        nextEntry.groupId === entry.groupId
      ) {
        await this.undo();
      }
    };

    await run();
  }

  async redo(): Promise<void> {
    if (!this.canRedo) return;

    const run = async () => {
      const entry = this.state.entries[this.state.index + 1];
      this.state = produce(this.state, (draft) => {
        draft.index += 1;
      });
      this.emit();
      const nextEntry = this.state.entries[this.state.index + 1];
      await entry.redo();
      if (
        entry.groupId !== undefined &&
        nextEntry &&
        nextEntry.groupId === entry.groupId
      ) {
        await this.redo();
      }
    };

    await run();
  }

  startGroup(): void {
    if (this.state.isGrouping) {
      throw new Error('UndoManager is already grouping.');
    }
    this.state = produce(this.state, (draft) => {
      draft.isGrouping = true;
      draft.lastGroupId += 1;
    });
  }

  endGroup(): void {
    this.state = produce(this.state, (draft) => {
      draft.isGrouping = false;
    });
  }

  clear(): void {
    this.state = produce(this.state, (draft) => {
      draft.entries.length = 0;
      draft.index = -1;
    });
    this.emit();
  }
}

let singleton: UndoManager | null = null;

export function getUndoManager(): UndoManager {
  if (!singleton) {
    singleton = new UndoManager();
  }
  return singleton;
}
