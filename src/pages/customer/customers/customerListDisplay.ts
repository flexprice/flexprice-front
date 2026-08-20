import type { CustomerResponse } from '@/types/dto';

export type CustomerListRow = CustomerResponse & {
	integrationProviders: string[];
};

export function getCustomerIntegrationProviders(customer: CustomerResponse, mappedProviders: string[] = []): string[] {
	const fromExpand = (customer.integrations ?? []).map((mapping) => mapping.provider_type).filter(Boolean);
	if (fromExpand.length > 0) return [...new Set(fromExpand)];
	return [...new Set(mappedProviders.filter(Boolean))];
}
