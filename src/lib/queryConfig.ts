export const QUERY_PRESETS = {
	REALTIME: { staleTime: 0, gcTime: 60_000 },
	DEFAULT: { staleTime: 5 * 60_000, gcTime: 10 * 60_000 },
	STATIC: { staleTime: 30 * 60_000, gcTime: 60 * 60_000 },
} as const;

/**
 * Creates a structured TanStack Query config with preset stale/gc times and optional overrides.
 *
 * Context: ReactQueryProvider sets staleTime: 0 and gcTime: 0 globally (always-refetch).
 * Use this utility to opt specific queries into a different caching strategy.
 *
 * @example
 * const config = createQueryConfig(() => fetchCustomers(), 'DEFAULT');
 * const { data } = useQuery({ queryKey: ['customers'], ...config });
 */
export function createQueryConfig<T>(
	queryFn: () => Promise<T>,
	preset: keyof typeof QUERY_PRESETS = 'DEFAULT',
	overrides?: Partial<(typeof QUERY_PRESETS)[typeof preset]>,
) {
	return { queryFn, ...QUERY_PRESETS[preset], ...overrides };
}
