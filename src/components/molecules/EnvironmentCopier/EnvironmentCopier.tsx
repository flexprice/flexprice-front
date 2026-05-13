import React, { useState, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, Input, Select, Button } from '@/components/atoms';
import { ENVIRONMENT_TYPE, Environment } from '@/models/Environment';
import { CloneEnvironmentPayload } from '@/types/dto/Environment';
import EnvironmentApi from '@/api/EnvironmentApi';
import toast from 'react-hot-toast';
import { Copy, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	sourceEnvironment: Environment | null;
	onEnvironmentCloned: (environmentId?: string) => void | Promise<void>;
}

const EnvironmentCopier: React.FC<Props> = ({ isOpen, onOpenChange, sourceEnvironment, onEnvironmentCloned }) => {
	const NEW_ENV_SENTINEL = '__new__';
	const [targetEnvironmentId, setTargetEnvironmentId] = useState<string>(NEW_ENV_SENTINEL);
	const [name, setName] = useState('');
	const [type, setType] = useState<ENVIRONMENT_TYPE.DEVELOPMENT | ENVIRONMENT_TYPE.PRODUCTION>(ENVIRONMENT_TYPE.DEVELOPMENT);
	const queryClient = useQueryClient();

	const isNewEnvironment = targetEnvironmentId === NEW_ENV_SENTINEL;

	const { data: allEnvironments = [] } = useQuery({
		queryKey: ['environments'],
		queryFn: async () => {
			const res = await EnvironmentApi.getAllEnvironments();
			return res.environments;
		},
	});

	const targetEnvironmentOptions = useMemo(() => {
		const others = allEnvironments.filter((env) => env.id !== sourceEnvironment?.id);
		return [
			{ value: NEW_ENV_SENTINEL, label: 'Create a new environment', description: 'A new environment will be created for the copy' },
			...others.map((env) => ({
				value: env.id,
				label: env.name,
				description: env.type === ENVIRONMENT_TYPE.PRODUCTION ? 'Production' : 'Sandbox',
			})),
		];
	}, [allEnvironments, sourceEnvironment?.id]);

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

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				setTargetEnvironmentId(NEW_ENV_SENTINEL);
				setName('');
				setType(ENVIRONMENT_TYPE.DEVELOPMENT);
			}
			onOpenChange(open);
		},
		[onOpenChange],
	);

	const { mutate: cloneEnvironment, isPending } = useMutation({
		mutationFn: async (payload: CloneEnvironmentPayload) => {
			if (!sourceEnvironment?.id) throw new Error('No source environment selected');
			return await EnvironmentApi.cloneEnvironment(sourceEnvironment.id, payload);
		},
		onSuccess: async () => {
			toast.success('Environment clone started — features and plans are being copied in the background.');
			handleOpenChange(false);
			queryClient.invalidateQueries({ queryKey: ['environments'] });
			await onEnvironmentCloned();
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to clone environment');
		},
	});

	const handleClone = useCallback(() => {
		if (isNewEnvironment && !name.trim()) {
			toast.error('Environment name is required');
			return;
		}
		const payload: CloneEnvironmentPayload = isNewEnvironment
			? { name: name.trim(), type }
			: { target_environment_id: targetEnvironmentId };
		cloneEnvironment(payload);
	}, [isNewEnvironment, name, type, targetEnvironmentId, cloneEnvironment]);

	const handleCancel = useCallback(() => {
		handleOpenChange(false);
	}, [handleOpenChange]);

	const isSubmitDisabled = isPending || !sourceEnvironment?.id || (isNewEnvironment && !name.trim());

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title='Copy Environment'
			className='max-w-[520px]'
			description={
				sourceEnvironment ? (
					<span className='text-sm text-muted-foreground'>
						Copying from{' '}
						<span className='inline-flex items-center font-semibold text-gray-900 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-[12px] leading-none'>
							{sourceEnvironment.name}
						</span>{' '}
						into {isNewEnvironment ? 'a new environment' : 'the selected environment'}.
					</span>
				) : (
					'Copy all published configuration into an environment.'
				)
			}>
			<div className='space-y-5'>
				{/* Cleanup callout */}
				<div className='rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3.5'>
					<div className='flex items-start gap-2.5'>
						<AlertTriangle className='h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500' />
						<div>
							<p className='text-[13px] font-semibold text-amber-800 mb-0.5'>Clean up before copying</p>
							<p className='text-[13px] text-amber-700 leading-relaxed'>
								All active features and plans will be copied as-is. Archive or remove anything you don't want carried over{' '}
								<span className='font-medium'>before</span> proceeding.
							</p>
						</div>
					</div>
				</div>

				{/* Target environment */}
				<Select
					label='Copy into'
					placeholder='Select target environment'
					options={targetEnvironmentOptions}
					value={targetEnvironmentId}
					onChange={(value) => setTargetEnvironmentId(value)}
					disabled={isPending}
				/>

				{/* New environment fields — only shown when no target is selected */}
				{isNewEnvironment && (
					<>
						<Input
							label='New Environment Name'
							placeholder='e.g. Staging, Production Clone'
							value={name}
							onChange={setName}
							disabled={isPending}
						/>
						<Select
							label='Type'
							placeholder='Select environment type'
							options={environmentTypeOptions}
							value={type}
							onChange={(value) => setType(value as ENVIRONMENT_TYPE.DEVELOPMENT | ENVIRONMENT_TYPE.PRODUCTION)}
							disabled={isPending}
						/>
					</>
				)}

				{/* What gets copied */}
				<div className='rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden'>
					<div className='px-4 py-2.5 bg-gray-50'>
						<p className='text-[11px] font-semibold text-gray-400 uppercase tracking-widest'>What will be copied</p>
					</div>
					<div className='px-4 py-3 flex items-start gap-3'>
						<CheckCircle2 className='h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500' />
						<div>
							<p className='text-sm font-medium text-gray-800'>All active features</p>
							<p className='text-xs text-gray-500 mt-0.5'>Static, Boolean & Metered features along with their associated meters</p>
						</div>
					</div>
					<div className='px-4 py-3 flex items-start gap-3'>
						<CheckCircle2 className='h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500' />
						<div>
							<p className='text-sm font-medium text-gray-800'>All active plans</p>
							<p className='text-xs text-gray-500 mt-0.5'>Including all prices, entitlements, and credit grants attached to each plan</p>
						</div>
					</div>
					<div className='px-4 py-2.5 bg-gray-50'>
						<p className='text-xs text-gray-400'>
							Draft entities, archived entities, customers, subscriptions, invoices, and wallet balances are{' '}
							<span className='font-medium'>not</span> copied.
						</p>
					</div>
				</div>

				{/* Async note */}
				<div className='flex items-center gap-2.5 text-gray-500'>
					<Clock className='h-3.5 w-3.5 flex-shrink-0' />
					<p className='text-xs'>
						{isNewEnvironment
							? 'The environment is created immediately. Features and plans are cloned in the background and may take a few seconds to appear.'
							: 'Features and plans are cloned in the background and may take a few seconds to appear.'}
					</p>
				</div>

				{/* Actions */}
				<div className='flex justify-end gap-2 pt-1'>
					<Button variant='outline' onClick={handleCancel} disabled={isPending}>
						Cancel
					</Button>
					<Button onClick={handleClone} disabled={isSubmitDisabled}>
						<Copy className='h-4 w-4 mr-1.5' />
						{isPending ? 'Copying...' : 'Copy Environment'}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default EnvironmentCopier;
