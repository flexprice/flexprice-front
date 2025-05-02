import { Button, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import { Plan } from '@/models/Plan';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PlanApi } from '@/api/PlanApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';

interface Props {
	data: Plan;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const EditPlanDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const [formData, setFormData] = useState<Plan>(data || {});
	const [errors, seterrors] = useState<Partial<Record<keyof Plan, string>>>({});

	const { mutate: updatePlan, isPending } = useMutation({
		mutationFn: (data: Plan) => PlanApi.updatePlan(data.id, data),
		onSuccess: () => {
			toast.success('Plan updated successfully');
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to update plan. Please try again.');
		},
	});

	useEffect(() => {
		if (data) {
			setFormData(data);
		}
	}, [data]);

	const handleSave = () => {
		if (!formData.name) {
			seterrors({ ...errors, name: 'Name is required' });
			return;
		}
		updatePlan(formData);
	};

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={'Edit Plan'}
			description={'Enter plan details to update the plan.'}
			trigger={trigger}>
			<Spacer height={'20px'} />
			<Input
				placeholder='Enter a name for the plan'
				description={'A descriptive name for this pricing plan.'}
				label='Plan Name'
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({ ...formData, name: e });
				}}
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
			<Button isLoading={isPending} disabled={isPending || !formData.name} onClick={handleSave}>
				Save
			</Button>
		</Sheet>
	);
};

export default EditPlanDrawer;
