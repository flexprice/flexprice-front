import { useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ExternalLink, ChevronsUpDown, KeyRound, LogOut, Settings } from 'lucide-react';
import { RouteNames } from '@/core/routes/Routes';
import { SidebarMenuButton, useSidebar, Popover, PopoverContent, PopoverTrigger, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

import { useNavigate } from 'react-router';
import AuthService from '@/core/auth/AuthService';
import { getCommandPaletteActionEventName, CommandPaletteActionId } from '@/core/actions';
import useUser from '@/hooks/useUser';
import { useShouldShowSidebarPricingPromo } from '@/hooks/useShouldShowSidebarPricingPromo';
import SidebarPricingPromoCard from './SidebarPricingPromoCard';
import ChangePasswordDialog from './ChangePasswordDialog';
import { config, APP_ENV } from '@/config/config';

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
	const { open: sidebarOpen } = useSidebar();
	const showPricingPromo = useShouldShowSidebarPricingPromo();
	const [changePasswordOpen, setChangePasswordOpen] = useState(false);

	if (loading) return <Skeleton className='w-full h-10' />;

	const dropdownItems = [
		{
			label: 'Settings',
			icon: Settings,
			onClick: () => {
				navigate(RouteNames.settings);
			},
		},
		// Self-hosted stores passwords itself, so a signed-in user changes theirs here.
		...(config.app.env === APP_ENV.SelfHosted
			? [
					{
						label: t('labels.changePassword'),
						icon: KeyRound,
						onClick: () => setChangePasswordOpen(true),
					},
				]
			: []),
		{
			label: 'Logout',
			icon: LogOut,
			onClick: handleLogout,
		},
	];

	return (
		<div className='flex flex-col gap-2 w-full'>
			{showPricingPromo && <SidebarPricingPromoCard className='mb-4' onCreateWithAI={() => navigate(RouteNames.pricingSetup)} />}

			<SidebarMenuButton
				onClick={() => {
					window.open('https://docs.flexprice.io', '_blank');
				}}
				tooltip={t('labels.documentation')}
				className={cn(`flex items-center justify-between gap-2 hover:bg-muted transition-colors my-0 py-1 `)}>
				<span className='flex items-center gap-2'>
					<BookOpen className={cn('size-5 me-1 !stroke-[1.5px]')} />
					<span className='text-sm select-none'>{t('labels.documentation')}</span>
				</span>
				<ExternalLink />
			</SidebarMenuButton>

			{/* user profile */}
			<Popover>
				<PopoverTrigger asChild>
					<button className='w-full flex items-center justify-between h-10 rounded-[6px] gap-2 px-2 hover:bg-muted transition-colors'>
						<div className='flex items-center gap-1 min-w-0 flex-1'>
							<div className='size-5 text-xs   bg-primary text-primary-foreground flex justify-center items-center rounded-full flex-shrink-0 font-medium'>
								{user?.email ? user.email.charAt(0).toUpperCase() : 'F'}
							</div>
							<div className={cn('min-w-0 flex-1 text-start', sidebarOpen ? '' : 'hidden')}>
								<p className='text-xs text-muted-foreground truncate'>{user?.email}</p>
							</div>
						</div>
						<ChevronsUpDown className={cn('h-4 w-4 text-muted-foreground', sidebarOpen ? '' : 'hidden')} />
					</button>
				</PopoverTrigger>
				<PopoverContent className='!w-56 mx-auto p-2 space-y-1'>
					{dropdownItems.map((item) => (
						<button
							key={item.label}
							onClick={item.onClick}
							className='w-full flex items-center gap-2 rounded-[6px] px-2 py-1 text-sm hover:bg-muted transition-colors'>
							{item.icon && <item.icon className='size-4' />}
							<span className='text-sm'>{item.label}</span>
						</button>
					))}
				</PopoverContent>
			</Popover>

			<ChangePasswordDialog isOpen={changePasswordOpen} email={user?.email ?? ''} onClose={() => setChangePasswordOpen(false)} />
		</div>
	);
};

export default SidebarFooter;
