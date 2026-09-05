import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import CustomerPortalApi from '@/api/CustomerPortalApi';
import { Button, Input, Select, Toggle } from '@/components/atoms';
import { refetchPortalQueries } from '../refetchPortalQueries';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import type { DurationUnit } from '@/models/Wallet';
import type { PortalAutoTopupRequest } from '@/types/dto/CustomerPortalBilling';
import { WalletResponse } from '@/types/dto/Wallet';

interface AutoTopUpFormProps {
	wallet: WalletResponse;
	/** True when a saved method can be charged unattended. */
	hasChargeableMethod: boolean;
	onAddPaymentMethod?: () => void;
	onDone?: () => void;
}

const DURATION_UNITS: DurationUnit[] = ['second', 'minute', 'hour', 'day'];

/**
 * Auto top-up configuration.
 *
 * The payload is flat and narrower than the admin one. There is no invoicing
 * toggle — that selects the transaction reason and is the tenant's call — and no
 * auto-charge switch: enabling auto top-up *is* the consent to be charged
 * unattended, so a second checkbox would only imply a choice that is not offered.
 *
 * Because of that, auto top-up needs a chargeable saved method to be meaningful,
 * and says so rather than saving a config that can never fire.
 */
const AutoTopUpForm = ({ wallet, hasChargeableMethod, onAddPaymentMethod, onDone }: AutoTopUpFormProps) => {
	const { t } = useTranslation('customer-portal');

	const [enabled, setEnabled] = useState(wallet.auto_topup?.enabled ?? false);
	const [threshold, setThreshold] = useState(wallet.auto_topup?.threshold ?? '');
	const [amount, setAmount] = useState(wallet.auto_topup?.amount ?? '');
	const [cooldownValue, setCooldownValue] = useState(wallet.auto_topup?.cooldown?.value ? String(wallet.auto_topup.cooldown.value) : '');
	const [cooldownUnit, setCooldownUnit] = useState<DurationUnit>(wallet.auto_topup?.cooldown?.unit ?? 'hour');
	// A stored cooloff of 0 means unset, matching how the backend reads it.
	const [cooldownEnabled, setCooldownEnabled] = useState(Number(wallet.auto_topup?.cooldown?.value ?? 0) > 0);

	const handleCooldownToggle = (next: boolean) => {
		setCooldownEnabled(next);
		if (!next) setCooldownValue('');
	};

	const { mutate: save, isPending } = useMutation({
		mutationFn: () => {
			const payload: PortalAutoTopupRequest = {
				enabled,
				...(enabled ? { threshold, amount } : {}),
				// A zero-valued duration clears a stored cooloff, not null.
				//
				// The backend merges auto top-up field by field and only looks at cooldown
				// when the pointer is non-nil, so JSON null is indistinguishable from the
				// field being absent and the stored cooloff survived untouched. Its clear
				// branch keys off Duration.IsEmpty(), which is value === 0 — so that is the
				// payload that actually resets it.
				cooldown:
					cooldownEnabled && Number(cooldownValue) > 0
						? { value: Number(cooldownValue), unit: cooldownUnit }
						: { value: 0, unit: cooldownUnit },
			};
			return CustomerPortalApi.updateAutoTopup(wallet.id, payload);
		},
		onSuccess: async () => {
			toast.success(t('autoTopUp.saved'));
			onDone?.();
			await refetchPortalQueries(['portal-wallets', 'portal-wallet-balance']);
		},
		onError: (error: Error) => toast.error(error.message || t('errors.saveAutoTopUp')),
	});

	// Both are required by the API whenever auto top-up is on. Enabling it without a
	// chargeable method saves a config that can never fire — a trap rather than a
	// setting — so the save is blocked, not just warned about.
	// The cool-off clause matters: with the toggle on and the field empty the
	// payload sends cooldown: null, silently clearing the cool-off while the
	// switch still reads as on. Blocking Save is the honest response.
	const hasValidCooloff = !cooldownEnabled || Number(cooldownValue) > 0;
	const isValid = (!enabled || (Number(threshold) > 0 && Number(amount) > 0 && hasChargeableMethod)) && hasValidCooloff;
	const currencySymbol = getCurrencySymbol(wallet.currency ?? 'USD');

	return (
		<div className='flex flex-col gap-5'>
			<Toggle
				title={t('autoTopUp.enableTitle')}
				label={t('autoTopUp.enableLabel')}
				description={t('autoTopUp.enableHint')}
				checked={enabled}
				onChange={setEnabled}
				disabled={isPending}
			/>

			{enabled && (
				<div className='space-y-4'>
					<Input
						label={t('autoTopUp.thresholdLabel')}
						placeholder={t('autoTopUp.thresholdPlaceholder')}
						description={t('autoTopUp.thresholdHelp')}
						type='number'
						step='0.01'
						min='0'
						value={threshold}
						onChange={setThreshold}
						disabled={isPending}
						inputPrefix={currencySymbol}
					/>

					<Input
						label={t('autoTopUp.amountLabel')}
						placeholder={t('autoTopUp.amountPlaceholder')}
						description={t('autoTopUp.amountHelp')}
						type='number'
						step='0.01'
						min='0'
						value={amount}
						onChange={setAmount}
						disabled={isPending}
						inputPrefix={currencySymbol}
					/>

					<Toggle
						title={t('autoTopUp.cooloffTitle')}
						label={t('autoTopUp.cooloffLabel')}
						description={cooldownEnabled ? t('autoTopUp.cooloffOnHint') : t('autoTopUp.cooloffOffHint')}
						checked={cooldownEnabled}
						onChange={handleCooldownToggle}
						disabled={isPending}
					/>

					{cooldownEnabled && (
						<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
							<Input
								label={t('autoTopUp.cooloffValueLabel')}
								placeholder={t('autoTopUp.cooloffPlaceholder')}
								type='number'
								min='1'
								value={cooldownValue}
								onChange={setCooldownValue}
								disabled={isPending}
							/>
							<Select
								label={t('autoTopUp.cooloffUnitLabel')}
								value={cooldownUnit}
								onChange={(value) => setCooldownUnit(value as DurationUnit)}
								options={DURATION_UNITS.map((unit) => ({ value: unit, label: t(`autoTopUp.cooloffUnits.${unit}`) }))}
								disabled={isPending}
							/>
						</div>
					)}
				</div>
			)}

			<div className='border-t border-line pt-4'>
				{/* Sits directly above the button it explains. At the top of the form it
				    was separated from the greyed-out Save by the whole configuration, and
				    a second line under the button repeated it. */}
				{enabled && !hasChargeableMethod && (
					<div className='mb-3 flex items-start gap-2 rounded-lg border border-line bg-surface-subtle p-3'>
						<AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-danger' />
						<div className='text-sm'>
							<p className='text-content'>{t('autoTopUp.noSavedCard')}</p>
							<p className='text-xs mt-0.5 text-content-tertiary'>{t('autoTopUp.needsCardHint')}</p>
							{onAddPaymentMethod && (
								<button
									type='button'
									onClick={onAddPaymentMethod}
									className='underline mt-1'
									style={{ color: 'var(--portal-primary, #2563eb)' }}>
									{t('paymentMethods.add')}
								</button>
							)}
						</div>
					</div>
				)}
				<Button onClick={() => save()} disabled={!isValid || isPending} isLoading={isPending}>
					{t('autoTopUp.save')}
				</Button>
			</div>
		</div>
	);
};

export default AutoTopUpForm;
