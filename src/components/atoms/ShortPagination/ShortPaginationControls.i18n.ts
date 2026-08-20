// Bundled i18n so ShortPaginationControls renders real English out-of-the-box when reused by
// exportable components (e.g. @flexprice/ui's CreditHistory) — WITHOUT overriding a
// host app that has its own i18n. Mirrors src/components/molecules/CustomerUsageChart.i18n.ts.
import { createBundledT } from '@/lib/exportable/bundledI18n';

const EN_PAGINATION = {
	page: 'Page {{current}} of {{total}}',
	showingRange: 'Showing {{start}} to {{end}} of {{total}} {{unit}}',
	showingRangeCompact: 'Showing {{start}}–{{end}} of {{total}} {{unit}}',
	unitItems: 'items',
	previous: 'Previous',
	next: 'Next',
};

export const usePaginationT = createBundledT('common', { pagination: EN_PAGINATION }).useBoundT;
