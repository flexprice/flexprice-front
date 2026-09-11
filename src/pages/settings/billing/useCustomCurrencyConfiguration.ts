import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsApi from '@/api/SettingsApi';
import useEnvironment from '@/hooks/useEnvironment';
import {
	EMPTY_CUSTOM_CURRENCY_DRAFT,
	parseCustomCurrencyConfig,
	serializeCustomCurrencyConfig,
	toCustomCurrencyDraft,
	type CustomCurrencyDraft,
} from '@/types/dto/CustomCurrency';
import { SETTINGS_KEYS } from '../constants';
import { settingsQueryKeys } from '../queryKeys';

export function useCustomCurrencyConfiguration() {
	const queryClient = useQueryClient();
	const { activeEnvironment } = useEnvironment();
	const environmentId = activeEnvironment?.id;

	const query = useQuery({
		queryKey: settingsQueryKeys.customCurrencyConfig(environmentId),
		// useCustomCurrencyConfig shares this key and reads the cached value as a
		// CustomCurrencyConfig, so this must cache that shape and not the editor draft.
		queryFn: async () => {
			const setting = await SettingsApi.getSettingByKey(SETTINGS_KEYS.CUSTOM_CURRENCY_CONFIG);
			return parseCustomCurrencyConfig(setting?.value);
		},
		enabled: !!environmentId,
	});

	// Memoised because the section copies it into a draft from an effect keyed on it.
	const savedConfiguration = useMemo(
		() => (query.data ? toCustomCurrencyDraft(query.data) : EMPTY_CUSTOM_CURRENCY_DRAFT),
		[query.data],
	);

	const updateConfiguration = useMutation({
		mutationFn: async (draft: CustomCurrencyDraft) => {
			await SettingsApi.updateSettingByKey(SETTINGS_KEYS.CUSTOM_CURRENCY_CONFIG, {
				value: serializeCustomCurrencyConfig(draft),
			});
			return draft;
		},
		onSuccess: () => {
			// The symbols published to the currency formatters come from this key too.
			queryClient.invalidateQueries({ queryKey: settingsQueryKeys.customCurrencyConfig(environmentId) });
		},
	});

	return {
		savedConfiguration,
		// A disabled query is not "loading" in TanStack v5 (isLoading is isPending && isFetching), so
		// without the environment guard the section renders an empty draft as if it were the saved
		// config — and saving that blank form wipes the tenant's configured currencies.
		isLoading: !environmentId || query.isPending,
		isError: query.isError,
		updateConfiguration,
	};
}
