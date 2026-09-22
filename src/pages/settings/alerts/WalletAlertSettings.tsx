import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, Card, Loader, Tooltip } from '@/components/atoms';
import { SettingsCardHeader, WalletAlertThresholdSection } from '@/components/molecules';
import type { WalletAlertThresholdSectionLabels } from '@/components/molecules/WalletAlertThresholdSection';
import { Switch } from '@/components/ui/switch';
import { WalletAlertLevel } from '@/models/Wallet';
import {
	fromWalletAlertDraftForSave,
	getWalletAlertValidationErrorKey,
	setWalletAlertDraftEnabled,
	toWalletAlertDraft,
	toWalletAlertSettingsForValidation,
} from '@/utils/wallet/walletAlertUtils';
import { useWalletAlertSettings } from './useWalletAlertSettings';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';

const WalletAlertSettingsSection = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { settings, isLoading, updateSettings } = useWalletAlertSettings();
	const { can, isSuperAdmin } = useCurrentUserPermissions();
	// Backed by SettingsApi (a generic settings key), whose PUT the backend restricts to Super
	// Admin regardless of alert_settings:write — see SamlSsoTab's own settings-gating note.
	const canWriteAlertSettings = can('alert_settings', 'write') && isSuperAdmin;
	const [draft, setDraft] = useState(() => toWalletAlertDraft(settings));

	useEffect(() => {
		setDraft(toWalletAlertDraft(settings));
	}, [settings]);

	// No currency symbol here: these are tenant-wide defaults that apply to wallets in any
	// currency, so the unit selector's "Currency" label is what identifies the mode.
	const thresholdLabels: WalletAlertThresholdSectionLabels = {
		thresholdType: t('alerts.walletAlerts.thresholdTypeLabel'),
		thresholdTypeTooltip: (
			<>
				<span className='block'>{t('alerts.walletAlerts.thresholdTypeTooltipAbsolute')}</span>
				<span className='mt-1.5 block'>{t('alerts.walletAlerts.thresholdTypeTooltipPercentage')}</span>
			</>
		),
		thresholdTypeAbsolute: t('alerts.walletAlerts.thresholdTypeAbsolute'),
		thresholdTypePercentage: t('alerts.walletAlerts.thresholdTypePercentage'),
		rowDescription: t('alerts.walletAlerts.rowDescription'),
		amountPlaceholder: t('alerts.walletAlerts.amountPlaceholder'),
		levels: {
			[WalletAlertLevel.CRITICAL]: t('alerts.walletAlerts.levels.critical'),
			[WalletAlertLevel.WARNING]: t('alerts.walletAlerts.levels.warning'),
			[WalletAlertLevel.INFO]: t('alerts.walletAlerts.levels.info'),
		},
	};

	const handleSave = () => {
		// Validate against the raw draft so invalid values (e.g. 'abc') produce the correct
		// 'invalidXxxThreshold' error rather than 'atLeastOneThreshold' — normalization would
		// silently drop NaN values before the validator sees them.
		const validationErrorKey = getWalletAlertValidationErrorKey(toWalletAlertSettingsForValidation(draft));

		if (validationErrorKey) {
			toast.error(t(`alerts.walletAlerts.validation.${validationErrorKey}`));
			return;
		}

		const normalized = fromWalletAlertDraftForSave(draft);

		updateSettings.mutate(normalized, {
			onSuccess: () => toast.success(t('alerts.walletAlerts.saveSuccess')),
			onError: () => toast.error(t('alerts.walletAlerts.saveError')),
		});
	};

	const isDisabled = !draft.alert_enabled || updateSettings.isPending;
	const alertsTitle = t('alerts.walletAlerts.title');

	// Same Card chrome as every sibling settings section (Theme, Customer Portal, SAML SSO) so the
	// tabs match; the compact interior spacing is what keeps it from feeling like a nested card.
	return (
		<Card variant='default' noPadding className='rounded-xl border-line bg-surface shadow-sm'>
			<div className='space-y-5 p-6'>
				<SettingsCardHeader
					title={alertsTitle}
					infoDescription={t('alerts.walletAlerts.description')}
					infoAriaLabel={t('info.ariaLabel', { field: alertsTitle })}
					titleClassName='text-lg font-medium text-content-zinc-strong'
					className='mb-0'
					cta={
						<Switch
							checked={draft.alert_enabled}
							onCheckedChange={(enabled) => setDraft((prev) => setWalletAlertDraftEnabled(prev, enabled))}
							disabled={isLoading || updateSettings.isPending}
							aria-label={alertsTitle}
						/>
					}
				/>
				{isLoading ? (
					<div className='flex min-h-[160px] items-center justify-center'>
						<Loader />
					</div>
				) : (
					<>
						<WalletAlertThresholdSection draft={draft} labels={thresholdLabels} disabled={isDisabled} onChange={setDraft} />
						<div className='flex justify-end'>
							{canWriteAlertSettings ? (
								<Button onClick={handleSave} isLoading={updateSettings.isPending} disabled={updateSettings.isPending}>
									{t('alerts.walletAlerts.saveChanges')}
								</Button>
							) : (
								<Tooltip content={t('superAdmin.writeDeniedTooltip')}>
									<span tabIndex={0} className='inline-block'>
										<Button disabled>{t('alerts.walletAlerts.saveChanges')}</Button>
									</span>
								</Tooltip>
							)}
						</div>
					</>
				)}
			</div>
		</Card>
	);
};

export default WalletAlertSettingsSection;
