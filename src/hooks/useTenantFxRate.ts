import { useQuery } from '@tanstack/react-query';
import FxRateApi from '@/api/FxRateApi';

/** The tenant (global) rate for a pair; null when none is configured. */
export const useTenantFxRate = (from?: string, to?: string) =>
	useQuery({
		queryKey: ['tenant-fx-rate', from, to],
		queryFn: async () => {
			const response = await FxRateApi.queryFxRates({
				scope: 'tenant',
				from_currency: from!.toLowerCase(),
				to_currency: to!.toLowerCase(),
				limit: 1,
				offset: 0,
			});
			return response.items[0] ?? null;
		},
		enabled: !!from && !!to,
	});
