import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsApi from '@/api/SettingsApi';
import { FALLBACK_INVOICE_CONFIG, parseInvoiceConfig, serializeInvoiceConfig, type InvoiceConfig } from '@/types/dto/BillingSettings';
import { SETTINGS_KEYS } from '../constants';
import { settingsQueryKeys } from '../queryKeys';

async function fetchInvoiceConfiguration(): Promise<InvoiceConfig> {
	const setting = await SettingsApi.getSettingByKey(SETTINGS_KEYS.INVOICE_CONFIG);
	return parseInvoiceConfig(setting.value);
}

export function useInvoiceConfiguration() {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: settingsQueryKeys.invoiceConfig,
		queryFn: fetchInvoiceConfiguration,
	});

	const updateConfiguration = useMutation({
		mutationFn: async (configuration: InvoiceConfig) => {
			const payload = serializeInvoiceConfig(configuration);
			const setting = await SettingsApi.updateSettingByKey(SETTINGS_KEYS.INVOICE_CONFIG, { value: payload });
			return parseInvoiceConfig(setting.value);
		},
		onSuccess: (configuration) => {
			queryClient.setQueryData(settingsQueryKeys.invoiceConfig, configuration);
		},
	});

	const resetToDefaults = useMutation({
		mutationFn: async () => {
			const setting = await SettingsApi.resetSettingToDefaults(SETTINGS_KEYS.INVOICE_CONFIG);
			return parseInvoiceConfig(setting.value);
		},
		onSuccess: (configuration) => {
			queryClient.setQueryData(settingsQueryKeys.invoiceConfig, configuration);
		},
	});

	const configuration = query.data ?? FALLBACK_INVOICE_CONFIG;

	return {
		configuration,
		savedConfiguration: configuration,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
		updateConfiguration,
		resetToDefaults,
	};
}
