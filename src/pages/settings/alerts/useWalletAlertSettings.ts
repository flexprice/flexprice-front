import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import SettingsApi from '@/api/SettingsApi';
import { WalletAlertSettings } from '@/models/Wallet';
import { SETTINGS_KEYS } from '../constants';
import { settingsQueryKeys } from '../queryKeys';

const DEFAULT_WALLET_ALERT_SETTINGS: WalletAlertSettings = {
	alert_enabled: false,
	critical: null,
	warning: null,
	info: null,
};

async function fetchWalletAlertSettings(): Promise<WalletAlertSettings> {
	try {
		const setting = await SettingsApi.getSettingByKey(SETTINGS_KEYS.WALLET_BALANCE_ALERT_CONFIG);
		return (setting.value as WalletAlertSettings) ?? DEFAULT_WALLET_ALERT_SETTINGS;
	} catch {
		return DEFAULT_WALLET_ALERT_SETTINGS;
	}
}

export function useWalletAlertSettings() {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: settingsQueryKeys.walletBalanceAlertConfig,
		queryFn: fetchWalletAlertSettings,
	});

	const updateSettings = useMutation({
		mutationFn: async (settings: WalletAlertSettings) => {
			await SettingsApi.updateSettingByKey(SETTINGS_KEYS.WALLET_BALANCE_ALERT_CONFIG, { value: settings });
			return settings;
		},
		onSuccess: (settings) => {
			queryClient.setQueryData(settingsQueryKeys.walletBalanceAlertConfig, settings);
		},
	});

	return {
		settings: query.data ?? DEFAULT_WALLET_ALERT_SETTINGS,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
		updateSettings,
	};
}
