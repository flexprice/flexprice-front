import React, { useMemo, useState } from 'react';
import { AddButton, FormHeader } from '@/components/atoms';
import { Coupon } from '@/models/Coupon';
import { useQuery } from '@tanstack/react-query';
import CouponApi from '@/api/CouponApi';
import filterValidCoupons from '@/utils/helpers/coupons';
import { CouponModal } from '@/components/molecules';
import formatCouponName from '@/utils/common/format_coupon_name';
import { useTranslation } from 'react-i18next';

type Props = {
	currency?: string;
	selectedCoupon?: Coupon | null;
	onChange: (coupon: Coupon | null) => void;
	disabled?: boolean;
	// For tracking local coupon usage
	allLineItemCoupons?: Record<string, Coupon>;
};

const SubscriptionCoupon: React.FC<Props> = ({ currency, selectedCoupon, onChange, disabled, allLineItemCoupons = {} }) => {
	const { t } = useTranslation(['billing', 'common']);
	const [isOpen, setIsOpen] = useState(false);
	const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

	const { data: availableCoupons = [] } = useQuery({
		queryKey: ['availableCoupons'],
		queryFn: async () => {
			const response = await CouponApi.getAllCoupons({ limit: 1000, offset: 0 });
			return filterValidCoupons(response.items);
		},
	});

	// Count local usage of coupons from line items
	const localCouponUsage = useMemo(() => {
		const usage: Record<string, number> = {};

		// Count line item level coupon usage
		Object.values(allLineItemCoupons).forEach((coupon) => {
			usage[coupon.id] = (usage[coupon.id] || 0) + 1;
		});

		// Add subscription level usage if there's a selected coupon
		if (selectedCoupon) {
			usage[selectedCoupon.id] = (usage[selectedCoupon.id] || 0) + 1;
		}

		return usage;
	}, [allLineItemCoupons, selectedCoupon]);

	const currencyFilteredCoupons: Coupon[] = useMemo(() => {
		if (!currency) return availableCoupons as Coupon[];
		const validCoupons = filterValidCoupons(availableCoupons as Coupon[], currency);

		// Filter out coupons that have reached their redemption limit
		return validCoupons.filter((coupon) => {
			// If this coupon is currently selected for subscription level, always show it
			// (to allow changing/removing)
			if (selectedCoupon?.id === coupon.id) {
				return true;
			}

			// Calculate total redemptions including local usage (excluding current selection)
			const localUsage = localCouponUsage[coupon.id] || 0;
			const adjustedLocalUsage = selectedCoupon?.id === coupon.id ? localUsage - 1 : localUsage;
			const totalRedemptions = coupon.total_redemptions + adjustedLocalUsage;

			// If coupon has max_redemptions, check if it has been exceeded
			if (coupon.max_redemptions && coupon.max_redemptions > 0) {
				return totalRedemptions < coupon.max_redemptions;
			}

			// No redemption limit, so it's available
			return true;
		});
	}, [availableCoupons, currency, selectedCoupon, localCouponUsage]);

	const handleSave = (couponId: string) => {
		const coupon = currencyFilteredCoupons.find((c) => c.id === couponId);
		if (!coupon) return setIsOpen(false);

		// Set single coupon
		onChange(coupon);
		setEditingCouponId(null);
		setIsOpen(false);
	};

	const handleDelete = () => {
		onChange(null);
	};

	const handleEdit = () => {
		setEditingCouponId(selectedCoupon?.id || null);
		setIsOpen(true);
	};

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<FormHeader className='mb-0' title={t('subscriptions.subscriptionCoupon')} variant='sub-header' />
				{!selectedCoupon && (
					<AddButton
						label={t('subscriptions.addCoupon')}
						onClick={() => {
							setEditingCouponId(null);
							setIsOpen(true);
						}}
						disabled={disabled}
					/>
				)}
			</div>

			{selectedCoupon ? (
				<div className='rounded-lg border border-gray-200 bg-blue-50 p-4'>
					<div className='flex items-center justify-between'>
						<div className='flex-1'>
							<div className='text-sm font-medium text-blue-900'>{selectedCoupon.name}</div>
							<div className='text-sm text-blue-700'>{formatCouponName(selectedCoupon)}</div>
							<div className='text-xs text-blue-600'>{selectedCoupon.currency?.toUpperCase()}</div>
						</div>
						{!disabled && (
							<div className='flex gap-2'>
								<button onClick={handleEdit} className='text-sm text-blue-600 hover:text-blue-800 underline'>
									{t('subscriptions.coupon.change')}
								</button>
								<button onClick={handleDelete} className='text-sm text-red-600 hover:text-red-800 underline'>
									{t('subscriptions.coupon.remove')}
								</button>
							</div>
						)}
					</div>
				</div>
			) : (
				<div className='rounded-xl border border-gray-300 p-4 text-center text-gray-500'>{t('subscriptions.coupon.emptyState')}</div>
			)}

			<CouponModal
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				coupons={currencyFilteredCoupons}
				onSave={handleSave}
				onCancel={() => {
					setIsOpen(false);
					setEditingCouponId(null);
				}}
				selectedCouponId={editingCouponId ?? undefined}
			/>
		</div>
	);
};

export default SubscriptionCoupon;
