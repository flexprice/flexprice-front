import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsApi from '@/api/SettingsApi';
import { DEFAULT_PORTAL_CONFIG, deepMergePortalConfig, type PortalConfig } from '@/types/dto/PortalConfig';
import { SETTINGS_KEYS } from '../constants';
import { settingsQueryKeys } from '../queryKeys';

async function fetchCustomerPortalConfig(): Promise<PortalConfig> {
	try {
		const setting = await SettingsApi.getSettingByKey(SETTINGS_KEYS.CUSTOMER_PORTAL_CONFIG);
		return deepMergePortalConfig(DEFAULT_PORTAL_CONFIG, setting.value as Partial<PortalConfig>);
	} catch {
		return DEFAULT_PORTAL_CONFIG;
	}
}

export function useCustomerPortalConfig() {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: settingsQueryKeys.customerPortalConfig,
		queryFn: fetchCustomerPortalConfig,
	});

	const updateConfig = useMutation({
		mutationFn: async (config: PortalConfig) => {
			await SettingsApi.updateSettingByKey(SETTINGS_KEYS.CUSTOMER_PORTAL_CONFIG, { value: config });
			return config;
		},
		onSuccess: (config) => {
			queryClient.setQueryData(settingsQueryKeys.customerPortalConfig, config);
		},
	});

	return {
		config: query.data ?? DEFAULT_PORTAL_CONFIG,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
		updateConfig,
	};
}
