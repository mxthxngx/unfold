import type { QueryClient } from '@tanstack/react-query';

import { nodeQueryKeys } from './query-keys';

import type { FlatNodeDto, SpaceNotesDto } from '@/api/nodes';

/** Returns a shallow copy of cached flat nodes for undo snapshots, or `undefined` if missing. */
export function getSpaceNodesSnapshot(
  qc: QueryClient,
  spaceId: string,
): FlatNodeDto[] | undefined {
  const data = qc.getQueryData<SpaceNotesDto>(nodeQueryKeys.space(spaceId));
  if (!data?.nodes) return undefined;
  return data.nodes.map((n) => ({ ...n }));
}

/** Marks the space nodes query stale so React Query refetches. */
export function invalidateSpaceNodesQuery(qc: QueryClient, spaceId: string) {
  return qc.invalidateQueries({
    queryKey: nodeQueryKeys.space(spaceId),
  });
}
