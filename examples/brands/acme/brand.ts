import type { BrandPack } from '@/brand/types';
import logo from './logo.svg';

const brand: BrandPack = {
	id: 'acme',
	name: 'Acme Billing',
	logo,
	favicon: logo,
	supportEmail: 'help@acme.example',
	primaryColor: '#0F766E',
	links: {
		docs: 'https://docs.flexprice.io', // no docs of our own yet: keep Flexprice's
		website: 'https://acme.example',
		// No bookCall / community: those command-palette actions are hidden.
	},
	fontFamily: 'IBM Plex Sans',
};

export default brand;
