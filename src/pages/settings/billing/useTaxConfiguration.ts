import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsApi from '@/api/SettingsApi';
import { FALLBACK_TAX_CONFIG, parseTaxConfig, serializeTaxConfig, type TaxConfig } from '@/types/dto/TaxSettings';
import { SETTINGS_KEYS } from '../constants';
import { settingsQueryKeys } from '../queryKeys';

/**
 * Reads the effective tax configuration.
 *
 * A failed read resolves to the native engine, matching how the sibling billing
 * sections treat theirs: the key is absent for every environment that has never
 * configured an external engine, which is most of them.
 */
async function fetchTaxConfiguration(): Promise<TaxConfig> {
	try {
		const setting = await SettingsApi.getSettingByKey(SETTINGS_KEYS.TAX_CONFIG);
		return parseTaxConfig(setting?.value);
	} catch {
		return FALLBACK_TAX_CONFIG;
	}
}

export function useTaxConfiguration() {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: settingsQueryKeys.taxConfig,
		queryFn: fetchTaxConfiguration,
	});

	const updateConfiguration = useMutation({
		mutationFn: async (configuration: TaxConfig) => {
			const payload = serializeTaxConfig(configuration);
			await SettingsApi.updateSettingByKey(SETTINGS_KEYS.TAX_CONFIG, { value: payload });
			return payload;
		},
		onSuccess: (configuration) => {
			queryClient.setQueryData(settingsQueryKeys.taxConfig, configuration);
		},
	});

	const configuration = query.data ?? FALLBACK_TAX_CONFIG;

	return {
		configuration,
		savedConfiguration: configuration,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
		updateConfiguration,
	};
}
