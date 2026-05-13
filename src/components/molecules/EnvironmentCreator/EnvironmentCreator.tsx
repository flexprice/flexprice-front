import React, { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Input, Select, Button } from '@/components/atoms';
import { ENVIRONMENT_TYPE } from '@/models/Environment';
import { CreateEnvironmentPayload } from '@/types/dto/Environment';
import EnvironmentApi from '@/api/EnvironmentApi';
import toast from 'react-hot-toast';
import { Mail, CalendarDays, AlertTriangle } from 'lucide-react';
import { SANDBOX_AUTO_CANCELLATION_DAYS } from '@/constants/constants';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onEnvironmentCreated: (environmentId?: string) => void | Promise<void>;
}

const EnvironmentCreator: React.FC<Props> = ({ isOpen, onOpenChange, onEnvironmentCreated }) => {
	const [name, setName] = useState('Sandbox');
	const [type, setType] = useState<ENVIRONMENT_TYPE>(ENVIRONMENT_TYPE.DEVELOPMENT);
	const queryClient = useQueryClient();

	const environmentTypeOptions = useMemo(
		() => [
			{
				value: ENVIRONMENT_TYPE.DEVELOPMENT,
				label: 'Sandbox',
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

	const isProduction = type === ENVIRONMENT_TYPE.PRODUCTION;
	const isSandbox = type === ENVIRONMENT_TYPE.DEVELOPMENT;

	const calendlyLink = 'https://calendly.com/nikhil-flexprice/30min';
	const slackLink = 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ';
	const emailLink = 'mailto:support@flexprice.io';

	const handleContactClick = (url: string) => {
		window.open(url, '_blank', 'noopener noreferrer');
	};

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title='Create Environment'
			className='max-w-[550px]'
			description='Create a new environment for your application'>
			<div className='space-y-4'>
				<Input label='Name' placeholder='Enter environment name' value={name} onChange={setName} disabled={isPending || isProduction} />

				<Select
					label='Type'
					placeholder='Select environment type'
					options={environmentTypeOptions}
					value={type}
					onChange={(value) => setType(value as ENVIRONMENT_TYPE)}
					disabled={isPending}
				/>

				{/* Sandbox Note */}
				{isSandbox && (
					<div className='w-full flex items-center gap-2.5 rounded-md border border-amber-300 bg-amber-50/80 px-3 py-2.5'>
						<AlertTriangle className='h-4 w-4 flex-shrink-0 text-amber-600' />
						<span className='text-sm font-medium text-amber-800 leading-relaxed'>
							Sandbox subscriptions are automatically cancelled after {SANDBOX_AUTO_CANCELLATION_DAYS} days
						</span>
					</div>
				)}

				{/* Production Contact Options */}
				{isProduction && (
					<div className='space-y-6 pt-2'>
						<div className='text-center'>
							<p className='text-sm text-gray-600 mb-6'>
								Production environments require an approval.
								<br />
								Contact us to get started:
							</p>
						</div>
						<div className='flex gap-8 justify-center items-center px-4'>
							<button
								type='button'
								onClick={() => handleContactClick(slackLink)}
								className='flex flex-col items-center gap-2 group transition-transform duration-300 ease-in-out hover:scale-[1.03]'
								aria-label='Contact Slack'>
								<div
									className='h-14 w-14 rounded-xl flex items-center justify-center shadow-sm transition-shadow duration-300 ease-in-out group-hover:shadow-md'
									style={{ backgroundColor: '#4A154B' }}>
									<img src='/assets/logo/slack-logo.png' alt='Slack' className='h-7 w-7 object-contain' />
								</div>
								<span className='text-xs font-medium text-gray-700 group-hover:text-[#4A154B] transition-colors duration-300 ease-in-out'>
									Slack
								</span>
							</button>
							<button
								type='button'
								onClick={() => handleContactClick(emailLink)}
								className='flex flex-col items-center gap-2 group transition-transform duration-300 ease-in-out hover:scale-[1.03]'
								aria-label='Contact Email'>
								<div
									className='h-14 w-14 rounded-xl flex items-center justify-center shadow-sm transition-shadow duration-300 ease-in-out group-hover:shadow-md'
									style={{ backgroundColor: '#E5E7EB' }}>
									<Mail className='h-7 w-7 text-gray-700' strokeWidth={1.5} />
								</div>
								<span className='text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-300 ease-in-out'>
									Email
								</span>
							</button>
							<button
								type='button'
								onClick={() => handleContactClick(calendlyLink)}
								className='flex flex-col items-center gap-2 group transition-transform duration-300 ease-in-out hover:scale-[1.03]'
								aria-label='Book a call'>
								<div
									className='h-14 w-14 rounded-xl flex items-center justify-center shadow-sm transition-shadow duration-300 ease-in-out group-hover:shadow-md'
									style={{ backgroundColor: '#0069FF' }}>
									<CalendarDays className='h-7 w-7 text-white' strokeWidth={1.5} />
								</div>
								<span className='text-xs font-medium text-gray-700 group-hover:text-[#0069FF] transition-colors duration-300 ease-in-out'>
									Book a call
								</span>
							</button>
						</div>
					</div>
				)}

				{/* Action Buttons - Only show for non-production */}
				{!isProduction && (
					<div className='flex justify-end space-x-2 pt-4'>
						<Button variant='outline' onClick={handleCancel} disabled={isPending}>
							Cancel
						</Button>
						<Button onClick={handleCreate} disabled={isPending || !name.trim()}>
							{isPending ? 'Creating...' : 'Create Environment'}
						</Button>
					</div>
				)}
			</div>
		</Dialog>
	);
};

export default EnvironmentCreator;
