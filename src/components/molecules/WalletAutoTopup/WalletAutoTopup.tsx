import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, Button, Input, Toggle, Select } from '@/components/atoms';
import type { SelectOption } from '@/components/atoms';
import { toast } from 'react-hot-toast';
import { PremiumFeatureIcon } from '../PremiumFeature/PremiumFeature';
import { useTranslation } from 'react-i18next';
import type { AutoTopup, DurationUnit } from '@/models';

export type AutoTopupConfig = AutoTopup;

interface WalletAutoTopupProps {
	open: boolean;
	autoTopupConfig: AutoTopupConfig | undefined;
	onSave: (config: AutoTopupConfig) => void;
	onClose: () => void;
}

/** Backend treats value 0 as unset cooloff (preferred over null for PUT merge). */
const UNSET_COOLDOWN = { value: 0, unit: 'second' as const };

const DEFAULT_CONFIG: AutoTopupConfig = {
	enabled: false,
	threshold: '0.00',
	amount: '0.00',
	invoicing: false,
	cooldown: UNSET_COOLDOWN,
};

const DURATION_UNITS: DurationUnit[] = ['second', 'minute', 'hour', 'day'];

const UNIT_DEFAULT_LABELS: Record<DurationUnit, string> = {
	second: 'Second',
	minute: 'Minute',
	hour: 'Hour',
	day: 'Day',
};

