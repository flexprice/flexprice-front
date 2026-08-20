import { useState, useEffect, useCallback } from 'react';
import { uniqueId } from 'lodash';
import toast from 'react-hot-toast';
import Dialog from '@/components/atoms/Dialog';
import { RecurringChargesForm } from '@/components/organisms/PlanForm';
import UsagePricingForm, { PriceInternalState } from '@/components/organisms/PlanForm/UsagePricingForm';
import type { InternalPrice } from '@/components/organisms/PlanForm/SetupChargesSection';
import { RectangleRadiogroup, type RectangleRadiogroupOption } from '@/components/molecules';
import { INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_MODEL, PRICE_TYPE, PRICE_ENTITY_TYPE } from '@/models/Price';
import { BILLING_PERIOD } from '@/constants/constants';
import { Gauge, Repeat } from 'lucide-react';
import {
	internalPriceToSubscriptionLineItemRequest,
	subscriptionLineItemToInternalPrice,
	type AddedSubscriptionLineItem,
} from '@/utils/subscription/internalPriceToSubscriptionLineItemRequest';
import SubscriptionChargeCommitmentSection, {
	DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE,
	type SubscriptionChargeCommitmentState,
} from '@/components/organisms/Subscription/SubscriptionChargeCommitmentSection';
import {
	applyWindowCommitmentToLineItem,
	formatWindowCommitmentError,
	sanitizeSubscriptionLineItemForApi,
	subscriptionChargeCommitmentFromLineItem,
} from '@/utils/subscription/subscription_line_item_commitment_helpers';
import { useTranslation } from 'react-i18next';

export type { AddedSubscriptionLineItem };

const CHARGE_OPTIONS: RectangleRadiogroupOption[] = [
	{
		label: 'Fixed charges',
		value: PRICE_TYPE.FIXED,
		icon: Repeat,
		description: 'Billed on a fixed schedule (monthly, yearly, etc.)',
	},
	{
		label: 'Usage Charges',
		value: PRICE_TYPE.USAGE,
		icon: Gauge,
		description: 'Pay only for what customers actually use',
	},
];

interface AddSubscriptionChargeDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (item: AddedSubscriptionLineItem) => void | Promise<void>;
	defaultCurrency?: string;
	defaultBillingPeriod?: BILLING_PERIOD;
	/** Default start date for new charges (e.g. subscription start_date in ISO format). */
	defaultStartDate?: string;
	/** When set, dialog is in edit mode: form pre-filled and save updates this item (same tempId). */
	initialItem?: AddedSubscriptionLineItem | null;
	/** When provided (e.g. on subscription edit page), passed to UsagePricingForm for context. */
	subscriptionId?: string;
	/** When true, shows loading state on save/update buttons and blocks dialog close. */
	isSaving?: boolean;
}

function getEmptyPrice(
	defaultCurrency?: string,
	defaultBillingPeriod?: BILLING_PERIOD,
	defaultStartDate?: string,
	type: PRICE_TYPE = PRICE_TYPE.FIXED,
): Partial<InternalPrice> {
	const base = {
		currency: defaultCurrency ?? 'USD',
		billing_period: defaultBillingPeriod ?? BILLING_PERIOD.MONTHLY,
		billing_period_count: 1,
		invoice_cadence: INVOICE_CADENCE.ARREAR,
		display_name: '',
		start_date: defaultStartDate,
		internal_state: PriceInternalState.NEW,
	};
	if (type === PRICE_TYPE.USAGE) {
		return {
			...base,
			type: PRICE_TYPE.USAGE,
			billing_model: BILLING_MODEL.FLAT_FEE,
			amount: '',
		};
	}
	return {
		...base,
		type: PRICE_TYPE.FIXED,
		billing_model: BILLING_MODEL.FLAT_FEE,
		amount: '',
		min_quantity: 1,
	};
}

