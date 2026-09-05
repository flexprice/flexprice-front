import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import SettingsApi from '@/api/SettingsApi';
import useEnvironment from '@/hooks/useEnvironment';
import { parseCustomCurrencyConfig, toCustomCurrencyDisplay, type CustomCurrencyConfig } from '@/types/dto/CustomCurrency';
import { setCustomCurrencies } from '@/utils/common/custom_currency';
import { SETTINGS_KEYS } from '@/pages/settings/constants';
import { settingsQueryKeys } from '@/pages/settings/queryKeys';

/**
 * Loads the tenant's custom currencies and publishes their symbols to the currency
 * formatters. Mounted once for the app; the setting is scoped per environment, so the
 * query is keyed by it and the registry is cleared while a new one loads.
 */
export const useCustomCurrencyConfig = (): { config: CustomCurrencyConfig; isLoading: boolean } => {
	const { activeEnvironment } = useEnvironment();
	const environmentId = activeEnvironment?.id;

	const { data, isLoading } = useQuery({
		queryKey: settingsQueryKeys.customCurrencyConfig(environmentId),
		queryFn: async () => {
			const setting = await SettingsApi.getSettingByKey(SETTINGS_KEYS.CUSTOM_CURRENCY_CONFIG);
			return parseCustomCurrencyConfig(setting?.value);
		},
		enabled: !!environmentId,
		staleTime: 5 * 60 * 1000,
	});

	useEffect(() => {
		if (!environmentId) return;
		// Cleared on environment change so a previous tenant's symbols are never shown
		// against another environment's amounts.
		setCustomCurrencies(data ? toCustomCurrencyDisplay(data) : {});
	}, [data, environmentId]);

	return {
		config: data ?? { custom_currencies: {}, default_fiat_currency: '' },
		isLoading,
	};
};

export default useCustomCurrencyConfig;
