import { Button, Input, Select, Sheet, Spacer, Textarea } from '@/components/atoms';
import { PriceUnit } from '@/models/PriceUnit';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PriceUnitApi } from '@/api/PriceUnitApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { CreatePriceUnitRequest, UpdatePriceUnitRequest, PriceUnitResponse, CreatePriceUnitResponse } from '@/types/dto';
import { currencyOptions } from '@/constants/constants';

interface Props {
	data?: PriceUnit | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const PriceUnitDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const isEdit = !!data;

	const [formData, setFormData] = useState<CreatePriceUnitRequest & { id?: string }>({
		name: data?.name || '',
		code: data?.code || '',
		symbol: data?.symbol || '',
		base_currency: data?.base_currency || '',
		conversion_rate: data?.conversion_rate || '',
		metadata: data?.metadata || undefined,
		id: data?.id,
	});
	const [metadataString, setMetadataString] = useState<string>(data?.metadata ? JSON.stringify(data.metadata, null, 2) : '');
	const [errors, setErrors] = useState<Partial<Record<keyof CreatePriceUnitRequest, string>>>({});

	const { mutate: updatePriceUnit, isPending } = useMutation<
		PriceUnitResponse | CreatePriceUnitResponse,
		ServerError,
		CreatePriceUnitRequest | (UpdatePriceUnitRequest & { id: string })
	>({
		mutationFn: (vars) => {
			if (isEdit) {
				const { id, ...rest } = vars as UpdatePriceUnitRequest & { id: string };
				return PriceUnitApi.UpdatePriceUnit(id, rest);
			}
			return PriceUnitApi.CreatePriceUnit(vars as CreatePriceUnitRequest);
		},
		onSuccess: () => {
			toast.success(isEdit ? 'Price unit updated successfully' : 'Price unit created successfully');
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || `Failed to ${isEdit ? 'update' : 'create'} price unit. Please try again.`);
		},
	});

	useEffect(() => {
		if (data) {
			// Map PriceUnit to CreatePriceUnitRequest structure for form
			setFormData({
				id: data.id,
				name: data.name || '',
				code: data.code || '',
				symbol: data.symbol || '',
				base_currency: data.base_currency || '',
				conversion_rate: data.conversion_rate || '',
				metadata: data.metadata || undefined,
			});
			setMetadataString(data.metadata ? JSON.stringify(data.metadata, null, 2) : '');
		} else {
			setFormData({
				name: '',
				code: '',
				symbol: '',
				base_currency: '',
				conversion_rate: '',
			});
			setMetadataString('');
		}
		setErrors({});
	}, [data, open]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof CreatePriceUnitRequest, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = 'Name is required';
		}

		if (!formData.code?.trim()) {
			newErrors.code = 'Code is required';
		}

		if (formData.code?.trim().length !== 3) {
			newErrors.code = 'Code must be exactly 3 characters';
		}

		if (!formData.symbol?.trim()) {
			newErrors.symbol = 'Symbol is required';
		}

		if (!formData.base_currency?.trim()) {
			newErrors.base_currency = 'Base currency is required';
		} else if (formData.base_currency.length !== 3) {
			newErrors.base_currency = 'Base currency must be exactly 3 characters';
		}

		if (!formData.conversion_rate?.trim()) {
			newErrors.conversion_rate = 'Conversion rate is required';
		} else {
			const rate = parseFloat(formData.conversion_rate);
			if (isNaN(rate)) {
				newErrors.conversion_rate = 'Conversion rate must be a valid number';
			} else if (rate <= 0) {
				newErrors.conversion_rate = 'Conversion rate must be greater than 0';
			}
		}

		// Only validate metadata in edit mode
		if (isEdit && metadataString.trim()) {
			try {
				const parsed = JSON.parse(metadataString);
				if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
					newErrors.metadata = 'Metadata must be a JSON object';
				} else {
					const allStrings = Object.values(parsed).every((val) => typeof val === 'string');
					if (!allStrings) {
						newErrors.metadata = 'All metadata values must be strings';
					}
				}
			} catch {
				newErrors.metadata = 'Invalid Metadata format';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}

		let metadata = undefined;
		if (metadataString.trim()) {
			try {
				metadata = JSON.parse(metadataString);
			} catch {
				return;
			}
		}

		if (isEdit) {
			const updateDto: UpdatePriceUnitRequest & { id: string } = {
				id: formData.id!,
				name: formData.name.trim(),
				metadata,
			};
			updatePriceUnit(updateDto);
		} else {
			// Build CreatePriceUnitRequest DTO (metadata not included during creation)
			const createDto: CreatePriceUnitRequest = {
				name: formData.name.trim(),
				code: formData.code.trim(),
				symbol: formData.symbol.trim(),
				base_currency: formData.base_currency.trim(),
				conversion_rate: formData.conversion_rate.trim(),
			};
			updatePriceUnit(createDto);
		}
	};

	const isFormValid =
		formData.name?.trim() &&
		formData.code?.trim() &&
		formData.symbol?.trim() &&
		formData.base_currency?.trim() &&
		formData.conversion_rate?.trim();

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? 'Edit Price Unit' : 'Create Price Unit'}
			description={isEdit ? 'Enter price unit details to update the price unit.' : 'Enter price unit details to create a new price unit.'}
			trigger={trigger}>
			<Input
				placeholder='Enter a name for the price unit'
				description={'A descriptive name for this price unit (e.g., Bitcoin, Tokens, Credits).'}
				label='Name'
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({ ...formData, name: e });
				}}
			/>

			<Spacer height={'20px'} />
			<Input
				label='Code'
				error={errors.code}
				onChange={(e) => {
					setFormData({ ...formData, code: e });
				}}
				value={formData.code}
				placeholder='Enter a unique code for the price unit'
				disabled={isEdit}
			/>

			<Spacer height={'20px'} />
			<Input
				label='Symbol'
				error={errors.symbol}
				onChange={(e) => {
					setFormData({ ...formData, symbol: e });
				}}
				value={formData.symbol}
				placeholder='Enter a symbol (e.g., ₿, €, tokens)'
				description={'The display symbol for this price unit (e.g., ₿ for Bitcoin, € for Euro, "tokens" for tokens).'}
			/>

			<Spacer height={'20px'} />
			<Select
				label='Base Currency'
				error={errors.base_currency}
				onChange={(value) => {
					setFormData({ ...formData, base_currency: value });
				}}
				value={formData.base_currency}
				options={currencyOptions}
				placeholder='Select base currency'
				description={'The base currency code (3 letters, e.g., USD, EUR, GBP).'}
			/>

			<Spacer height={'20px'} />
			<Input
				label='Conversion Rate'
				error={errors.conversion_rate}
				onChange={(e) => {
					setFormData({ ...formData, conversion_rate: e });
				}}
				value={formData.conversion_rate}
				placeholder='0.01'
				description={
					'The exchange rate from this price unit to the base currency. Must be greater than 0. Example: 0.01 means 100 units = 1.00 USD.'
				}
				type='number'
				step='any'
			/>

			{isEdit && (
				<>
					<Spacer height={'20px'} />
					<Textarea
						value={metadataString}
						onChange={(e) => {
							setMetadataString(e);
							if (errors.metadata) {
								setErrors({ ...errors, metadata: undefined });
							}
						}}
						error={errors.metadata}
						className='min-h-[100px]'
						placeholder='{"key": "value"}'
						label='Metadata (Optional)'
						description='Additional metadata as JSON. All values must be strings.'
					/>
				</>
			)}

			<Spacer height={'20px'} />
			<Button isLoading={isPending} disabled={isPending || !isFormValid} onClick={handleSave}>
				{isEdit ? 'Save' : 'Create'}
			</Button>
		</Sheet>
	);
};

export default PriceUnitDrawer;
