import { lazy } from 'react';
import type { BrandExtensions } from '@/brand/types';

/**
 * Flexprice keeps the app's own layout and pages. Its one brand-specific piece is the marketing
 * panel beside the sign-in form (testimonials, customer logos), which other brands should not inherit.
 */
const extensions: BrandExtensions = {
	slots: {
		'auth.aside': lazy(() => import('@/pages/auth/templates/FlexpriceDefault/LandingSection')),
	},
};

export default extensions;
