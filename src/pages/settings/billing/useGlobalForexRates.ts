import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FxRateApi from '@/api/FxRateApi';
import type { ForexRateFormValues } from '@/components/molecules/ForexRateModal';
import useEnvironment from '@/hooks/useEnvironment';
import type { FxPageArgs } from '@/hooks/useScopedFxOverrides';
import { settingsQueryKeys } from '../queryKeys';

export function useGlobalForexRates({ page, limit, offset }: FxPageArgs) {
	const queryClient = useQueryClient();
	const { activeEnvironment } = useEnvironment();
	const environmentId = activeEnvironment?.id;

	const query = useQuery({
		queryKey: settingsQueryKeys.forexRates(environmentId, page, limit, offset),
		queryFn: () => FxRateApi.queryFxRates({ scope: 'tenant', limit, offset }),
		enabled: !!environmentId,
	});

	const invalidate = () => queryClient.invalidateQueries({ queryKey: settingsQueryKeys.forexRatesRoot(environmentId) });

	const createRate = useMutation({
		mutationFn: (values: ForexRateFormValues) =>
			FxRateApi.createFxRate({ scope: 'tenant', from_currency: values.from_currency, to_currency: values.to_currency, rate: values.rate }),
		onSuccess: invalidate,
	});

	const updateRate = useMutation({
		mutationFn: ({ id, rate }: { id: string; rate: string }) => FxRateApi.updateFxRate(id, { rate }),
		onSuccess: invalidate,
	});

	return {
		rates: query.data?.items ?? [],
		total: query.data?.pagination?.total ?? 0,
		isLoading: query.isLoading,
		isError: query.isError,
		createRate,
		updateRate,
	};
}
