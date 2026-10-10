import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui';
import { Blocks, Rocket, Server, ChevronsUpDown, Plus, Copy, Pencil } from 'lucide-react';
import { Select, SelectContent, useSidebar } from '@/components/ui';
import * as SelectPrimitive from '@radix-ui/react-select';
import { SelectOption } from '@/components/atoms/Select/Select';
import { Button, Tooltip } from '@/components/atoms';
import { useEnvironmentSwitcher } from '@/hooks/useEnvironmentSwitcher';
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
	const { open: sidebarOpen } = useSidebar();
	const switcher = useEnvironmentSwitcher();
	const { loading, environments, current: currentEnvironment, isDevelopment, isProduction, dialogs } = switcher;
	const canWriteEnvironment = switcher.canWrite;

	const [isOpen, setIsOpen] = useState(false);

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
				{canWriteEnvironment ? (
					<Button onClick={switcher.openCreate} size='sm' className='w-full text-center rounded-[6px] justify-center items-center'>
						<Plus className='h-4 w-4' />
						{t('environment.selector.addEnvironment')}
					</Button>
				) : (
					<Tooltip content={t('environment.selector.writeDeniedTooltip')}>
						<span tabIndex={0} className='inline-block w-full'>
							<Button disabled size='sm' className='w-full text-center rounded-[6px] justify-center items-center'>
								<Plus className='h-4 w-4' />
								{t('environment.selector.addEnvironment')}
							</Button>
						</span>
					</Tooltip>
				)}

				{dialogs}
			</div>
		);
	}

	const options: SelectOption[] = environments.map((env) => ({
		value: env.id,
		label: env.name,
		prefixIcon: getEnvironmentIcon(env.type),
	}));

	const { tenantName } = switcher;

	const handleEditClick = (env: Environment, e: React.MouseEvent | React.PointerEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOpen(false);
		switcher.openEdit(env);
	};

	const handleChange = async (environmentId: string) => {
		setIsOpen(false);
		await switcher.select(environmentId);
	};

	const environmentName = currentEnvironment?.name || t('environment.selector.noEnvironment');

	return (
		<div className={cn('mt-1 w-full', className)}>
			{/* Tenant */}
			<div className='w-full mt-2 flex items-center justify-between gap-2'>
				<div className='flex items-center text-start gap-2 min-w-0'>
					<span className='size-7 bg-surface-avatar text-content-inverse flex justify-center items-center bg-contain rounded-[6px] text-xs font-semibold'>
						{tenantName
							?.split(' ')
							.map((n) => n[0])
							.join('')
							.slice(0, 2) || t('environment.selector.fallbackTenantLetters')}
					</span>
					<div className={cn('text-start min-w-0', sidebarOpen ? '' : 'hidden')}>
						<p className='font-medium text-[16px] leading-snug truncate'>{tenantName || t('environment.selector.unknownTenant')}</p>
					</div>
				</div>
			</div>

			{/* Environment picker (colored box) */}
			<Select open={isOpen} onOpenChange={setIsOpen} value={switcher.activeId} onValueChange={handleChange} disabled={disabled}>
				<SelectTrigger className={cn(sidebarOpen ? '' : 'hidden')}>
					<div
						className={cn(
							'w-full mt-3.5 flex items-center justify-between h-10 px-2 py-[10px] rounded-[6px] border',
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
				<SelectContent className='mt-2 w-[calc(var(--radix-select-trigger-width)+8px)] max-w-[calc(var(--radix-select-trigger-width)+8px)] border-line bg-surface text-content'>
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
								{canWriteEnvironment ? (
									<button
										type='button'
										aria-label={t('environment.selector.renameAria', { name: option.label })}
										onPointerDown={(e) => e.stopPropagation()}
										onClick={(e) => handleEditClick(env, e)}
										className='absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-[4px] text-muted-foreground hover:bg-accent hover:text-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity'>
										<Pencil className='h-3.5 w-3.5' />
									</button>
								) : (
									<Tooltip content={t('environment.selector.writeDeniedTooltip')}>
										<span
											tabIndex={0}
											className='absolute right-1.5 top-1/2 -translate-y-1/2 inline-block opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity'>
											<button
												type='button'
												disabled
												aria-label={t('environment.selector.renameAria', { name: option.label })}
												onPointerDown={(e) => e.stopPropagation()}
												className='p-1 rounded-[4px] text-muted-foreground cursor-not-allowed'>
												<Pencil className='h-3.5 w-3.5' />
											</button>
										</span>
									</Tooltip>
								)}
							</div>
						);
					})}
					<div className='flex flex-col gap-1.5 m-2 text-muted-foreground'>
						{canWriteEnvironment ? (
							<Button
								onClick={() => {
									setIsOpen(false);
									switcher.openCreate();
								}}
								key='create'
								value='create'
								size='sm'
								className='w-full text-center rounded-[6px] justify-center items-center'>
								<Plus className='h-4 w-4' />
								{t('environment.selector.addEnvironment')}
							</Button>
						) : (
							<Tooltip content={t('environment.selector.writeDeniedTooltip')}>
								<span tabIndex={0} className='inline-block w-full'>
									<Button disabled key='create' size='sm' className='w-full text-center rounded-[6px] justify-center items-center'>
										<Plus className='h-4 w-4' />
										{t('environment.selector.addEnvironment')}
									</Button>
								</span>
							</Tooltip>
						)}
						{canWriteEnvironment ? (
							<Button
								onClick={() => {
									setIsOpen(false);
									switcher.openCopy();
								}}
								key='copy'
								size='sm'
								variant='outline'
								className='w-full text-center rounded-[6px] justify-center items-center'>
								<Copy className='h-4 w-4' />
								{t('environment.selector.copyEnvironment')}
							</Button>
						) : (
							<Tooltip content={t('environment.selector.writeDeniedTooltip')}>
								<span tabIndex={0} className='inline-block w-full'>
									<Button
										disabled
										key='copy'
										size='sm'
										variant='outline'
										className='w-full text-center rounded-[6px] justify-center items-center'>
										<Copy className='h-4 w-4' />
										{t('environment.selector.copyEnvironment')}
									</Button>
								</span>
							</Tooltip>
						)}
					</div>
				</SelectContent>
			</Select>

			{dialogs}
		</div>
	);
};

export default EnvironmentSelector;
