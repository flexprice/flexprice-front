import { Button, DatePicker, Dialog, Input } from '@/components/atoms';
import { useTranslation, Trans } from 'react-i18next';
import type { LineItem } from '@/models/Subscription';
import { useSubscriptionQuantityModify } from '@/hooks/useSubscriptionQuantityModify';
import { buildLineItemChangeModifyRequest } from '@/utils/subscription/buildLineItemChangeModifyRequest';
import { getEditableLineItemAmount, isSameDecimal, isValidPriceString } from '@/utils/subscription/lineItemPriceEdit';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { isValidNonNegativeQuantityString } from '@/utils/subscription/quantityValidation';
import type { ExecuteSubscriptionModifyRequest } from '@/types/dto/Subscription';
import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import SubscriptionModifyPreviewSummary from './SubscriptionModifyPreviewSummary';
import formatDate from '@/utils/common/format_date';
import {
	buildEffectiveDateIsoForQuantityModify,
	getDefaultEffectiveDateForQuantityModify,
	getInvoiceCadenceRawFromLineItem,
	isEffectiveDateWithinBillingPeriod,
	isEffectiveDateWithinLineItemWindow,
} from '@/utils/subscription/quantityModifyEffectiveDate';

export interface SubscriptionLineItemQuantityModifyDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId: string;
	lineItem: LineItem;
	/** Subscription billing period bounds (ISO 8601); used to default effective date by invoice cadence. */
	currentPeriodStart: string;
	currentPeriodEnd: string;
}

type Step = 'form' | 'preview';

