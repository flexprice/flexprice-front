import { Button, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import { Plan } from '@/models/Plan';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PlanApi } from '@/api/PlanApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import { CreatePlanRequest, UpdatePlanRequest, PlanResponse, CreatePlanResponse } from '@/types/dto';
interface Props {
	data?: Plan | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const PlanDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const isEdit = !!data;
	const navigate = useNavigate();

	const [formData, setFormData] = useState<CreatePlanRequest & { id?: string }>({
		name: data?.name || '',
		description: data?.description || '',
		lookup_key: data?.lookup_key || '',
		metadata: data?.metadata,
		id: data?.id,
	});
	const [metadataString, setMetadataString] = useState<string>(data?.metadata ? JSON.stringify(data.metadata, null, 2) : '');
	const [errors, setErrors] = useState<Partial<Record<keyof CreatePlanRequest, string>>>({});

	const { mutate: updatePlan, isPending } = useMutation<
		PlanResponse | CreatePlanResponse,
		ServerError,
		CreatePlanRequest | (UpdatePlanRequest & { id: string })
	>({
		mutationFn: (vars) => {
			if (isEdit) {
				const { id, ...rest } = vars as UpdatePlanRequest & { id: string };
				return PlanApi.updatePlan(id, rest);
			}
			return PlanApi.createPlan(vars as CreatePlanRequest);
		},
		onSuccess: (data) => {
			toast.success(isEdit ? 'Plan updated successfully' : 'Plan created successfully');
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
			navigate(`${RouteNames.plan}/${data.id}`);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || `Failed to ${isEdit ? 'update' : 'create'} plan. Please try again.`);
		},
	});

	useEffect(() => {
		if (data) {
			// Map Plan to CreatePlanRequest structure for form
			setFormData({
				id: data.id,
				name: data.name || '',
				description: data.description || '',
				lookup_key: data.lookup_key || '',
				metadata: data.metadata,
			});
			setMetadataString(data.metadata ? JSON.stringify(data.metadata, null, 2) : '');
		} else {
			setFormData({
				name: '',
				description: '',
				lookup_key: '',
			});
			setMetadataString('');
		}
		setErrors({});
	}, [data, open]);

	// Auto-generate lookup key from name when creating (not editing)
	useEffect(() => {
		if (!isEdit) {
			setFormData((prev) => ({ ...prev, lookup_key: `plan-${prev.name?.toLowerCase().replace(/\s/g, '-') || ''}` }));
		}
	}, [formData.name, isEdit]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof CreatePlanRequest, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = 'Name is required';
		}

		if (!formData.lookup_key?.trim()) {
			newErrors.lookup_key = 'Lookup key is required';
		}

		if (metadataString.trim()) {
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
			const updateDto: UpdatePlanRequest & { id: string } = {
				id: formData.id!,
				name: formData.name.trim(),
				lookup_key: formData.lookup_key, // Optional - matches backend structure
				description: formData.description,
				metadata,
			};
			updatePlan(updateDto);
		} else {
			// Build CreatePlanRequest DTO
			const createDto: CreatePlanRequest = {
				name: formData.name.trim(),
				lookup_key: formData.lookup_key,
				description: formData.description,
				metadata,
			};
			updatePlan(createDto);
		}
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
					setFormData({ ...formData, name: e });
				}}
			/>

			<Spacer height={'20px'} />
			<Input
				label='Lookup Key'
				error={errors.lookup_key}
				onChange={(e) => {
					setFormData({ ...formData, lookup_key: e });
				}}
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

			<Spacer height={'20px'} />
			<Button isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}>
				{isEdit ? 'Save' : 'Create'}
			</Button>
		</Sheet>
	);
};

export default PlanDrawer;
