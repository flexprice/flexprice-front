import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

export const QUERY_TIMES = {
	REALTIME: 0,
	DEFAULT_STALE: 5 * 60 * 1000,
	DEFAULT_GC: 10 * 60 * 1000,
	STATIC: 30 * 60 * 1000,
} as const;

export interface QueryCacheConfig {
	staleTime: number;
	gcTime: number;
}

export const QUERY_PRESETS = {
	REALTIME: { staleTime: QUERY_TIMES.REALTIME, gcTime: QUERY_TIMES.DEFAULT_GC },
	DEFAULT: { staleTime: QUERY_TIMES.DEFAULT_STALE, gcTime: QUERY_TIMES.DEFAULT_GC },
	STATIC: { staleTime: QUERY_TIMES.STATIC, gcTime: QUERY_TIMES.STATIC },
} as const;

type CacheOverrides = Partial<QueryCacheConfig>;

export const queryClientDefaults = {
	defaultOptions: {
		queries: QUERY_PRESETS.DEFAULT,
	},
} satisfies QueryClientConfig;

export const createQueryClient = (config: QueryClientConfig = {}) =>
	new QueryClient({
		...config,
		defaultOptions: {
			...config.defaultOptions,
			queries: {
				...QUERY_PRESETS.DEFAULT,
				...config.defaultOptions?.queries,
			},
		},
	});

export const createQueryConfig = (preset: keyof typeof QUERY_PRESETS = 'DEFAULT', overrides: CacheOverrides = {}): QueryCacheConfig =>
	({
		...QUERY_PRESETS[preset],
		...overrides,
	});
