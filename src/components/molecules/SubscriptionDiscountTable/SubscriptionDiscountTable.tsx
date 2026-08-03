import { FC, useState, useMemo } from 'react';
import FlexpriceTable, { ColumnData } from '../Table';
import { Chip, ActionButton, AddButton, FormHeader } from '@/components/atoms';
import { Coupon } from '@/models/Coupon';
import { CouponModal } from '@/components/molecules';
import formatCouponName from '@/utils/common/format_coupon_name';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { formatAmount } from '@/components/atoms/Input/Input';
import { useQuery } from '@tanstack/react-query';
import CouponApi from '@/api/CouponApi';
import filterValidCoupons from '@/utils/helpers/coupons';
import { useTranslation } from 'react-i18next';

interface Props {
	coupon: Coupon | null;
	onChange: (coupon: Coupon | null) => void;
	disabled?: boolean;
	currency?: string;
	allLineItemCoupons?: Record<string, Coupon>;
}

const SubscriptionDiscountTable: FC<Props> = ({ coupon, onChange, disabled, currency, allLineItemCoupons = {} }) => {
	const { t } = useTranslation(['billing', 'common']);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Fetch available coupons
	const couponsQuery = useQuery({
		queryKey: ['coupons'],
		queryFn: () => CouponApi.getAllCoupons({ limit: 100, offset: 0 }),
	});

	// Filter coupons based on currency and local usage tracking
	const currencyFilteredCoupons = useMemo(() => {
		const allCoupons = couponsQuery.data?.items || [];
		const validCoupons = filterValidCoupons(allCoupons, currency);

		// Create local usage tracking
		const localCouponUsage: Record<string, number> = {};

		// Count usage from line item coupons
		Object.values(allLineItemCoupons).forEach((lineCoupon) => {
			localCouponUsage[lineCoupon.id] = (localCouponUsage[lineCoupon.id] || 0) + 1;
		});

		// Count usage from current coupon
		if (coupon) {
			localCouponUsage[coupon.id] = (localCouponUsage[coupon.id] || 0) + 1;
		}

		// Filter out coupons that have exceeded their redemption limits
		return validCoupons.filter((c) => {
			const totalUsage = (c.total_redemptions || 0) + (localCouponUsage[c.id] || 0);
			const maxRedemptions = c.max_redemptions;

			// Always show the currently selected coupon for editing/removal
			if (coupon && c.id === coupon.id) return true;

			// Show if no max redemptions or if usage is below limit
			return !maxRedemptions || totalUsage < maxRedemptions;
		});
	}, [couponsQuery.data?.items, currency, allLineItemCoupons, coupon]);

	const handleSave = (couponId: string) => {
		try {
			// Find the coupon from filtered coupons
			const selectedCoupon = currencyFilteredCoupons.find((c) => c.id === couponId) || null;
			onChange(selectedCoupon);
			setIsModalOpen(false);
		} catch (error) {
			console.error('Error saving coupon:', error);
			setIsModalOpen(false);
		}
	};

	const handleDelete = async () => {
		onChange(null);
	};

	const handleEdit = () => {
		setIsModalOpen(true);
	};

	// Convert single coupon to array format for table display
	const tableData = coupon ? [coupon] : [];

	const columns: ColumnData<Coupon>[] = [
		{
			title: t('subscriptions.discountTable.couponName'),
			render: (row) => {
				try {
					return <div className='font-medium'>{formatCouponName(row)}</div>;
				} catch (error) {
					console.error('Error formatting coupon name:', error);
					return <div className='font-medium'>{row?.name || t('subscriptions.unknownCoupon')}</div>;
				}
			},
		},
		{
			title: t('subscriptions.discountTable.discount'),
			render: (row) => {
				try {
					if (row?.type === 'fixed') {
						const symbol = getCurrencySymbol(row.currency?.trim() ? row.currency : '');
						return (
							<div className='text-success font-medium'>
								{t('subscriptions.discountFixedOff', {
									symbol,
									amount: formatAmount(row.amount_off ?? '0'),
								})}
							</div>
						);
					} else if (row?.type === 'percentage') {
						return (
							<div className='text-success font-medium'>{t('subscriptions.discountPercentOff', { percent: row.percentage_off ?? 0 })}</div>
						);
					}
					return t('common:labels.na');
				} catch (error) {
					console.error('Error rendering discount:', error);
					return <div>{t('common:labels.na')}</div>;
				}
			},
		},
		{
			title: t('subscriptions.discountTable.type'),
			render: (row) => (
				<Chip
					variant={row.type === 'fixed' ? 'default' : 'info'}
					label={row.type === 'fixed' ? t('subscriptions.fixedAmount') : t('subscriptions.percentage')}
				/>
			),
		},
		{
			title: t('subscriptions.discountTable.currency'),
			render: (row) => row.currency.toUpperCase(),
		},
		{
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => (
				<ActionButton
					id={row.id}
					copyId={{ entityType: 'Discount' }}
					deleteMutationFn={handleDelete}
					refetchQueryKey='subscription_discount'
					entityName={`Discount ${formatCouponName(row)}`}
					edit={{
						enabled: !disabled,
						onClick: handleEdit,
					}}
					archive={{
						enabled: !disabled,
						text: 'Remove',
					}}
				/>
			),
		},
	];

	return (
		<div>
			<CouponModal
				isOpen={isModalOpen}
				onOpenChange={setIsModalOpen}
				coupons={currencyFilteredCoupons}
				onSave={handleSave}
				onCancel={() => setIsModalOpen(false)}
				selectedCouponId={coupon?.id}
			/>

			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<FormHeader className='mb-0' title={t('subscriptions.discounts')} variant='sub-header' />
					{!coupon && <AddButton onClick={() => setIsModalOpen(true)} disabled={disabled} label={t('common:actions.add')} />}
				</div>
				<div className='rounded-[6px] border border-line-strong'>
					<FlexpriceTable data={tableData} columns={columns} showEmptyRow />
				</div>
			</div>
		</div>
	);
};

export default SubscriptionDiscountTable;
