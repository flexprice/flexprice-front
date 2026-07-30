import { FC, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Select, SelectOption, Toggle, Dialog } from '@/components/atoms';
import TaxApi from '@/api/TaxApi';
import { TAXRATE_ENTITY_TYPE } from '@/models/Tax';
import { CreateTaxAssociationRequest, TaxRateResponse } from '@/types/dto/tax';
import { ENTITY_STATUS } from '@/models';
import { currencyOptions } from '@/constants/constants';
import { useTranslation } from 'react-i18next';

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
	const { t } = useTranslation('common');
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
			newErrors.tax_rate_code = t('taxAssociation.taxRateRequired');
		}

		// Validate priority
		const priority = Number(formData.priority);
		if (isNaN(priority) || priority < 1) {
			newErrors.priority = t('taxAssociation.priorityPositive');
		}

		// Validate currency
		if (!formData.currency?.trim()) {
			newErrors.currency = t('taxAssociation.currencyRequired');
		}

		return {
			isValid: Object.keys(newErrors).length === 0,
			errors: newErrors,
		};
	}, [formData, t]);

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
		<Dialog isOpen={open} onOpenChange={onOpenChange} title={t('taxAssociation.dialogTitle')} className='sm:max-w-[500px]'>
			<form onSubmit={handleSubmit} className='space-y-6'>
				<div className='space-y-4'>
					<div className='space-y-2'>
						<Select
							label={t('taxAssociation.labelTaxRate')}
							value={formData.tax_rate_code}
							onChange={(value: string) => handleFieldChange('tax_rate_code', value)}
							options={taxRateOptions}
							placeholder={t('taxAssociation.placeholderTaxRate')}
							disabled={isLoadingTaxRates}
							noOptionsText={t('taxAssociation.noTaxRatesFound')}
							error={errors.tax_rate_code}
						/>
						{isLoadingTaxRates && <p className='text-sm text-gray-500 mt-1'>{t('taxAssociation.loadingTaxRates')}</p>}
					</div>

					<div className='space-y-2'>
						<Input
							label={t('taxAssociation.labelPriority')}
							id='priority'
							type='number'
							min='1'
							value={formData.priority.toString()}
							onChange={(value) => handleFieldChange('priority', parseInt(value) || 1)}
							placeholder={t('taxAssociation.placeholderPriority')}
							error={errors.priority}
						/>
						<p className='text-sm text-gray-500'>{t('taxAssociation.priorityHint')}</p>
					</div>

					<div className='space-y-2'>
						<Select
							label={t('taxAssociation.labelCurrency')}
							value={formData.currency}
							onChange={(value: string) => handleFieldChange('currency', value)}
							options={currencyOptions}
							placeholder={t('taxAssociation.placeholderCurrency')}
							error={errors.currency}
						/>
					</div>

					<div className='space-y-2'>
						<Toggle
							checked={formData.auto_apply}
							onChange={(checked: boolean) => handleFieldChange('auto_apply', checked)}
							label={t('taxAssociation.labelAutoApply')}
						/>
						<p className='text-sm text-gray-500'>{t('taxAssociation.autoApplyHint')}</p>
					</div>
				</div>

				<div className='flex justify-end space-x-3 pt-4'>
					<Button type='button' variant='outline' onClick={handleCancel}>
						{t('actions.cancel')}
					</Button>
					<Button type='submit' disabled={!formData.tax_rate_code || isLoadingTaxRates}>
						{t('taxAssociation.submitLink')}
					</Button>
				</div>
			</form>
		</Dialog>
	);
};

export default TaxAssociationDialog;
