import React, { useState, useEffect } from 'react';
import { Dialog, Button, Input, Toggle, Select } from '@/components/atoms';
import toast from 'react-hot-toast';
import { AlertSettings, AlertThreshold, AlertLevel } from '@/models/Feature';
import { useTranslation } from 'react-i18next';

interface FeatureAlertDialogProps {
	open: boolean;
	alertSettings?: AlertSettings;
	onSave: (alertSettings: AlertSettings) => void | Promise<void>;
	onClose: () => void;
}

const FeatureAlertDialog: React.FC<FeatureAlertDialogProps> = ({ open, alertSettings, onSave, onClose }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const [localAlertSettings, setLocalAlertSettings] = useState<AlertSettings>({
		alert_enabled: false,
		critical: null,
		warning: null,
		info: null,
	});
	const [isSaving, setIsSaving] = useState(false);

	// Sync local state with props
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

	// Determine the master condition - prioritize critical, then any existing threshold
	const getMasterCondition = (): 'above' | 'below' | undefined => {
		if (localAlertSettings.critical) return localAlertSettings.critical.condition;
		if (localAlertSettings.warning) return localAlertSettings.warning.condition;
		if (localAlertSettings.info) return localAlertSettings.info.condition;
		return undefined;
	};

	// Check if condition selector should be disabled for a given level
	const isConditionDisabled = (level: AlertLevel): boolean => {
		const threshold = localAlertSettings[level];
		if (!threshold) return false;

		// Critical always controls the condition if it exists
		if (level !== AlertLevel.CRITICAL && localAlertSettings.critical) {
			return true;
		}

		// If warning exists and this is info, warning controls (when no critical)
		if (level === AlertLevel.INFO && localAlertSettings.warning && !localAlertSettings.critical) {
			return true;
		}

		// If info exists and this is warning, info controls (when no critical)
		if (level === AlertLevel.WARNING && localAlertSettings.info && !localAlertSettings.critical) {
			return true;
		}

		return false;
	};

	const handleSave = async () => {
		// Prevent double-submit
		if (isSaving) return;

		// SINGLE VALIDATION: If alerts enabled, at least one threshold must be set with valid values
		if (localAlertSettings.alert_enabled) {
			const hasAnyThreshold = localAlertSettings.critical || localAlertSettings.warning || localAlertSettings.info;

			if (!hasAnyThreshold) {
				toast.error(t('catalog:features.alerts.toastAtLeastOneThreshold'));
				return;
			}

			// Validate threshold values - only check if they exist and are valid numbers
			const validateValue = (
				threshold: AlertThreshold | null | undefined,
				messageKey:
					| 'catalog:features.alerts.toastInvalidCriticalThreshold'
					| 'catalog:features.alerts.toastInvalidWarningThreshold'
					| 'catalog:features.alerts.toastInvalidInfoThreshold',
			): boolean => {
				if (threshold) {
					const value = parseFloat(threshold.threshold);
					if (isNaN(value)) {
						toast.error(t(messageKey));
						return false;
					}
				}
				return true;
			};

			if (!validateValue(localAlertSettings.critical, 'catalog:features.alerts.toastInvalidCriticalThreshold')) return;
			if (!validateValue(localAlertSettings.warning, 'catalog:features.alerts.toastInvalidWarningThreshold')) return;
			if (!validateValue(localAlertSettings.info, 'catalog:features.alerts.toastInvalidInfoThreshold')) return;
		}

		// COMPLETE OVERWRITE - send exactly what's in the form
		const settingsToSave: AlertSettings = {
			alert_enabled: localAlertSettings.alert_enabled,
			critical: localAlertSettings.critical,
			warning: localAlertSettings.warning,
			info: localAlertSettings.info,
		};

		try {
			setIsSaving(true);
			await onSave(settingsToSave);
		} finally {
			setIsSaving(false);
		}
	};

	const handleClose = () => {
		// Prevent closing during save
		if (isSaving) return;
		// Reset to original values
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

	const handleThresholdChange = (level: AlertLevel, field: 'threshold' | 'condition', value: string) => {
		const currentThreshold = localAlertSettings[level] || { threshold: '0', condition: 'below' as const };

		// If condition is being changed, sync all other thresholds to use the same condition
		if (field === 'condition') {
			const newCondition = value as 'above' | 'below';
			const newState: AlertSettings = {
				...localAlertSettings,
				critical: localAlertSettings.critical ? { ...localAlertSettings.critical, condition: newCondition } : null,
				warning: localAlertSettings.warning ? { ...localAlertSettings.warning, condition: newCondition } : null,
				info: localAlertSettings.info ? { ...localAlertSettings.info, condition: newCondition } : null,
			};
			setLocalAlertSettings(newState);
		} else {
			const newState: AlertSettings = {
				...localAlertSettings,
				[level]: {
					...currentThreshold,
					[field]: value,
				},
			};
			setLocalAlertSettings(newState);
		}
	};

	const handleRemoveThreshold = (level: AlertLevel) => {
		const newState: AlertSettings = {
			...localAlertSettings,
			[level]: null, // Explicitly set to null for removal
		};
		setLocalAlertSettings(newState);
	};

	const handleAddThreshold = (level: AlertLevel) => {
		// Use the master condition (prioritize critical, then any existing)
		const masterCondition = getMasterCondition() || 'below';

		const newState: AlertSettings = {
			...localAlertSettings,
			[level]: {
				threshold: '0',
				condition: masterCondition,
			},
		};
		setLocalAlertSettings(newState);
	};

	const renderThresholdInput = (level: AlertLevel, label: string, description: string) => {
		const threshold = localAlertSettings[level];
		const conditionDisabled = isConditionDisabled(level);

		return (
			<div className='space-y-3 p-4 border rounded-lg bg-gray-50'>
				<div className='flex items-center justify-between'>
					<div>
						<label className='text-sm font-medium text-gray-900'>{label}</label>
						<p className='text-xs text-gray-500 mt-0.5'>{description}</p>
					</div>
					{threshold ? (
						<Button variant='ghost' size='sm' onClick={() => handleRemoveThreshold(level)} disabled={isSaving}>
							{t('catalog:features.alerts.remove')}
						</Button>
					) : (
						<Button variant='outline' size='sm' onClick={() => handleAddThreshold(level)} disabled={isSaving}>
							{t('catalog:features.alerts.add')}
						</Button>
					)}
				</div>

				{threshold && (
					<div className='grid grid-cols-2 gap-3'>
						<div className='space-y-1'>
							<label className='text-xs font-medium text-gray-700'>{t('catalog:features.alerts.thresholdValue')}</label>
							<Input
								placeholder={t('catalog:features.alerts.thresholdPlaceholder')}
								value={threshold.threshold}
								onChange={(value) => handleThresholdChange(level, 'threshold', value)}
								type='number'
								step='0.01'
								disabled={isSaving}
							/>
						</div>
						<div className='space-y-1'>
							<label className='text-xs font-medium text-gray-700'>{t('catalog:features.alerts.condition')}</label>
							<Select
								options={[
									{ label: t('catalog:features.alerts.below'), value: 'below' },
									{ label: t('catalog:features.alerts.above'), value: 'above' },
								]}
								value={threshold.condition}
								onChange={(value) => handleThresholdChange(level, 'condition', value)}
								disabled={conditionDisabled || isSaving}
							/>
						</div>
					</div>
				)}
			</div>
		);
	};

	const handleToggleChange = (enabled: boolean) => {
		const newState: AlertSettings = { ...localAlertSettings, alert_enabled: enabled };
		setLocalAlertSettings(newState);
	};

	return (
		<Dialog
			className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title={t('catalog:features.alerts.dialogTitle')}
			showCloseButton>
			<div className='flex flex-col gap-6 min-w-[600px]'>
				{/* Alert Toggle */}
				<Toggle
					title={t('catalog:features.alerts.enableTitle')}
					label={t('catalog:features.alerts.enableLabel')}
					description={t('catalog:features.alerts.enableDescription')}
					checked={localAlertSettings.alert_enabled || false}
					onChange={handleToggleChange}
					disabled={isSaving}
				/>

				{/* Alert Configuration */}
				{localAlertSettings.alert_enabled && (
					<div className='space-y-4'>
						{renderThresholdInput(
							AlertLevel.CRITICAL,
							t('catalog:features.alerts.criticalThreshold'),
							t('catalog:features.alerts.criticalHelp'),
						)}
						{renderThresholdInput(
							AlertLevel.WARNING,
							t('catalog:features.alerts.warningThreshold'),
							t('catalog:features.alerts.warningHelp'),
						)}
						{renderThresholdInput(AlertLevel.INFO, t('catalog:features.alerts.infoThreshold'), t('catalog:features.alerts.infoHelp'))}
					</div>
				)}

				{/* Action Buttons */}
				<div className='flex justify-end gap-2 mt-6'>
					<Button variant='outline' onClick={handleClose} disabled={isSaving}>
						{t('common:actions.cancel')}
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? t('catalog:features.alerts.saving') : t('catalog:features.alerts.saveChanges')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default FeatureAlertDialog;
