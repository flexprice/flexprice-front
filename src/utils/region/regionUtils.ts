import { includes } from 'lodash';
import { Region } from '@/types/enums/Region';

export interface DashboardUrls {
	india: string | undefined;
	us: string | undefined;
}

/**
 * Gets dashboard URLs from environment variables
 * @returns Object containing India and US dashboard URLs
 */
export const getDashboardUrls = (): DashboardUrls => {
	return {
		india: import.meta.env.VITE_DASHBOARD_URL_INDIA,
		us: import.meta.env.VITE_DASHBOARD_URL_US,
	};
};

/**
 * Detects the current region based on window.location.origin
 * Compares the current origin with configured dashboard URLs
 * @returns Region enum value or null if region cannot be determined
 */
export const detectCurrentRegion = (): Region | null => {
	const currentOrigin = window.location.origin;
	const { india: indiaUrl, us: usUrl } = getDashboardUrls();

	// Extract origin from full URLs with error handling
	let indiaOrigin: string | null = null;
	let usOrigin: string | null = null;

	try {
		if (indiaUrl) {
			indiaOrigin = new URL(indiaUrl).origin;
		}
	} catch (error) {
		console.warn('Invalid VITE_DASHBOARD_URL_INDIA:', error);
	}

	try {
		if (usUrl) {
			usOrigin = new URL(usUrl).origin;
		}
	} catch (error) {
		console.warn('Invalid VITE_DASHBOARD_URL_US:', error);
	}

	// Check if current origin matches any configured region
	const origins = [indiaOrigin, usOrigin].filter(Boolean) as string[];

	if (origins.length === 0) {
		return null; // No valid URLs configured
	}

	// Use lodash includes to check if current origin matches any region
	if (includes(origins, currentOrigin)) {
		switch (currentOrigin) {
			case indiaOrigin:
				return Region.INDIA;
			case usOrigin:
				return Region.US;
			default:
				return null;
		}
	}

	// Fallback: if only one region is configured, return it
	if (indiaOrigin && !usOrigin) return Region.INDIA;
	if (usOrigin && !indiaOrigin) return Region.US;

	return null; // Unknown region or multiple regions configured but current doesn't match
};

/**
 * Gets the dashboard URL for a specific region
 * @param region - The region to get the dashboard URL for
 * @returns The dashboard URL for the region or null if not configured
 */
export const getRegionDashboardUrl = (region: Region): string | null => {
	const urls = getDashboardUrls();

	switch (region) {
		case Region.INDIA:
			return urls.india || null;
		case Region.US:
			return urls.us || null;
		default:
			return null;
	}
};

/**
 * Switches to a different region by replacing the current URL
 * @param region - The region to switch to
 */
export const switchRegion = (region: Region): void => {
	const newUrl = getRegionDashboardUrl(region);

	if (!newUrl) {
		console.warn(`Dashboard URL not configured for region: ${region}`);
		return;
	}

	// Preserve pathname and search params when switching
	const currentPath = window.location.pathname;
	const currentSearch = window.location.search;
	const targetUrl = `${newUrl}${currentPath}${currentSearch}`;

	window.location.replace(targetUrl);
};
