import React, { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Input, Select, Button } from '@/components/atoms';
import { ENVIRONMENT_TYPE } from '@/models/Environment';
import { CreateEnvironmentPayload } from '@/types/dto/Environment';
import EnvironmentApi from '@/api/EnvironmentApi';
import toast from 'react-hot-toast';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onEnvironmentCreated: (environmentId?: string) => void | Promise<void>;
}

const EnvironmentCreator: React.FC<Props> = ({ isOpen, onOpenChange, onEnvironmentCreated }) => {
	const [name, setName] = useState('');
	const [type, setType] = useState<ENVIRONMENT_TYPE>(ENVIRONMENT_TYPE.DEVELOPMENT);
	const queryClient = useQueryClient();

	const environmentTypeOptions = useMemo(
		() => [
			{
				value: ENVIRONMENT_TYPE.DEVELOPMENT,
				label: 'Development',
				description: 'For development and testing purposes',
			},
			{
				value: ENVIRONMENT_TYPE.PRODUCTION,
				label: 'Production',
				description: 'For live production environment',
			},
		],
		[],
	);

	const { mutate: createEnvironment, isPending } = useMutation({
		mutationFn: async (payload: CreateEnvironmentPayload) => {
			const result = await EnvironmentApi.createEnvironment(payload);
			if (!result) {
				throw new Error('Failed to create environment');
			}
			return result;
		},
		onSuccess: async (result) => {
			toast.success('Environment created successfully');
			// Reset form
			setName('');
			setType(ENVIRONMENT_TYPE.DEVELOPMENT);
			// Close dialog
			onOpenChange(false);
			// Invalidate environments query to refetch the list
			queryClient.invalidateQueries({ queryKey: ['environments'] });
			// Call callback with the created environment ID (await if it's async)
			await onEnvironmentCreated(result?.id);
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to create environment');
		},
	});

	const handleCreate = useCallback(() => {
		if (!name.trim()) {
			toast.error('Environment name is required');
			return;
		}

		createEnvironment({
			name: name.trim(),
			type,
		});
	}, [name, type, createEnvironment]);

	const handleCancel = useCallback(() => {
		setName('');
		setType(ENVIRONMENT_TYPE.DEVELOPMENT);
		onOpenChange(false);
	}, [onOpenChange]);

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title='Create New Environment'
			description='Create a new environment for your application'>
			<div className='space-y-4'>
				<Input label='Environment Name' placeholder='Enter environment name' value={name} onChange={setName} disabled={isPending} />

				<Select
					label='Environment Type'
					placeholder='Select environment type'
					options={environmentTypeOptions}
					value={type}
					onChange={(value) => setType(value as ENVIRONMENT_TYPE)}
					disabled={isPending}
				/>

				<div className='flex justify-end space-x-2 pt-4'>
					<Button variant='outline' onClick={handleCancel} disabled={isPending}>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={isPending || !name.trim()}>
						{isPending ? 'Creating...' : 'Create Environment'}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default EnvironmentCreator;
