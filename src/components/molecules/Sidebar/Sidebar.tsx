import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from '@/components/ui';
import React, { useMemo } from 'react';
import SidebarNav, { NavItem } from './SidebarMenu';
import FlexpriceSidebarFooter from './SidebarFooter';
import { EnvironmentSelector } from '@/components/molecules';
import { cn } from '@/lib/utils';
import { useLocaleStore } from '@/store/useLocaleStore';
import { Direction } from '@/config/branding';
import { Slot } from '@/brand/Slot';
import { useAppNav } from '@/core/navigation/useAppNav';

const AppSidebar: React.FC<React.ComponentProps<typeof Sidebar>> = ({ ...props }) => {
	const { open: sidebarOpen } = useSidebar();
	const direction = useLocaleStore((s) => s.direction);
	const side = direction === Direction.RTL ? 'right' : 'left';

	const appNav = useAppNav();
	const navMain: NavItem[] = useMemo(
		() =>
			appNav.map((item) => ({
				title: item.title,
				url: item.url,
				icon: item.icon,
				items: item.children?.map((child) => ({ title: child.title, url: child.url })),
			})),
		[appNav],
	);

	return (
		<Sidebar
			collapsible='icon'
			side={side}
			{...props}
			className={cn('border-line-strong py-1 bg-surface-sidebar', sidebarOpen ? 'px-3' : 'px-2')}>
			<SidebarHeader>
				<Slot name='sidebar.header' collapsed={!sidebarOpen} />
				<EnvironmentSelector />
			</SidebarHeader>
			<SidebarContent className='gap-0 mt-1'>
				<SidebarNav items={navMain} />
			</SidebarContent>
			<SidebarFooter>
				<FlexpriceSidebarFooter />
			</SidebarFooter>
		</Sidebar>
	);
};

export default AppSidebar;
