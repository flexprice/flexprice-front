import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Input, Select, Button } from '@/components/atoms';
import { ENVIRONMENT_TYPE } from '@/models/Environment';
import { CreateEnvironmentPayload } from '@/types/dto/Environment';
import EnvironmentApi from '@/api/EnvironmentApi';
import toast from 'react-hot-toast';
import { Mail, CalendarDays, AlertTriangle } from 'lucide-react';
import { SANDBOX_AUTO_CANCELLATION_DAYS } from '@/constants/constants';
import { getContactDetails } from '@/config/contact';
import { config } from '@/config/config';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onEnvironmentCreated: (environmentId?: string) => void | Promise<void>;
}

const EnvironmentCreator: React.FC<Props> = ({ isOpen, onOpenChange, onEnvironmentCreated }) => {
	const { t } = useTranslation('settings');
	const [name, setName] = useState('');
	const [type, setType] = useState<ENVIRONMENT_TYPE>(ENVIRONMENT_TYPE.DEVELOPMENT);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (isOpen) {
			setName(t('environment.types.sandbox'));
			setType(ENVIRONMENT_TYPE.DEVELOPMENT);
		}
	}, [isOpen, t]);

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

	const { mutate: createEnvironment, isPending } = useMutation({
		mutationFn: async (payload: CreateEnvironmentPayload) => {
			const result = await EnvironmentApi.createEnvironment(payload);
			if (!result) {
				throw new Error(t('environment.creator.errorCreateUnknown'));
			}
			return result;
		},
		onSuccess: async (result) => {
			toast.success(t('environment.creator.toastCreated'));
			setName('');
			setType(ENVIRONMENT_TYPE.DEVELOPMENT);
			onOpenChange(false);
			queryClient.invalidateQueries({ queryKey: ['environments'] });
			await onEnvironmentCreated(result?.id);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('environment.creator.toastCreateFailed'));
		},
	});

	const handleCreate = useCallback(() => {
		if (!name.trim()) {
			toast.error(t('environment.creator.errorNameRequired'));
			return;
		}

		createEnvironment({
			name: name.trim(),
			type,
		});
	}, [createEnvironment, name, t, type]);

	const handleCancel = useCallback(() => {
		setName('');
		setType(ENVIRONMENT_TYPE.DEVELOPMENT);
		onOpenChange(false);
	}, [onOpenChange]);

	const isProduction = type === ENVIRONMENT_TYPE.PRODUCTION;
	const isSandbox = type === ENVIRONMENT_TYPE.DEVELOPMENT;
	// When enabled via VITE_PLATFORM_CONFIG, this platform can self-create production
	// environments (shows the create form) instead of the "contact us" options.
	const productionEnabled = config.platform.production.enabled;

	const { slackUrl, email, bookCallUrl } = getContactDetails();
	const emailLink = `mailto:${email}`;

	const handleContactClick = (url: string) => {
		window.open(url, '_blank', 'noopener noreferrer');
	};

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('environment.creator.title')}
			className='max-w-[550px]'
			description={t('environment.creator.description')}>
			<div className='space-y-4'>
				<Input
					label={t('environment.creator.nameLabel')}
					placeholder={t('environment.creator.namePlaceholder')}
					value={name}
					onChange={setName}
					disabled={isPending || (isProduction && !productionEnabled)}
				/>

				<Select
					label={t('environment.creator.typeLabel')}
					placeholder={t('environment.creator.typePlaceholder')}
					options={environmentTypeOptions}
					value={type}
					onChange={(value) => setType(value as ENVIRONMENT_TYPE)}
					disabled={isPending}
				/>

				{/* Sandbox Note */}
				{isSandbox && (
					<div className='w-full flex items-center gap-2.5 rounded-md border border-warning-line-strong bg-warning-muted/80 px-3 py-2.5'>
						<AlertTriangle className='h-4 w-4 flex-shrink-0 text-warning' />
						<span className='text-sm font-medium text-warning-deep leading-relaxed'>
							{t('environment.creator.sandboxCancellationNote', { days: SANDBOX_AUTO_CANCELLATION_DAYS })}
						</span>
					</div>
				)}

				{/* Production Contact Options — shown when this platform cannot self-create production envs */}
				{isProduction && !productionEnabled && (
					<div className='space-y-6 pt-2'>
						<div className='text-center'>
							<p className='text-sm text-content-tertiary mb-6'>
								{t('environment.creator.productionBodyLine1')}
								<br />
								{t('environment.creator.productionContactPrompt')}
							</p>
						</div>
						<div className='flex gap-8 justify-center items-center px-4'>
							<button
								type='button'
								onClick={() => handleContactClick(slackUrl)}
								className='flex flex-col items-center gap-2 group transition-transform duration-300 ease-in-out hover:scale-[1.03]'
								aria-label={t('environment.creator.ariaSlackContact')}>
								<div
									className='h-14 w-14 rounded-xl flex items-center justify-center shadow-sm transition-shadow duration-300 ease-in-out group-hover:shadow-md'
									style={{ backgroundColor: '#4A154B' }}>
									<img src='/assets/logo/slack-logo.png' alt={t('environment.creator.slackAlt')} className='h-7 w-7 object-contain' />
								</div>
								<span className='text-xs font-medium text-content-secondary group-hover:text-[#4A154B] transition-colors duration-300 ease-in-out'>
									{t('environment.creator.brandSlack')}
								</span>
							</button>
							<button
								type='button'
								onClick={() => handleContactClick(emailLink)}
								className='flex flex-col items-center gap-2 group transition-transform duration-300 ease-in-out hover:scale-[1.03]'
								aria-label={t('environment.creator.ariaEmailContact')}>
								<div
									className='h-14 w-14 rounded-xl flex items-center justify-center shadow-sm transition-shadow duration-300 ease-in-out group-hover:shadow-md'
									style={{ backgroundColor: 'rgb(var(--fp-surface-strong))' }}>
									<Mail className='h-7 w-7 text-content-secondary' strokeWidth={1.5} />
								</div>
								<span className='text-xs font-medium text-content-secondary group-hover:text-content transition-colors duration-300 ease-in-out'>
									{t('environment.creator.brandEmail')}
								</span>
							</button>
							<button
								type='button'
								onClick={() => handleContactClick(bookCallUrl)}
								className='flex flex-col items-center gap-2 group transition-transform duration-300 ease-in-out hover:scale-[1.03]'
								aria-label={t('environment.creator.ariaBookCall')}>
								<div
									className='h-14 w-14 rounded-xl flex items-center justify-center shadow-sm transition-shadow duration-300 ease-in-out group-hover:shadow-md'
									style={{ backgroundColor: '#0069FF' }}>
									<CalendarDays className='h-7 w-7 text-white' strokeWidth={1.5} />
								</div>
								<span className='text-xs font-medium text-content-secondary group-hover:text-[#0069FF] transition-colors duration-300 ease-in-out'>
									{t('environment.creator.bookACall')}
								</span>
							</button>
						</div>
					</div>
				)}

				{/* Action Buttons - shown for non-production, or for production when platform config enables it */}
				{(!isProduction || productionEnabled) && (
					<div className='flex justify-end space-x-2 pt-4'>
						<Button variant='outline' onClick={handleCancel} disabled={isPending}>
							{t('connection.buttons.cancel')}
						</Button>
						<Button onClick={handleCreate} disabled={isPending || !name.trim()}>
							{isPending ? t('environment.creator.savingEllipsis') : t('environment.creator.submitCreate')}
						</Button>
					</div>
				)}
			</div>
		</Dialog>
	);
};

export default EnvironmentCreator;
