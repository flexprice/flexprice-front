import { FC, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ColumnData, FlexpriceTable, LineItemCoupon } from '@/components/molecules';
import PriceOverrideDialog from '@/components/molecules/PriceOverrideDialog/PriceOverrideDialog';
import CommitmentConfigDialog from '@/components/molecules/CommitmentConfigDialog';
import { Price, PRICE_TYPE, PRICE_UNIT_TYPE } from '@/models';
import type { PriceBucketSize } from '@/models/Meter';
import { ChevronDownIcon, ChevronUpIcon, Copy, Pencil, RotateCcw, Tag, Target, Trash2 } from 'lucide-react';
import { FormHeader, DecimalUsageInput, AddButton, Chip } from '@/components/atoms';
import { ChargeValueCell } from '@/components/molecules';
import { capitalize } from 'es-toolkit';
import { Coupon } from '@/models';
import { BsThreeDots } from 'react-icons/bs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui';
import OptionsDropdownMenu from '@/components/molecules/DropdownMenu';
import { ExtendedPriceOverride } from '@/utils';
import { LineItemCommitmentConfig } from '@/types/dto/LineItemCommitmentConfig';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';
import type { AddedSubscriptionLineItem } from './AddSubscriptionChargeDialog';
import { getCurrencySymbol, copyToClipboard, getBucketSizeLabel } from '@/utils/common/helper_functions';
import { formatBillingPeriodForPrice } from '@/utils/common/helper_functions';
import { resolveBucketSize } from '@/utils/common/commitment_helpers';
import { formatAmount } from '@/components/atoms/Input/Input';
import { BILLING_PERIOD, BUCKET_SIZE_NONE } from '@/constants/constants';
import { isCadenceCompatible } from '@/utils/subscription/cadenceCompatibility';
import { useTranslation } from 'react-i18next';

const DEFAULT_ROW_LIMIT = 5;

/**
 * Resolves the committed quantity from a table-cell input string.
 * Falls back to `minQuantity` only when the input doesn't parse to a
 * number at all — a typed "0" must resolve to 0, not fall back.
 */
export function resolveQuantityFromInput(value: string, minQuantity: number): number {
	const parsed = parseInt(value, 10);
	return Number.isNaN(parsed) ? minQuantity : parsed;
}

type ChargeTableData = {
	priceId: string;
	charge: ReactNode;
	quantity: ReactNode;
	price: ReactNode;
	invoice_cadence: string;
	bucketSize: ReactNode;
	actions?: ReactNode;
};

/**
 * Price-then-meter bucket resolution for added line items. The request type only
 * carries meter_id, but items round-tripped from existing line items can carry a
 * meter object at runtime — same fallback order as resolveBucketSize.
 */
const resolveAddedItemBucketSize = (item: AddedSubscriptionLineItem): PriceBucketSize | string | undefined => {
	const priceWithMeter = item.price as
		| (typeof item.price & { meter?: { aggregation?: { bucket_size?: PriceBucketSize | string | null } } })
		| undefined;
	return priceWithMeter?.bucket_size ?? priceWithMeter?.meter?.aggregation?.bucket_size ?? undefined;
};

const bucketSizeCell = (bucketSize: ReturnType<typeof resolveBucketSize> | PriceBucketSize | undefined, naLabel: string): ReactNode => {
	const label = getBucketSizeLabel(bucketSize);
	return label ? <Chip label={label} variant='default' /> : <span className='text-content-muted'>{naLabel}</span>;
};

interface PriceActionMenuProps {
	price: Price;
	isOverridden: boolean;
	hasCommitment: boolean;
	onOverride: (price: Price) => void;
	onReset: (priceId: string) => void;
	onCommitment: (price: Price) => void;
	onOpenCoupon: (priceId: string) => void;
}

