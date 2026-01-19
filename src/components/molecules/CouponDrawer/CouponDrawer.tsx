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
	const isEdit = !!data;
	const navigate = useNavigate();

	const [formData, setFormData] = useState<Partial<CreateCouponRequest>>(
		data || {
			name: '',
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
			toast.success(isEdit ? 'Coupon updated successfully' : 'Coupon created successfully');
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
			navigate(`${RouteNames.coupons}/${data.id}`);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || `Failed to ${isEdit ? 'update' : 'create'} coupon. Please try again.`);
		},
	});

	useEffect(() => {
		if (data) {
			setFormData(data);
		} else {
			setFormData({
				name: '',
				type: COUPON_TYPE.FIXED,
				cadence: COUPON_CADENCE.ONCE,
				currency: 'usd',
			});
		}
	}, [data]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof CreateCouponRequest, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = 'Name is required';
		}

		if (!formData.type) {
			newErrors.type = 'Type is required';
		}

		if (!formData.cadence) {
			newErrors.cadence = 'Cadence is required';
		}

		if (formData.type === COUPON_TYPE.FIXED && !formData.amount_off) {
			newErrors.amount_off = 'Amount off is required for fixed type coupons';
		}

		if (formData.type === COUPON_TYPE.PERCENTAGE && !formData.percentage_off) {
			newErrors.percentage_off = 'Percentage off is required for percentage type coupons';
		}

		if (formData.type === COUPON_TYPE.FIXED && !formData.currency) {
			newErrors.currency = 'Currency is required for fixed type coupons';
		}

		// Validate duration_in_periods for repeated cadence
		if (formData.cadence === COUPON_CADENCE.REPEATED && !formData.duration_in_periods) {
			newErrors.duration_in_periods = 'Duration in periods is required for repeated cadence';
		}

		// Validate date fields
		if (formData.redeem_after && formData.redeem_before) {
			const redeemAfter = new Date(formData.redeem_after);
			const redeemBefore = new Date(formData.redeem_before);

			if (redeemAfter >= redeemBefore) {
				newErrors.redeem_before = 'Redeem before date must be after redeem after date';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}
		// For edit, include the id from the original data
		const dataToSubmit: MutationData = isEdit ? { ...formData, id: data?.id } : formData;
		updateCoupon(dataToSubmit);
	};

	const typeOptions: SelectOption[] = [
		{ label: 'Fixed Amount', value: COUPON_TYPE.FIXED },
		{ label: 'Percentage', value: COUPON_TYPE.PERCENTAGE },
	];

	const cadenceOptions: SelectOption[] = [
		{ label: 'Once', value: COUPON_CADENCE.ONCE },
		{ label: 'Repeated', value: COUPON_CADENCE.REPEATED },
		{ label: 'Forever', value: COUPON_CADENCE.FOREVER },
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
			title={isEdit ? 'Edit Coupon' : 'Create Coupon'}
			description={isEdit ? 'Enter coupon details to update the coupon.' : 'Enter coupon details to create a new coupon.'}
			trigger={trigger}>
			<Spacer height={'20px'} />
			<Input
				placeholder='Enter a name for the coupon'
				description={'A descriptive name for this coupon.'}
				label='Coupon Name'
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
					});
				}}
			/>

			<Spacer height={'20px'} />
			<Select
				label='Coupon Type'
				placeholder='Select coupon type'
				options={typeOptions}
				value={formData.type}
				onChange={(e) => setFormData({ ...formData, type: e as COUPON_TYPE })}
				error={errors.type}
				description='Choose between fixed amount or percentage discount'
			/>

			<Spacer height={'20px'} />
			{formData.type === COUPON_TYPE.FIXED ? (
				<div className='grid grid-cols-2 gap-4'>
					<Input
						label='Amount Off'
						placeholder='0.00'
						type='number'
						step='0.01'
						value={formData.amount_off}
						error={errors.amount_off}
						onChange={(e) => setFormData({ ...formData, amount_off: e })}
						description='The fixed amount to discount'
					/>
					<Select
						label='Currency'
						placeholder='Select currency'
						options={currencyOptions}
						value={formData.currency}
						onChange={(e) => setFormData({ ...formData, currency: e })}
						error={errors.currency}
					/>
				</div>
			) : (
				<Input
					label='Percentage Off'
					placeholder='10'
					type='number'
					step='0.01'
					max='100'
					value={formData.percentage_off}
					error={errors.percentage_off}
					onChange={(e) => setFormData({ ...formData, percentage_off: e })}
					description='The percentage to discount (0-100)'
				/>
			)}

			<Spacer height={'20px'} />
			<Select
				label='Cadence'
				placeholder='Select cadence'
				options={cadenceOptions}
				value={formData.cadence}
				onChange={(e) => setFormData({ ...formData, cadence: e as COUPON_CADENCE })}
				error={errors.cadence}
				description='How often this coupon can be used'
			/>

			<Spacer height={'20px'} />
			<div>
				<DatePicker
					label='Redeem After (Optional)'
					date={formData.redeem_after ? new Date(formData.redeem_after) : undefined}
					setDate={(date) => setFormData({ ...formData, redeem_after: date?.toISOString() })}
					placeholder='Select start date'
				/>
				<p className='text-xs text-muted-foreground mt-1'>When the coupon becomes valid</p>
				{errors.redeem_after && <p className='text-xs text-red-500 mt-1'>{errors.redeem_after}</p>}
			</div>

			<Spacer height={'20px'} />
			<div>
				<DatePicker
					label='Redeem Before (Optional)'
					date={formData.redeem_before ? new Date(formData.redeem_before) : undefined}
					setDate={(date) => setFormData({ ...formData, redeem_before: date?.toISOString() })}
					placeholder='Select expiry date'
				/>
				<p className='text-xs text-muted-foreground mt-1'>When the coupon expires</p>
				{errors.redeem_before && <p className='text-xs text-red-500 mt-1'>{errors.redeem_before}</p>}
			</div>

			<Spacer height={'20px'} />
			<Input
				label='Max Redemptions (Optional)'
				placeholder='100'
				type='number'
				value={formData.max_redemptions?.toString()}
				onChange={(e) => setFormData({ ...formData, max_redemptions: e ? parseInt(e) : undefined })}
				description='Maximum number of times this coupon can be used'
			/>

			{formData.cadence === COUPON_CADENCE.REPEATED && (
				<>
					<Spacer height={'20px'} />
					<Input
						label='Duration in Periods'
						placeholder='3'
						type='number'
						value={formData.duration_in_periods?.toString()}
						onChange={(e) => setFormData({ ...formData, duration_in_periods: e ? parseInt(e) : undefined })}
						error={errors.duration_in_periods}
						description='Number of billing periods the discount applies (required for repeated cadence)'
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
					} catch (error) {
						setErrors({ ...errors, metadata: 'Invalid Metadata' });
					}
				}}
				className='min-h-[100px]'
				placeholder='{"key": "value"}'
				label='Metadata (Optional)'
				description='Additional metadata as JSON'
			/>

			<Spacer height={'20px'} />
			<Button
				isLoading={isPending}
				disabled={isPending || !formData.name?.trim() || !formData.type || !formData.cadence}
				onClick={handleSave}>
				{isEdit ? 'Save' : 'Create'}
			</Button>
		</Sheet>
	);
};

export default CouponDrawer;
