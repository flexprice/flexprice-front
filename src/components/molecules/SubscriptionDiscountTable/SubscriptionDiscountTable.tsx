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

interface Props {
	coupon: Coupon | null;
	onChange: (coupon: Coupon | null) => void;
	disabled?: boolean;
	currency?: string;
	allLineItemCoupons?: Record<string, Coupon>;
}

const SubscriptionDiscountTable: FC<Props> = ({ coupon, onChange, disabled, currency, allLineItemCoupons = {} }) => {
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
			title: 'Coupon Name',
			render: (row) => {
				try {
					return <div className='font-medium'>{formatCouponName(row)}</div>;
				} catch (error) {
					console.error('Error formatting coupon name:', error);
					return <div className='font-medium'>{row?.name || 'Unknown Coupon'}</div>;
				}
			},
		},
		{
			title: 'Discount',
			render: (row) => {
				try {
					if (row?.type === 'fixed') {
						return (
							<div className='text-green-600 font-medium'>
								{getCurrencySymbol(row.currency || 'USD')}
								{formatAmount(row.amount_off || '0')} off
							</div>
						);
					} else if (row?.type === 'percentage') {
						return <div className='text-green-600 font-medium'>{row.percentage_off || 0}% off</div>;
					}
					return '--';
				} catch (error) {
					console.error('Error rendering discount:', error);
					return <div>--</div>;
				}
			},
		},
		{
			title: 'Type',
			render: (row) => (
				<Chip variant={row.type === 'fixed' ? 'default' : 'info'} label={row.type === 'fixed' ? 'Fixed Amount' : 'Percentage'} />
			),
		},
		{
			title: 'Currency',
			render: (row) => row.currency.toUpperCase(),
		},
		{
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => (
				<ActionButton
					id={row.id}
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
					<FormHeader className='mb-0' title='Discounts' variant='sub-header' />
					{!coupon && <AddButton onClick={() => setIsModalOpen(true)} disabled={disabled} label='Add' />}
				</div>
				<div className='rounded-xl border border-gray-300'>
					<FlexpriceTable data={tableData} columns={columns} showEmptyRow />
				</div>
			</div>
		</div>
	);
};

export default SubscriptionDiscountTable;
