import { FC, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Select, SelectOption, Toggle, Dialog } from '@/components/atoms';
import TaxApi from '@/api/TaxApi';
import { TAXRATE_ENTITY_TYPE } from '@/models/Tax';
import { CreateTaxAssociationRequest, TaxRateResponse } from '@/types/dto/tax';
import { currencyOptions } from '@/constants/constants';
import { ENTITY_STATUS } from '@/models/base';

interface TaxAssociationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	entityType: TAXRATE_ENTITY_TYPE;
	entityId: string;
	onSave: (data: CreateTaxAssociationRequest) => void;
	onCancel: () => void;
	data?: CreateTaxAssociationRequest;
	alreadyLinkedTaxRateCodes?: string[];
}

interface FormData {
	tax_rate_code: string;
	priority: number;
	currency: string;
	auto_apply: boolean;
}

interface FormErrors {
	tax_rate_code?: string;
	priority?: string;
	currency?: string;
}

const TaxAssociationDialog: FC<TaxAssociationDialogProps> = ({
	open,
	onOpenChange,
	entityType,
	entityId,
	onSave,
	onCancel,
	data,
	alreadyLinkedTaxRateCodes,
}) => {
	console.log('data', data);

	const [formData, setFormData] = useState<FormData>({
		tax_rate_code: data?.tax_rate_code || '',
		priority: data?.priority || 1,
		currency: data?.currency || 'usd',
		auto_apply: data?.auto_apply || true,
	});

	const [errors, setErrors] = useState<FormErrors>({});

	// Fetch published tax rates
	const { data: taxRatesData, isLoading: isLoadingTaxRates } = useQuery({
		queryKey: ['fetchPublishedTaxRates'],
		queryFn: async () => {
			return await TaxApi.listTaxRates({ limit: 1000, status: ENTITY_STATUS.PUBLISHED });
		},
		enabled: open,
	});

	const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
		const newErrors: FormErrors = {};

		// Validate tax rate code
		if (!formData.tax_rate_code?.trim()) {
			newErrors.tax_rate_code = 'Tax rate is required';
		}

		// Validate priority
		const priority = Number(formData.priority);
		if (isNaN(priority) || priority < 1) {
			newErrors.priority = 'Priority must be a positive number';
		}

		// Validate currency
		if (!formData.currency?.trim()) {
			newErrors.currency = 'Currency is required';
		}

		return {
			isValid: Object.keys(newErrors).length === 0,
			errors: newErrors,
		};
	}, [formData]);

	// Handle field changes with error clearing
	const handleFieldChange = useCallback(
		(field: keyof FormData, value: any) => {
			setFormData((prev) => ({ ...prev, [field]: value }));
			// Clear error for this field when user starts typing
			if (errors[field as keyof FormErrors]) {
				setErrors((prev) => ({ ...prev, [field]: undefined }));
			}
		},
		[errors],
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();

			const validation = validateForm();

			if (!validation.isValid) {
				setErrors(validation.errors);
				return;
			}

			const payload: CreateTaxAssociationRequest = {
				tax_rate_code: formData.tax_rate_code,
				entity_type: entityType,
				entity_id: entityId,
				priority: formData.priority,
				currency: formData.currency,
				auto_apply: formData.auto_apply,
			};

			onSave(payload);
		},
		[formData, entityType, entityId, onSave, validateForm],
	);

	const handleCancel = useCallback(() => {
		setFormData({
			tax_rate_code: '',
			priority: 1,
			currency: '',
			auto_apply: true,
		});
		setErrors({});
		onCancel();
		onOpenChange(false);
	}, [onCancel, onOpenChange]);

	const taxRateOptions: SelectOption[] = (taxRatesData?.items || []).map((taxRate: TaxRateResponse) => ({
		label: `${taxRate.name} (${taxRate.code})`,
		value: taxRate.code,
		description: taxRate.description,
		disabled: alreadyLinkedTaxRateCodes?.includes(taxRate.code),
	}));

	return (
		<Dialog isOpen={open} onOpenChange={onOpenChange} title='Link Tax Rate' className='sm:max-w-[500px]'>
			<form onSubmit={handleSubmit} className='space-y-6'>
				<div className='space-y-4'>
					<div className='space-y-2'>
						<Select
							label='Tax Rate'
							value={formData.tax_rate_code}
							onChange={(value: string) => handleFieldChange('tax_rate_code', value)}
							options={taxRateOptions}
							placeholder='Select a tax rate'
							disabled={isLoadingTaxRates}
							noOptionsText='No tax rates found'
							error={errors.tax_rate_code}
						/>
						{isLoadingTaxRates && <p className='text-sm text-gray-500 mt-1'>Loading tax rates...</p>}
					</div>

					<div className='space-y-2'>
						<Input
							label='Priority'
							id='priority'
							type='number'
							min='1'
							value={formData.priority.toString()}
							onChange={(value) => handleFieldChange('priority', parseInt(value) || 1)}
							placeholder='Enter priority (1-100)'
							error={errors.priority}
						/>
						<p className='text-sm text-gray-500'>Determines the order of application when multiple tax rates apply</p>
					</div>

					<div className='space-y-2'>
						<Select
							label='Currency'
							value={formData.currency}
							onChange={(value: string) => handleFieldChange('currency', value)}
							options={currencyOptions}
							placeholder='Select currency'
							error={errors.currency}
						/>
					</div>

					<div className='space-y-2'>
						<Toggle
							checked={formData.auto_apply}
							onChange={(checked: boolean) => handleFieldChange('auto_apply', checked)}
							label='Auto Apply'
						/>
						<p className='text-sm text-gray-500'>Automatically apply this tax rate when applicable</p>
					</div>
				</div>

				<div className='flex justify-end space-x-3 pt-4'>
					<Button type='button' variant='outline' onClick={handleCancel}>
						Cancel
					</Button>
					<Button type='submit' disabled={!formData.tax_rate_code || isLoadingTaxRates}>
						Link Tax Rate
					</Button>
				</div>
			</form>
		</Dialog>
	);
};

export default TaxAssociationDialog;
