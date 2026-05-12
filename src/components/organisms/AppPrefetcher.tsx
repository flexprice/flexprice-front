import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useEnvironment from '@/hooks/useEnvironment';
import { PREFETCH_REGISTRY } from '@/config/prefetch';
import { preloadWebhookDashboard } from '@/pages/webhooks';

const AppPrefetcher = () => {
	const queryClient = useQueryClient();
	const { activeEnvironment } = useEnvironment();

	useEffect(() => {
		if (!activeEnvironment?.id) return;
		const envId = activeEnvironment.id;

		const run = () => {
			// Preload route chunks that are likely to be visited.
			preloadWebhookDashboard().catch(() => {
				// Preload failures should never affect UX
			});

			for (const config of Object.values(PREFETCH_REGISTRY)) {
				const key = config.queryKey(envId);
				if (queryClient.getQueryData(key)) continue;

				queryClient
					.prefetchQuery({
						queryKey: key,
						queryFn: config.queryFn,
						staleTime: config.staleTime,
						gcTime: config.gcTime,
					})
					.catch(() => {
						// Prefetch failures should never affect UX
					});
			}
		};

		// Schedule on browser idle time (fallback for Safari).
		const w = window as unknown as {
			requestIdleCallback?: (cb: () => void, options?: { timeout?: number }) => number;
			cancelIdleCallback?: (id: number) => void;
		};

		if (typeof w.requestIdleCallback === 'function') {
			const id = w.requestIdleCallback(run, { timeout: 3000 });
			return () => w.cancelIdleCallback?.(id);
		}

		const id = window.setTimeout(run, 200);
		return () => window.clearTimeout(id);
	}, [queryClient, activeEnvironment?.id]);

	return null;
};

export default AppPrefetcher;
