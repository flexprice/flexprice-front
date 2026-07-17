import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, Card, Loader } from '@/components/atoms';
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

const ALERT_LEVELS = [WalletAlertLevel.CRITICAL, WalletAlertLevel.WARNING, WalletAlertLevel.INFO] as const;

const WalletAlertSettingsSection = () => {
	const { t } = useTranslation(['settings', 'common']);
	const { settings, isLoading, updateSettings } = useWalletAlertSettings();
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

	const isDisabled = !draft.alert_enabled || updateSettings.isPending;
	const alertsTitle = t('alerts.walletAlerts.title');

	return (
		<Card variant='default' noPadding className='rounded-xl border-gray-200 bg-white shadow-sm'>
			<div className='px-6 pt-6'>
				<SettingsCardHeader
					title={alertsTitle}
					infoDescription={t('alerts.walletAlerts.description')}
					infoAriaLabel={t('info.ariaLabel', { field: alertsTitle })}
					titleClassName='text-lg font-medium text-zinc-800'
					className='mb-2'
					cta={
						<Switch
							checked={draft.alert_enabled ?? false}
							onCheckedChange={(enabled) => setDraft((prev) => ({ ...prev, alert_enabled: enabled }))}
							disabled={updateSettings.isPending}
							aria-label={alertsTitle}
						/>
					}
				/>
			</div>
			{isLoading ? (
				<Loader />
			) : (
				<div className='space-y-6 px-6 pb-6 pt-6'>
					{draft.alert_enabled && (
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
					)}
					<div className='flex justify-end'>
						<Button onClick={handleSave} isLoading={updateSettings.isPending} disabled={updateSettings.isPending}>
							{t('alerts.walletAlerts.saveChanges')}
						</Button>
					</div>
				</div>
			)}
		</Card>
	);
};

export default WalletAlertSettingsSection;
