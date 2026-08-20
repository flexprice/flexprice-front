import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';

export interface BreadcrumbItem {
	label: string;
	path: string;
}

/** Path segments whose breadcrumb label should not be a raw URL capitalization. */
const SEGMENT_LABEL_KEYS: Record<string, string> = {
	revenue: 'sidebar.nav.analytics',
};

const formatPathSegment = (segment: string): string => {
	return segment
		.replace(/-/g, ' ')
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

export const useBreadcrumbs = () => {
	const location = useLocation();
	const { t } = useTranslation('common');
	const { setBreadcrumbs, setLoading } = useBreadcrumbsStore();

	useEffect(() => {
		setLoading(true);
		const pathSegments = location.pathname.split('/').filter(Boolean);

		const newBreadcrumbs = pathSegments.map((segment, index, arr) => {
			const path = `/${arr.slice(0, index + 1).join('/')}`;
			const labelKey = SEGMENT_LABEL_KEYS[segment];
			const label = labelKey ? t(labelKey) : formatPathSegment(segment);

			return {
				label,
				path,
			};
		});

		setBreadcrumbs(newBreadcrumbs);
		setLoading(false);
	}, [location.pathname, setBreadcrumbs, setLoading, t]);
};
