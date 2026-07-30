import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation('settings');
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
			{
				value: NEW_ENV_SENTINEL,
				label: t('environment.copy.createNewOption'),
				description: t('environment.copy.createNewOptionDescription'),
			},
			...others.map((env) => ({
				value: env.id,
				label: env.name,
				description: env.type === ENVIRONMENT_TYPE.PRODUCTION ? t('environment.types.production') : t('environment.types.sandbox'),
			})),
		];
	}, [NEW_ENV_SENTINEL, allEnvironments, sourceEnvironment?.id, t]);

	const environmentTypeOptions = useMemo(
		() => [
			{
				value: ENVIRONMENT_TYPE.DEVELOPMENT,
				label: t('environment.types.sandbox'),
				description: t('environment.types.sandboxDescription'),
			},
			{
				value: ENVIRONMENT_TYPE.PRODUCTION,
				label: t('environment.types.production'),
				description: t('environment.types.productionDescription'),
			},
		],
		[t],
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
		[NEW_ENV_SENTINEL, onOpenChange],
	);

	const { mutate: cloneEnvironment, isPending } = useMutation({
		mutationFn: async (payload: CloneEnvironmentPayload) => {
			if (!sourceEnvironment?.id) throw new Error(t('environment.copy.errorNoSource'));
			return await EnvironmentApi.cloneEnvironment(sourceEnvironment.id, payload);
		},
		onSuccess: async () => {
			toast.success(t('environment.copy.toastStarted'));
			handleOpenChange(false);
			queryClient.invalidateQueries({ queryKey: ['environments'] });
			await onEnvironmentCloned();
		},
		onError: (error: Error) => {
			toast.error(error.message || t('environment.copy.toastCloneFailed'));
		},
	});

	const handleClone = useCallback(() => {
		if (isNewEnvironment && !name.trim()) {
			toast.error(t('environment.copy.errorNameRequired'));
			return;
		}
		const payload: CloneEnvironmentPayload = isNewEnvironment
			? { name: name.trim(), type }
			: { target_environment_id: targetEnvironmentId };
		cloneEnvironment(payload);
	}, [cloneEnvironment, isNewEnvironment, name, t, targetEnvironmentId, type]);

	const handleCancel = useCallback(() => {
		handleOpenChange(false);
	}, [handleOpenChange]);

	const isSubmitDisabled = isPending || !sourceEnvironment?.id || (isNewEnvironment && !name.trim());

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title={t('environment.copy.title')}
			className='max-w-[520px]'
			description={
				sourceEnvironment ? (
					<span className='text-sm text-muted-foreground'>
						{t('environment.copy.introBeforeBadge')}{' '}
						<span className='inline-flex items-center font-semibold text-gray-900 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-[12px] leading-none'>
							{sourceEnvironment.name}
						</span>{' '}
						{isNewEnvironment ? t('environment.copy.intoNew') : t('environment.copy.intoSelected')}
					</span>
				) : (
					t('environment.copy.fallbackDescription')
				)
			}>
			<div className='space-y-5'>
				{/* Cleanup callout */}
				<div className='rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3.5'>
					<div className='flex items-start gap-2.5'>
						<AlertTriangle className='h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500' />
						<div>
							<p className='text-[13px] font-semibold text-amber-800 mb-0.5'>{t('environment.copy.cleanupTitle')}</p>
							<p className='text-[13px] text-amber-700 leading-relaxed'>
								{t('environment.copy.cleanupBodyLead')}
								<span className='font-medium'>{t('environment.copy.cleanupBefore')}</span>
								{t('environment.copy.cleanupBodyTrail')}
							</p>
						</div>
					</div>
				</div>

				{/* Target environment */}
				<Select
					label={t('environment.copy.copyIntoLabel')}
					placeholder={t('environment.copy.selectTargetPlaceholder')}
					options={targetEnvironmentOptions}
					value={targetEnvironmentId}
					onChange={(value) => setTargetEnvironmentId(value)}
					disabled={isPending}
				/>

				{/* New environment fields — only shown when no target is selected */}
				{isNewEnvironment && (
					<>
						<Input
							label={t('environment.copy.newEnvironmentName')}
							placeholder={t('environment.copy.namePlaceholder')}
							value={name}
							onChange={setName}
							disabled={isPending}
						/>
						<Select
							label={t('environment.copy.typeLabel')}
							placeholder={t('environment.copy.typePlaceholder')}
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
						<p className='text-[11px] font-semibold text-gray-400 uppercase tracking-widest'>{t('environment.copy.whatCopiedHeading')}</p>
					</div>
					<div className='px-4 py-3 flex items-start gap-3'>
						<CheckCircle2 className='h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500' />
						<div>
							<p className='text-sm font-medium text-gray-800'>{t('environment.copy.featuresTitle')}</p>
							<p className='text-xs text-gray-500 mt-0.5'>{t('environment.copy.featuresDescription')}</p>
						</div>
					</div>
					<div className='px-4 py-3 flex items-start gap-3'>
						<CheckCircle2 className='h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500' />
						<div>
							<p className='text-sm font-medium text-gray-800'>{t('environment.copy.plansTitle')}</p>
							<p className='text-xs text-gray-500 mt-0.5'>{t('environment.copy.plansDescription')}</p>
						</div>
					</div>
					<div className='px-4 py-2.5 bg-gray-50'>
						<p className='text-xs text-gray-400'>
							{t('environment.copy.excludedLead')}
							<span className='font-medium'>{t('environment.copy.excludedBold')}</span>
							{t('environment.copy.excludedTail')}
						</p>
					</div>
				</div>

				{/* Async note */}
				<div className='flex items-center gap-2.5 text-gray-500'>
					<Clock className='h-3.5 w-3.5 flex-shrink-0' />
					<p className='text-xs'>{isNewEnvironment ? t('environment.copy.noteAsyncNewEnv') : t('environment.copy.noteAsyncOnly')}</p>
				</div>

				{/* Actions */}
				<div className='flex justify-end gap-2 pt-1'>
					<Button variant='outline' onClick={handleCancel} disabled={isPending}>
						{t('connection.buttons.cancel')}
					</Button>
					<Button onClick={handleClone} disabled={isSubmitDisabled}>
						<Copy className='h-4 w-4 me-1.5' />
						{isPending ? t('environment.copy.copyingEllipsis') : t('environment.copy.buttonCopy')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default EnvironmentCopier;
