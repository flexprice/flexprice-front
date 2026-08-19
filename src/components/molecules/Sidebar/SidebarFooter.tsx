import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen01Icon, UnfoldMoreIcon, Logout01Icon, Settings01Icon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '@/components/atoms';
import { RouteNames } from '@/core/routes/Routes';
import { SidebarMenuButton, useSidebar, Popover, PopoverContent, PopoverTrigger, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

import { useNavigate } from 'react-router';
import AuthService from '@/core/auth/AuthService';
import { getCommandPaletteActionEventName, CommandPaletteActionId } from '@/core/actions';
import useUser from '@/hooks/useUser';
import { useShouldShowSidebarPricingPromo } from '@/hooks/useShouldShowSidebarPricingPromo';
import { getContactDetails, isContactEnabled } from '@/config/contact';
import SidebarPricingPromoCard from './SidebarPricingPromoCard';

const ContactUsHoverLabel = ({ className }: { className?: string }) => {
	const { t } = useTranslation('common');
	const contactLabel = t('labels.contactUs');
	const replyHint = t('labels.contactUsReplyHint');

	return (
		<span className={cn('relative block overflow-hidden text-start', className)}>
			<span className='invisible block whitespace-nowrap text-sm leading-5' aria-hidden>
				{replyHint}
			</span>
			<span className='absolute inset-0 whitespace-nowrap text-sm leading-5 transition-all duration-200 ease-flow group-hover/contact:-translate-y-full group-hover/contact:opacity-0'>
				{contactLabel}
			</span>
			<span className='absolute inset-0 whitespace-nowrap text-sm leading-5 text-muted-foreground opacity-0 translate-y-full transition-all duration-200 ease-flow group-hover/contact:translate-y-0 group-hover/contact:opacity-100'>
				{replyHint}
			</span>
		</span>
	);
};

const SidebarFooter = () => {
	const { t } = useTranslation('common');
	const navigate = useNavigate();
	const handleLogout = useCallback(async () => {
		await AuthService.logout();
	}, []);

	// Log out from command palette (Cmd+K → Log out)
	useEffect(() => {
		const eventName = getCommandPaletteActionEventName(CommandPaletteActionId.Logout);
		const handler = () => handleLogout();
		window.addEventListener(eventName, handler);
		return () => window.removeEventListener(eventName, handler);
	}, [handleLogout]);

	const { loading, user } = useUser();
	const { open } = useSidebar();
	const showPricingPromo = useShouldShowSidebarPricingPromo();
	const contactEnabled = isContactEnabled();
	const slackUrl = getContactDetails().slackUrl;
	const showContactInFooter = contactEnabled && Boolean(slackUrl) && !showPricingPromo;
	const showContactInMenu = contactEnabled && Boolean(slackUrl) && showPricingPromo;

	if (loading) return <Skeleton className='w-full h-12' />;

	const dropdownItems = [
		{
			label: 'Settings',
			icon: Settings01Icon,
			onClick: () => {
				navigate(RouteNames.settings);
			},
		},
		{
			label: 'Logout',
			icon: Logout01Icon,
			onClick: handleLogout,
		},
	];

	return (
		<div className='flex flex-col gap-2 w-full'>
			{showPricingPromo && <SidebarPricingPromoCard className='mb-4' onCreateWithAI={() => navigate(RouteNames.pricingSetup)} />}

			{showContactInFooter ? (
				<SidebarMenuButton
					onClick={() => {
						window.open(slackUrl, '_blank', 'noopener,noreferrer');
					}}
					tooltip={t('labels.contactUs')}
					className={cn(
						'group/contact flex items-center gap-2 hover:bg-muted transition-colors my-0 overflow-visible [&>span:last-child]:overflow-visible',
						open ? 'py-1' : 'justify-center !p-0 group-data-[reveal=closed]:!p-0 group-data-[collapsible=icon]:!p-0',
					)}>
					<span
						className={cn('flex min-w-0 items-center', open ? 'w-full gap-2' : 'size-full items-center justify-center overflow-visible')}>
						<img
							src='/assets/logo/slack-logo.png'
							alt={t('contactUs.slackAlt')}
							className={cn('shrink-0 object-contain', open ? 'size-5 me-1' : 'size-[21px]')}
						/>
						<ContactUsHoverLabel className={cn(!open && 'hidden')} />
					</span>
				</SidebarMenuButton>
			) : null}

			<SidebarMenuButton
				onClick={() => {
					window.open('https://docs.flexprice.io', '_blank', 'noopener,noreferrer');
				}}
				tooltip={t('labels.documentation')}
				className={cn(
					'flex items-center gap-2 hover:bg-muted transition-colors my-0 overflow-visible [&>span:last-child]:overflow-visible',
					open ? 'py-1' : 'justify-center !p-0 group-data-[reveal=closed]:!p-0 group-data-[collapsible=icon]:!p-0',
				)}>
				<span className={cn('flex items-center', open ? 'gap-2' : 'size-full items-center justify-center overflow-visible')}>
					<HugeIcon icon={BookOpen01Icon} size={20} className={cn('!size-5 shrink-0', open && 'me-1')} />
					<span className={cn('text-sm select-none', !open && 'hidden')}>{t('labels.documentation')}</span>
				</span>
			</SidebarMenuButton>

			{/* user profile */}
			<Popover>
				<PopoverTrigger asChild>
					<button
						type='button'
						aria-label={user?.email}
						className={cn(
							'flex items-center rounded-[var(--fp-radius-md)] hover:bg-muted transition-colors',
							open ? 'h-12 w-full justify-between gap-2 px-2' : 'size-8 justify-center p-0',
						)}>
						<div className={cn('flex min-w-0 items-center', open && 'flex-1 gap-2')}>
							<div className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground'>
								{user?.email ? user.email.charAt(0).toUpperCase() : 'F'}
							</div>
							<div className={cn('min-w-0 flex-1 text-start', !open && 'hidden')}>
								<p className='truncate text-xs text-muted-foreground'>{user?.email}</p>
							</div>
						</div>
						<HugeIcon icon={UnfoldMoreIcon} size={16} className={cn('text-muted-foreground', !open && 'hidden')} />
					</button>
				</PopoverTrigger>
				<PopoverContent className='!w-56 mx-auto rounded-[var(--fp-radius-lg)] p-2 space-y-1'>
					{showContactInMenu ? (
						<button
							type='button'
							onClick={() => {
								window.open(slackUrl, '_blank', 'noopener,noreferrer');
							}}
							className='group/contact flex w-full items-center gap-2 rounded-[var(--fp-radius-md)] px-2 py-1 text-sm hover:bg-muted transition-colors'>
							<img src='/assets/logo/slack-logo.png' alt={t('contactUs.slackAlt')} className='size-4 shrink-0 object-contain' />
							<ContactUsHoverLabel />
						</button>
					) : null}
					{dropdownItems.map((item) => (
						<button
							key={item.label}
							onClick={item.onClick}
							className='w-full flex items-center gap-2 rounded-[var(--fp-radius-md)] px-2 py-1 text-sm hover:bg-muted transition-colors'>
							{item.icon && <HugeIcon icon={item.icon} size={16} />}
							<span className='text-sm'>{item.label}</span>
						</button>
					))}
				</PopoverContent>
			</Popover>
		</div>
	);
};

export default SidebarFooter;
