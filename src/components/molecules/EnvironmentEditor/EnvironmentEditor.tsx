import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation('settings');
	const [name, setName] = useState(environment?.name ?? '');
	const queryClient = useQueryClient();

	useEffect(() => {
		if (isOpen) {
			setName(environment?.name ?? '');
		}
	}, [isOpen, environment]);

	const { mutate: updateEnvironment, isPending } = useMutation({
		mutationFn: async (newName: string) => {
			if (!environment) throw new Error(t('environment.editor.errorNoEnvironment'));
			const result = await EnvironmentApi.updateEnvironment(environment.id, { name: newName });
			if (!result) {
				throw new Error(t('environment.editor.errorUpdateUnknown'));
			}
			return result;
		},
		onSuccess: async () => {
			toast.success(t('environment.editor.toastUpdated'));
			onOpenChange(false);
			queryClient.invalidateQueries({ queryKey: ['environments'] });
			if (onEnvironmentUpdated) {
				await onEnvironmentUpdated();
			}
		},
		onError: (error: Error) => {
			toast.error(error.message || t('environment.editor.toastUpdateFailed'));
		},
	});

	const handleSave = useCallback(() => {
		const trimmed = name.trim();
		if (!trimmed) {
			toast.error(t('environment.editor.errorNameRequired'));
			return;
		}
		if (trimmed === environment?.name) {
			onOpenChange(false);
			return;
		}
		updateEnvironment(trimmed);
	}, [name, environment, onOpenChange, t, updateEnvironment]);

	const handleCancel = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('environment.editor.title')}
			className='max-w-[30rem]'
			description={t('environment.editor.description')}>
			<div className='space-y-4'>
				<Input
					label={t('environment.editor.nameLabel')}
					placeholder={t('environment.editor.namePlaceholder')}
					value={name}
					onChange={setName}
					disabled={isPending}
				/>
				<div className='flex justify-end space-x-2 pt-4'>
					<Button variant='outline' onClick={handleCancel} disabled={isPending}>
						{t('connection.buttons.cancel')}
					</Button>
					<Button onClick={handleSave} disabled={isPending || !name.trim()}>
						{isPending ? t('environment.editor.savingEllipsis') : t('environment.editor.submitSave')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default EnvironmentEditor;
