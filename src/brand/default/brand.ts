import type { BrandPack } from '@/brand/types';

/** Flexprice — the brand the open-source build ships with. */
const brand: BrandPack = {
	id: 'flexprice',
	name: 'Flexprice',
	logo: '/comicon.png',
	favicon: '/favicon.ico',
	supportEmail: 'support@flexprice.io',
	primaryColor: '#7C3AED',
	title: 'flexprice.io',
	links: {
		docs: 'https://docs.flexprice.io',
		website: 'https://flexprice.io',
		bookCall: 'https://calendly.com/nikhil-flexprice/30min',
		community: 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ',
		linkedin: 'https://www.linkedin.com/company/flexpriceio/',
		issues: 'https://github.com/flexprice/flexprice-front/issues',
	},
};

export default brand;