const AddSubscriptionChargeDialog: React.FC<AddSubscriptionChargeDialogProps> = ({
	isOpen,
	onOpenChange,
	onSave,
	defaultCurrency,
	defaultBillingPeriod,
	defaultStartDate,
	initialItem = null,
	subscriptionId,
	isSaving = false,
}) => {
	const { t } = useTranslation('billing');
	const isEditMode = !!initialItem;
	const editType = initialItem?.price?.type;
	const resolvedEditType = editType === PRICE_TYPE.USAGE ? PRICE_TYPE.USAGE : PRICE_TYPE.FIXED;

	const [selectedChargeType, setSelectedChargeType] = useState<PRICE_TYPE | null>(null);
	const [price, setPrice] = useState<Partial<InternalPrice>>(() => getEmptyPrice(defaultCurrency, defaultBillingPeriod, defaultStartDate));
	const [commitmentState, setCommitmentState] = useState<SubscriptionChargeCommitmentState>(DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE);
	const [selectedMeterId, setSelectedMeterId] = useState<string | undefined>();

	const meterId = selectedMeterId ?? price.meter_id;

	const resetForm = useCallback(() => {
		setSelectedChargeType(null);
		setSelectedMeterId(undefined);
		setCommitmentState(DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE);
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		if (initialItem) {
			setSelectedChargeType(resolvedEditType);
			setPrice(
				subscriptionLineItemToInternalPrice(initialItem, {
					currency: defaultCurrency,
					billingPeriod: defaultBillingPeriod,
				}),
			);
			setCommitmentState(subscriptionChargeCommitmentFromLineItem(initialItem));
			setSelectedMeterId(initialItem.price?.meter_id);
		} else {
			resetForm();
			setPrice(getEmptyPrice(defaultCurrency, defaultBillingPeriod, defaultStartDate));
		}
	}, [isOpen, defaultCurrency, defaultBillingPeriod, defaultStartDate, initialItem, resolvedEditType, resetForm]);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open && isSaving) return;
			if (!open) resetForm();
			onOpenChange(open);
		},
		[onOpenChange, resetForm, isSaving],
	);

	const handleChargeTypeSelect = useCallback(
		(type: PRICE_TYPE) => {
			setSelectedChargeType(type);
			setPrice(getEmptyPrice(defaultCurrency, defaultBillingPeriod, defaultStartDate, type));
			setSelectedMeterId(undefined);
			setCommitmentState(DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE);
		},
		[defaultCurrency, defaultBillingPeriod, defaultStartDate],
	);

	const buildAndSave = useCallback(
		async (partial: Partial<InternalPrice>, tempId: string) => {
			const isUsage = partial.type === PRICE_TYPE.USAGE;
			const quantity = isUsage ? 0 : partial.min_quantity != null ? Number(partial.min_quantity) : 1;
			const request = internalPriceToSubscriptionLineItemRequest(partial, quantity);

			let finalRequest = request;

			if (isUsage) {
				const commitmentError = applyWindowCommitmentToLineItem(finalRequest, commitmentState, partial);
				if (commitmentError) {
					toast.error(formatWindowCommitmentError(commitmentError.error, t));
					return;
				}
				finalRequest = sanitizeSubscriptionLineItemForApi(finalRequest, (partial.currency ?? defaultCurrency ?? 'usd').toLowerCase());
			}

			try {
				await onSave({ ...finalRequest, tempId });
				onOpenChange(false);
			} catch {
				// Keep dialog open so the user can fix and retry.
			}
		},
		[commitmentState, defaultCurrency, onOpenChange, onSave, t],
	);

	const handleAdd = useCallback((partial: Partial<InternalPrice>) => buildAndSave(partial, uniqueId('sub_')), [buildAndSave]);

	const handleUpdate = useCallback(
		(partial: Partial<InternalPrice>) => {
			if (initialItem) buildAndSave(partial, initialItem.tempId);
		},
		[initialItem, buildAndSave],
	);

	const showRadiogroup = !initialItem && selectedChargeType === null;
	const showRecurringForm = selectedChargeType === PRICE_TYPE.FIXED || (initialItem && resolvedEditType === PRICE_TYPE.FIXED);
	const showUsageForm = selectedChargeType === PRICE_TYPE.USAGE || (initialItem && resolvedEditType === PRICE_TYPE.USAGE);

	const getTitle = () => {
		if (showRadiogroup) return 'Add charge';
		if (isEditMode) return resolvedEditType === PRICE_TYPE.USAGE ? 'Edit usage charge' : 'Edit fixed charge';
		return showUsageForm ? 'Add usage charge' : 'Add fixed charge';
	};

	const getDescription = () => {
		if (showRadiogroup) return undefined;
		return 'Add a subscription-level charge. It will appear in the charges table and be included when the subscription is created.';
	};

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title={getTitle()}
			description={getDescription()}
			className='w-full max-w-4xl overflow-x-hidden'>
			{showRadiogroup && (
				<div className='-mt-1'>
					<RectangleRadiogroup options={CHARGE_OPTIONS} onChange={(value) => handleChargeTypeSelect(value as PRICE_TYPE)} />
				</div>
			)}
			{showRecurringForm && (
				<RecurringChargesForm
					price={price}
					onAdd={handleAdd}
					onUpdate={handleUpdate}
					onEditClicked={() => {}}
					onDeleteClicked={() => onOpenChange(false)}
					entityName=''
					isSaving={isSaving}
				/>
			)}
			{showUsageForm && (
				<UsagePricingForm
					price={price}
					onAdd={handleAdd}
					onUpdate={handleUpdate}
					onEditClicked={() => {}}
					onDeleteClicked={() => onOpenChange(false)}
					entityType={PRICE_ENTITY_TYPE.SUBSCRIPTION}
					entityId={subscriptionId}
					onMeterChange={(feature) => setSelectedMeterId(feature?.meter_id)}
					isSaving={isSaving}
					formFooter={
						<SubscriptionChargeCommitmentSection
							meterId={meterId}
							currency={price.currency ?? defaultCurrency}
							billingPeriod={defaultBillingPeriod}
							value={commitmentState}
							onChange={setCommitmentState}
							sourcePrice={price}
							sourceBucketSize={price.bucket_size}
							disabled={isSaving}
						/>
					}
				/>
			)}
		</Dialog>
	);
};

export default AddSubscriptionChargeDialog;
