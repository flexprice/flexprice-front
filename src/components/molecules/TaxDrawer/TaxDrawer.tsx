import { Button, Input, Sheet, Spacer, Textarea, Select, SelectOption } from '@/components/atoms';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import TaxApi from '@/api/TaxApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { TAX_RATE_TYPE, TAX_RATE_SCOPE, TaxRate } from '@/models/Tax';
import { CreateTaxRateRequest, UpdateTaxRateRequest } from '@/types/dto/tax';

interface Props {
	data?: TaxRate | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

// Union type for form data that can handle both create and edit scenarios
type FormData = {
	id?: string; // Only present in edit mode
} & Partial<CreateTaxRateRequest>;

const taxTypeOptions: SelectOption[] = [
	{ label: 'Percentage', value: TAX_RATE_TYPE.PERCENTAGE },
	{ label: 'Fixed Amount', value: TAX_RATE_TYPE.FIXED },
];

// const scopeOptions: SelectOption[] = [
// 	{ label: 'Internal', value: TAX_RATE_SCOPE.INTERNAL },
// 	{ label: 'External', value: TAX_RATE_SCOPE.EXTERNAL },
// 	{ label: 'One-time', value: TAX_RATE_SCOPE.ONETIME },
// ];

const TaxDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const isEdit = !!data;

	const [formData, setFormData] = useState<FormData>({
		name: '',
		code: '',
		description: '',
		tax_rate_type: TAX_RATE_TYPE.PERCENTAGE,
		scope: TAX_RATE_SCOPE.INTERNAL,
		percentage_value: undefined,
		fixed_value: undefined,
	});
	const [errors, setErrors] = useState<Partial<Record<keyof CreateTaxRateRequest, string>>>({});

	const { mutate: saveTaxRate, isPending } = useMutation({
		mutationFn: (formData: FormData) => {
			if (isEdit && formData.id) {
				// For edit, only allow fields that can be updated
				const updatePayload: UpdateTaxRateRequest = {
					name: formData.name,
					description: formData.description,
					metadata: formData.metadata,
				};
				return TaxApi.updateTaxRate(formData.id, updatePayload);
			} else {
				// For create, require all necessary fields
				const createPayload: CreateTaxRateRequest = {
					name: formData.name!,
					code: formData.code!,
					description: formData.description,
					tax_rate_type: formData.tax_rate_type!,
					scope: formData.scope!,
					percentage_value: formData.percentage_value,
					fixed_value: formData.fixed_value,
					metadata: formData.metadata,
				};
				return TaxApi.createTaxRate(createPayload);
			}
		},
		onSuccess: () => {
			toast.success(isEdit ? 'Tax rate updated successfully' : 'Tax rate created successfully');
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: Error) => {
			toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} tax rate. Please try again.`);
		},
	});

	useEffect(() => {
		if (data) {
			// Edit mode - populate with existing data
			setFormData({
				id: data.id,
				name: data.name,
				code: data.code,
				description: data.description,
				tax_rate_type: data.tax_rate_type,
				scope: data.scope,
				percentage_value: data.percentage_value,
				fixed_value: data.fixed_value,
				metadata: data.metadata,
			});
		} else {
			// Create mode - reset to defaults
			setFormData({
				name: '',
				code: '',
				description: '',
				tax_rate_type: TAX_RATE_TYPE.PERCENTAGE,
				scope: TAX_RATE_SCOPE.INTERNAL,
				percentage_value: undefined,
				fixed_value: undefined,
			});
		}
	}, [data]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof CreateTaxRateRequest, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = 'Name is required';
		}

		// Only validate code for create operation
		if (!isEdit && !formData.code?.trim()) {
			newErrors.code = 'Code is required';
		}

		// Only validate tax values for create operation (they can't be updated)
		if (!isEdit) {
			if (formData.tax_rate_type === TAX_RATE_TYPE.PERCENTAGE) {
				if (formData.percentage_value === undefined || formData.percentage_value < 0 || formData.percentage_value > 100) {
					newErrors.percentage_value = 'Percentage value must be between 0 and 100';
				}
			}

			if (formData.tax_rate_type === TAX_RATE_TYPE.FIXED) {
				if (formData.fixed_value === undefined || formData.fixed_value < 0) {
					newErrors.fixed_value = 'Fixed value must be greater than or equal to 0';
				}
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}
		saveTaxRate(formData);
	};

	const handleNameChange = (value: string) => {
		setFormData({
			...formData,
			name: value,
			// Only auto-generate code for create operation
			code: isEdit ? formData.code : 'tax-' + value.replace(/\s/g, '-').toLowerCase(),
		});
	};

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? 'Edit Tax Rate' : 'Create Tax Rate'}
			description={isEdit ? 'Update tax rate details.' : 'Create a new tax rate for your billing system.'}
			trigger={trigger}>
			<Spacer height={'20px'} />
			<Input
				placeholder='Enter tax rate name'
				description={'A descriptive name for this tax rate (e.g., "GST", "VAT", "Sales Tax").'}
				label='Tax Rate Name'
				value={formData.name}
				error={errors.name}
				onChange={handleNameChange}
			/>

			<Spacer height={'20px'} />
			<Input
				label='Code'
				disabled={isEdit}
				error={errors.code}
				onChange={(e) => setFormData({ ...formData, code: e })}
				value={formData.code}
				placeholder='Enter unique code'
				description={
					isEdit ? 'Tax rate code cannot be changed after creation.' : 'A unique identifier for this tax rate (e.g., "GST", "VAT").'
				}
			/>

			<Spacer height={'20px'} />
			<Select
				label='Tax Type'
				options={taxTypeOptions}
				value={formData.tax_rate_type}
				onChange={(e) => setFormData({ ...formData, tax_rate_type: e as TAX_RATE_TYPE })}
				description={isEdit ? 'Tax type cannot be changed after creation.' : 'Choose how the tax is calculated.'}
				disabled={isEdit}
			/>

			<Spacer height={'20px'} />
			{formData.tax_rate_type === TAX_RATE_TYPE.PERCENTAGE ? (
				<Input
					label='Percentage Value'
					type='number'
					placeholder='0.00'
					value={formData.percentage_value?.toString() || ''}
					onChange={(e) => setFormData({ ...formData, percentage_value: parseFloat(e) || undefined })}
					error={errors.percentage_value}
					description={isEdit ? 'Percentage value cannot be changed after creation.' : 'Enter the percentage value (0-100).'}
					suffix='%'
					disabled={isEdit}
				/>
			) : (
				<Input
					label='Fixed Amount'
					type='number'
					placeholder='0.00'
					value={formData.fixed_value?.toString() || ''}
					onChange={(e) => setFormData({ ...formData, fixed_value: parseFloat(e) || undefined })}
					error={errors.fixed_value}
					description={isEdit ? 'Fixed amount cannot be changed after creation.' : 'Enter the fixed amount in your default currency.'}
					inputPrefix='$'
					disabled={isEdit}
				/>
			)}

			<Spacer height={'20px'} />
			<Textarea
				value={formData.description}
				onChange={(e) => {
					setFormData({ ...formData, description: e });
				}}
				className='min-h-[100px]'
				placeholder='Enter description'
				label='Description'
				description='Optional description to help your team understand this tax rate.'
			/>
			<Spacer height={'20px'} />
			<Button
				isLoading={isPending}
				disabled={isPending || !formData.name?.trim() || (!isEdit && !formData.code?.trim())}
				onClick={handleSave}>
				{isEdit ? 'Save Changes' : 'Create Tax Rate'}
			</Button>
		</Sheet>
	);
};

export default TaxDrawer;
