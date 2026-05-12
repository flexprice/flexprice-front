import WebhookApi from '@/api/WebhookApi';

/** Canonical query key strings — import this enum in both prefetchConfig and useQuery calls */
export enum PrefetchQueryKey {
	WebhookDashboardUrl = 'webhookDashboardUrl',
}

export interface PrefetchConfig {
	queryKey: (envId: string) => unknown[];
	queryFn: () => Promise<unknown>;
	/** how long cached data stays fresh */
	staleTime: number;
	/** how long cached data stays in memory */
	gcTime: number;
}

export const PREFETCH_REGISTRY = {
	[PrefetchQueryKey.WebhookDashboardUrl]: {
		queryKey: (envId: string) => [PrefetchQueryKey.WebhookDashboardUrl, envId],
		queryFn: async () => await WebhookApi.getWebhookDashboardUrl(),
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	},
} satisfies Record<PrefetchQueryKey, PrefetchConfig>;
