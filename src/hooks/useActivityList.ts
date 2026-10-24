import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import ActivityApi from '@/api/ActivityApi';
import { ActivityQuery, ActivityScope, scopeToQuery } from '@/types/dto/ActivityLog';

interface Options {
	scope: ActivityScope;
	query?: Partial<ActivityQuery>;
	pageSize?: number;
	enabled?: boolean;
}

export const activityQueryKey = (scope: ActivityScope, query: Partial<ActivityQuery>, pageSize: number) =>
	['activity', 'list', scope, query, pageSize] as const;

const useActivityList = ({ scope, query = {}, pageSize = 50, enabled = true }: Options) => {
	const base = useMemo(() => ({ ...scopeToQuery(scope), ...query, limit: pageSize }), [scope, query, pageSize]);
	const result = useInfiniteQuery({
		queryKey: activityQueryKey(scope, query, pageSize),
		queryFn: ({ pageParam }) => ActivityApi.list({ ...base, cursor: pageParam || undefined }),
		initialPageParam: '',
		getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
		enabled,
	});
	const items = useMemo(() => result.data?.pages.flatMap((p) => p.items) ?? [], [result.data]);
	return {
		items,
		fetchNextPage: result.fetchNextPage,
		hasNextPage: !!result.hasNextPage,
		isLoading: result.isLoading,
		isFetchingNextPage: result.isFetchingNextPage,
		error: result.error,
		refetch: result.refetch,
	};
};

export default useActivityList;
