import {
  useQueryClient,
  type MutationFunctionContext,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { isTauri } from '@tauri-apps/api/core';

import { invalidateSpaceNodesQuery } from './node-query-client';
import { nodeQueryKeys } from './query-keys';

import type {
  CreateNodePayload,
  DeleteNodesPayload,
  FlatNodeDto,
  MoveNodesPayload,
  SetPinnedPayload,
  SpaceNotesDto,
  UpdateNodePayload,
  MoveNodesUnpinnedPayload,
  ApplySpaceSnapshotPayload,
} from '@/api/nodes';
import {
  nodesCreate,
  nodesDelete,
  nodesList,
  nodesMove,
  nodesSetPinned,
  nodesUpdate,
  nodesMoveUnpinned,
  nodesApplySpaceSnapshot,
} from '@/api/nodes';
import {
  useAppMutation,
  useSuspenseAppQuery,
} from '@/lib/react-query';

export const emptySpaceNotes: SpaceNotesDto = { nodes: [] };

function nodesQueryOptions(spaceId: string) {
  return {
    queryKey: nodeQueryKeys.space(spaceId),
    queryFn: async (): Promise<SpaceNotesDto> => {
      if (!isTauri()) {
        return emptySpaceNotes;
      }
      const res = await nodesList(spaceId);
      console.log('res', res);
      return res;
    },
  };
}

function withSpaceQueryInvalidation<
  TData,
  TVariables extends { spaceId: string },
  TContext = unknown,
>(
  qc: ReturnType<typeof useQueryClient>,
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables, TContext>,
) {
  const { onSuccess, ...restOptions } = options ?? {};

  return {
    mutationFn,
    ...restOptions,
    async onSuccess(
      data: TData,
      variables: TVariables,
      onMutateResult: TContext | undefined,
      context: MutationFunctionContext,
    ) {
      await invalidateSpaceNodesQuery(qc, variables.spaceId);
      return onSuccess?.(data, variables, onMutateResult as TContext, context);
    },
  };
}


/** For use under `React.Suspense` — suspends until nodes are available; `data` is always defined when rendered. */
export function useNodesSuspenseQuery(spaceId: string) {
  return useSuspenseAppQuery(nodesQueryOptions(spaceId));
}

export function useCreateNodeMutation(
  options?: UseMutationOptions<FlatNodeDto, Error, CreateNodePayload>,
) {
  const qc = useQueryClient();
  return useAppMutation(withSpaceQueryInvalidation(qc, nodesCreate, options));
}

export function useUpdateNodeMutation(
  options?: UseMutationOptions<FlatNodeDto, Error, UpdateNodePayload>,
) {
  const qc = useQueryClient();
  return useAppMutation(withSpaceQueryInvalidation(qc, nodesUpdate, options));
}

export function useMoveNodesMutation(
  options?: UseMutationOptions<void, Error, MoveNodesPayload>,
) {
  const qc = useQueryClient();
  return useAppMutation(withSpaceQueryInvalidation(qc, nodesMove, options));
}

export function useMoveNodesUnpinnedMutation(
  options?: UseMutationOptions<void, Error, MoveNodesUnpinnedPayload>,
) {
  const qc = useQueryClient();
  return useAppMutation(
    withSpaceQueryInvalidation(qc, nodesMoveUnpinned, options),
  );
}

export function useApplySpaceSnapshotMutation(
  options?: UseMutationOptions<void, Error, ApplySpaceSnapshotPayload>,
) {
  const qc = useQueryClient();
  return useAppMutation(
    withSpaceQueryInvalidation(qc, nodesApplySpaceSnapshot, options),
  );
}

export function useDeleteNodesMutation(
  options?: UseMutationOptions<void, Error, DeleteNodesPayload>,
) {
  const qc = useQueryClient();
  return useAppMutation(withSpaceQueryInvalidation(qc, nodesDelete, options));
}

export function useSetPinnedMutation(
  options?: UseMutationOptions<void, Error, SetPinnedPayload>,
) {
  const qc = useQueryClient();
  return useAppMutation(
    withSpaceQueryInvalidation(qc, nodesSetPinned, options),
  );
}
