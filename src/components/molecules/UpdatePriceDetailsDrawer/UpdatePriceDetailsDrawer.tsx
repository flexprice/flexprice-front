import { Button, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import SelectGroup from '@/components/organisms/PlanForm/SelectGroup';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PriceApi } from '@/api/PriceApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { UpdatePriceRequest } from '@/types/dto/Price';
import { Price } from '@/models/Price';
import { GROUP_ENTITY_TYPE } from '@/models/Group';

interface UpdatePriceDetailsDrawerProps {
	price: Price;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const UpdatePriceDetailsDrawer: FC<UpdatePriceDetailsDrawerProps> = ({ price, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const [formData, setFormData] = useState<{
		display_name: string;
		description: string;
		lookup_key: string;
		metadata: string;
		group_id: string;
	}>({
		display_name: price?.display_name || '',
		description: price?.description || '',
		lookup_key: price?.lookup_key || '',
		metadata: price?.metadata ? JSON.stringify(price.metadata, null, 2) : '',
		group_id: price?.group_id || '',
	});
	const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

	const { mutate: updatePrice, isPending } = useMutation({
		mutationFn: (updateData: UpdatePriceRequest) => {
			return PriceApi.UpdatePrice(price.id, updateData);
		},
		onSuccess: () => {
			toast.success('Price details updated successfully');
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update price details. Please try again.');
		},
	});

	useEffect(() => {
		if (price) {
			setFormData({
				display_name: price.display_name || '',
				description: price.description || '',
				lookup_key: price.lookup_key || '',
				metadata: price.metadata ? JSON.stringify(price.metadata, null, 2) : '',
				group_id: price.group_id || '',
			});
		}
		setErrors({});
	}, [price, open]);

	const validateForm = () => {
		const newErrors: Partial<Record<string, string>> = {};

		if (formData.metadata.trim()) {
			try {
				const parsed = JSON.parse(formData.metadata);
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
		if (formData.metadata.trim()) {
			try {
				metadata = JSON.parse(formData.metadata);
			} catch {
				return;
			}
		}

		const updateDto: UpdatePriceRequest = {
			display_name: formData.display_name?.trim() || undefined,
			description: formData.description?.trim() || undefined,
			lookup_key: formData.lookup_key?.trim() || undefined,
			metadata: metadata,
			// Send empty string when "None" is selected so the server can clear group_id; otherwise send the id or undefined
			group_id: formData.group_id?.trim() === '' ? '' : formData.group_id?.trim() || undefined,
		};

		updatePrice(updateDto);
	};

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title='Edit Price Details'
			description='Update non-critical price details such as display name, description, and metadata.'
			trigger={trigger}>
			<div className='space-y-8 mt-4'>
				<Input
					label='Display Name'
					placeholder='Enter display name'
					value={formData.display_name || ''}
					onChange={(e) => {
						setFormData({ ...formData, display_name: e });
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
					label='Lookup Key'
					placeholder='Enter lookup key'
					value={formData.lookup_key || ''}
					onChange={(e) => {
						setFormData({ ...formData, lookup_key: e });
					}}
				/>

				<Textarea
					value={formData.metadata}
					onChange={(e) => {
						setFormData({ ...formData, metadata: e });
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

				<SelectGroup
					label='Group'
					placeholder='Select a group (optional)'
					value={formData.group_id}
					onChange={(group) => setFormData({ ...formData, group_id: group?.id ?? '' })}
					entityType={GROUP_ENTITY_TYPE.PRICE}
					showLookupKey={false}
				/>

				<Spacer className='!h-4' />
				<Button isLoading={isPending} disabled={isPending} onClick={handleSave}>
					Save Details
				</Button>
			</div>
		</Sheet>
	);
};

export default UpdatePriceDetailsDrawer;
