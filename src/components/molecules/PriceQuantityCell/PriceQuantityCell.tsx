import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DecimalUsageInput } from '@/components/atoms';
import { PRICE_TYPE, type Price } from '@/models/Price';
import type { Coupon } from '@/models';
import type { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import { resolveQuantityFromInput } from '@/utils/subscription/quantityValidation';

export interface PriceQuantityCellProps {
	price: Price;
	override?: ExtendedPriceOverride;
	disabled?: boolean;
	lineItemCoupon?: Coupon | null;
	/** Controlled draft. Omit with `onQuantityChange` to let the cell keep its own draft. */
	quantityInput?: string;
	/** Pass string to set transient input (including '' for empty); pass null to clear transient after commit. */
	onQuantityChange?: (value: string | null) => void;
	onResetOverride: (priceId: string) => void;
	onPriceOverride: (priceId: string, override: Partial<ExtendedPriceOverride>) => void;
	onClearCoupon?: (priceId: string) => void;
	usageLabel?: string;
	ariaLabel?: string;
}

const isOnlyQuantityOverride = (override?: ExtendedPriceOverride): boolean =>
	!!override &&
	((Object.keys(override).length === 1 && override.quantity !== undefined) ||
		(Object.keys(override).length === 2 && override.price_id !== undefined && override.quantity !== undefined));

/**
 * Quantity input for FIXED catalogue prices on create-sub plan charges and addon attach.
 * USAGE prices are metered — the input is hidden.
 */
const PriceQuantityCell: FC<PriceQuantityCellProps> = ({
	price,
	override,
	disabled = false,
	lineItemCoupon,
	quantityInput,
	onQuantityChange,
	onResetOverride,
	onPriceOverride,
	onClearCoupon,
	usageLabel,
	ariaLabel,
}) => {
	const { t } = useTranslation('customers');
	const minQuantity = price.min_quantity ?? 1;
	const currentQuantity = override?.quantity ?? minQuantity;
	const [internalDraft, setInternalDraft] = useState<string | undefined>(undefined);
	const isControlled = onQuantityChange !== undefined;
	const draft = isControlled ? quantityInput : internalDraft;
	const displayQuantity = draft ?? currentQuantity.toString();

	const setDraft = (value: string | null) => {
		if (onQuantityChange) {
			onQuantityChange(value);
			return;
		}
		setInternalDraft(value === null ? undefined : value);
	};

	// Clear transient only when override was removed (e.g. Reset Override) so we show minQuantity.
	useEffect(() => {
		if (override !== undefined) {
			return;
		}
		if (isControlled) {
			if (quantityInput == null || quantityInput === '') {
				return;
			}
			onQuantityChange(null);
			return;
		}
		setInternalDraft(undefined);
	}, [override, isControlled, quantityInput, onQuantityChange]);

	if (price.type !== PRICE_TYPE.FIXED) {
		return <>{usageLabel ?? t('organisms.subscriptionPriceTable.payAsYouGo')}</>;
	}

	return (
		<div className='w-20' data-interactive='true'>
			<DecimalUsageInput
				value={displayQuantity}
				ariaLabel={ariaLabel}
				onChange={(value) => {
					if (value === '') {
						setDraft('');
						return;
					}
					const quantity = resolveQuantityFromInput(value, minQuantity);

					if (quantity === minQuantity) {
						if (isOnlyQuantityOverride(override)) {
							onResetOverride(price.id);
						} else if (override) {
							const { quantity: _q, ...rest } = override;
							onPriceOverride(price.id, { ...rest, quantity: undefined });
						}
						setDraft(isControlled && value !== quantity.toString() ? value : null);
						return;
					}

					if (lineItemCoupon) onClearCoupon?.(price.id);
					onPriceOverride(price.id, { quantity });
					setDraft(quantity.toString());
				}}
				placeholder={minQuantity.toString()}
				disabled={disabled}
				precision={0}
				min={0}
			/>
		</div>
	);
};

export default PriceQuantityCell;
