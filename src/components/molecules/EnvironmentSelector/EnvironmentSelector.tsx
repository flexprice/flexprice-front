import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui';
import {
	BlocksIcon,
	RocketIcon,
	ServerStack01Icon,
	UnfoldMoreIcon,
	PlusSignIcon,
	Copy01Icon,
	PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '@/components/atoms';
import { useGlobalLoading } from '@/core/services/tanstack/ReactQueryProvider';
import useUser from '@/hooks/useUser';
import { Select, SelectContent, useSidebar } from '@/components/ui';
import * as SelectPrimitive from '@radix-ui/react-select';
import { SelectOption } from '@/components/atoms/Select/Select';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import { useEnvironment } from '@/hooks/useEnvironment';
import { useRestrictedEnvs, EnvRestrictionState } from '@/hooks/useRestrictedEnvs';
import { Button } from '@/components/atoms';
import EnvironmentCreator from '../EnvironmentCreator/EnvironmentCreator';
import EnvironmentCopier from '../EnvironmentCopier/EnvironmentCopier';
import EnvironmentEditor from '../EnvironmentEditor/EnvironmentEditor';
import ContactUsDialog from '../ContactUsDialog/ContactUsDialog';
import Environment, { ENVIRONMENT_TYPE } from '@/models/Environment';

interface Props {
	disabled?: boolean;
	className?: string;
}
const SelectTrigger = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Trigger
		ref={ref}
		className={cn(
			'w-full outline-none ring-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
			className,
		)}
		{...props}>
		{children}
	</SelectPrimitive.Trigger>
));

const SelectItem = React.forwardRef<
	React.ElementRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Item
		ref={ref}
		className={cn(
			'relative flex w-full cursor-default select-none items-center rounded-[var(--fp-radius-md)] py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			className,
		)}
		{...props}>
		<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
	</SelectPrimitive.Item>
));

const getEnvironmentIcon = (type: ENVIRONMENT_TYPE) => {
	switch (type) {
		case ENVIRONMENT_TYPE.PRODUCTION:
			return <HugeIcon icon={RocketIcon} size={16} />;
		case ENVIRONMENT_TYPE.DEVELOPMENT:
			return <HugeIcon icon={BlocksIcon} size={16} />;
		default:
			return <HugeIcon icon={ServerStack01Icon} size={16} />;
	}
};

