import { Button, Input, Sheet, Spacer, Select } from '@/components/atoms';
import { Group } from '@/models/Group';
import { GROUP_ENTITY_TYPE } from '@/models/Group';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { GroupApi } from '@/api/GroupApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { CreateGroupRequest, UpdateGroupRequest, GroupResponse } from '@/types/dto';

interface Props {
	data?: Group | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const GroupDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const isEdit = !!data;

	const [formData, setFormData] = useState<CreateGroupRequest & { id?: string }>({
		name: data?.name || '',
		lookup_key: data?.lookup_key || '',
		entity_type: data?.entity_type || GROUP_ENTITY_TYPE.PRICE,
		id: data?.id,
	});

	const [errors, setErrors] = useState<Partial<Record<keyof CreateGroupRequest, string>>>({});

	const { mutate: updateGroup, isPending } = useMutation<GroupResponse, Error, (CreateGroupRequest | UpdateGroupRequest) & { id?: string }>(
		{
			mutationFn: (vars) => {
				const { id, ...rest } = vars;
				if (isEdit && id) {
					return GroupApi.updateGroup(id, rest as UpdateGroupRequest);
				}
				return GroupApi.createGroup(rest as CreateGroupRequest);
			},
			onSuccess: () => {
				toast.success(isEdit ? 'Group updated successfully' : 'Group created successfully');
				onOpenChange?.(false);
				refetchQueries(refetchQueryKeys);
			},
			onError: (error: Error) => {
				toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} group. Please try again.`);
			},
		},
	);

	useEffect(() => {
		if (data) {
			setFormData({
				id: data.id,
				name: data.name || '',
				lookup_key: data.lookup_key || '',
				entity_type: data.entity_type,
			});
		} else {
			setFormData({
				name: '',
				lookup_key: '',
				entity_type: GROUP_ENTITY_TYPE.PRICE,
			});
		}
		setErrors({});
	}, [data]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof CreateGroupRequest, string>> = {};

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

		const payload = {
			id: isEdit ? formData.id : undefined,
			name: formData.name.trim(),
			lookup_key: formData.lookup_key,
			entity_type: formData.entity_type,
		};
		updateGroup(payload);
	};

	const entityTypeOptions = [
		{ value: GROUP_ENTITY_TYPE.PRICE, label: 'Price' },
		{ value: GROUP_ENTITY_TYPE.FEATURE, label: 'Feature' },
	];

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? 'Edit Group' : 'Create Group'}
			description={isEdit ? 'Enter group details to update the group.' : 'Enter group details to create a new group.'}
			trigger={trigger}>
			<Spacer height={'20px'} />
			<Input
				placeholder='Enter a name for the group'
				description={'A descriptive name for this group.'}
				label='Group Name'
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
						lookup_key: isEdit ? formData.lookup_key : 'group-' + e.replace(/\s/g, '-').toLowerCase(),
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
				placeholder='Enter a slug for the group'
				description={'A system identifier used for API calls and integrations.'}
			/>

			<Spacer height={'20px'} />
			<Select
				label='Entity Type'
				value={formData.entity_type}
				onChange={(value) => setFormData({ ...formData, entity_type: value as GROUP_ENTITY_TYPE })}
				options={entityTypeOptions}
				placeholder='Select entity type'
				description='Choose the type of entity this group will contain.'
			/>

			<Spacer height={'20px'} />
			<Button isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}>
				{isEdit ? 'Save' : 'Create Group'}
			</Button>
		</Sheet>
	);
};

export default GroupDrawer;
