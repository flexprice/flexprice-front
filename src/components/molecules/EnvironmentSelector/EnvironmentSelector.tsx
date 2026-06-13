import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui';
import { Blocks, Rocket, Server, ChevronsUpDown, Plus, Copy, Pencil, ExternalLink } from 'lucide-react';
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
import { config } from '@/config/config';

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
			'relative flex w-full cursor-default select-none items-center rounded-[6px] py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			className,
		)}
		{...props}>
		<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
	</SelectPrimitive.Item>
));

const getEnvironmentIcon = (type: ENVIRONMENT_TYPE) => {
	switch (type) {
		case ENVIRONMENT_TYPE.PRODUCTION:
			return <Rocket className='h-4 w-4' />;
		case ENVIRONMENT_TYPE.DEVELOPMENT:
			return <Blocks className='h-4 w-4' />;
		default:
			return <Server className='h-4 w-4' />;
	}
};

const EnvironmentSelector: React.FC<Props> = ({ disabled = false, className }) => {
	const { t } = useTranslation('settings');
	const { loading, user } = useUser();
	const { open: sidebarOpen } = useSidebar();
	const navigate = useNavigate();
	const { setLoading } = useGlobalLoading();

	const { environments, activeEnvironment, changeActiveEnvironment, refetchEnvironments, isDevelopment, isProduction } = useEnvironment();
	const { getRestriction } = useRestrictedEnvs();
	const { isSandboxMode, productionUrl } = config.restrictions;

	const [isOpen, setIsOpen] = useState(false);
	const [isCreatorOpen, setIsCreatorOpen] = useState(false);
	const [isCopierOpen, setIsCopierOpen] = useState(false);
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
	const [isSuspendedDialogOpen, setIsSuspendedDialogOpen] = useState(false);

	if (loading)
		return (
			<div>
				<Skeleton className='h-10 w-full' />
			</div>
		);

	if (!environments || environments.length === 0) {
		return <div className='p-2 text-sm text-muted-foreground'>{t('environment.selector.noneAvailable')}</div>;
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
			<div className='w-full mt-2 flex items-center justify-between gap-2'>
				<div className='flex items-center text-start gap-2 min-w-0'>
					<span className='size-7 bg-black text-white flex justify-center items-center bg-contain rounded-[6px] text-xs font-semibold'>
						{user?.tenant?.name
							?.split(' ')
							.map((n) => n[0])
							.join('')
							.slice(0, 2) || t('environment.selector.fallbackTenantLetters')}
					</span>
					<div className={cn('text-start min-w-0', sidebarOpen ? '' : 'hidden')}>
						<p className='font-medium text-[16px] leading-snug truncate'>{user?.tenant?.name || t('environment.selector.unknownTenant')}</p>
					</div>
				</div>
			</div>

			{/* Sandbox mode badge */}
			{isSandboxMode && sidebarOpen && (
				<div className='mt-2 flex items-center gap-1.5 px-1'>
					<span className='h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0' />
					<span className='text-[11px] font-semibold uppercase tracking-widest text-amber-700'>{t('environment.types.sandbox')}</span>
				</div>
			)}

			{/* Environment picker (colored box) */}
			<Select open={isOpen} onOpenChange={setIsOpen} value={activeEnvironment?.id} onValueChange={handleChange} disabled={disabled}>
				<SelectTrigger className={cn(sidebarOpen ? '' : 'hidden')}>
					<div
						className={cn(
							'w-full mt-3.5 flex items-center justify-between h-10 px-2 py-[10px] rounded-[6px] border',
							isDevelopment && 'border-yellow-400 text-yellow-900',
							isProduction && 'border-[#BFD0F5] text-[#1F5ADA]',
						)}
						style={{
							background: isProduction
								? 'linear-gradient(to right, #EEF4FF, #DDE7FF, #EEF4FF)'
								: 'linear-gradient(to right, #FFFCEE, #FFF9DD, #FFFCEE)',
						}}>
						<div className='flex items-center gap-2 min-w-0'>
							{isDevelopment ? (
								<Blocks absoluteStrokeWidth className='!size-5 !stroke-[1.5px] text-current' />
							) : (
								<Rocket absoluteStrokeWidth className='!size-5 !stroke-[1.5px] text-current' />
							)}
							<span className='block text-[14px] font-normal truncate max-w-[120px]'>{environmentName}</span>
						</div>
						<ChevronsUpDown className='h-4 w-4 opacity-60 shrink-0' />
					</div>
				</SelectTrigger>
				<SelectContent className='mt-2 w-[calc(var(--radix-select-trigger-width)+8px)] max-w-[calc(var(--radix-select-trigger-width)+8px)]'>
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
									className='absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-[4px] text-muted-foreground hover:bg-accent hover:text-foreground opacity-60 hover:opacity-100 transition-opacity'>
									<Pencil className='h-3.5 w-3.5' />
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
							className='w-full text-center rounded-[6px] justify-center items-center'>
							<Plus className='h-4 w-4' />
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
							className='w-full text-center rounded-[6px] justify-center items-center'>
							<Copy className='h-4 w-4' />
							{t('environment.selector.copyEnvironment')}
						</Button>
					</div>
					{isSandboxMode && productionUrl && (
						<a
							href={productionUrl}
							className='flex items-center justify-center gap-1.5 mx-2 mb-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 border-t border-border pt-2'>
							<ExternalLink className='h-3 w-3' />
							{t('environment.selector.goToProduction')}
						</a>
					)}
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