const PriceActionMenu: FC<PriceActionMenuProps> = ({
	price,
	isOverridden,
	hasCommitment,
	onOverride,
	onReset,
	onCommitment,
	onOpenCoupon,
}) => {
	const { t } = useTranslation('customers');
	const { t: tc } = useTranslation('common');
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	return (
		<div
			data-interactive='true'
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setIsDropdownOpen(!isDropdownOpen);
			}}>
			<DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
				<DropdownMenuTrigger asChild>
					<button>
						<BsThreeDots className='text-base size-4' />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-48'>
					<DropdownMenuItem
						onClick={() => {
							void copyToClipboard(price.id, tc('copyId.toastWithType', { type: 'Price' }));
						}}>
						<Copy className='me-2 h-4 w-4' />
						{tc('copyId.genericLabel')}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => onOverride(price)}>
						<Pencil className='me-2 h-4 w-4' />
						{isOverridden ? t('organisms.subscriptionPriceTable.editOverride') : t('organisms.subscriptionPriceTable.overridePrice')}
					</DropdownMenuItem>
					{isOverridden && (
						<DropdownMenuItem onClick={() => onReset(price.id)}>
							<RotateCcw className='me-2 h-4 w-4' />
							{t('organisms.subscriptionPriceTable.resetOverride')}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={() => onCommitment(price)}>
						<Target className='me-2 h-4 w-4' />
						{hasCommitment
							? t('organisms.subscriptionPriceTable.editCommitment')
							: t('organisms.subscriptionPriceTable.configureCommitment')}
					</DropdownMenuItem>
					{!isOverridden && (
						<DropdownMenuItem onClick={() => onOpenCoupon(price.id)}>
							<Tag className='me-2 h-4 w-4' />
							{t('organisms.subscriptionPriceTable.applyCoupon')}
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

interface PriceQuantityCellProps {
	price: Price;
	override?: ExtendedPriceOverride;
	lineItemCoupon: Coupon | null | undefined;
	quantityInput: string | undefined;
	disabled: boolean;
	/** Pass string to set transient input (including '' for empty); pass null to clear transient after commit. */
	onQuantityChange: (value: string | null) => void;
	onResetOverride: (priceId: string) => void;
	onPriceOverride: (priceId: string, override: Partial<ExtendedPriceOverride>) => void;
	onClearCoupon: (priceId: string) => void;
}

const PriceQuantityCell: FC<PriceQuantityCellProps> = ({
	price,
	override,
	lineItemCoupon,
	quantityInput,
	disabled,
	onQuantityChange,
	onResetOverride,
	onPriceOverride,
	onClearCoupon,
}) => {
	const { t } = useTranslation('customers');
	const minQuantity = price.min_quantity ?? 1;
	const currentQuantity = override?.quantity ?? minQuantity;
	const displayQuantity = quantityInput ?? currentQuantity.toString();

	// Clear transient only when override was removed (e.g. Reset Override) so we show minQuantity.
	// We do not clear when override.quantity matches quantityInput, to avoid clearing right after user types.
	useEffect(() => {
		if (override !== undefined || quantityInput == null || quantityInput === '') {
			return;
		}
		onQuantityChange(null);
	}, [override, quantityInput, onQuantityChange]);

	if (price.type !== PRICE_TYPE.FIXED) {
		return <>{t('organisms.subscriptionPriceTable.payAsYouGo')}</>;
	}

	return (
		<div className='w-20' data-interactive='true'>
			<DecimalUsageInput
				value={displayQuantity}
				onChange={(value) => {
					if (value === '') {
						onQuantityChange('');
						return;
					}
					const quantity = resolveQuantityFromInput(value, minQuantity);

					if (quantity === minQuantity) {
						const onlyQuantityOverride =
							override &&
							((Object.keys(override).length === 1 && override.quantity !== undefined) ||
								(Object.keys(override).length === 2 && override.price_id && override.quantity));
						if (onlyQuantityOverride) {
							onResetOverride(price.id);
						} else if (override) {
							const { quantity: _q, ...rest } = override;
							onPriceOverride(price.id, rest);
						}
					} else {
						if (lineItemCoupon) onClearCoupon(price.id);
						onPriceOverride(price.id, { quantity });
						// Keep transient value so display doesn't snap back before parent re-renders
						onQuantityChange(quantity.toString());
						return;
					}
					onQuantityChange(value === quantity.toString() ? null : value);
				}}
				placeholder={minQuantity.toString()}
				disabled={disabled}
				precision={0}
			/>
		</div>
	);
};

export interface Props {
	data: Price[];
	/** Used for filtering and dialog context (e.g. commitment). */
	billingPeriod?: BILLING_PERIOD;
	/**
	 * Subscription-level billing_period_count used with `billingPeriod` for the cadence-compatibility
	 * check. Defaults to 1 because today's create/edit flows do not expose a count > 1 field; callers
	 * that add such a control should pass the state value through.
	 */
	billingPeriodCount?: number;
	/** Used for filtering and LineItemCoupon. */
	currency?: string;
	onPriceOverride?: (priceId: string, override: Partial<ExtendedPriceOverride>) => void;
	onResetOverride?: (priceId: string) => void;
	overriddenPrices?: Record<string, ExtendedPriceOverride>;
	lineItemCoupons?: Record<string, Coupon>;
	onLineItemCouponsChange?: (priceId: string, coupon: Coupon | null) => void;
	onCommitmentChange?: (priceId: string, config: LineItemCommitmentConfig | null, timeBuckets?: CommitmentTimeBucket[]) => void;
	disabled?: boolean;
	subscriptionLevelCoupon?: Coupon | null;
	/** Subscription-level added line items (entity type SUBSCRIPTION). Shown with delete-only actions. */
	addedLineItems?: AddedSubscriptionLineItem[];
	/** Called when user clicks Add charge; parent should open the add-charge dialog. */
	onAddCharge?: () => void;
	/** Called when user removes an added subscription line item. */
	onRemoveAddedCharge?: (tempId: string) => void;
	/** Called when user clicks Edit on an added subscription line item; parent should open the edit dialog. */
	onEditAddedCharge?: (item: AddedSubscriptionLineItem) => void;
}

function formatAddedLineItemPrice(item: AddedSubscriptionLineItem, fallbackCurrency?: string): string {
	const p = item.price;
	if (!p) return '--';
	const currency =
		p.price_unit_type === PRICE_UNIT_TYPE.CUSTOM
			? p.price_unit_config?.price_unit
			: ((p as { currency?: string }).currency ?? fallbackCurrency);
	const symbol = currency ? getCurrencySymbol(currency) : '';
	const amount = p.amount ?? p.price_unit_config?.amount ?? '0';
	const period = p.billing_period ? formatBillingPeriodForPrice(p.billing_period) : '';
	return `${symbol}${formatAmount(amount)}${period ? ` / ${period}` : ''}`;
}

const SubscriptionPriceTable: FC<Props> = ({
	data,
	billingPeriod,
	billingPeriodCount = 1,
	currency,
	onPriceOverride,
	onResetOverride,
	overriddenPrices = {},
	lineItemCoupons = {},
	onLineItemCouponsChange,
	onCommitmentChange,
	disabled = false,
	subscriptionLevelCoupon = null,
	addedLineItems = [],
	onAddCharge,
	onRemoveAddedCharge,
	onEditAddedCharge,
}) => {
	const [showAllRows, setShowAllRows] = useState(false);
	const [openAddedMenuTempId, setOpenAddedMenuTempId] = useState<string | null>(null);
	const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedCommitmentPrice, setSelectedCommitmentPrice] = useState<Price | null>(null);
	const [isCommitmentDialogOpen, setIsCommitmentDialogOpen] = useState(false);
	const [couponModalState, setCouponModalState] = useState<{ isOpen: boolean; priceId: string | null }>({
		isOpen: false,
		priceId: null,
	});
	const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});

	const { t } = useTranslation('customers');
	const chargesTableColumns = useMemo<ColumnData<ChargeTableData>[]>(
		() => [
			{ fieldName: 'charge', title: t('organisms.subscriptionPriceTable.colCharge') },
			{
				title: t('organisms.subscriptionPriceTable.colBillingPeriod'),
				render: (data) => capitalize(data.invoice_cadence) || t('usageTable.featureTypes.dash'),
			},
			{ fieldName: 'quantity', title: t('organisms.subscriptionPriceTable.colQuantity') },
			{ fieldName: 'price', title: t('organisms.subscriptionPriceTable.colPrice') },
			{ fieldName: 'bucketSize', title: t('organisms.subscriptionPriceTable.colBucketSize') },
			{
				fieldName: 'actions',
				title: '',
				width: 50,
				align: 'center',
				fieldVariant: 'interactive',
			},
		],
		[t],
	);

	const filteredPrices = useMemo(() => {
		let filtered = data;
		if (currency) {
			filtered = filtered.filter((p) => p.currency.toLowerCase() === currency.toLowerCase());
		}
		if (billingPeriod) {
			filtered = filtered.filter((p) => isCadenceCompatible(billingPeriod, billingPeriodCount, p.billing_period, p.billing_period_count));
		}
		return filtered;
	}, [data, billingPeriod, billingPeriodCount, currency]);

	const handleOverride = (price: Price) => {
		if (lineItemCoupons[price.id]) {
			onLineItemCouponsChange?.(price.id, null);
		}
		setSelectedPrice(price);
		setIsDialogOpen(true);
	};

	const handleConfigureCommitment = (price: Price) => {
		setSelectedCommitmentPrice(price);
		setIsCommitmentDialogOpen(true);
	};

	const setQuantityInput = (priceId: string, value: string | null) => {
		setQuantityInputs((prev) => {
			const next = { ...prev };
			if (value === null) delete next[priceId];
			else next[priceId] = value;
			return next;
		});
	};

	const mappedData = useMemo<ChargeTableData[]>(() => {
		return (filteredPrices ?? []).map((price) => {
			const isOverridden = overriddenPrices[price.id] !== undefined;
			const appliedCoupon = lineItemCoupons[price.id];
			const override = overriddenPrices[price.id];

			return {
				priceId: price.id,
				charge: (
					<div>
						<div>{price.display_name || price.meter?.name || t('organisms.subscriptionPriceTable.chargeFallback')}</div>
					</div>
				),
				quantity: (
					<PriceQuantityCell
						price={price}
						override={override}
						lineItemCoupon={appliedCoupon}
						quantityInput={quantityInputs[price.id]}
						disabled={disabled}
						onQuantityChange={(value) => setQuantityInput(price.id, value ?? '')}
						onResetOverride={(id) => onResetOverride?.(id)}
						onPriceOverride={(id, o) => onPriceOverride?.(id, o)}
						onClearCoupon={(id) => onLineItemCouponsChange?.(id, null)}
					/>
				),
				price: <ChargeValueCell data={price} appliedCoupon={appliedCoupon} priceOverride={isOverridden ? override : undefined} />,
				invoice_cadence: price.invoice_cadence,
				bucketSize: bucketSizeCell(
					isOverridden && override?.bucket_size !== undefined
						? override.bucket_size === BUCKET_SIZE_NONE
							? undefined
							: override.bucket_size
						: (resolveBucketSize(price) ?? undefined),
					t('common:labels.na'),
				),
				actions: (
					<PriceActionMenu
						price={price}
						isOverridden={isOverridden}
						hasCommitment={override?.commitment !== undefined}
						onOverride={handleOverride}
						onReset={(id) => onResetOverride?.(id)}
						onCommitment={handleConfigureCommitment}
						onOpenCoupon={(id) => setCouponModalState({ isOpen: true, priceId: id })}
					/>
				),
			};
		});
	}, [
		filteredPrices,
		billingPeriod,
		billingPeriodCount,
		overriddenPrices,
		lineItemCoupons,
		quantityInputs,
		disabled,
		onPriceOverride,
		onResetOverride,
		onLineItemCouponsChange,
		t,
	]);

	const addedRows = useMemo<ChargeTableData[]>(() => {
		return addedLineItems.map((item) => ({
			priceId: item.tempId,
			charge: (
				<div>
					<div>{item.display_name || item.price?.display_name || t('organisms.subscriptionPriceTable.chargeFallback')}</div>
				</div>
			),
			quantity: <span>{item.quantity ?? 1}</span>,
			price: <span>{formatAddedLineItemPrice(item, currency)}</span>,
			invoice_cadence: item.price?.invoice_cadence ?? '--',
			bucketSize: bucketSizeCell(resolveAddedItemBucketSize(item), t('common:labels.na')),
			actions:
				onRemoveAddedCharge || onEditAddedCharge ? (
					<OptionsDropdownMenu
						options={[
							...(onEditAddedCharge
								? [
										{
											label: t('organisms.subscriptionPriceTable.editAdded'),
											icon: <Pencil className='h-4 w-4' />,
											onSelect: () => onEditAddedCharge(item),
										},
									]
								: []),
							...(onRemoveAddedCharge
								? [
										{
											label: t('organisms.subscriptionPriceTable.deleteAdded'),
											icon: <Trash2 className='h-4 w-4' />,
											onSelect: () => onRemoveAddedCharge(item.tempId),
											className: 'text-danger focus:text-danger',
										},
									]
								: []),
						]}
						isOpen={openAddedMenuTempId === item.tempId}
						onOpenChange={(open) => setOpenAddedMenuTempId(open ? item.tempId : null)}
						trigger={
							<button type='button' disabled={disabled}>
								<BsThreeDots className='text-base size-4' />
							</button>
						}
						align='end'
					/>
				) : undefined,
		}));
	}, [addedLineItems, currency, disabled, onRemoveAddedCharge, onEditAddedCharge, openAddedMenuTempId, t]);

	const combinedData = useMemo(() => [...mappedData, ...addedRows], [mappedData, addedRows]);
	const displayedData = showAllRows ? combinedData : combinedData.slice(0, DEFAULT_ROW_LIMIT);
	const hasMore = combinedData.length > DEFAULT_ROW_LIMIT;

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between gap-2'>
				<FormHeader title={t('organisms.subscriptionPriceTable.charges')} variant='sub-header' />
				{onAddCharge && <AddButton onClick={onAddCharge} disabled={disabled} className='w-fit'></AddButton>}
			</div>
			<div className='rounded-[6px] border border-line-strong'>
				<div style={{ overflow: 'hidden' }}>
					<FlexpriceTable columns={chargesTableColumns} data={displayedData} />
				</div>
			</div>
			{hasMore && (
				<div className='flex justify-center mt-3'>
					<button
						onClick={() => setShowAllRows((prev) => !prev)}
						className='flex items-center gap-1.5 text-sm text-content-tertiary hover:text-content transition-colors py-2 px-3 rounded-[6px] hover:bg-surface-subtle'>
						{showAllRows ? (
							<>
								<span>{t('organisms.subscriptionPriceTable.showLess')}</span>
								<ChevronUpIcon className='w-4 h-4' />
							</>
						) : (
							<>
								<span>
									{t('organisms.subscriptionPriceTable.showMore', { count: Math.max(0, combinedData.length - DEFAULT_ROW_LIMIT) })}
								</span>
								<ChevronDownIcon className='w-4 h-4' />
							</>
						)}
					</button>
				</div>
			)}

			{selectedPrice && onPriceOverride && onResetOverride && (
				<PriceOverrideDialog
					isOpen={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					price={selectedPrice}
					onPriceOverride={onPriceOverride}
					onResetOverride={onResetOverride}
					overriddenPrices={overriddenPrices}
				/>
			)}

			{selectedCommitmentPrice && (
				<CommitmentConfigDialog
					isOpen={isCommitmentDialogOpen}
					onOpenChange={setIsCommitmentDialogOpen}
					price={selectedCommitmentPrice}
					onSave={(priceId, config, timeBuckets) => onCommitmentChange?.(priceId, config, timeBuckets)}
					currentConfig={overriddenPrices[selectedCommitmentPrice.id]?.commitment}
					currentTimeBuckets={overriddenPrices[selectedCommitmentPrice.id]?.commitment_time_buckets}
					billingPeriod={billingPeriod}
				/>
			)}

			{couponModalState.priceId && !overriddenPrices[couponModalState.priceId] && (
				<LineItemCoupon
					priceId={couponModalState.priceId}
					currency={currency}
					selectedCoupon={lineItemCoupons[couponModalState.priceId]}
					onChange={(priceId, coupon) => {
						onLineItemCouponsChange?.(priceId, coupon);
						setCouponModalState({ isOpen: false, priceId: null });
					}}
					disabled={disabled}
					showAddButton={true}
					isModalOpen={couponModalState.isOpen}
					onModalClose={() => setCouponModalState({ isOpen: false, priceId: null })}
					allLineItemCoupons={lineItemCoupons}
					subscriptionLevelCoupons={subscriptionLevelCoupon ? [subscriptionLevelCoupon] : []}
				/>
			)}
		</div>
	);
};

export default SubscriptionPriceTable;
