import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FxRateApi from '@/api/FxRateApi';
import type { ForexRateFormValues } from '@/components/molecules/ForexRateModal';
import type { FxRateScope } from '@/models/FxRate';
import type { UpdateFxRateRequest } from '@/types/dto/FxRate';

/** First query-key element of every customer / subscription override list; refetch with this prefix. */
export const FX_OVERRIDES_KEY = 'fx-overrides';

/** The entity an override list belongs to. Tenant rates are listed by Settings › Billing instead. */
export interface FxOverrideOwner {
	scope: Exclude<FxRateScope, 'tenant'>;
	scopeId: string;
}

const sameInstant = (a?: string, b?: string) => (a && b ? new Date(a).getTime() === new Date(b).getTime() : a === b);

/** Fields that changed; a cleared date is not sent because the backend cannot clear one. */
export const diffOverride = (original: ForexRateFormValues, next: ForexRateFormValues): UpdateFxRateRequest => {
	const update: UpdateFxRateRequest = {};
	if (next.rate !== original.rate) update.rate = next.rate;
	if (next.start_date && !sameInstant(next.start_date, original.start_date)) update.start_date = next.start_date;
	if (next.end_date && !sameInstant(next.end_date, original.end_date)) update.end_date = next.end_date;
	return update;
};

/** One page of a server-paginated FX rate list. */
export interface FxPageArgs {
	page: number;
	limit: number;
	offset: number;
}

export function useScopedFxOverrides({ scope, scopeId }: FxOverrideOwner, { page, limit, offset }: FxPageArgs) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: [FX_OVERRIDES_KEY, scope, scopeId, page],
		queryFn: () => FxRateApi.queryFxRates({ scope, scope_id: scopeId, limit, offset }),
		enabled: !!scopeId,
	});

	const invalidate = () => queryClient.invalidateQueries({ queryKey: [FX_OVERRIDES_KEY, scope, scopeId] });

	const createOverride = useMutation({
		mutationFn: (values: ForexRateFormValues) =>
			FxRateApi.createFxRate({
				scope,
				scope_id: scopeId,
				from_currency: values.from_currency,
				to_currency: values.to_currency,
				rate: values.rate,
				...(values.start_date ? { start_date: values.start_date } : {}),
				...(values.end_date ? { end_date: values.end_date } : {}),
			}),
		onSuccess: invalidate,
	});

	const updateOverride = useMutation({
		mutationFn: ({ id, original, values }: { id: string; original: ForexRateFormValues; values: ForexRateFormValues }) =>
			FxRateApi.updateFxRate(id, diffOverride(original, values)),
		onSuccess: invalidate,
	});

	const deleteOverride = async (id: string) => {
		await FxRateApi.deleteFxRate(id);
	};

	return {
		overrides: query.data?.items ?? [],
		total: query.data?.pagination?.total ?? 0,
		isLoading: query.isLoading,
		isError: query.isError,
		createOverride,
		updateOverride,
		deleteOverride,
	};
}
