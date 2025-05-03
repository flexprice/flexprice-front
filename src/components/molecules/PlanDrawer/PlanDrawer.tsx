import { Button, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import { Plan } from '@/models/Plan';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PlanApi } from '@/utils/api_requests/PlanApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/tanstack/ReactQueryProvider';

interface Props {
	data?: Plan | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const PlanDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const isEdit = !!data;

	const [formData, setFormData] = useState<Partial<Plan>>(
		data || {
			name: '',
			description: '',
			lookup_key: '',
			prices: [],
		},
	);
	const [errors, setErrors] = useState<Partial<Record<keyof Plan, string>>>({});

	const { mutate: updatePlan, isPending } = useMutation({
		mutationFn: (data: Partial<Plan>) => (isEdit ? PlanApi.updatePlan(data.id!, data) : PlanApi.createPlan(data)),
		onSuccess: () => {
			toast.success(isEdit ? 'Plan updated successfully' : 'Plan created successfully');
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || `Failed to ${isEdit ? 'update' : 'create'} plan. Please try again.`);
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
				prices: [],
			});
		}
	}, [data]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof Plan, string>> = {};

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
		updatePlan(formData);
	};

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? 'Edit Plan' : 'Create Plan'}
			description={isEdit ? 'Enter plan details to update the plan.' : 'Enter plan details to create a new plan.'}
			trigger={trigger}>
			<Spacer height={'20px'} />
			<Input
				placeholder='Enter a name for the plan'
				description={'A descriptive name for this pricing plan.'}
				label='Plan Name'
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
						lookup_key: isEdit ? formData.lookup_key : 'plan-' + e.replace(/\s/g, '-').toLowerCase(),
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
				placeholder='Enter a slug for the plan'
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
				description='Helps your team to understand the purpose of this plan.'
			/>
			<Spacer height={'20px'} />
			<Button isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}>
				{isEdit ? 'Save' : 'Create Plan'}
			</Button>
		</Sheet>
	);
};

export default PlanDrawer;
