import { Button, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import type { CostSheet } from '@/models/CostSheet';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import CostSheetApi from '@/api/CostSheetApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { CreateCostSheetRequest, UpdateCostSheetRequest } from '@/types/dto/CostSheet';

interface Props {
	data?: CostSheet | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const CostSheetDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const isEdit = !!data;

	const [formData, setFormData] = useState<Partial<CostSheet>>(
		data || {
			name: '',
			description: '',
			lookup_key: '',
		},
	);
	const [errors, setErrors] = useState<Partial<Record<keyof CostSheet, string>>>({});

	const { mutate: updateCostSheet, isPending } = useMutation({
		mutationFn: (formData: Partial<CostSheet>) => {
			if (isEdit && data?.id) {
				const updateRequest: UpdateCostSheetRequest = {
					name: formData.name,
					description: formData.description,
					metadata: formData.metadata,
				};
				return CostSheetApi.UpdateCostSheet(data.id, updateRequest);
			} else {
				const createRequest: CreateCostSheetRequest = {
					name: formData.name!,
					lookup_key: formData.lookup_key!,
					description: formData.description,
					metadata: formData.metadata,
				};
				return CostSheetApi.CreateCostSheet(createRequest);
			}
		},
		onSuccess: (_: CostSheet) => {
			toast.success(isEdit ? 'Cost Sheet updated successfully' : 'Cost Sheet created successfully');
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: ServerError) => {
			const errorMessage = error?.error?.message || `Failed to ${isEdit ? 'update' : 'create'} cost sheet. Please try again.`;
			toast.error(errorMessage);
		},
	});

	useEffect(() => {
		if (data) {
			setFormData(data);
		} else {
			setFormData({
				name: '',
				description: '',
				lookup_key: '',
			});
		}
	}, [data]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof CostSheet, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = 'Name is required';
		}

		if (!formData.lookup_key?.trim()) {
			newErrors.lookup_key = 'Lookup key is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}
		updateCostSheet(formData);
	};

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? 'Edit Cost Sheet' : 'Create Cost Sheet'}
			description={isEdit ? 'Enter cost sheet details to update the cost sheet.' : 'Enter cost sheet details to create a new cost sheet.'}
			trigger={trigger}>
			<Spacer height={'20px'} />
			<Input
				placeholder='Enter a name for the cost sheet'
				description={'A descriptive name for this cost sheet.'}
				label='Cost Sheet Name'
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
						lookup_key: isEdit ? formData.lookup_key : 'cost-sheet-' + (e || '').replace(/\s/g, '-').toLowerCase(),
					});
				}}
			/>

			<Spacer height={'20px'} />
			<Input
				label='Lookup Key'
				disabled={isEdit}
				error={errors.lookup_key}
				onChange={(e) => setFormData({ ...formData, lookup_key: e })}
				value={formData.lookup_key}
				placeholder='Enter a slug for the cost sheet'
				description={'A system identifier used for API calls and integrations.'}
			/>

			<Spacer height={'20px'} />
			<Textarea
				value={formData.description}
				onChange={(e) => {
					setFormData({ ...formData, description: e });
				}}
				className='min-h-[100px]'
				placeholder='Enter description'
				label='Description'
				description='Helps your team to understand the purpose of this cost sheet.'
			/>
			<Spacer height={'20px'} />
			<Button isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}>
				{isEdit ? 'Save' : 'Create'}
			</Button>
		</Sheet>
	);
};

export default CostSheetDrawer;
