import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from '@/components/ui';
import React from 'react';
import SidebarNav, { NavItem } from './SidebarMenu';
import FlexpriceSidebarFooter from './SidebarFooter';
import { RouteNames } from '@/core/routes/Routes';
import { EnvironmentSelector } from '@/components/molecules';
import { Settings, Landmark, Layers2, CodeXml, Puzzle, GalleryHorizontalEnd, Home, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const COMMAND_PALETTE_EVENT = 'open-command-palette';

function SidebarSearchTrigger() {
	const { open: sidebarOpen } = useSidebar();
	const handleClick = () => window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT));

	return (
		<button
			type='button'
			onClick={handleClick}
			className={cn(
				'flex h-8 w-full items-center gap-2 rounded-md border border-input bg-background px-2.5 text-left text-sm text-muted-foreground shadow-none transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
				!sidebarOpen && 'justify-center px-2',
			)}
			aria-label='Search or run a command (⌘K)'>
			<Search className='h-4 w-4 shrink-0 opacity-70' />
			{sidebarOpen && (
				<>
					<span className='flex-1 truncate'>Search...</span>
					<kbd className='pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex'>
						⌘ K
					</kbd>
				</>
			)}
		</button>
	);
}

const AppSidebar: React.FC<React.ComponentProps<typeof Sidebar>> = ({ ...props }) => {
	const { open: sidebarOpen } = useSidebar();
	const navMain: NavItem[] = [
		{
			title: 'Home',
			url: RouteNames.homeDashboard,
			icon: Home,
		},
		{
			title: 'Product Catalog',
			url: RouteNames.features,
			icon: Layers2,
			items: [
				{
					title: 'Features',
					url: RouteNames.features,
				},
				{
					title: 'Plans',
					url: RouteNames.plan,
				},
				{
					title: 'Coupons',
					url: RouteNames.coupons,
				},
				{
					title: 'Addons',
					url: RouteNames.addons,
				},
				{
					title: 'Cost Sheets',
					url: RouteNames.costSheets,
				},
				{
					title: 'Price Units',
					url: RouteNames.priceUnits,
				},
				// {
				// 	title: 'Groups',
				// 	url: RouteNames.groups,
				// },
			],
		},
		{
			title: 'Billing',
			url: RouteNames.customers,
			icon: Landmark,
			items: [
				{
					title: 'Customers',
					url: RouteNames.customers,
				},
				{
					title: 'Subscriptions',
					url: RouteNames.subscriptions,
				},
				{
					title: 'Taxes',
					url: RouteNames.taxes,
				},
				{
					title: 'Invoices',
					url: RouteNames.invoices,
				},
				{
					title: 'Credit Notes',
					url: RouteNames.creditNotes,
				},
				{
					title: 'Payments',
					url: RouteNames.payments,
				},
			],
		},

		{
			title: 'Tools',
			url: RouteNames.bulkImports,
			icon: Settings,
			items: [
				{
					title: 'Imports',
					url: RouteNames.bulkImports,
				},
				{
					title: 'Exports',
					url: RouteNames.exports,
				},
			],
		},
		{
			title: 'Developers',
			url: RouteNames.events,
			icon: CodeXml,
			items: [
				{
					title: 'Events Debugger',
					url: RouteNames.events,
				},
				{
					title: 'API Keys',
					url: RouteNames.apiKeys,
				},
				{
					title: 'Service Accounts',
					url: RouteNames.serviceAccounts,
				},
				{
					title: 'Webhooks',
					url: RouteNames.webhooks,
				},
				{
					title: 'Runs',
					url: RouteNames.workflows,
				},
			],
		},
		{
			title: 'Integrations',
			url: RouteNames.integrations,
			icon: Puzzle,
		},
		{
			title: 'Pricing Widget',
			url: RouteNames.pricing,
			icon: GalleryHorizontalEnd,
		},
	];
	return (
		<Sidebar
			collapsible='icon'
			{...props}
			className={cn('border-none px-3 py-1 shadow-md  bg-[#f9f9f9]', sidebarOpen ? 'px-3' : 'pr-0 pl-2')}>
			<SidebarHeader>
				<EnvironmentSelector />
				<SidebarSearchTrigger />
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
