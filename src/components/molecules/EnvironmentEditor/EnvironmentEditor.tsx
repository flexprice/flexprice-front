import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Input, Button } from '@/components/atoms';
import EnvironmentApi from '@/api/EnvironmentApi';
import Environment from '@/models/Environment';
import toast from 'react-hot-toast';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	environment: Environment | null;
	onEnvironmentUpdated?: () => void | Promise<void>;
}

const EnvironmentEditor: React.FC<Props> = ({ isOpen, onOpenChange, environment, onEnvironmentUpdated }) => {
	const [name, setName] = useState(environment?.name ?? '');
	const queryClient = useQueryClient();

	useEffect(() => {
		if (isOpen) {
			setName(environment?.name ?? '');
		}
	}, [isOpen, environment]);

	const { mutate: updateEnvironment, isPending } = useMutation({
		mutationFn: async (newName: string) => {
			if (!environment) throw new Error('No environment selected');
			const result = await EnvironmentApi.updateEnvironment(environment.id, { name: newName });
			if (!result) {
				throw new Error('Failed to update environment');
			}
			return result;
		},
		onSuccess: async () => {
			toast.success('Environment updated successfully');
			onOpenChange(false);
			queryClient.invalidateQueries({ queryKey: ['environments'] });
			if (onEnvironmentUpdated) {
				await onEnvironmentUpdated();
			}
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to update environment');
		},
	});

	const handleSave = useCallback(() => {
		const trimmed = name.trim();
		if (!trimmed) {
			toast.error('Environment name is required');
			return;
		}
		if (trimmed === environment?.name) {
			onOpenChange(false);
			return;
		}
		updateEnvironment(trimmed);
	}, [name, environment, updateEnvironment, onOpenChange]);

	const handleCancel = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title='Rename Environment'
			className='max-w-[480px]'
			description='Update the name for this environment'>
			<div className='space-y-4'>
				<Input label='Name' placeholder='Enter environment name' value={name} onChange={setName} disabled={isPending} />
				<div className='flex justify-end space-x-2 pt-4'>
					<Button variant='outline' onClick={handleCancel} disabled={isPending}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isPending || !name.trim()}>
						{isPending ? 'Saving...' : 'Save'}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default EnvironmentEditor;
