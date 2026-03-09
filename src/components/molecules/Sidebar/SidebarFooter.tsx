import { useEffect, useCallback } from 'react';
import { BookOpen, ExternalLink, ChevronsUpDown, LogOut } from 'lucide-react';
import { SidebarMenuButton, useSidebar, Popover, PopoverContent, PopoverTrigger, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

import AuthService from '@/core/auth/AuthService';
import { getCommandPaletteActionEventName, CommandPaletteActionId } from '@/core/actions';
import useUser from '@/hooks/useUser';

const SidebarFooter = () => {
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

	if (loading) return <Skeleton className='w-full h-10' />;

	const dropdownItems = [
		// {
		// 	label: 'Onboarding',
		// 	icon: ListChecks,
		// 	onClick: () => {
		// 		navigate(RouteNames.onboarding);
		// 	},
		// },
		// {
		// 	label: 'Billing',
		// 	icon: CreditCard,
		// 	onClick: () => {
		// 		navigate(RouteNames.customerBilling);
		// 	},
		// },
		{
			label: 'Logout',
			icon: LogOut,
			onClick: handleLogout,
		},
	];

	return (
		<div className='flex flex-col gap-2 w-full'>
			<SidebarMenuButton
				onClick={() => {
					window.open('https://docs.flexprice.io', '_blank');
				}}
				tooltip={'Documentation'}
				className={cn(`flex items-center justify-between gap-2 hover:bg-muted transition-colors my-0 py-1 `)}>
				<span className='flex items-center gap-2'>
					<BookOpen className={cn('size-5 mr-1 !stroke-[1.5px]')} />
					<span className='text-sm select-none'>{'Documentation'}</span>
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
							<div className={cn('min-w-0 flex-1 text-left', sidebarOpen ? '' : 'hidden')}>
								<p className='text-xs text-muted-foreground truncate'>{user?.email}</p>
							</div>
						</div>
						<ChevronsUpDown className={cn('h-4 w-4 text-muted-foreground', sidebarOpen ? '' : 'hidden')} />
					</button>
				</PopoverTrigger>
				<PopoverContent className='!w-56 mx-auto p-2 space-y-1'>
					{dropdownItems.map((item, index) => {
						return (
							<button
								key={index}
								onClick={item.onClick}
								className='w-full flex items-center gap-2 rounded-[6px] px-2 py-1 text-sm hover:bg-muted transition-colors'>
								{item.icon && <item.icon className='size-4' />}
								<span className='text-sm'>{item.label}</span>
							</button>
						);
					})}
				</PopoverContent>
			</Popover>
		</div>
	);
};

export default SidebarFooter;
