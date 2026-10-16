import { config } from './config';
import { brandConfig } from './branding';
import { isFlexpriceIoHostname } from '@/utils/hostname/isFlexpriceIoHostname';

export interface ContactDetails {
	slackUrl: string;
	email: string;
	bookCallUrl: string;
}

/** The active brand's contact details (Flexprice's in the default build). Empty means "not offered". */
const BRAND_CONTACT: ContactDetails = {
	slackUrl: brandConfig.links.community ?? '',
	email: brandConfig.supportEmail,
	bookCallUrl: brandConfig.links.bookCall ?? '',
};

/** White-label contact details when `contact_us` is enabled in platform config. */
const PLATFORM_CONTACT_US: ContactDetails = {
	slackUrl: '',
	email: '',
	bookCallUrl: '',
};

export function isPlatformContactUsEnabled(): boolean {
	return config.platform.contact_us.enabled;
}

/** Show contact options on flexprice.io or when `contact_us` is enabled in platform config. */
export function isContactEnabled(): boolean {
	if (isPlatformContactUsEnabled()) return true;
	return typeof window !== 'undefined' && isFlexpriceIoHostname(window.location.hostname);
}

export function getContactDetails(): ContactDetails {
	return isPlatformContactUsEnabled() ? PLATFORM_CONTACT_US : BRAND_CONTACT;
}

export function getContactEmailMailto(): string {
	return `mailto:${getContactDetails().email}`;
}
