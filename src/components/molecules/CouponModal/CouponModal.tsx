import { Button, Select, SelectOption } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import { Coupon } from '@/models/Coupon';
import formatCouponName from '@/utils/common/format_coupon_name';
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSave: (couponId: string) => void;
	onCancel: () => void;
	coupons: Coupon[];
	selectedCouponId?: string;
}

interface FormErrors {
	couponId?: string;
}

const CouponModal: React.FC<Props> = ({ isOpen, onOpenChange, onSave, onCancel, coupons, selectedCouponId }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const [errors, setErrors] = useState<FormErrors>({});
	const [selectedCoupon, setSelectedCoupon] = useState<string>(selectedCouponId || '');

	useEffect(() => {
		if (isOpen) {
			setSelectedCoupon(selectedCouponId || '');
			setErrors({});
		}
	}, [isOpen, selectedCouponId]);

	const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
		const newErrors: FormErrors = {};

		if (!selectedCoupon) {
			newErrors.couponId = t('coupons.modal.selectCouponRequired');
		}

		return {
			isValid: Object.keys(newErrors).length === 0,
			errors: newErrors,
		};
	}, [selectedCoupon, t]);

	const handleSave = useCallback(() => {
		const validation = validateForm();

		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		setErrors({});
		onSave(selectedCoupon);
		setSelectedCoupon('');
		onOpenChange(false);
	}, [selectedCoupon, validateForm, onSave, onOpenChange]);

	const handleCancel = useCallback(() => {
		setSelectedCoupon(selectedCouponId || '');
		setErrors({});
		onCancel();
	}, [selectedCouponId, onCancel]);

	const handleCouponChange = useCallback(
		(value: string) => {
			setSelectedCoupon(value);
			if (errors.couponId) {
				setErrors((prev) => ({ ...prev, couponId: undefined }));
			}
		},
		[errors.couponId],
	);

	const couponOptions: SelectOption[] = coupons.map((coupon) => ({
		label: coupon.name,
		value: coupon.id,
		description: formatCouponName(coupon),
	}));

	return (
		<Dialog
			isOpen={isOpen}
			showCloseButton={false}
			onOpenChange={onOpenChange}
			title={t('coupons.modal.title')}
			className='sm:max-w-[31.25rem]'>
			<div className='grid gap-4 mt-3'>
				<div className='space-y-2'>
					<Select
						label={t('coupons.modal.selectCoupon')}
						placeholder={t('coupons.modal.chooseACoupon')}
						options={couponOptions}
						value={selectedCoupon}
						onChange={handleCouponChange}
						error={errors.couponId}
					/>
				</div>
			</div>

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={handleCancel}>
					{t('common:actions.cancel')}
				</Button>
				<Button onClick={handleSave}>{t('common:actions.add')}</Button>
			</div>
		</Dialog>
	);
};

export default CouponModal;
