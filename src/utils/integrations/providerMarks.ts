import { integrationCatalogSpecs } from '@/pages/insights-tools/integrations/integrationsData';

const PROVIDER_ID_MAP: Record<string, string> = {
	zoho_books: 'zoho',
};

const providerLogoMap = new Map(integrationCatalogSpecs.map((spec) => [spec.id, { logo: spec.logo, logoDark: spec.logoDark }]));

export function getProviderLogo(providerType: string): { logo: string; logoDark?: string } | undefined {
	const mappedId = PROVIDER_ID_MAP[providerType] ?? providerType;
	return providerLogoMap.get(mappedId);
}

export function formatProviderName(providerType: string): string {
	return providerType
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}
