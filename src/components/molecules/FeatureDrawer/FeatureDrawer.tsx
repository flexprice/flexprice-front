import { Button, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import SelectGroup from '@/components/organisms/PlanForm/SelectGroup';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import FeatureApi from '@/api/FeatureApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { UpdateFeatureRequest } from '@/types/dto/Feature';
import Feature from '@/models/Feature';
import { GROUP_ENTITY_TYPE } from '@/models/Group';
import { useTranslation } from 'react-i18next';

interface Props {
	data: Feature; // Required - update-only drawer
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const getInitialReportingUnit = (data: Feature | undefined) => {
	if (data?.reporting_unit) {
		return {
			unit_singular: data.reporting_unit.unit_singular ?? '',
			unit_plural: data.reporting_unit.unit_plural ?? '',
			conversion_rate: data.reporting_unit.conversion_rate ?? '0.01',
		};
	}
	return { unit_singular: '', unit_plural: '', conversion_rate: '0.01' };
};

const FeatureDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const { t } = useTranslation(['catalog', 'common']);
	const [formData, setFormData] = useState<UpdateFeatureRequest>({
		name: data?.name || '',
		description: data?.description || '',
		group_id: data?.group_id ?? data?.group?.id ?? '',
		unit_singular: data?.unit_singular || '',
		unit_plural: data?.unit_plural || '',
		reporting_unit: getInitialReportingUnit(data),
	});
	const [errors, setErrors] = useState<Partial<Record<keyof UpdateFeatureRequest, string>>>({});

	const { mutate: updateFeature, isPending } = useMutation({
		mutationFn: (updateData: UpdateFeatureRequest) => {
			return FeatureApi.updateFeature(data.id, updateData);
		},
		onSuccess: () => {
			toast.success('Feature updated successfully');
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update feature. Please try again.');
		},
	});

	useEffect(() => {
		if (data) {
			setFormData({
				name: data.name || '',
				description: data.description || '',
				group_id: data.group_id ?? data.group?.id ?? '',
				unit_singular: data.unit_singular || '',
				unit_plural: data.unit_plural || '',
				reporting_unit: getInitialReportingUnit(data),
			});
		}
		setErrors({});
	}, [data, open]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof UpdateFeatureRequest, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = 'Name is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}

		const updateDto: UpdateFeatureRequest = {
			name: formData.name?.trim(),
			description: formData.description?.trim() || undefined,
			group_id: formData.group_id?.trim() === '' ? '' : formData.group_id?.trim() || undefined,
			unit_singular: formData.unit_singular?.trim() || undefined,
			unit_plural: formData.unit_plural?.trim() || undefined,
			reporting_unit:
				formData.reporting_unit && (formData.reporting_unit.unit_singular?.trim() || formData.reporting_unit.unit_plural?.trim())
					? {
							unit_singular: formData.reporting_unit.unit_singular?.trim() ?? '',
							unit_plural: formData.reporting_unit.unit_plural?.trim() ?? '',
							conversion_rate: formData.reporting_unit.conversion_rate?.trim() || '0.01',
						}
					: undefined,
		};

		updateFeature(updateDto);
	};

	const isCtaDisabled = !formData.name?.trim() || isPending;

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={t('catalog:features.drawer.editTitle')}
			description={t('catalog:features.drawer.description')}
			trigger={trigger}>
			<div className='space-y-8 mt-4'>
				<Input
					label={t('catalog:features.drawer.name')}
					placeholder={t('catalog:features.drawer.namePlaceholder')}
					value={formData.name || ''}
					error={errors.name}
					onChange={(e) => {
						setFormData({ ...formData, name: e });
					}}
				/>

				<Textarea
					label={t('catalog:features.drawer.descriptionLabel')}
					placeholder={t('catalog:shared.enterDescription')}
					value={formData.description || ''}
					onChange={(e) => {
						setFormData({ ...formData, description: e });
					}}
					className='min-h-[6.25rem]'
				/>

				<SelectGroup
					entityType={GROUP_ENTITY_TYPE.FEATURE}
					label={t('catalog:features.drawer.group')}
					placeholder={t('catalog:features.drawer.groupPlaceholder')}
					value={formData.group_id ?? ''}
					onChange={(group) => setFormData({ ...formData, group_id: group?.id ?? '' })}
					showLookupKey={false}
				/>

				<Input
					label={t('catalog:features.drawer.unitSingular')}
					placeholder={t('catalog:features.drawer.unitSingularPh')}
					value={formData.unit_singular || ''}
					onChange={(e) => {
						setFormData({ ...formData, unit_singular: e });
					}}
				/>

				<Input
					label={t('catalog:features.drawer.unitPlural')}
					placeholder={t('catalog:features.drawer.unitPluralPh')}
					value={formData.unit_plural || ''}
					onChange={(e) => {
						setFormData({ ...formData, unit_plural: e });
					}}
				/>

				<Input
					label={t('catalog:features.drawer.displayUnitSingular')}
					placeholder={t('catalog:features.drawer.unitSingularPh')}
					value={formData.reporting_unit?.unit_singular ?? ''}
					onChange={(e) => {
						const pluralSuffix = t('catalog:features.drawer.displayUnitPluralAutoSuffix');
						setFormData({
							...formData,
							reporting_unit: {
								unit_singular: e,
								unit_plural: e ? `${e}${pluralSuffix}` : '',
								conversion_rate: formData.reporting_unit?.conversion_rate ?? '0.01',
							},
						});
					}}
				/>

				<Input
					label={t('catalog:features.drawer.displayUnitPlural')}
					placeholder={t('catalog:features.drawer.unitPluralPh')}
					value={formData.reporting_unit?.unit_plural ?? ''}
					onChange={(e) => {
						setFormData({
							...formData,
							reporting_unit: {
								unit_singular: formData.reporting_unit?.unit_singular ?? '',
								unit_plural: e,
								conversion_rate: formData.reporting_unit?.conversion_rate ?? '0.01',
							},
						});
					}}
				/>

				<Input
					label={t('catalog:features.drawer.conversionFactor')}
					placeholder={t('catalog:features.drawer.conversionFactorPh')}
					value={formData.reporting_unit?.conversion_rate ?? ''}
					onChange={(e) => {
						setFormData({
							...formData,
							reporting_unit: {
								unit_singular: formData.reporting_unit?.unit_singular ?? '',
								unit_plural: formData.reporting_unit?.unit_plural ?? '',
								conversion_rate: e,
							},
						});
					}}
				/>

				<Spacer className='!h-4' />
				<Button isLoading={isPending} disabled={isCtaDisabled} onClick={handleSave}>
					{t('catalog:features.drawer.saveFeature')}
				</Button>
			</div>
		</Sheet>
	);
};

export default FeatureDrawer;
