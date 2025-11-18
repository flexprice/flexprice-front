import { useState, useEffect } from 'react';
import { DatePicker, Label, Button } from '@/components/atoms';
import { SubscriptionDiscountTable } from '@/components/molecules';
import PriceTable from '@/components/organisms/Subscription/PriceTable';
import { Coupon } from '@/models/Coupon';
import { Price } from '@/models/Price';
import { usePriceOverrides } from '@/hooks/usePriceOverrides';
import { BILLING_PERIOD } from '@/constants/constants';
import { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';

// Simplified phase form state - just stores UI-friendly data
export interface PhaseFormData {
	start_date: Date;
	end_date?: Date | null;
	coupons: Coupon[];
	line_item_coupons: Record<string, Coupon>;
	priceOverrides: Record<string, ExtendedPriceOverride>;
	metadata: Record<string, string>;
}

interface PhaseFormProps {
	initialData?: Partial<PhaseFormData>;
	prices: Price[];
	billingPeriod: BILLING_PERIOD;
	currency: string;
	disabled?: boolean;
	onSave: (data: PhaseFormData) => void;
	onCancel: () => void;
	isEditing?: boolean;
	minStartDate?: Date;
	maxEndDate?: Date;
}

const PhaseForm: React.FC<PhaseFormProps> = ({
	initialData,
	prices,
	billingPeriod,
	currency,
	disabled = false,
	onSave,
	onCancel,
	isEditing = false,
	minStartDate,
	maxEndDate,
}) => {
	const [formState, setFormState] = useState<PhaseFormData>({
		start_date: initialData?.start_date || new Date(),
		end_date: initialData?.end_date || null,
		coupons: initialData?.coupons || [],
		line_item_coupons: initialData?.line_item_coupons || {},
		priceOverrides: initialData?.priceOverrides || {},
		metadata: initialData?.metadata || {},
	});

	// Price overrides functionality
	const { overriddenPrices, overridePrice, resetOverride } = usePriceOverrides(prices);

	// Sync form state when initialData changes (e.g., when switching between edit/create modes)
	useEffect(() => {
		if (initialData) {
			setFormState({
				start_date: initialData.start_date || new Date(),
				end_date: initialData.end_date ?? null,
				coupons: initialData.coupons || [],
				line_item_coupons: initialData.line_item_coupons || {},
				priceOverrides: initialData.priceOverrides || {},
				metadata: initialData.metadata || {},
			});

			// Initialize price overrides from initialData
			if (initialData.priceOverrides) {
				Object.entries(initialData.priceOverrides).forEach(([priceId, override]) => {
					overridePrice(priceId, override);
				});
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialData]);

	// Sync overriddenPrices back to formState
	useEffect(() => {
		setFormState((prev) => ({ ...prev, priceOverrides: overriddenPrices }));
	}, [overriddenPrices]);

	const handleSave = () => {
		onSave({
			...formState,
			priceOverrides: overriddenPrices,
		});
	};

	const updateFormState = (updates: Partial<PhaseFormData>) => {
		setFormState((prev) => ({ ...prev, ...updates }));
	};

	return (
		<div className='space-y-6 p-6 border border-gray-200 rounded-lg bg-white shadow-sm'>
			{/* Phase Dates */}
			<div>
				<h4 className='text-sm font-semibold text-gray-900 mb-4'>Phase Duration</h4>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<div>
						<Label label='Start Date*' />
						<DatePicker
							date={formState.start_date}
							setDate={(date) => {
								if (date) {
									updateFormState({ start_date: date });
								}
							}}
							disabled={disabled}
							minDate={minStartDate}
							maxDate={formState.end_date || maxEndDate}
						/>
					</div>
					<div>
						<Label label='End Date' />
						<DatePicker
							date={formState.end_date || undefined}
							setDate={(date) => {
								updateFormState({ end_date: date });
							}}
							placeholder='Forever'
							disabled={disabled}
							minDate={formState.start_date}
							maxDate={maxEndDate}
						/>
					</div>
				</div>
			</div>

			{/* Phase-level Coupons */}
			<div className='pt-6 border-t border-gray-200'>
				<SubscriptionDiscountTable
					coupon={formState.coupons.length > 0 ? formState.coupons[0] : null}
					onChange={(coupon) => {
						updateFormState({
							coupons: coupon ? [coupon] : [],
						});
					}}
					disabled={disabled}
					currency={currency}
					allLineItemCoupons={formState.line_item_coupons}
				/>
			</div>

			{/* Price Table with Line Item Coupons */}
			{prices.length > 0 && (
				<div className='pt-6 border-t border-gray-200'>
					<PriceTable
						data={prices}
						billingPeriod={billingPeriod}
						currency={currency}
						onPriceOverride={overridePrice}
						onResetOverride={resetOverride}
						overriddenPrices={overriddenPrices}
						lineItemCoupons={formState.line_item_coupons}
						onLineItemCouponsChange={(priceId, coupon) => {
							updateFormState({
								line_item_coupons: {
									...formState.line_item_coupons,
									...(coupon
										? { [priceId]: coupon }
										: (() => {
												const updated = { ...formState.line_item_coupons };
												delete updated[priceId];
												return updated;
											})()),
								},
							});
						}}
						disabled={disabled}
						subscriptionLevelCoupon={formState.coupons.length > 0 ? formState.coupons[0] : null}
					/>
				</div>
			)}

			{/* Action Buttons */}
			<div className='flex justify-end gap-3 pt-6 border-t border-gray-200'>
				<Button variant='outline' onClick={onCancel} disabled={disabled}>
					Cancel
				</Button>
				<Button onClick={handleSave} disabled={disabled}>
					{isEditing ? 'Update Phase' : 'Save Phase'}
				</Button>
			</div>
		</div>
	);
};

export default PhaseForm;
