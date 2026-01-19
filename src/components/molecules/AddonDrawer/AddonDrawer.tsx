import { Button, Input, Sheet, Spacer, Textarea, Select } from '@/components/atoms';
import Addon, { ADDON_TYPE } from '@/models/Addon';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import AddonApi from '@/api/AddonApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';

interface Props {
	data?: Addon | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const AddonDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const isEdit = !!data;
	const navigate = useNavigate();

	const [formData, setFormData] = useState<Partial<Addon>>(
		data || {
			name: '',
			description: '',
			lookup_key: '',
			type: ADDON_TYPE.ONETIME,
		},
	);
	const [errors, setErrors] = useState<Partial<Record<keyof Addon, string>>>({});

	const { mutate: updateAddon, isPending } = useMutation({
		mutationFn: (data: Partial<Addon>) => {
			if (isEdit) {
				return AddonApi.Update(data.id!, data as any);
			} else {
				return AddonApi.Create(data as any);
			}
		},
		onSuccess: (data: Addon) => {
			toast.success(isEdit ? 'Addon updated successfully' : 'Addon created successfully');
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
			navigate(`${RouteNames.addonDetails}/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.error?.message || `Failed to ${isEdit ? 'update' : 'create'} addon. Please try again.`);
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
				type: ADDON_TYPE.ONETIME,
			});
		}
	}, [data]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof Addon, string>> = {};

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
		updateAddon(formData);
	};

	const addonTypeOptions = [
		{ value: ADDON_TYPE.ONETIME, label: 'One Time' },
		{ value: ADDON_TYPE.MULTIPLE, label: 'Multiple' },
	];

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={isEdit ? 'Edit Addon' : 'Create Addon'}
			description={isEdit ? 'Enter addon details to update the addon.' : 'Enter addon details to create a new addon.'}
			trigger={trigger}>
			<Spacer height={'20px'} />
			<Input
				placeholder='Enter a name for the addon'
				description={'A descriptive name for this addon.'}
				label='Addon Name'
				value={formData.name}
				error={errors.name}
				onChange={(e) => {
					setFormData({
						...formData,
						name: e,
						lookup_key: isEdit ? formData.lookup_key : 'addon-' + e.replace(/\s/g, '-').toLowerCase(),
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
				placeholder='Enter a slug for the addon'
				description={'A system identifier used for API calls and integrations.'}
			/>

			<Spacer className='hidden' height={'20px'} />
			<Select
				label='Addon Type'
				value={formData.type}
				onChange={(value) => setFormData({ ...formData, type: value as ADDON_TYPE })}
				options={addonTypeOptions}
				className='hidden'
				placeholder='Select addon type'
				description='Choose whether this addon can be used once or multiple times.'
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
				description='Helps your team to understand the purpose of this addon.'
			/>
			<Spacer height={'20px'} />
			<Button isLoading={isPending} disabled={isPending || !formData.name?.trim() || !formData.lookup_key?.trim()} onClick={handleSave}>
				{isEdit ? 'Save' : 'Create'}
			</Button>
		</Sheet>
	);
};

export default AddonDrawer;
