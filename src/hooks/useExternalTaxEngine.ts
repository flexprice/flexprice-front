import { useQuery } from '@tanstack/react-query';
import SettingsApi from '@/api/SettingsApi';
import { FALLBACK_TAX_CONFIG, parseTaxConfig, usesExternalTaxEngine } from '@/types/dto/TaxSettings';
import { SETTINGS_KEYS } from '@/pages/settings/constants';
import { settingsQueryKeys } from '@/pages/settings/queryKeys';

/**
 * Whether an engine outside Flexprice calculates this environment's tax.
 *
 * Read wherever the UI offers to link a Flexprice tax rate, because the backend
 * refuses those calls while an external engine is in force: `CreateTaxAssociation`
 * rejects outright, and subscription/invoice creation rejects any
 * `tax_rate_overrides`. Both come back as a plain validation error, so without
 * this the dashboard keeps offering controls that cannot succeed and the only
 * feedback is a toast after the attempt.
 *
 * A failed read resolves to the native engine — the same direction the settings
 * section takes. Hiding tax controls because a settings read blipped would be
 * worse than leaving them up: the backend still refuses the write, so the
 * failure mode is the toast the user gets today, not a wrong tax.
 */
export function useExternalTaxEngine(): { isExternal: boolean; provider: string; isLoading: boolean } {
	const { data, isLoading } = useQuery({
		queryKey: settingsQueryKeys.taxConfig,
		queryFn: async () => {
			try {
				const setting = await SettingsApi.getSettingByKey(SETTINGS_KEYS.TAX_CONFIG);
				return parseTaxConfig(setting?.value);
			} catch {
				return FALLBACK_TAX_CONFIG;
			}
		},
		staleTime: 5 * 60 * 1000,
	});

	const config = data ?? FALLBACK_TAX_CONFIG;

	return {
		isExternal: usesExternalTaxEngine(config),
		provider: config.provider,
		isLoading,
	};
}

export default useExternalTaxEngine;
