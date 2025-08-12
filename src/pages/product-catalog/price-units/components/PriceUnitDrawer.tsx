import { FC, useEffect, useState } from 'react';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Input, Sheet, Spacer } from '@/components/atoms';
import PriceUnitApi from '@/api/PriceUnitApi';
import { PriceUnitResponse } from '@/types/dto/PriceUnit';
import { Decimal } from 'decimal.js';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { logger } from '@/utils/common/Logger';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	code: z.string().length(3, 'Code must be exactly 3 characters'),
	symbol: z.string().max(10, 'Symbol must be at most 10 characters'),
	base_currency: z.string().length(3, 'Base currency must be exactly 3 characters'),
	conversion_rate: z.string().refine((val) => {
		try {
			const decimal = new Decimal(val);
			return decimal.greaterThan(0);
		} catch {
			return false;
		}
	}, 'Conversion rate must be a positive number'),
	precision: z.number().min(0).max(8),
});

interface Props {
	data?: PriceUnitResponse;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
}

const PriceUnitDrawer: FC<Props> = ({ data, onOpenChange, open, trigger }) => {
	const [formData, setFormData] = useState<Partial<PriceUnitResponse>>(data || {});
	const [errors, setErrors] = useState<Partial<Record<keyof PriceUnitResponse, string>>>({});
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = open !== undefined && onOpenChange !== undefined;
	const isEdit = !!data;

	useEffect(() => {
		setFormData(data || {});
	}, [data]);

	const currentOpen = isControlled ? open : internalOpen;
	const toggleOpen = (open?: boolean) => {
		if (isControlled) {
			onOpenChange?.(open ?? false);
		} else {
			setInternalOpen((prev) => !prev);
		}
	};

	const handleChange = (name: keyof typeof formData, value: string | number | undefined) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const validateForm = () => {
		const result = schema.safeParse(formData);
		if (!result.success) {
			const newErrors: Partial<Record<keyof PriceUnitResponse, string>> = {};
			result.error.errors.forEach((error) => {
				const field = error.path[0] as keyof PriceUnitResponse;
				newErrors[field] = error.message;
			});
			setErrors(newErrors);
			return false;
		}
		setErrors({});
		return true;
	};

	const { mutate: savePriceUnit, isPending } = useMutation({
		mutationFn: async () => {
			const payload = {
				name: formData.name!,
				code: formData.code!,
				symbol: formData.symbol!,
				base_currency: formData.base_currency!,
				conversion_rate: new Decimal(formData.conversion_rate!),
				precision: formData.precision!,
			};

			if (data) {
				return await PriceUnitApi.update(data.id, payload);
			} else {
				return await PriceUnitApi.create(payload);
			}
		},
		onSuccess: async () => {
			await refetchQueries(['fetchPriceUnits']);
			toast.success(data ? 'Price unit updated successfully' : 'Price unit added successfully');
			if (!data) {
				setFormData({});
			}
			toggleOpen();
		},
		onError: (error: ServerError) => {
			logger.error(error);
			toast.error(error.error?.message || 'Failed to save price unit. Please try again.');
		},
	});

	const handleSubmit = () => {
		if (validateForm()) {
			savePriceUnit();
		}
	};

	const isCtaDisabled = !formData.name || !formData.code || !formData.base_currency || !formData.conversion_rate;

	return (
		<div>
			<Sheet
				isOpen={currentOpen}
				onOpenChange={toggleOpen}
				title={data ? 'Edit Price Unit' : 'Create Price Unit'}
				description={data ? 'Update price unit details.' : 'Enter details to create a new price unit.'}
				trigger={trigger}>
				<div className='space-y-4'>
					<Spacer className='!h-4' />
					<div className='relative card !p-4'>
						<span className='absolute -top-4 left-2 text-[#18181B] text-sm bg-white font-medium px-2 py-1'>Price Unit Details</span>
						<div className='space-y-4'>
							<Input
								label='Name'
								placeholder='Enter Name'
								value={formData.name || ''}
								onChange={(e) => handleChange('name', e)}
								error={errors.name}
							/>

							<Input
								label='Code'
								placeholder='e.g. USD'
								value={formData.code || ''}
								onChange={(e) => handleChange('code', e)}
								error={errors.code}
								disabled={isEdit}
								maxLength={3}
							/>

							<Input
								label='Symbol'
								placeholder='e.g. $'
								value={formData.symbol || ''}
								onChange={(e) => handleChange('symbol', e)}
								error={errors.symbol}
								maxLength={10}
							/>

							<Input
								label='Base Currency'
								placeholder='e.g. USD'
								value={formData.base_currency || ''}
								onChange={(e) => handleChange('base_currency', e)}
								error={errors.base_currency}
								disabled={isEdit}
								maxLength={3}
							/>

							<Input
								label='Conversion Rate'
								type='number'
								step='any'
								placeholder='e.g. 1.0'
								value={formData.conversion_rate?.toString() || ''}
								onChange={(e) => handleChange('conversion_rate', e)}
								error={errors.conversion_rate}
							/>

							<Input
								label='Precision'
								type='number'
								placeholder='e.g. 2'
								value={formData.precision?.toString() || '2'}
								onChange={(e) => handleChange('precision', Number(e))}
								error={errors.precision}
								min={0}
								max={8}
							/>
						</div>
					</div>

					<Spacer className='!h-4' />
					<Button isLoading={isPending} disabled={isPending || isCtaDisabled} onClick={handleSubmit}>
						{isPending ? 'Saving...' : data ? 'Update Price Unit' : 'Create Price Unit'}
					</Button>
				</div>
			</Sheet>
		</div>
	);
};

export default PriceUnitDrawer;
