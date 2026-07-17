import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Button, Toggle } from '@/components/atoms';
import toast from 'react-hot-toast';
import { WalletAlertThresholdCard } from '@/components/molecules';
import type { WalletAlertThresholdCardLabels } from '@/components/molecules/WalletAlertThresholdCard';
import { WalletAlertLevel, WalletAlertSettings } from '@/models/Wallet';
import { getWalletAlertValidationErrorKey, normalizeWalletAlertSettingsForSave } from '@/utils/wallet/walletAlertUtils';
import { ALERT_ENTITY_TYPE } from '@/models/AlertSetting';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import AlertSettingApi from '@/api/AlertSettingApi';
import { logger } from '@/utils/common/Logger';

interface AlertSettingsDialogProps {
	open: boolean;
	onClose: () => void;
	entityType: ALERT_ENTITY_TYPE.SUBSCRIPTION | ALERT_ENTITY_TYPE.SUBSCRIPTION_LINE_ITEM;
	entityId: string;
	/** Required when entityType is SUBSCRIPTION_LINE_ITEM — the owning subscription's id. */
	parentEntityId?: string;
	currency?: string;
}

// Reuses WalletAlertThresholdCard verbatim (same add/remove interaction as Wallet Alert
// Settings). AlertSettingsConfig (the backend DTO shape) and WalletAlertSettings are structurally
// identical ({critical,warning,info,alert_enabled} / {threshold,condition}), so no adapter is
// needed. The one difference: the backend only accepts "above" for subscription/line-item spend
// alerts, so every threshold's condition is fixed to "above" and the condition Select is always
// disabled (unlike wallet, where the user picks above/below).
const ALERT_LEVELS = [WalletAlertLevel.CRITICAL, WalletAlertLevel.WARNING, WalletAlertLevel.INFO] as const;

const EMPTY_CONFIG: WalletAlertSettings = {
	alert_enabled: false,
	critical: null,
	warning: null,
	info: null,
};

