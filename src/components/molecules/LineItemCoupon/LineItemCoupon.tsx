import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Coupon } from '@/models/Coupon';
import { useQuery } from '@tanstack/react-query';
import CouponApi from '@/api/CouponApi';
import filterValidCoupons from '@/utils/helpers/coupons';
import { CouponModal } from '@/components/molecules';
import formatCouponName from '@/utils/common/format_coupon_name';
import { cn } from '@/lib/utils';

type Props = {
	priceId: string;
	currency?: string;
	selectedCoupon?: Coupon;
	onChange: (priceId: string, coupon: Coupon | null) => void;
	disabled?: boolean;
	className?: string;
	showAddButton?: boolean;
	isModalOpen?: boolean;
	onModalClose?: () => void;
	// For tracking local coupon usage
	allLineItemCoupons?: Record<string, Coupon>; // Line item level coupons
	subscriptionLevelCoupons?: Coupon[]; // Subscription level coupons
};

const LineItemCoupon: React.FC<Props> = ({
	priceId,
	currency,
	selectedCoupon,
	onChange,
	disabled,
	className,
	showAddButton = true,
	isModalOpen = false,
	onModalClose,
	allLineItemCoupons = {},
	subscriptionLevelCoupons = [],
}) => {
	const { t } = useTranslation('common');
	const [isOpen, setIsOpen] = useState(isModalOpen);
	const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

	// Sync modal state with prop
	useEffect(() => {
		setIsOpen(isModalOpen);
		if (isModalOpen) {
			setEditingCouponId(selectedCoupon?.id || null);
		}
	}, [isModalOpen, selectedCoupon]);

	const { data: availableCoupons = [] } = useQuery({
		queryKey: ['availableCoupons'],
		queryFn: async () => {
			const response = await CouponApi.getAllCoupons({ limit: 1000, offset: 0 });
			return filterValidCoupons(response.items);
		},
	});

	// Count local usage of coupons across line items and subscription level
	const localCouponUsage = useMemo(() => {
		const usage: Record<string, number> = {};

		// Count line item level coupon usage
		Object.values(allLineItemCoupons).forEach((coupon) => {
			usage[coupon.id] = (usage[coupon.id] || 0) + 1;
		});

		// Count subscription level coupon usage
		subscriptionLevelCoupons.forEach((coupon) => {
			usage[coupon.id] = (usage[coupon.id] || 0) + 1;
		});

		return usage;
	}, [allLineItemCoupons, subscriptionLevelCoupons]);

	const currencyFilteredCoupons: Coupon[] = useMemo(() => {
		if (!currency) return availableCoupons as Coupon[];
		const validCoupons = filterValidCoupons(availableCoupons as Coupon[], currency);

		// Filter out coupons that have reached their redemption limit
		return validCoupons.filter((coupon) => {
			// If this coupon is currently selected for this line item, always show it
			// (to allow changing/removing)
			if (selectedCoupon?.id === coupon.id) {
				return true;
			}

			// Calculate total redemptions including local usage
			const localUsage = localCouponUsage[coupon.id] || 0;
			const totalRedemptions = coupon.total_redemptions + localUsage;

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
		if (!coupon) return closeModal();

		// Set single coupon
		onChange(priceId, coupon);
		setEditingCouponId(null);
		closeModal();
	};

	const handleDelete = () => {
		onChange(priceId, null);
	};

	const closeModal = () => {
		setIsOpen(false);
		onModalClose?.();
	};

	const openModal = () => {
		setEditingCouponId(null);
		setIsOpen(true);
	};

	if (!selectedCoupon && !showAddButton) {
		return null;
	}

	return (
		<div className={cn('space-y-2', className)}>
			{selectedCoupon && (
				<div className='rounded-lg border border-gray-200 bg-blue-50 p-2'>
					<div className='flex items-center justify-between'>
						<div className='flex-1'>
							<div className='text-xs font-medium text-blue-900'>{selectedCoupon.name}</div>
							<div className='text-xs text-blue-700'>{formatCouponName(selectedCoupon)}</div>
						</div>
						{!disabled && (
							<div className='flex gap-1'>
								<button onClick={handleDelete} className='text-xs text-red-600 hover:text-red-800 underline'>
									{t('form.remove')}
								</button>
							</div>
						)}
					</div>
				</div>
			)}

			{!disabled && showAddButton && !selectedCoupon && (
				<div className='flex justify-start'>
					<button onClick={openModal} className='text-xs text-blue-600 hover:text-blue-800 underline'>
						{t('labels.addCoupon')}
					</button>
				</div>
			)}

			<CouponModal
				isOpen={isOpen}
				onOpenChange={(open) => {
					if (!open) {
						closeModal();
						setEditingCouponId(null);
					}
				}}
				coupons={currencyFilteredCoupons}
				onSave={handleSave}
				onCancel={() => {
					closeModal();
					setEditingCouponId(null);
				}}
				selectedCouponId={editingCouponId ?? undefined}
			/>
		</div>
	);
};

export default LineItemCoupon;