const WalletAutoTopup: React.FC<WalletAutoTopupProps> = ({ open, autoTopupConfig, onSave, onClose }) => {
	const { t } = useTranslation('billing');
	const [localConfig, setLocalConfig] = useState<AutoTopupConfig>(autoTopupConfig || DEFAULT_CONFIG);
	const [cooldownEnabled, setCooldownEnabled] = useState(false);
	const [cooldownValue, setCooldownValue] = useState('');
	const [cooldownUnit, setCooldownUnit] = useState<DurationUnit | ''>('');

	const cooldownUnitOptions: SelectOption[] = useMemo(
		() =>
			DURATION_UNITS.map((unit) => ({
				value: unit,
				label: t(`wallet.autoTopup.cooldownUnits.${unit}`, { defaultValue: UNIT_DEFAULT_LABELS[unit] }),
			})),
		[t],
	);

	const hydrateFromConfig = (config: AutoTopupConfig | undefined) => {
		const next = config || DEFAULT_CONFIG;
		setLocalConfig({
			enabled: next.enabled ?? false,
			threshold: next.threshold ?? DEFAULT_CONFIG.threshold,
			amount: next.amount ?? DEFAULT_CONFIG.amount,
			invoicing: next.invoicing ?? false,
			cooldown: next.cooldown ?? UNSET_COOLDOWN,
		});

		const cooldown = next.cooldown;
		const cooldownValueNumber = cooldown?.value != null ? Number(cooldown.value) : NaN;
		// value <= 0 (or missing) means cooloff is unset
		const hasCooldown = cooldown != null && Number.isFinite(cooldownValueNumber) && cooldownValueNumber > 0 && Boolean(cooldown.unit);

		if (hasCooldown && cooldown?.unit) {
			setCooldownEnabled(true);
			setCooldownValue(String(cooldownValueNumber));
			setCooldownUnit(cooldown.unit);
		} else {
			setCooldownEnabled(false);
			setCooldownValue('');
			setCooldownUnit('');
		}
	};

	// Sync local state with props
	useEffect(() => {
		hydrateFromConfig(autoTopupConfig);
	}, [autoTopupConfig, open]);

	const handleCooldownEnabledChange = (enabled: boolean) => {
		setCooldownEnabled(enabled);
		if (!enabled) {
			setCooldownValue('');
			setCooldownUnit('');
		}
	};

	const handleSave = () => {
		if (localConfig.enabled) {
			if (!localConfig.threshold || isNaN(parseFloat(localConfig.threshold))) {
				toast.error(
					t('wallet.autoTopup.errors.invalidThreshold', {
						defaultValue: 'Please enter a valid threshold value',
					}),
				);
				return;
			}
			if (!localConfig.amount || isNaN(parseFloat(localConfig.amount)) || parseFloat(localConfig.amount) <= 0) {
				toast.error(
					t('wallet.autoTopup.errors.invalidAmount', {
						defaultValue: 'Please enter a valid amount value greater than 0',
					}),
				);
				return;
			}

			if (cooldownEnabled) {
				const trimmedValue = cooldownValue.trim();
				if (!trimmedValue || !cooldownUnit) {
					toast.error(
						t('wallet.autoTopup.errors.cooldownIncomplete', {
							defaultValue: 'Enter both a cooloff value and unit, or turn cooloff off',
						}),
					);
					return;
				}

				const parsed = Number(trimmedValue);
				if (!Number.isInteger(parsed) || parsed <= 0) {
					toast.error(
						t('wallet.autoTopup.errors.cooldownInvalidValue', {
							defaultValue: 'Cooloff value must be a positive integer',
						}),
					);
					return;
				}

				onSave({
					...localConfig,
					cooldown: { value: parsed, unit: cooldownUnit },
				});
				return;
			}
		}

		onSave({
			...localConfig,
			cooldown: UNSET_COOLDOWN,
		});
	};

	const handleClose = () => {
		hydrateFromConfig(autoTopupConfig);
		onClose();
	};

	const cooldownToggleDescription = cooldownEnabled
		? t('wallet.autoTopup.cooldownDescription', {
				defaultValue:
					'After a successful auto top-up, the system will not auto top-up again until this window ends, even if the balance is still below the threshold.',
			})
		: !localConfig.invoicing
			? t('wallet.autoTopup.cooldownBurstDescription', {
					defaultValue:
						'When cooloff is off and invoice payment is not required, the system may top up repeatedly until the balance exceeds the threshold.',
				})
			: t('wallet.autoTopup.cooldownOptionalDescription', {
					defaultValue: 'When cooloff is off, there is no wait between auto top-ups.',
				});

	return (
		<Dialog
			className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title={
				<div className='flex items-center gap-2'>
					<span className='text-lg font-medium'>{t('wallet.autoTopup.dialogTitle')}</span>
					<PremiumFeatureIcon />
				</div>
			}
			showCloseButton>
			<div className='flex flex-col gap-6 min-w-[31.25rem]'>
				{/* Enable Auto Top-Up Toggle */}
				<Toggle
					title={t('wallet.autoTopup.enableTitle')}
					label={t('wallet.autoTopup.enableLabel')}
					description={t('wallet.autoTopup.enableDescription')}
					checked={localConfig.enabled}
					onChange={(enabled) => setLocalConfig({ ...localConfig, enabled })}
				/>

				{/* Auto Top-Up Configuration */}
				{localConfig.enabled && (
					<div className='space-y-4'>
						{/* Threshold Input */}
						<div className='space-y-2'>
							<Input
								label={t('wallet.autoTopup.thresholdLabel')}
								placeholder={t('wallet.autoTopup.thresholdPlaceholder')}
								value={localConfig.threshold}
								onChange={(value) => setLocalConfig({ ...localConfig, threshold: value })}
								type='number'
								step='0.01'
								description={t('wallet.autoTopup.thresholdDescription')}
							/>
						</div>

						{/* Amount Input */}
						<div className='space-y-2'>
							<Input
								label={t('wallet.autoTopup.amountLabel')}
								placeholder={t('wallet.autoTopup.amountPlaceholder')}
								value={localConfig.amount}
								onChange={(value) => setLocalConfig({ ...localConfig, amount: value })}
								type='number'
								step='0.01'
								min='0'
								description={t('wallet.autoTopup.amountDescription')}
							/>
						</div>

						{/* Cooloff (optional) */}
						<Toggle
							title={t('wallet.autoTopup.cooldownTitle', { defaultValue: 'Cooloff' })}
							label={t('wallet.autoTopup.cooldownLabel', {
								defaultValue: 'Wait before next auto top-up',
							})}
							description={cooldownToggleDescription}
							checked={cooldownEnabled}
							onChange={handleCooldownEnabledChange}
						/>

						{cooldownEnabled && (
							<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
								<Input
									label={t('wallet.autoTopup.cooldownValueLabel', { defaultValue: 'Duration' })}
									placeholder={t('wallet.autoTopup.cooldownValuePlaceholder', { defaultValue: 'e.g. 1' })}
									value={cooldownValue}
									onChange={setCooldownValue}
									variant='integer'
									formatOptions={{
										allowDecimals: false,
										allowNegative: false,
										decimalSeparator: '.',
										thousandSeparator: ',',
									}}
								/>
								<Select
									label={t('wallet.autoTopup.cooldownUnitLabel', { defaultValue: 'Unit' })}
									options={cooldownUnitOptions}
									value={cooldownUnit || undefined}
									placeholder={t('wallet.autoTopup.cooldownUnitPlaceholder', { defaultValue: 'Select unit' })}
									onChange={(value) => setCooldownUnit((value as DurationUnit) || '')}
								/>
							</div>
						)}

						{/* Invoicing Toggle */}
						<Toggle
							title={t('wallet.autoTopup.invoiceTitle')}
							label={t('wallet.autoTopup.invoiceLabel')}
							description={
								localConfig.invoicing
									? t('wallet.autoTopup.invoiceDescriptionWhenInvoiced')
									: t('wallet.autoTopup.invoiceDescriptionImmediate')
							}
							checked={localConfig.invoicing}
							onChange={(invoicing) => setLocalConfig({ ...localConfig, invoicing })}
						/>
					</div>
				)}

				{/* Action Buttons */}
				<div className='flex justify-end gap-2 mt-6'>
					<Button variant='outline' onClick={handleClose}>
						{t('wallet.autoTopup.cancel')}
					</Button>
					<Button onClick={handleSave}>{t('wallet.autoTopup.saveChanges')}</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default WalletAutoTopup;