const AlertSettingsDialog: React.FC<AlertSettingsDialogProps> = ({ open, onClose, entityType, entityId, parentEntityId, currency }) => {
	const { t } = useTranslation('billing');
	const [localConfig, setLocalConfig] = useState<WalletAlertSettings>(EMPTY_CONFIG);

	const isLineItem = entityType === ALERT_ENTITY_TYPE.SUBSCRIPTION_LINE_ITEM;

	// Alert settings are their own resource (not embedded on the subscription/line item), so the
	// dialog resolves whether a configuration already exists for this entity every time it opens,
	// rather than being seeded via a prop the way WalletAlertDialog is.
	const {
		data: existing,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['alertSettings', entityType, entityId],
		queryFn: () =>
			AlertSettingApi.search({
				entity_type: entityType,
				entity_id: entityId,
				limit: 1,
			}),
		enabled: open && !!entityId,
	});

	const existingSetting = existing?.items?.[0];

	// Seeds localConfig from the fetched setting exactly once per time the dialog is opened, once
	// the search request has settled — a plain [open, existingSetting] dependency would re-seed
	// (stomping in-progress edits) on any later background refetch too.
	const seededRef = useRef(false);

	useEffect(() => {
		if (!open) {
			seededRef.current = false;
			return;
		}
		if (seededRef.current || isLoading) return;
		seededRef.current = true;

		if (existingSetting) {
			setLocalConfig({
				alert_enabled: existingSetting.config.alert_enabled ?? false,
				critical: existingSetting.config.critical ?? null,
				warning: existingSetting.config.warning ?? null,
				info: existingSetting.config.info ?? null,
			});
		} else {
			setLocalConfig(EMPTY_CONFIG);
		}
	}, [open, isLoading, existingSetting]);

	// Condition is always "above" for these alerts; the Select is shown disabled, so these local
	// handlers replace the wallet utils (which default new thresholds to "below").
	const addThreshold = (level: WalletAlertLevel) =>
		setLocalConfig((prev) => ({ ...prev, [level]: { threshold: '0', condition: 'above' } }));
	const removeThreshold = (level: WalletAlertLevel) => setLocalConfig((prev) => ({ ...prev, [level]: null }));
	const changeThresholdValue = (level: WalletAlertLevel, value: string) =>
		setLocalConfig((prev) => ({ ...prev, [level]: { threshold: value, condition: 'above' } }));

	const getLevelLabels = (level: WalletAlertLevel): WalletAlertThresholdCardLabels => {
		const titleKey = {
			[WalletAlertLevel.CRITICAL]: 'wallet.alerts.criticalTitle',
			[WalletAlertLevel.WARNING]: 'wallet.alerts.warningTitle',
			[WalletAlertLevel.INFO]: 'wallet.alerts.infoTitle',
		} as const;
		const descriptionKey = {
			[WalletAlertLevel.CRITICAL]: 'spendAlerts.criticalDescription',
			[WalletAlertLevel.WARNING]: 'spendAlerts.warningDescription',
			[WalletAlertLevel.INFO]: 'spendAlerts.infoDescription',
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

	const { mutate: saveAlertSettings, isPending: isSaving } = useMutation({
		mutationFn: (configToSave: WalletAlertSettings) =>
			existingSetting
				? AlertSettingApi.update(existingSetting.id, { config: configToSave })
				: AlertSettingApi.create({
						entity_type: entityType,
						entity_id: entityId,
						...(isLineItem ? { parent_entity_type: ALERT_ENTITY_TYPE.SUBSCRIPTION, parent_entity_id: parentEntityId } : {}),
						config: configToSave,
					}),
		onSuccess: async () => {
			toast.success(t('spendAlerts.saveSuccess'));
			await refetch();
			onClose();
		},
		onError: (e) => {
			logger.error('Failed to save alert settings', e);
			toast.error(t('spendAlerts.saveError'));
		},
	});

	const handleSave = () => {
		if (isSaving) return;

		const validationErrorKey = getWalletAlertValidationErrorKey(localConfig);
		if (validationErrorKey) {
			toast.error(t(`wallet.alerts.validation.${validationErrorKey}`));
			return;
		}

		saveAlertSettings(normalizeWalletAlertSettingsForSave(localConfig));
	};

	const handleClose = () => {
		if (isSaving) return;
		onClose();
	};

	return (
		<Dialog
			className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title={t(isLineItem ? 'spendAlerts.lineItemDialogTitle' : 'spendAlerts.subscriptionDialogTitle')}
			showCloseButton
			// Rendered inside interactive subscription/line-item table rows; without this, in-dialog
			// clicks bubble through the React tree to the row's onClick and navigate away.
			interactiveContent>
			<div className='flex min-w-[600px] flex-col gap-6'>
				<Toggle
					title={t('spendAlerts.enableTitle')}
					label={t(isLineItem ? 'spendAlerts.lineItemEnableLabel' : 'spendAlerts.subscriptionEnableLabel')}
					description={t('spendAlerts.enableDescription')}
					checked={localConfig.alert_enabled || false}
					onChange={(enabled) => setLocalConfig((prev) => ({ ...prev, alert_enabled: enabled }))}
					disabled={isSaving || isLoading}
				/>

				{localConfig.alert_enabled && (
					<div className='space-y-4'>
						{ALERT_LEVELS.map((level) => (
							<WalletAlertThresholdCard
								key={level}
								threshold={localConfig[level]}
								labels={getLevelLabels(level)}
								conditionDisabled
								disabled={isSaving || isLoading}
								onAdd={() => addThreshold(level)}
								onRemove={() => removeThreshold(level)}
								onThresholdChange={(value) => changeThresholdValue(level, value)}
								onConditionChange={() => {
									/* condition is fixed to "above" for subscription/line-item spend alerts */
								}}
							/>
						))}
					</div>
				)}

				<div className='mt-6 flex justify-end gap-2'>
					<Button variant='outline' onClick={handleClose} disabled={isSaving}>
						{t('spendAlerts.cancel')}
					</Button>
					<Button onClick={handleSave} disabled={isSaving || isLoading}>
						{isSaving ? t('spendAlerts.saving') : t('spendAlerts.saveChanges')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default AlertSettingsDialog;
