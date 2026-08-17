import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from '@/components/ui';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarNav, { NavItem } from './SidebarMenu';
import FlexpriceSidebarFooter from './SidebarFooter';
import { RouteNames } from '@/core/routes/Routes';
import { EnvironmentSelector } from '@/components/molecules';
import {
	Home01Icon,
	Layers01Icon,
	LandmarkIcon,
	ChartLineData02Icon,
	SourceCodeIcon,
	PuzzleIcon,
	GalleryHorizontalEndIcon,
	UserMultipleIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useLocaleStore } from '@/store/useLocaleStore';
import { Direction } from '@/config/branding';
import { config } from '@/config/config';

const AppSidebar: React.FC<React.ComponentProps<typeof Sidebar>> = ({ ...props }) => {
	const { t } = useTranslation('common');
	const { open: sidebarOpen } = useSidebar();
	const direction = useLocaleStore((s) => s.direction);
	const side = direction === Direction.RTL ? 'right' : 'left';

	const navMain: NavItem[] = useMemo(
		() => [
			{
				title: t('sidebar.nav.home'),
				url: RouteNames.homeDashboard,
				icon: Home01Icon,
			},
			{
				title: t('sidebar.nav.productCatalog'),
				url: RouteNames.features,
				icon: Layers01Icon,
				items: [
					{
						title: t('sidebar.nav.features'),
						url: RouteNames.features,
					},
					{
						title: t('sidebar.nav.plans'),
						url: RouteNames.plan,
					},
					{
						title: t('sidebar.nav.coupons'),
						url: RouteNames.coupons,
					},
					{
						title: t('sidebar.nav.addons'),
						url: RouteNames.addons,
					},
					{
						title: t('sidebar.nav.costSheets'),
						url: RouteNames.costSheets,
					},
					{
						title: t('sidebar.nav.priceUnits'),
						url: RouteNames.priceUnits,
					},
					{
						title: t('sidebar.nav.groups'),
						url: RouteNames.groups,
					},
				],
			},
			{
				title: t('sidebar.nav.customers'),
				url: RouteNames.customers,
				icon: UserMultipleIcon,
			},
			{
				title: t('sidebar.nav.billing'),
				url: RouteNames.subscriptions,
				icon: LandmarkIcon,
				items: [
					{
						title: t('sidebar.nav.subscriptions'),
						url: RouteNames.subscriptions,
					},
					{
						title: t('sidebar.nav.invoices'),
						url: RouteNames.invoices,
					},
					{
						title: t('sidebar.nav.taxes'),
						url: RouteNames.taxes,
					},
					{
						title: t('sidebar.nav.creditNotes'),
						url: RouteNames.creditNotes,
					},
					{
						title: t('sidebar.nav.payments'),
						url: RouteNames.payments,
					},
				],
			},
			...(config.platform.revenue.enabled
				? [
						{
							title: t('sidebar.nav.analytics'),
							url: RouteNames.revenue,
							icon: ChartLineData02Icon,
						},
					]
				: []),
			{
				title: t('sidebar.nav.developers'),
				url: RouteNames.events,
				icon: SourceCodeIcon,
				items: [
					{
						title: t('sidebar.nav.eventsDebugger'),
						url: RouteNames.events,
					},
					{
						title: t('sidebar.nav.apiKeys'),
						url: RouteNames.apiKeys,
					},
					{
						title: t('sidebar.nav.serviceAccounts'),
						url: RouteNames.serviceAccounts,
					},
					{
						title: t('sidebar.nav.webhooks'),
						url: RouteNames.webhooks,
					},
					{
						title: t('sidebar.nav.workflows'),
						url: RouteNames.workflows,
					},
					{
						title: t('sidebar.nav.exports'),
						url: RouteNames.exports,
					},
				],
			},
			{
				title: t('sidebar.nav.integrations'),
				url: RouteNames.integrations,
				icon: PuzzleIcon,
			},
			{
				title: t('sidebar.nav.pricingWidget'),
				url: RouteNames.pricing,
				icon: GalleryHorizontalEndIcon,
			},
		],
		[t],
	);

	return (
		<Sidebar
			collapsible='icon'
			side={side}
			{...props}
			className={cn('border-r-0 group-data-[side=left]:border-r-0 bg-transparent py-1', sidebarOpen ? 'px-3' : 'px-2')}>
			<SidebarHeader>
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
