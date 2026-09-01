import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, Card, Loader, Tooltip } from '@/components/atoms';
import { SettingsCardHeader, WalletAlertThresholdCard } from '@/components/molecules';
import type { WalletAlertThresholdCardLabels } from '@/components/molecules/WalletAlertThresholdCard';
import { Switch } from '@/components/ui/switch';
import { WalletAlertLevel, type WalletAlertSettings } from '@/models/Wallet';
import {
	addWalletAlertThreshold,
	getWalletAlertValidationErrorKey,
	isWalletAlertConditionDisabled,
	normalizeWalletAlertSettingsForSave,
	updateWalletAlertThreshold,
} from '@/utils/wallet/walletAlertUtils';
import { useWalletAlertSettings } from './useWalletAlertSettings';
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions';

const ALERT_LEVELS = [WalletAlertLevel.CRITICAL, WalletAlertLevel.WARNING, WalletAlertLevel.INFO] as const;

const WalletAlertSettingsSection = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { settings, isLoading, updateSettings } = useWalletAlertSettings();
	const { can, isSuperAdmin } = useCurrentUserPermissions();
	// Backed by SettingsApi (a generic settings key), whose PUT the backend restricts to Super
	// Admin regardless of alert_settings:write — see SamlSsoTab's own settings-gating note.
	const canWriteAlertSettings = can('alert_settings', 'write') && isSuperAdmin;
	const [draft, setDraft] = useState<WalletAlertSettings>(settings);

	useEffect(() => {
		setDraft(settings);
	}, [settings]);

	const getLevelLabels = (level: WalletAlertLevel): WalletAlertThresholdCardLabels => ({
		title: t(`alerts.walletAlerts.levels.${level}`),
		description: t(`alerts.walletAlerts.levelDescriptions.${level}`),
		add: t('alerts.walletAlerts.add'),
		remove: t('alerts.walletAlerts.remove'),
		thresholdValue: t('alerts.walletAlerts.thresholdValue', { currency: 'USD' }),
		condition: t('alerts.walletAlerts.condition'),
		conditionBelow: t('alerts.walletAlerts.conditions.below'),
		conditionAbove: t('alerts.walletAlerts.conditions.above'),
		amountPlaceholder: t('alerts.walletAlerts.amountPlaceholder'),
	});

	const handleSave = () => {
		const normalized = normalizeWalletAlertSettingsForSave(draft);
		const validationErrorKey = getWalletAlertValidationErrorKey(normalized);

		if (validationErrorKey) {
			toast.error(t(`alerts.walletAlerts.validation.${validationErrorKey}`));
			return;
		}

		updateSettings.mutate(normalized, {
			onSuccess: () => toast.success(t('alerts.walletAlerts.saveSuccess')),
			onError: () => toast.error(t('alerts.walletAlerts.saveError')),
		});
	};

	// Denied users could still flip the switch and edit thresholds — pointless since they can't
	// save, and misleading since nothing indicates why. Fold the permission check into the same
	// disabled state as the pending-save one.
	const isReadOnly = !canWriteAlertSettings || updateSettings.isPending;
	const isDisabled = !draft.alert_enabled || isReadOnly;
	const alertsTitle = t('alerts.walletAlerts.title');

	return (
		<Card variant='default' noPadding className='rounded-xl border-line bg-surface shadow-sm'>
			<div className='px-6 pt-6'>
				<SettingsCardHeader
					title={alertsTitle}
					infoDescription={t('alerts.walletAlerts.description')}
					infoAriaLabel={t('info.ariaLabel', { field: alertsTitle })}
					titleClassName='text-lg font-medium text-content-zinc-strong'
					className='mb-2'
					cta={
						<Switch
							checked={draft.alert_enabled ?? false}
							onCheckedChange={(enabled) => setDraft((prev) => ({ ...prev, alert_enabled: enabled }))}
							disabled={isLoading || isReadOnly}
							aria-label={alertsTitle}
						/>
					}
				/>
			</div>
			{isLoading ? (
				<div className='flex min-h-[200px] items-center justify-center'>
					<Loader />
				</div>
			) : (
				<div className='space-y-6 px-6 pb-6 pt-6'>
					<div className='space-y-4'>
						{ALERT_LEVELS.map((level) => (
							<WalletAlertThresholdCard
								key={level}
								threshold={draft[level]}
								labels={getLevelLabels(level)}
								conditionDisabled={isWalletAlertConditionDisabled(level, draft)}
								disabled={isDisabled}
								onAdd={() => setDraft((prev) => addWalletAlertThreshold(prev, level))}
								onRemove={() => setDraft((prev) => updateWalletAlertThreshold(prev, level, null))}
								onThresholdChange={(value) => setDraft((prev) => updateWalletAlertThreshold(prev, level, { threshold: value }))}
								onConditionChange={(value) => setDraft((prev) => updateWalletAlertThreshold(prev, level, { condition: value }))}
							/>
						))}
					</div>
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
				</div>
			)}
		</Card>
	);
};

export default WalletAlertSettingsSection;
