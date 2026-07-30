import { Button, Input, Sheet, Spacer, Textarea, Select, SelectOption, DatePicker } from '@/components/atoms';
import { Coupon } from '@/models/Coupon';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import CouponApi from '@/api/CouponApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { useNavigate } from 'react-router';
import { COUPON_TYPE, COUPON_CADENCE } from '@/types/common/Coupon';
import { CreateCouponRequest, UpdateCouponRequest } from '@/types/dto/Coupon';
import { RouteNames } from '@/core/routes/Routes';
import { getCurrencyOptions } from '@/constants/constants';
import { useTranslation } from 'react-i18next';

interface Props {
	data?: Coupon | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

// Type for mutation data that can include id for edit operations
type MutationData = Partial<CreateCouponRequest> & { id?: string };

const CouponDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const isEdit = !!data;
	const navigate = useNavigate();

	const [formData, setFormData] = useState<Partial<CreateCouponRequest>>(
		data || {
			name: '',
			coupon_code: '',
			type: COUPON_TYPE.FIXED,
			cadence: COUPON_CADENCE.ONCE,
			currency: 'usd',
		},
	);
	const [errors, setErrors] = useState<Partial<Record<keyof CreateCouponRequest, string>>>({});

	const { mutate: updateCoupon, isPending } = useMutation({
		mutationFn: (data: MutationData) => {
			if (isEdit && data.id) {
				return CouponApi.updateCoupon(data.id, data as UpdateCouponRequest);
			} else {
				return CouponApi.createCoupon(data as CreateCouponRequest);
			}
		},
		onSuccess: (data: Coupon) => {
			toast.success(isEdit ? t('coupons.drawer.toast.updated') : t('coupons.drawer.toast.created'));
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
			navigate(`${RouteNames.coupons}/${data.id}`);
		},
		onError: (error: Error) => {
			toast.error(error.message || (isEdit ? t('coupons.drawer.toast.failedUpdate') : t('coupons.drawer.toast.failedCreate')));
		},
	});

	useEffect(() => {
		if (data) {
			setFormData(data);
		} else {
			setFormData({
				name: '',
				coupon_code: '',
				type: COUPON_TYPE.FIXED,
				cadence: COUPON_CADENCE.ONCE,
				currency: 'usd',
			});
		}
	}, [data]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof CreateCouponRequest, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = t('coupons.drawer.validation.nameRequired');
		}

		if (!isEdit && !formData.coupon_code?.trim()) {
			newErrors.coupon_code = t('coupons.drawer.validation.couponCodeRequired');
		}

		if (!formData.type) {
			newErrors.type = t('coupons.drawer.validation.typeRequired');
		}

		if (!formData.cadence) {
			newErrors.cadence = t('coupons.drawer.validation.cadenceRequired');
		}

		if (formData.type === COUPON_TYPE.FIXED && !formData.amount_off) {
			newErrors.amount_off = t('coupons.drawer.validation.amountOffFixedRequired');
		}

		if (formData.type === COUPON_TYPE.PERCENTAGE && !formData.percentage_off) {
			newErrors.percentage_off = t('coupons.drawer.validation.percentageOffRequired');
		}

		if (formData.type === COUPON_TYPE.FIXED && !formData.currency) {
			newErrors.currency = t('coupons.drawer.validation.currencyFixedRequired');
		}

		// Validate duration_in_periods for repeated cadence
		if (formData.cadence === COUPON_CADENCE.REPEATED && !formData.duration_in_periods) {
			newErrors.duration_in_periods = t('coupons.drawer.validation.durationRepeatedRequired');
		}

		// Validate date fields
		if (formData.redeem_after && formData.redeem_before) {
			const redeemAfter = new Date(formData.redeem_after);
			const redeemBefore = new Date(formData.redeem_before);

			if (redeemAfter >= redeemBefore) {
				newErrors.redeem_before = t('coupons.drawer.validation.redeemBeforeAfter');
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}
		// For percentage coupons, do not send currency in payload.
		const normalizedFormData: Partial<CreateCouponRequest> = {
			...formData,
			...(formData.type === COUPON_TYPE.PERCENTAGE ? { currency: undefined } : {}),
		};
		// For edit, include the id from the original data
		const dataToSubmit: MutationData = isEdit ? { ...normalizedFormData, id: data?.id } : normalizedFormData;
		updateCoupon(dataToSubmit);
	};

	const typeOptions: SelectOption[] = [
		{ label: t('coupons.drawer.fixedAmount'), value: COUPON_TYPE.FIXED },
		{ label: t('coupons.drawer.percentage'), value: COUPON_TYPE.PERCENTAGE },
	];

	const cadenceOptions: SelectOption[] = [
		{ label: t('coupons.drawer.cadenceOnce'), value: COUPON_CADENCE.ONCE },
		{ label: t('coupons.drawer.cadenceRepeated'), value: COUPON_CADENCE.REPEATED },
		{ label: t('coupons.drawer.cadenceForever'), value: COUPON_CADENCE.FOREVER },
	];

