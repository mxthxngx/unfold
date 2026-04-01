import { invoke } from '@tauri-apps/api/core';

/** One node row (same shape as DB and `nodes_list` payload). */
export type FlatNode = {
  id: string;
  spaceId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  isPinned: boolean;
};

/** Alias for the same flat row — use for sidebar UI and API interchangeably. */
export type TreeNode = FlatNode;

/** Space: all node rows in stable list order (matches SQL: parent, sort, name). */
export type SpaceNotesDto = {
  nodes: FlatNode[];
};

export type CreateNodePayload = {
  spaceId: string;
  parentId: string | null;
  name: string;
};

export type UpdateNodePayload = {
  spaceId: string;
  id: string;
  name?: string;
};

export type MoveNodesPayload = {
  spaceId: string;
  nodeIds: string[];
  newParentId: string | null;
};

export type DeleteNodesPayload = {
  spaceId: string;
  nodeIds: string[];
};

export type SetPinnedPayload = {
  spaceId: string;
  nodeIds: string[];
  isPinned: boolean;
};

export type MoveNodesUnpinnedPayload = {
  spaceId: string;
  nodeIds: string[];
  newParentId: string | null;
  insertBeforeId: string | null;
};

export type ApplySpaceSnapshotPayload = {
  spaceId: string;
  nodes: FlatNode[];
};

export async function nodesList(spaceId: string): Promise<SpaceNotesDto> {
  return invoke<SpaceNotesDto>('nodes_list', { spaceId });
}

export async function nodesCreate(
  payload: CreateNodePayload,
): Promise<FlatNode> {
  return invoke<FlatNode>('nodes_create', { request: payload });
}

export async function nodesUpdate(
  payload: UpdateNodePayload,
): Promise<FlatNode> {
  return invoke<FlatNode>('nodes_update', { request: payload });
}

export async function nodesMove(payload: MoveNodesPayload): Promise<void> {
  return invoke<void>('nodes_move', { request: payload });
}

export async function nodesDelete(payload: DeleteNodesPayload): Promise<void> {
  return invoke<void>('nodes_delete', { request: payload });
}

export async function nodesSetPinned(payload: SetPinnedPayload): Promise<void> {
  return invoke<void>('nodes_set_pinned', { request: payload });
}

export async function nodesMoveUnpinned(
  payload: MoveNodesUnpinnedPayload,
): Promise<void> {
  return invoke<void>('nodes_move_unpinned', { request: payload });
}

export async function nodesApplySpaceSnapshot(
  payload: ApplySpaceSnapshotPayload,
): Promise<void> {
  return invoke<void>('nodes_apply_space_snapshot', { request: payload });
}
