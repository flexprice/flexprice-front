// src/core/navigation/useAppNav.ts
//
// The console's navigation as data — one model every layout renders. The default sidebar draws it
// as a tree; a brand pack's shell may draw it as tabs, a rail, anything. Brands rearrange it with
// `extensions.nav` instead of re-listing pages, so a page added here appears in every brand unless
// that brand hides it.
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { LucideIcon } from 'lucide-react';
import { Landmark, Layers2, CodeXml, Puzzle, GalleryHorizontalEnd, Home, BarChart3 } from 'lucide-react';
import extensions from '@brand/extensions';
import { RouteNames } from '@/core/routes/Routes';
import { config } from '@/config/config';
import { useBrandNavItems } from '@/brand/modules';

export interface AppNavItem {
	/** Stable id brands use to find, move or hide an entry, e.g. 'catalog.plans'. */
	id: string;
	title: string;
	url: string;
	icon?: LucideIcon;
	children?: AppNavItem[];
}

/** The app's own navigation, before any brand changes. */
export function buildDefaultNav(t: TFunction): AppNavItem[] {
	return [
		{ id: 'home', title: t('sidebar.nav.home'), url: RouteNames.homeDashboard, icon: Home },
		{
			id: 'catalog',
			title: t('sidebar.nav.productCatalog'),
			url: RouteNames.features,
			icon: Layers2,
			children: [
				{ id: 'catalog.features', title: t('sidebar.nav.features'), url: RouteNames.features },
				{ id: 'catalog.plans', title: t('sidebar.nav.plans'), url: RouteNames.plan },
				{ id: 'catalog.coupons', title: t('sidebar.nav.coupons'), url: RouteNames.coupons },
				{ id: 'catalog.addons', title: t('sidebar.nav.addons'), url: RouteNames.addons },
				{ id: 'catalog.costSheets', title: t('sidebar.nav.costSheets'), url: RouteNames.costSheets },
				{ id: 'catalog.priceUnits', title: t('sidebar.nav.priceUnits'), url: RouteNames.priceUnits },
				{ id: 'catalog.groups', title: t('sidebar.nav.groups'), url: RouteNames.groups },
			],
		},
		{
			id: 'billing',
			title: t('sidebar.nav.billing'),
			url: RouteNames.customers,
			icon: Landmark,
			children: [
				{ id: 'billing.customers', title: t('sidebar.nav.customers'), url: RouteNames.customers },
				{ id: 'billing.subscriptions', title: t('sidebar.nav.subscriptions'), url: RouteNames.subscriptions },
				{ id: 'billing.taxes', title: t('sidebar.nav.taxes'), url: RouteNames.taxes },
				{ id: 'billing.invoices', title: t('sidebar.nav.invoices'), url: RouteNames.invoices },
				{ id: 'billing.creditNotes', title: t('sidebar.nav.creditNotes'), url: RouteNames.creditNotes },
				{ id: 'billing.payments', title: t('sidebar.nav.payments'), url: RouteNames.payments },
			],
		},
		...(config.platform.revenue.enabled
			? [{ id: 'revenue', title: t('sidebar.nav.revenue'), url: RouteNames.revenue, icon: BarChart3 }]
			: []),
		{
			id: 'developers',
			title: t('sidebar.nav.developers'),
			url: RouteNames.events,
			icon: CodeXml,
			children: [
				{ id: 'developers.events', title: t('sidebar.nav.eventsDebugger'), url: RouteNames.events },
				{ id: 'developers.apiKeys', title: t('sidebar.nav.apiKeys'), url: RouteNames.apiKeys },
				{ id: 'developers.serviceAccounts', title: t('sidebar.nav.serviceAccounts'), url: RouteNames.serviceAccounts },
				{ id: 'developers.webhooks', title: t('sidebar.nav.webhooks'), url: RouteNames.webhooks },
				{ id: 'developers.exports', title: t('sidebar.nav.exports'), url: RouteNames.exports },
				{ id: 'developers.usageSyncs', title: t('sidebar.nav.usageSyncs'), url: RouteNames.usageSyncs },
				{ id: 'developers.workflows', title: t('sidebar.nav.workflows'), url: RouteNames.workflows },
			],
		},
		{ id: 'integrations', title: t('sidebar.nav.integrations'), url: RouteNames.integrations, icon: Puzzle },
		{ id: 'pricingWidget', title: t('sidebar.nav.pricingWidget'), url: RouteNames.pricing, icon: GalleryHorizontalEnd },
	];
}

/**
 * The navigation the active build renders: the app's own entries, then entries contributed by the
 * brand pack's modules (placed before Integrations), then the pack's `nav` rearrangement.
 */
export function useAppNav(): AppNavItem[] {
	const { t } = useTranslation('common');
	const moduleItems = useBrandNavItems();

	return useMemo(() => {
		const nav = buildDefaultNav(t);
		const at = nav.findIndex((item) => item.id === 'integrations');
		nav.splice(at === -1 ? nav.length : at, 0, ...moduleItems);
		return extensions.nav ? extensions.nav(nav, { t, routes: RouteNames }) : nav;
	}, [t, moduleItems]);
}

const matches = (pathname: string, url: string) => pathname === url || pathname.startsWith(`${url}/`);

/**
 * The top-level entry a pathname belongs to, and the child within it. The longest matching URL
 * wins, so a section's root entry does not stay lit on a deeper page of a sibling.
 */
export function findActiveNav(nav: AppNavItem[], pathname: string): { section?: AppNavItem; child?: AppNavItem } {
	let best: { section?: AppNavItem; child?: AppNavItem } = {};
	let bestLength = -1;
	for (const section of nav) {
		for (const candidate of [section, ...(section.children ?? [])]) {
			if (matches(pathname, candidate.url) && candidate.url.length > bestLength) {
				bestLength = candidate.url.length;
				best = { section, child: candidate === section ? undefined : candidate };
			}
		}
	}
	return best;
}