	const currencyOptions: SelectOption[] = getCurrencyOptions().map((currency) => {
		return {
			label: currency.currency,
			value: currency.currency.toLowerCase(),
		};
	});

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? t('coupons.drawer.editTitle') : t('coupons.drawer.createTitle')}
			description={isEdit ? t('coupons.drawer.descriptionEdit') : t('coupons.drawer.descriptionCreate')}
			trigger={trigger}>
			<Spacer height={'20px'} />
			<Input
				placeholder={t('coupons.drawer.namePlaceholder')}
				description={t('coupons.drawer.nameHelp')}
				label={t('coupons.drawer.couponName')}
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
					});
				}}
			/>

			{!isEdit && (
				<>
					<Spacer height={'20px'} />
					<Input
						id='coupon_code'
						label={t('coupons.drawer.couponCode')}
						placeholder={t('coupons.drawer.couponCodePlaceholder')}
						value={formData.coupon_code}
						error={errors.coupon_code as string | undefined}
						onChange={(e) => setFormData({ ...formData, coupon_code: e })}
						description={t('coupons.drawer.couponCodeHelp')}
					/>
				</>
			)}

			<Spacer height={'20px'} />
			<Select
				label={t('coupons.drawer.couponType')}
				placeholder={t('coupons.drawer.selectCouponType')}
				options={typeOptions}
				value={formData.type}
				onChange={(e) => setFormData({ ...formData, type: e as COUPON_TYPE })}
				error={errors.type}
				description={t('coupons.drawer.couponTypeHelp')}
			/>

			<Spacer height={'20px'} />
			{formData.type === COUPON_TYPE.FIXED ? (
				<div className='grid grid-cols-2 gap-4'>
					<Input
						label={t('coupons.drawer.amountOff')}
						placeholder={t('coupons.drawer.amountPlaceholder')}
						type='number'
						step='0.01'
						value={formData.amount_off}
						error={errors.amount_off}
						onChange={(e) => setFormData({ ...formData, amount_off: e })}
						description={t('coupons.drawer.amountHelp')}
					/>
					<Select
						label={t('coupons.drawer.currency')}
						placeholder={t('coupons.drawer.selectCurrency')}
						options={currencyOptions}
						value={formData.currency}
						onChange={(e) => setFormData({ ...formData, currency: e })}
						error={errors.currency}
					/>
				</div>
			) : (
				<Input
					label={t('coupons.drawer.percentageOff')}
					placeholder={t('coupons.drawer.percentagePlaceholder')}
					type='number'
					step='0.01'
					max='100'
					value={formData.percentage_off}
					error={errors.percentage_off}
					onChange={(e) => setFormData({ ...formData, percentage_off: e })}
					description={t('coupons.drawer.percentageHelp')}
				/>
			)}

			<Spacer height={'20px'} />
			<Select
				label={t('coupons.drawer.cadence')}
				placeholder={t('coupons.drawer.selectCadence')}
				options={cadenceOptions}
				value={formData.cadence}
				onChange={(e) => setFormData({ ...formData, cadence: e as COUPON_CADENCE })}
				error={errors.cadence}
				description={t('coupons.drawer.cadenceHelp')}
			/>

			<Spacer height={'20px'} />
			<div>
				<DatePicker
					label={t('coupons.drawer.redeemAfter')}
					date={formData.redeem_after ? new Date(formData.redeem_after) : undefined}
					setDate={(date) => setFormData({ ...formData, redeem_after: date?.toISOString() })}
					placeholder={t('coupons.drawer.selectStartDate')}
				/>
				<p className='text-xs text-muted-foreground mt-1'>{t('coupons.drawer.redeemAfterHelp')}</p>
				{errors.redeem_after && <p className='text-xs text-red-500 mt-1'>{errors.redeem_after}</p>}
			</div>

			<Spacer height={'20px'} />
			<div>
				<DatePicker
					label={t('coupons.drawer.redeemBefore')}
					date={formData.redeem_before ? new Date(formData.redeem_before) : undefined}
					setDate={(date) => setFormData({ ...formData, redeem_before: date?.toISOString() })}
					placeholder={t('coupons.drawer.selectExpiryDate')}
				/>
				<p className='text-xs text-muted-foreground mt-1'>{t('coupons.drawer.redeemBeforeHelp')}</p>
				{errors.redeem_before && <p className='text-xs text-red-500 mt-1'>{errors.redeem_before}</p>}
			</div>

			<Spacer height={'20px'} />
			<Input
				label={t('coupons.drawer.maxRedemptions')}
				placeholder={t('coupons.drawer.maxRedemptionsPlaceholder')}
				type='number'
				value={formData.max_redemptions?.toString()}
				onChange={(e) => setFormData({ ...formData, max_redemptions: e ? parseInt(e) : undefined })}
				description={t('coupons.drawer.maxRedemptionsHelp')}
			/>

			{formData.cadence === COUPON_CADENCE.REPEATED && (
				<>
					<Spacer height={'20px'} />
					<Input
						label={t('coupons.drawer.durationInPeriods')}
						placeholder={t('coupons.drawer.durationPlaceholder')}
						type='number'
						value={formData.duration_in_periods?.toString()}
						onChange={(e) => setFormData({ ...formData, duration_in_periods: e ? parseInt(e) : undefined })}
						error={errors.duration_in_periods}
						description={t('coupons.drawer.durationHelp')}
					/>
				</>
			)}

			<Spacer height={'20px'} />
			<Textarea
				value={formData.metadata ? JSON.stringify(formData.metadata, null, 2) : ''}
				onChange={(e) => {
					try {
						const metadata = e ? JSON.parse(e) : undefined;
						setFormData({ ...formData, metadata });
					} catch {
						setErrors({ ...errors, metadata: t('coupons.drawer.invalidMetadata') });
					}
				}}
				className='min-h-[100px]'
				placeholder={t('shared.metadataPlaceholder')}
				label={t('shared.metadataOptional')}
				description={t('shared.metadataJsonAdditional')}
			/>

			<Spacer height={'20px'} />
			<Button
				isLoading={isPending}
				disabled={isPending || !formData.name?.trim() || !formData.type || !formData.cadence || (!isEdit && !formData.coupon_code?.trim())}
				onClick={handleSave}>
				{isEdit ? t('common:actions.save') : t('common:actions.create')}
			</Button>
		</Sheet>
	);
};

export default CouponDrawer;