const EnvironmentSelector: React.FC<Props> = ({ disabled = false, className }) => {
	const { t } = useTranslation('settings');
	const { loading, user } = useUser();
	const { open } = useSidebar();
	const navigate = useNavigate();
	const { setLoading } = useGlobalLoading();

	const { environments, activeEnvironment, changeActiveEnvironment, refetchEnvironments, isDevelopment, isProduction } = useEnvironment();
	const { getRestriction } = useRestrictedEnvs();

	const [isOpen, setIsOpen] = useState(false);
	const [isCreatorOpen, setIsCreatorOpen] = useState(false);
	const [isCopierOpen, setIsCopierOpen] = useState(false);
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
	const [isSuspendedDialogOpen, setIsSuspendedDialogOpen] = useState(false);

	useEffect(() => {
		if (!open) setIsOpen(false);
	}, [open]);

	if (loading)
		return (
			<div>
				<Skeleton className='h-10 w-full' />
			</div>
		);

	if (!environments || environments.length === 0) {
		return (
			<div className={cn('mt-1 w-full', className)}>
				<p className='p-2 text-sm text-muted-foreground'>{t('environment.selector.noneAvailable')}</p>
				<Button
					onClick={() => setIsCreatorOpen(true)}
					size='sm'
					className='w-full text-center rounded-[var(--fp-radius-md)] justify-center items-center'>
					<HugeIcon icon={PlusSignIcon} size={16} />
					{t('environment.selector.addEnvironment')}
				</Button>

				<EnvironmentCreator
					isOpen={isCreatorOpen}
					onOpenChange={setIsCreatorOpen}
					onEnvironmentCreated={async (environmentId) => {
						await refetchEnvironments();
						if (environmentId) {
							changeActiveEnvironment(environmentId);
							navigate(RouteNames.home);
						}
					}}
				/>
			</div>
		);
	}

	const options: SelectOption[] = environments.map((env) => ({
		value: env.id,
		label: env.name,
		prefixIcon: getEnvironmentIcon(env.type),
	}));

	const handleEditClick = (env: Environment, e: React.MouseEvent | React.PointerEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOpen(false);
		setEditingEnvironment(env);
		setIsEditorOpen(true);
	};

	const handleChange = async (environmentId: string) => {
		const restriction = getRestriction(environmentId, user?.tenant?.id);
		if (restriction.state === EnvRestrictionState.Suspended) {
			setIsOpen(false);
			setIsSuspendedDialogOpen(true);
			return;
		}
		setLoading(true);
		try {
			changeActiveEnvironment(environmentId);
			navigate(RouteNames.home);
		} catch (error) {
			console.error('Failed to change environment:', error);
		} finally {
			setLoading(false);
		}
	};

	// If activeEnvironment is null, use the first environment as a fallback
	const currentEnvironment = activeEnvironment || environments[0];
	const environmentName = currentEnvironment?.name || t('environment.selector.noEnvironment');

	return (
		<div className={cn('mt-1 w-full', className)}>
			{/* Tenant */}
			<div className={cn('w-full mt-2 flex items-center gap-2', open ? 'justify-between' : 'justify-center')}>
				<div className={cn('flex items-center min-w-0', open ? 'gap-2 text-start' : 'justify-center')}>
					<span
						className={cn(
							'bg-surface-avatar text-content-inverse flex justify-center items-center bg-contain font-semibold',
							open ? 'size-7 rounded-[6px] text-xs' : 'size-8 rounded-[var(--fp-radius-md)] text-xs',
						)}>
						{user?.tenant?.name
							?.split(' ')
							.map((n) => n[0])
							.join('')
							.slice(0, 2) || t('environment.selector.fallbackTenantLetters')}
					</span>
					<div className={cn('text-start min-w-0', open ? '' : 'hidden')}>
						<p className='font-medium text-[16px] leading-snug truncate'>{user?.tenant?.name || t('environment.selector.unknownTenant')}</p>
					</div>
				</div>
			</div>

			{/* Environment picker (colored box) */}
			<Select open={isOpen} onOpenChange={setIsOpen} value={activeEnvironment?.id} onValueChange={handleChange} disabled={disabled}>
				<SelectTrigger className='w-full'>
					<div
						className={cn(
							'mt-3.5 flex items-center rounded-[var(--fp-radius-md)] border',
							open ? 'h-10 w-full justify-between px-2 py-[10px]' : 'size-10 justify-center p-0',
							isDevelopment && 'border-accent-yellow-line text-accent-yellow-deep',
							isProduction && 'border-env-prod-line text-env-prod-text',
						)}
						/*
						 * The gradient is tokenized rather than literal: its text colour is a token that
						 * flips light in dark mode, so the surface underneath has to move with it. Leaving
						 * these as pale pastels produced light-on-light in dark mode.
						 */
						style={{
							background: isProduction
								? 'linear-gradient(to right, rgb(var(--fp-env-prod-bg)), rgb(var(--fp-env-prod-bg-mid)), rgb(var(--fp-env-prod-bg)))'
								: 'linear-gradient(to right, rgb(var(--fp-env-dev-bg)), rgb(var(--fp-env-dev-bg-mid)), rgb(var(--fp-env-dev-bg)))',
						}}>
						<div className={cn('flex items-center min-w-0', open ? 'gap-2' : 'justify-center')}>
							{isDevelopment ? (
								<HugeIcon icon={BlocksIcon} size={20} className='text-current' />
							) : (
								<HugeIcon icon={RocketIcon} size={20} className='text-current' />
							)}
							<span className={cn('block text-[14px] font-normal truncate max-w-[120px]', !open && 'hidden')}>{environmentName}</span>
						</div>
						<HugeIcon icon={UnfoldMoreIcon} size={16} className={cn('opacity-60', !open && 'hidden')} />
					</div>
				</SelectTrigger>
				<SelectContent className='mt-2 w-[calc(var(--radix-select-trigger-width)+8px)] max-w-[calc(var(--radix-select-trigger-width)+8px)] rounded-[var(--fp-radius-lg)] border-line bg-surface text-content'>
					{options.map((option, idx) => {
						const env = environments[idx];
						return (
							<div key={option.value} className='relative flex items-center group'>
								<SelectItem value={option.value} className='flex-1 pr-9'>
									<div className='flex items-center gap-2 text-muted-foreground min-w-0'>
										{option.prefixIcon}
										<span className='block flex-1 min-w-0 truncate pe-2 max-w-[calc(var(--radix-select-trigger-width)-110px)]'>
											{option.label}
										</span>
									</div>
								</SelectItem>
								<button
									type='button'
									aria-label={t('environment.selector.renameAria', { name: option.label })}
									onPointerDown={(e) => e.stopPropagation()}
									onClick={(e) => handleEditClick(env, e)}
									className='absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-[4px] text-muted-foreground hover:bg-accent hover:text-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity'>
									<HugeIcon icon={PencilEdit01Icon} size={14} />
								</button>
							</div>
						);
					})}
					<div className='flex flex-col gap-1.5 m-2 text-muted-foreground'>
						<Button
							onClick={() => {
								setIsOpen(false);
								setIsCreatorOpen(true);
							}}
							key='create'
							value='create'
							size='sm'
							className='w-full text-center rounded-[var(--fp-radius-md)] justify-center items-center'>
							<HugeIcon icon={PlusSignIcon} size={16} />
							{t('environment.selector.addEnvironment')}
						</Button>
						<Button
							onClick={() => {
								setIsOpen(false);
								setIsCopierOpen(true);
							}}
							key='copy'
							size='sm'
							variant='outline'
							className='w-full text-center rounded-[var(--fp-radius-md)] justify-center items-center'>
							<HugeIcon icon={Copy01Icon} size={16} />
							{t('environment.selector.copyEnvironment')}
						</Button>
					</div>
				</SelectContent>
			</Select>

			<EnvironmentCreator
				isOpen={isCreatorOpen}
				onOpenChange={setIsCreatorOpen}
				onEnvironmentCreated={async (environmentId) => {
					await refetchEnvironments();
					if (environmentId) {
						handleChange(environmentId);
					}
				}}
			/>

			<EnvironmentCopier
				isOpen={isCopierOpen}
				onOpenChange={setIsCopierOpen}
				sourceEnvironment={currentEnvironment}
				onEnvironmentCloned={async () => {
					await refetchEnvironments();
				}}
			/>

			<EnvironmentEditor
				isOpen={isEditorOpen}
				onOpenChange={(open) => {
					setIsEditorOpen(open);
					if (!open) setEditingEnvironment(null);
				}}
				environment={editingEnvironment}
				onEnvironmentUpdated={async () => {
					await refetchEnvironments();
				}}
			/>

			<ContactUsDialog
				isOpen={isSuspendedDialogOpen}
				onOpenChange={setIsSuspendedDialogOpen}
				title={t('environment.selector.suspendedTitle')}
				description={t('environment.selector.suspendedDescription')}
			/>
		</div>
	);
};

export default EnvironmentSelector;
