import { Button, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import FeatureApi from '@/api/FeatureApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { UpdateFeatureRequest } from '@/types/dto/Feature';
import Feature from '@/models/Feature';

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
	const [formData, setFormData] = useState<UpdateFeatureRequest>({
		name: data?.name || '',
		description: data?.description || '',
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
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to update feature. Please try again.');
		},
	});

	useEffect(() => {
		if (data) {
			setFormData({
				name: data.name || '',
				description: data.description || '',
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
		<Sheet isOpen={open} onOpenChange={onOpenChange} title='Edit Feature' description='Update feature details.' trigger={trigger}>
			<div className='space-y-8 mt-4'>
				<Input
					label='Name'
					placeholder='Enter feature name'
					value={formData.name || ''}
					error={errors.name}
					onChange={(e) => {
						setFormData({ ...formData, name: e });
					}}
				/>

				<Textarea
					label='Description'
					placeholder='Enter description'
					value={formData.description || ''}
					onChange={(e) => {
						setFormData({ ...formData, description: e });
					}}
					className='min-h-[100px]'
				/>

				<Input
					label='Unit Singular'
					placeholder='e.g., unit'
					value={formData.unit_singular || ''}
					onChange={(e) => {
						setFormData({ ...formData, unit_singular: e });
					}}
				/>

				<Input
					label='Unit Plural'
					placeholder='e.g., units'
					value={formData.unit_plural || ''}
					onChange={(e) => {
						setFormData({ ...formData, unit_plural: e });
					}}
				/>

				<Input
					label='Display Unit Singular'
					placeholder='e.g., unit'
					value={formData.reporting_unit?.unit_singular ?? ''}
					onChange={(e) => {
						setFormData({
							...formData,
							reporting_unit: {
								unit_singular: e,
								unit_plural: e ? e + 's' : '',
								conversion_rate: formData.reporting_unit?.conversion_rate ?? '0.01',
							},
						});
					}}
				/>

				<Input
					label='Display Unit Plural'
					placeholder='e.g., units'
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
					label='Display Unit Conversion Factor'
					placeholder='e.g., 0.0000167'
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
					Save Feature
				</Button>
			</div>
		</Sheet>
	);
};

export default FeatureDrawer;
