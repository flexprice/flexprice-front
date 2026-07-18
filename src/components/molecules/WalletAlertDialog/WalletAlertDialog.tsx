import React, { useState, useEffect } from 'react';
import { Dialog, Button, Toggle } from '@/components/atoms';
import toast from 'react-hot-toast';
import { WalletAlertThresholdCard } from '@/components/molecules';
import type { WalletAlertThresholdCardLabels } from '@/components/molecules/WalletAlertThresholdCard';
import { WalletAlertSettings, WalletAlertLevel } from '@/models/Wallet';
import {
	addWalletAlertThreshold,
	applyWalletAlertThresholdChange,
	getWalletAlertValidationErrorKey,
	isWalletAlertConditionDisabled,
	normalizeWalletAlertSettingsForSave,
	updateWalletAlertThreshold,
} from '@/utils/wallet/walletAlertUtils';
import { useTranslation } from 'react-i18next';

interface WalletAlertDialogProps {
	open: boolean;
	alertSettings?: WalletAlertSettings;
	onSave: (alertSettings: WalletAlertSettings) => void | Promise<void>;
	onClose: () => void;
	currency?: string;
}

const ALERT_LEVELS = [WalletAlertLevel.CRITICAL, WalletAlertLevel.WARNING, WalletAlertLevel.INFO] as const;

const WalletAlertDialog: React.FC<WalletAlertDialogProps> = ({ open, alertSettings, onSave, onClose, currency }) => {
	const { t } = useTranslation('billing');
	const [localAlertSettings, setLocalAlertSettings] = useState<WalletAlertSettings>({
		alert_enabled: false,
		critical: null,
		warning: null,
		info: null,
	});
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (alertSettings) {
			setLocalAlertSettings({
				alert_enabled: alertSettings.alert_enabled || false,
				critical: alertSettings.critical || null,
				warning: alertSettings.warning || null,
				info: alertSettings.info || null,
			});
		} else {
			setLocalAlertSettings({
				alert_enabled: false,
				critical: null,
				warning: null,
				info: null,
			});
		}
	}, [alertSettings]);

	const getLevelLabels = (level: WalletAlertLevel): WalletAlertThresholdCardLabels => {
		const titleKey = {
			[WalletAlertLevel.CRITICAL]: 'wallet.alerts.criticalTitle',
			[WalletAlertLevel.WARNING]: 'wallet.alerts.warningTitle',
			[WalletAlertLevel.INFO]: 'wallet.alerts.infoTitle',
		} as const;
		const descriptionKey = {
			[WalletAlertLevel.CRITICAL]: 'wallet.alerts.criticalDescription',
			[WalletAlertLevel.WARNING]: 'wallet.alerts.warningDescription',
			[WalletAlertLevel.INFO]: 'wallet.alerts.infoDescription',
		} as const;

		return {
			title: t(titleKey[level]),
			description: t(descriptionKey[level]),
			add: t('wallet.alerts.add'),
			remove: t('wallet.alerts.remove'),
			thresholdValue: t('wallet.alerts.thresholdValueLabel', { currencySuffix: currency ? ` (${currency})` : '' }),
			condition: t('wallet.alerts.conditionLabel'),
			conditionBelow: t('wallet.alerts.conditionBelow'),
			conditionAbove: t('wallet.alerts.conditionAbove'),
			amountPlaceholder: t('wallet.alerts.amountPlaceholder'),
		};
	};

	const handleSave = async () => {
		if (isSaving) return;

		// Validate against the raw draft so invalid values (e.g. 'abc') produce
		// the correct 'invalidXxxThreshold' error rather than 'atLeastOneThreshold'
		// (normalization would silently drop NaN values before the validator sees them).
		const validationErrorKey = getWalletAlertValidationErrorKey(localAlertSettings);
		if (validationErrorKey) {
			toast.error(t(`wallet.alerts.validation.${validationErrorKey}`));
			return;
		}

		const settingsToSave = normalizeWalletAlertSettingsForSave(localAlertSettings);

		try {
			setIsSaving(true);
			await onSave(settingsToSave);
		} finally {
			setIsSaving(false);
		}
	};

	const handleClose = () => {
		if (isSaving) return;
		if (alertSettings) {
			setLocalAlertSettings({
				alert_enabled: alertSettings.alert_enabled || false,
				critical: alertSettings.critical || null,
				warning: alertSettings.warning || null,
				info: alertSettings.info || null,
			});
		}
		onClose();
	};

	return (
		<Dialog
			className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title={t('wallet.alerts.dialogTitle')}
			showCloseButton>
			<div className='flex min-w-[600px] flex-col gap-6'>
				<Toggle
					title={t('wallet.alerts.enableTitle')}
					label={t('wallet.alerts.enableLabel')}
					description={t('wallet.alerts.enableDescription')}
					checked={localAlertSettings.alert_enabled || false}
					onChange={(enabled) => setLocalAlertSettings((prev) => ({ ...prev, alert_enabled: enabled }))}
					disabled={isSaving}
				/>

				{localAlertSettings.alert_enabled && (
					<div className='space-y-4'>
						{ALERT_LEVELS.map((level) => (
							<WalletAlertThresholdCard
								key={level}
								threshold={localAlertSettings[level]}
								labels={getLevelLabels(level)}
								conditionDisabled={isWalletAlertConditionDisabled(level, localAlertSettings)}
								disabled={isSaving}
								onAdd={() => setLocalAlertSettings((prev) => addWalletAlertThreshold(prev, level))}
								onRemove={() => setLocalAlertSettings((prev) => updateWalletAlertThreshold(prev, level, null))}
								onThresholdChange={(value) =>
									setLocalAlertSettings((prev) => applyWalletAlertThresholdChange(prev, level, 'threshold', value))
								}
								onConditionChange={(value) =>
									setLocalAlertSettings((prev) => applyWalletAlertThresholdChange(prev, level, 'condition', value))
								}
							/>
						))}
					</div>
				)}

				<div className='mt-6 flex justify-end gap-2'>
					<Button variant='outline' onClick={handleClose} disabled={isSaving}>
						{t('wallet.alerts.cancel')}
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? t('wallet.alerts.saving') : t('wallet.alerts.saveChanges')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default WalletAlertDialog;
