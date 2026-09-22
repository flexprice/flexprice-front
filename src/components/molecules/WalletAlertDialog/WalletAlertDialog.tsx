import React, { useState, useEffect } from 'react';
import { Dialog, Button } from '@/components/atoms';
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';
import { WalletAlertThresholdSection } from '@/components/molecules';
import type { WalletAlertThresholdSectionLabels } from '@/components/molecules/WalletAlertThresholdSection';
import { WalletAlertSettings, WalletAlertLevel } from '@/models/Wallet';
import {
	fromWalletAlertDraftForSave,
	getWalletAlertValidationErrorKey,
	setWalletAlertDraftEnabled,
	toWalletAlertDraft,
	toWalletAlertSettingsForValidation,
} from '@/utils/wallet/walletAlertUtils';
import { useTranslation } from 'react-i18next';

interface WalletAlertDialogProps {
	open: boolean;
	alertSettings?: WalletAlertSettings;
	onSave: (alertSettings: WalletAlertSettings) => void | Promise<void>;
	onClose: () => void;
	currency?: string;
}

const WalletAlertDialog: React.FC<WalletAlertDialogProps> = ({ open, alertSettings, onSave, onClose, currency }) => {
	const { t } = useTranslation('billing');
	const [draft, setDraft] = useState(() => toWalletAlertDraft(alertSettings));
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setDraft(toWalletAlertDraft(alertSettings));
	}, [alertSettings]);

	const thresholdLabels: WalletAlertThresholdSectionLabels = {
		thresholdType: t('wallet.alerts.thresholdTypeLabel'),
		thresholdTypeTooltip: (
			<>
				<span className='block'>{t('wallet.alerts.thresholdTypeTooltipAbsolute')}</span>
				<span className='mt-1.5 block'>{t('wallet.alerts.thresholdTypeTooltipPercentage')}</span>
			</>
		),
		thresholdTypeAbsolute: t('wallet.alerts.thresholdTypeAbsolute'),
		thresholdTypePercentage: t('wallet.alerts.thresholdTypePercentage'),
		rowDescription: t('wallet.alerts.rowDescription'),
		amountPlaceholder: t('wallet.alerts.amountPlaceholder'),
		levels: {
			[WalletAlertLevel.CRITICAL]: t('wallet.alerts.criticalTitle'),
			[WalletAlertLevel.WARNING]: t('wallet.alerts.warningTitle'),
			[WalletAlertLevel.INFO]: t('wallet.alerts.infoTitle'),
		},
	};

	const handleSave = async () => {
		if (isSaving) return;

		// Validate against the raw draft so invalid values (e.g. 'abc') produce
		// the correct 'invalidXxxThreshold' error rather than 'atLeastOneThreshold'
		// (normalization would silently drop NaN values before the validator sees them).
		const validationErrorKey = getWalletAlertValidationErrorKey(toWalletAlertSettingsForValidation(draft));
		if (validationErrorKey) {
			toast.error(t(`wallet.alerts.validation.${validationErrorKey}`));
			return;
		}

		const settingsToSave = fromWalletAlertDraftForSave(draft);

		try {
			setIsSaving(true);
			await onSave(settingsToSave);
		} finally {
			setIsSaving(false);
		}
	};

	const handleClose = () => {
		if (isSaving) return;
		setDraft(toWalletAlertDraft(alertSettings));
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
			<div className='flex min-w-[600px] flex-col gap-5'>
				{/*
				 * A settings row rather than the Toggle atom: the switch belongs on the far right, level
				 * with the label it controls, with the explanation underneath — not stacked under a
				 * separate heading with the switch off to the left.
				 */}
				<div className='space-y-1'>
					<div className='flex items-center justify-between gap-4'>
						<span className='text-sm font-medium text-content'>{t('wallet.alerts.enableTitle')}</span>
						<Switch
							checked={draft.alert_enabled}
							onCheckedChange={(enabled) => setDraft((prev) => setWalletAlertDraftEnabled(prev, enabled))}
							disabled={isSaving}
							aria-label={t('wallet.alerts.enableTitle')}
						/>
					</div>
					<p className='max-w-[440px] text-sm text-content-secondary'>{t('wallet.alerts.enableDescription')}</p>
				</div>

				<WalletAlertThresholdSection
					draft={draft}
					labels={thresholdLabels}
					currency={currency}
					disabled={isSaving || !draft.alert_enabled}
					onChange={setDraft}
				/>

				<div className='flex justify-end gap-2'>
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
