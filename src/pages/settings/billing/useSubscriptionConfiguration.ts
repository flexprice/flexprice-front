import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsApi from '@/api/SettingsApi';
import {
	FALLBACK_SUBSCRIPTION_CONFIG,
	parseSubscriptionConfig,
	serializeSubscriptionConfig,
	type SubscriptionConfig,
} from '@/types/dto/BillingSettings';
import { SETTINGS_KEYS } from '../constants';
import { settingsQueryKeys } from '../queryKeys';

async function fetchSubscriptionConfiguration(): Promise<SubscriptionConfig> {
	try {
		const setting = await SettingsApi.getSettingByKey(SETTINGS_KEYS.SUBSCRIPTION_CONFIG);
		return parseSubscriptionConfig(setting.value);
	} catch {
		return FALLBACK_SUBSCRIPTION_CONFIG;
	}
}

export function useSubscriptionConfiguration() {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: settingsQueryKeys.subscriptionConfig,
		queryFn: fetchSubscriptionConfiguration,
	});

	const updateConfiguration = useMutation({
		mutationFn: async (configuration: SubscriptionConfig) => {
			const payload = serializeSubscriptionConfig(configuration);
			await SettingsApi.updateSettingByKey(SETTINGS_KEYS.SUBSCRIPTION_CONFIG, { value: payload });
			return payload;
		},
		onSuccess: (configuration) => {
			queryClient.setQueryData(settingsQueryKeys.subscriptionConfig, configuration);
		},
	});

	const configuration = query.data ?? FALLBACK_SUBSCRIPTION_CONFIG;

	return {
		configuration,
		savedConfiguration: configuration,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
		updateConfiguration,
	};
}
