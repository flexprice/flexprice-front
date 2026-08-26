import { Button, Input, Sheet, Textarea, Select, SelectOption } from '@/components/atoms';
import { FC, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import TaxApi from '@/api/TaxApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { TAX_RATE_TYPE, TAX_RATE_SCOPE, TaxRate } from '@/models/Tax';
import { CreateTaxRateRequest, UpdateTaxRateRequest } from '@/types/dto/tax';
import { useTranslation } from 'react-i18next';

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

const TaxDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const { t } = useTranslation('billing');
	const isEdit = !!data;

	const taxTypeOptions = useMemo<SelectOption[]>(
		() => [
			{ label: t('taxes.rateType.percentage'), value: TAX_RATE_TYPE.PERCENTAGE },
			{ label: t('taxes.rateType.fixedAmount'), value: TAX_RATE_TYPE.FIXED },
		],
		[t],
	);

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
			toast.success(isEdit ? t('taxes.toast.updatedSuccess') : t('taxes.toast.createdSuccess'));
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: Error) => {
			toast.error(error.message || (isEdit ? t('taxes.toast.saveFailedUpdate') : t('taxes.toast.saveFailedCreate')));
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
			newErrors.name = t('taxes.validation.nameRequired');
		}

		// Only validate code for create operation
		if (!isEdit && !formData.code?.trim()) {
			newErrors.code = t('taxes.validation.codeRequired');
		}

		// Only validate tax values for create operation (they can't be updated)
		if (!isEdit) {
			if (formData.tax_rate_type === TAX_RATE_TYPE.PERCENTAGE) {
				if (formData.percentage_value === undefined || formData.percentage_value < 0 || formData.percentage_value > 100) {
					newErrors.percentage_value = t('taxes.validation.percentageRange');
				}
			}

			if (formData.tax_rate_type === TAX_RATE_TYPE.FIXED) {
				if (formData.fixed_value === undefined || formData.fixed_value < 0) {
					newErrors.fixed_value = t('taxes.validation.fixedNonNegative');
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
			code: isEdit ? formData.code : t('taxes.drawer.codeAutoPrefix') + value.replace(/\s/g, '-').toLowerCase(),
		});
	};

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? t('taxes.drawer.titleEdit') : t('taxes.drawer.titleCreate')}
			description={isEdit ? t('taxes.drawer.descEdit') : t('taxes.drawer.descCreate')}
			trigger={trigger}>
			<div className='space-y-5 mt-4'>
				<Input
					placeholder={t('taxes.drawer.namePlaceholder')}
					description={t('taxes.drawer.nameHint')}
					label={t('taxes.drawer.nameLabel')}
					value={formData.name}
					error={errors.name}
					onChange={handleNameChange}
				/>

				<Input
					label={t('taxes.drawer.codeLabel')}
					disabled={isEdit}
					error={errors.code}
					onChange={(e) => setFormData({ ...formData, code: e })}
					value={formData.code}
					placeholder={t('taxes.drawer.codePlaceholder')}
					description={isEdit ? t('taxes.drawer.codeHintEdit') : t('taxes.drawer.codeHintCreate')}
				/>

				<Select
					label={t('taxes.drawer.taxTypeLabel')}
					options={taxTypeOptions}
					value={formData.tax_rate_type}
					onChange={(e) => setFormData({ ...formData, tax_rate_type: e as TAX_RATE_TYPE })}
					description={isEdit ? t('taxes.drawer.taxTypeHintEdit') : t('taxes.drawer.taxTypeHintCreate')}
					disabled={isEdit}
				/>

				{formData.tax_rate_type === TAX_RATE_TYPE.PERCENTAGE ? (
					<Input
						label={t('taxes.drawer.percentageLabel')}
						type='number'
						placeholder={t('taxes.drawer.numericPlaceholder')}
						value={formData.percentage_value?.toString() || ''}
						onChange={(e) => {
							const parsed = parseFloat(e);
							setFormData({ ...formData, percentage_value: Number.isFinite(parsed) ? parsed : undefined });
						}}
						error={errors.percentage_value}
						description={isEdit ? t('taxes.drawer.percentageHintEdit') : t('taxes.drawer.percentageHintCreate')}
						suffix={t('taxes.drawer.percentSuffix')}
						disabled={isEdit}
					/>
				) : (
					<Input
						label={t('taxes.drawer.fixedAmountLabel')}
						type='number'
						placeholder={t('taxes.drawer.numericPlaceholder')}
						value={formData.fixed_value?.toString() || ''}
						onChange={(e) => {
							const parsed = parseFloat(e);
							setFormData({ ...formData, fixed_value: Number.isFinite(parsed) ? parsed : undefined });
						}}
						error={errors.fixed_value}
						description={isEdit ? t('taxes.drawer.fixedHintEdit') : t('taxes.drawer.fixedHintCreate')}
						inputPrefix={t('taxes.drawer.fixedAmountPrefix')}
						disabled={isEdit}
					/>
				)}

				<Textarea
					value={formData.description}
					onChange={(e) => {
						setFormData({ ...formData, description: e });
					}}
					className='min-h-[6.25rem]'
					placeholder={t('taxes.drawer.descriptionPlaceholder')}
					label={t('taxes.drawer.descriptionLabel')}
					description={t('taxes.drawer.descriptionHint')}
				/>
				<Button
					isLoading={isPending}
					disabled={isPending || !formData.name?.trim() || (!isEdit && !formData.code?.trim())}
					onClick={handleSave}>
					{isEdit ? t('taxes.drawer.saveChanges') : t('taxes.drawer.createSubmit')}
				</Button>
			</div>
		</Sheet>
	);
};

export default TaxDrawer;