const SubscriptionLineItemQuantityModifyDialog: FC<SubscriptionLineItemQuantityModifyDialogProps> = ({
	isOpen,
	onOpenChange,
	subscriptionId,
	lineItem,
	currentPeriodStart,
	currentPeriodEnd,
}) => {
	const { t } = useTranslation(['billing', 'common']);
	const [step, setStep] = useState<Step>('form');
	const [quantityInput, setQuantityInput] = useState('');
	const [amountInput, setAmountInput] = useState('');
	const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(undefined);
	const [confirmedPayload, setConfirmedPayload] = useState<ExecuteSubscriptionModifyRequest | null>(null);
	const [formError, setFormError] = useState<string | null>(null);

	const { preview, execute, previewResult, reset, isPreviewPending, isExecutePending } = useSubscriptionQuantityModify(subscriptionId);

	const invoiceCadenceRaw = getInvoiceCadenceRawFromLineItem(lineItem);
	/** Undefined when the price can't be edited (non flat-fee or custom price unit) — only quantity is offered then. */
	const currentAmount = getEditableLineItemAmount(lineItem);
	const currentQuantity = lineItem.quantity != null ? String(lineItem.quantity) : '';
	const currency = lineItem.currency || 'USD';

	useEffect(() => {
		if (!isOpen) return;
		setQuantityInput(currentQuantity);
		setAmountInput(currentAmount ?? '');
		setStep('form');
		setEffectiveDate(getDefaultEffectiveDateForQuantityModify(lineItem, currentPeriodStart, currentPeriodEnd));
		setConfirmedPayload(null);
		setFormError(null);
		reset();
	}, [
		isOpen,
		lineItem.id,
		currentQuantity,
		currentAmount,
		lineItem.start_date,
		lineItem.end_date,
		invoiceCadenceRaw,
		currentPeriodStart,
		currentPeriodEnd,
		reset,
	]);

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			reset();
			setStep('form');
			setEffectiveDate(undefined);
			setConfirmedPayload(null);
			setFormError(null);
		}
		onOpenChange(open);
	};

	const normalizedQuantity = quantityInput.trim().replace(/,/g, '');
	const normalizedAmount = amountInput.trim().replace(/,/g, '');

	const buildPayloadFromForm = useCallback((): ExecuteSubscriptionModifyRequest | null => {
		if (!isValidNonNegativeQuantityString(quantityInput)) {
			setFormError('Enter a valid quantity — zero or greater.');
			return null;
		}
		if (currentAmount !== undefined && !isValidPriceString(amountInput)) {
			setFormError('Enter a valid price, e.g. 1200.50 — use "." for decimals.');
			return null;
		}
		// Send only what changed; an omitted field keeps its current value on the backend.
		const quantityChanged = !isSameDecimal(normalizedQuantity, currentQuantity);
		const amountChanged = currentAmount !== undefined && !isSameDecimal(normalizedAmount, currentAmount);
		if (!quantityChanged && !amountChanged) {
			setFormError(currentAmount !== undefined ? 'Change the quantity or the price to continue.' : 'Change the quantity to continue.');
			return null;
		}
		if (effectiveDate && !isEffectiveDateWithinLineItemWindow(lineItem, effectiveDate)) {
			const startHint = lineItem.start_date?.trim() ? ` This charge started on ${formatDate(lineItem.start_date)}.` : '';
			setFormError(`Set the effective date to a time when this charge is active.${startHint}`);
			return null;
		}
		if (effectiveDate && !isEffectiveDateWithinBillingPeriod(currentPeriodStart, currentPeriodEnd, effectiveDate)) {
			setFormError(
				'Set the effective date within the current billing period. The period end is exclusive — choose a time before it, or clear the field for immediate effect.',
			);
			return null;
		}
		setFormError(null);
		const effectiveIso = effectiveDate ? buildEffectiveDateIsoForQuantityModify(lineItem, effectiveDate, currentPeriodEnd) : undefined;
		return buildLineItemChangeModifyRequest({
			lineItemId: lineItem.id,
			quantity: quantityChanged ? normalizedQuantity : undefined,
			amount: amountChanged ? normalizedAmount : undefined,
			effectiveDateIso: effectiveIso,
		});
	}, [
		quantityInput,
		amountInput,
		normalizedQuantity,
		normalizedAmount,
		currentQuantity,
		currentAmount,
		effectiveDate,
		lineItem,
		currentPeriodStart,
		currentPeriodEnd,
	]);

	const handlePreview = async () => {
		const payload = buildPayloadFromForm();
		if (!payload) return;
		try {
			await preview(payload);
			setConfirmedPayload(payload);
			setStep('preview');
		} catch {
			// Error surfaced via toast in hook
		}
	};

	const handleBack = () => {
		setStep('form');
		setConfirmedPayload(null);
		reset();
	};

	const handleApply = async () => {
		if (!confirmedPayload) return;
		try {
			await execute(confirmedPayload);
			handleOpenChange(false);
		} catch {
			// Error surfaced via toast in hook
		}
	};

	const busy = isPreviewPending || isExecutePending;

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title={
				step === 'form'
					? currentAmount !== undefined
						? t('subscriptions.editCharge')
						: t('subscriptions.changeQuantity')
					: t('subscriptions.reviewChanges')
			}
			description={
				step === 'form' ? (
					<span className='text-sm text-content-tertiary'>
						<Trans
							ns='billing'
							i18nKey={
								currentAmount !== undefined
									? 'subscriptions.quantityModify.updatingChargeDescription'
									: 'subscriptions.quantityModify.updatingDescription'
							}
							values={{ name: lineItem.display_name }}
							components={{ highlight: <span className='font-medium text-content' /> }}
						/>
					</span>
				) : undefined
			}
			className='sm:max-w-[560px]'
			showCloseButton={!busy}>
			<div className={step === 'preview' ? 'space-y-4' : 'space-y-6'}>
				{step === 'form' && (
					<>
						<div className='w-full space-y-5'>
							<div className='space-y-2'>
								<Input
									label={t('subscriptions.quantity')}
									variant='text'
									value={quantityInput}
									onChange={(e) => setQuantityInput(e)}
									placeholder={t('subscriptions.quantityPlaceholder')}
									disabled={busy}
								/>
							</div>
							{currentAmount !== undefined && (
								<div className='space-y-2'>
									<Input
										label={t('subscriptions.quantityModify.pricePerUnit')}
										variant='text'
										value={amountInput}
										onChange={(e) => setAmountInput(e)}
										inputPrefix={<span className='text-sm text-content-secondary'>{getCurrencySymbol(currency)}</span>}
										placeholder={t('subscriptions.quantityModify.pricePlaceholder')}
										disabled={busy}
									/>
								</div>
							)}
							{formError && <p className='text-sm text-danger'>{formError}</p>}
							<div className='w-full space-y-3'>
								<DatePicker
									label={t('subscriptions.effectiveDate')}
									placeholder={t('subscriptions.selectDate')}
									date={effectiveDate}
									setDate={setEffectiveDate}
									popoverTriggerClassName='w-full'
									disabled={busy}
								/>
								<div className='flex w-full gap-3 rounded-lg border border-info-line bg-info-muted px-4 py-3.5'>
									<Info className='mt-0.5 h-5 w-5 shrink-0 text-info' aria-hidden />
									<p className='min-w-0 flex-1 text-sm leading-relaxed text-info-deepest'>
										{t('subscriptions.quantityModify.effectiveDateHint')}
									</p>
								</div>
							</div>
						</div>
						<div className='flex justify-end gap-3 pt-2'>
							<Button variant='outline' onClick={() => handleOpenChange(false)} disabled={busy}>
								{t('common:actions.cancel')}
							</Button>
							<Button onClick={() => void handlePreview()} isLoading={isPreviewPending} disabled={busy}>
								{t('subscriptions.quantityModify.preview')}
							</Button>
						</div>
					</>
				)}

				{step === 'preview' && (
					<>
						<SubscriptionModifyPreviewSummary
							data={previewResult}
							quantityChangeContext={{
								lineItemDisplayName: lineItem.display_name,
								previousQuantity: currentQuantity,
								newQuantity: normalizedQuantity || currentQuantity,
								currency,
								previousAmount: currentAmount,
								newAmount: currentAmount !== undefined ? normalizedAmount || currentAmount : undefined,
							}}
						/>
						<div className='flex justify-end gap-3 border-t border-line-subtle pt-4'>
							<Button variant='outline' onClick={handleBack} disabled={busy}>
								{t('common:actions.back')}
							</Button>
							<Button onClick={() => void handleApply()} isLoading={isExecutePending} disabled={busy || !confirmedPayload}>
								{t('subscriptions.quantityModify.applyChanges')}
							</Button>
						</div>
					</>
				)}
			</div>
		</Dialog>
	);
};

export default SubscriptionLineItemQuantityModifyDialog;
