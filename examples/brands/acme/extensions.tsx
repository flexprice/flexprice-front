import type { BrandExtensions } from '@/brand/types';
import { removeNavItems } from '@/brand/navHelpers';

/** Same layout and pages as Flexprice; only the navigation is trimmed and one section renamed. */
const extensions: BrandExtensions = {
	nav: (nav) =>
		removeNavItems(nav, ['catalog.costSheets', 'pricingWidget']).map((item) =>
			item.id === 'catalog' ? { ...item, title: 'Pricing' } : item,
		),
};

export default extensions;
